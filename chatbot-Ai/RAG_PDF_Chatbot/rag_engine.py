from __future__ import annotations

from pathlib import Path
from threading import Lock
import hashlib
import re

from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_huggingface import ChatHuggingFace, HuggingFaceEmbeddings, HuggingFaceEndpoint
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

FALLBACK_ANSWER = "The requested information is not available in the system knowledge base."
FOLLOWUP_MARKERS = {
    "it", "its", "that", "those", "these", "this", "they", "them", "he", "she",
    "previous", "above", "same", "again", "earlier", "already", "provided", "keywords",
}
STOPWORDS = {
    "the", "and", "for", "with", "from", "into", "about", "there", "which", "when",
    "what", "where", "your", "have", "has", "had", "will", "would", "should", "could",
    "been", "being", "their", "them", "then", "than", "that", "this", "those", "these",
    "also", "just", "more", "most", "such", "very", "some", "many", "only", "using",
    "used", "does", "done", "over", "under", "is", "are", "was", "were", "can", "any",
}


class RAGEngine:
    def __init__(self) -> None:
        self._lock = Lock()

        self._llm = None
        self._chat_model = None
        self._embeddings = None
        self._chain = None

        self._parser = StrOutputParser()
        self._prompt = PromptTemplate(
            template=(
                "You are the ADPT-DB AI Assistant. Use only context and conversation history to answer. "
                "If any question related to yes or no is there then respond according to the context available. "
                "If the answer is missing in the context, return exactly: "
                "Strictly Do not return this text in the response 'as per the provided context... or based on the provided context..'" 
                "Strictly Do not return the ID:KB-xxx anywhere in the response."
                "Convert the markdown text as it indicates like bold,italic,title,etc. and return the answer. "
                f"{FALLBACK_ANSWER}\n\n"
                "Conversation History:\n{history}\n\n"
                "Context:\n{context}\n\n"
                "Question: {question}"
            ),
            input_variables=["history", "context", "question"],
        )

        self._current_pdf_path: str | None = None
        self._retriever = None
        self._chunk_count = 0
        self._history: list[dict[str, str]] = []
        self._history_limit = 8
      

    def _ensure_embeddings(self) -> None:
        if self._embeddings is None:
            self._embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2"
            )

    def _ensure_chain(self) -> None:
        if self._chain is not None:
            return

        self._llm = HuggingFaceEndpoint(
            repo_id="mistralai/Mistral-7B-Instruct-v0.2",
            task="text-generation",
            temperature=0,
            max_new_tokens=180,
        )
        self._chat_model = ChatHuggingFace(llm=self._llm)
        self._chain = self._prompt | self._chat_model | self._parser

    def _resolve_pdf_path(self, pdf_path: str) -> Path:
        path = Path(pdf_path).expanduser()
        if not path.is_absolute():
            path = (Path.cwd() / path).resolve()
        return path

    def _get_index_dir(self, pdf_path: Path) -> Path:
        signature = (
            f"{pdf_path.resolve()}|{pdf_path.stat().st_size}|"
            f"{pdf_path.stat().st_mtime_ns}|700|120|all-MiniLM-L6-v2"
        )
        key = hashlib.sha1(signature.encode("utf-8")).hexdigest()[:16]
        cache_root = Path(__file__).resolve().parent / ".cache"
        return cache_root / key

    def _extract_keywords(self, text: str, limit: int = 10) -> list[str]:
        words = re.findall(r"[A-Za-z][A-Za-z0-9_-]{2,}", text.lower())
        unique = []
        seen = set()
        for word in words:
            if word in STOPWORDS:
                continue
            if word not in seen:
                unique.append(word)
                seen.add(word)
            if len(unique) >= limit:
                break
        return unique 

    def _has_followup_reference(self, question: str) -> bool:
        words = set(re.findall(r"[A-Za-z]+", question.lower()))
        return bool(words.intersection(FOLLOWUP_MARKERS))

    def _build_history_text(self, turns: int = 3) -> str:
        if not self._history:
            return "No previous conversation."

        lines = []
        for item in self._history[-turns:]:
            lines.append(f"Q: {item['question']}")
            lines.append(f"A: {item['answer']}")
        return "\n".join(lines)

    def _build_retrieval_query(self, question: str) -> str:
        if not self._history:
            return question

        if not self._has_followup_reference(question):
            return question

        last_turn = self._history[-1]
        last_keywords = self._extract_keywords(last_turn["question"] + " " + last_turn["answer"], limit=8)
        if not last_keywords:
            return f"{question}\nRelated previous question: {last_turn['question']}"

        keywords_text = ", ".join(last_keywords)
        return (
            f"{question}\n"
            f"Related previous question: {last_turn['question']}\n"
            f"Important previous keywords: {keywords_text}"
        )

    def _append_history(self, question: str, answer: str) -> None:
        self._history.append({"question": question, "answer": answer})
        if len(self._history) > self._history_limit:
            self._history = self._history[-self._history_limit:]

    def clear_history(self) -> None:
        with self._lock:
            self._history = []

    def load_pdf(self, pdf_path: str) -> dict:
        resolved_pdf = self._resolve_pdf_path(pdf_path)
        if not resolved_pdf.exists():
            raise FileNotFoundError(f"PDF not found: {resolved_pdf}")

        with self._lock:
            self._ensure_embeddings()

            if self._current_pdf_path == str(resolved_pdf) and self._retriever is not None:
                return {
                    "pdf_path": self._current_pdf_path,
                    "chunk_count": self._chunk_count,
                    "cache_source": "memory",
                }

            index_dir = self._get_index_dir(resolved_pdf)
            faiss_file = index_dir / "index.faiss"
            pkl_file = index_dir / "index.pkl"

            if faiss_file.exists() and pkl_file.exists():
                vector_store = FAISS.load_local(
                    str(index_dir),
                    self._embeddings,
                    allow_dangerous_deserialization=True,
                )
                cache_source = "disk"
                chunk_count = 0
            else:
                loader = PyPDFLoader(str(resolved_pdf))
                documents = loader.load()
                splitter = RecursiveCharacterTextSplitter(
                    chunk_size=700,
                    chunk_overlap=120,
                )
                chunks = splitter.split_documents(documents)
                vector_store = FAISS.from_documents(chunks, self._embeddings)
                index_dir.mkdir(parents=True, exist_ok=True)
                vector_store.save_local(str(index_dir))
                cache_source = "rebuilt"
                chunk_count = len(chunks)

            self._retriever = vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={"k": 3},
            )
            self._current_pdf_path = str(resolved_pdf)
            self._chunk_count = chunk_count
            self._history = []

            return {
                "pdf_path": self._current_pdf_path,
                "chunk_count": self._chunk_count,
                "cache_source": cache_source,
            }

    def ask(self, question: str) -> dict:
        with self._lock:
            if self._retriever is None:
                raise RuntimeError("No PDF is loaded. Load a PDF first.")

            self._ensure_chain()

            retrieval_query = self._build_retrieval_query(question)
            documents = self._retriever.invoke(retrieval_query)
            context = "\n\n".join(doc.page_content for doc in documents)
            history_text = self._build_history_text()

            if not context.strip():
                answer = FALLBACK_ANSWER
                self._append_history(question, answer)
                return {
                    "answer": answer,
                    "context_preview": "",
                }

            answer = self._chain.invoke({
                "history": history_text,
                "context": context,
                "question": question,
            }).strip()

            final_answer = answer or FALLBACK_ANSWER
            self._append_history(question, final_answer)

            return {
                "answer": final_answer,
                "context_preview": context[:350],
            }

    def status(self) -> dict:
        with self._lock:
            return {
                "loaded": self._retriever is not None,
                "pdf_path": self._current_pdf_path,
                "chunk_count": self._chunk_count,
                "history_turns": len(self._history),
            }
