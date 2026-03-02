from __future__ import annotations
from pathlib import Path
from threading import Lock
import hashlib
import json
import os
import re
from typing import Any
import numpy as np
from rapidfuzz import fuzz, process
from sklearn.metrics.pairwise import cosine_similarity

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
            repo_id="meta-llama/Llama-3.3-70B-Instruct",
            task="text-generation",
            temperature=0,
            max_new_tokens=1024,
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



rag_engine = RAGEngine()


class DatabaseEngine:

    # ── Class-level constants (shared across all instances) ──────────
    _STOPWORDS = {
        "a", "an", "and", "are", "as", "at", "be", "by", "can", "do", "for",
        "from", "get", "give", "has", "have", "i", "in", "is", "it", "its",
        "list", "me", "my", "need", "of", "on", "or", "please", "see", "show",
        "that", "the", "their", "them", "those", "to", "up", "want", "with",
        "whose", "you", "display", "fetch", "find", "tell", "all", "high",
        "top", "bottom", "based",
    }

    _SUMMARY_RE = re.compile(
        r"\b(overall|summary|overview|statistics|stats|full\s+details?|"
        r"all\s+(fields?|columns?|data|info|attributes?)|complete\s+(report|data|info)|"
        r"everything|breakdown|report|general|aggregate|total\s+overview)\b",
        re.IGNORECASE,
    )

    _DUAL_EXTREME_RE = re.compile(
        r"\b("
        r"top\s+\d+\s+and\s+(bottom|worst|lowest?)"
        r"|bottom\s+\d+\s+and\s+(top|best|highest?)"
        r"|highest?.+lowest?"
        r"|lowest?.+highest?"
        r"|best.+worst"
        r"|worst.+best"
        r")\b",
        re.IGNORECASE,
    )

    _COMPARE_RE = re.compile(
        r"\b(compar|versus|vs\.?|differ|against|between)\b",
        re.IGNORECASE,
    )

    _AGG_RE = re.compile(
        r"\b(average|avg|mean|total|sum|count|min|max|maximum|minimum|"
        r"how\s+many|how\s+much|median|spread|distribution)\b",
        re.IGNORECASE,
    )

    # ── Class-level caches (persist across instances) ────────────────
    _EMBEDDING_CACHE: dict[tuple[int, tuple[str, ...]], tuple[list[str], "np.ndarray"]] = {}
    _EMBEDDING_LOCK = Lock()

    _SYNONYM_CACHE: dict[str, dict[str, list[str]]] = {}
    _SYNONYM_LOCK = Lock()

    _DISK_CACHE_DIR: Path | None = Path(os.getenv("SYNONYM_CACHE_DIR", ".synonym_cache"))

    def __init__(self, raw_query: str):
        # Intent detection (per-instance, based on the query)
        self.raw_query        = raw_query
        self.is_summary       = bool(self._SUMMARY_RE.search(raw_query))
        self.is_dual_extreme  = bool(self._DUAL_EXTREME_RE.search(raw_query))
        self.is_comparison    = bool(self._COMPARE_RE.search(raw_query))
        self.has_aggregation  = bool(self._AGG_RE.search(raw_query))

        # Model references (lazy-inited via rag_engine singleton)
        rag_engine._ensure_embeddings()
        rag_engine._ensure_chain()
        self.embeddings = rag_engine._embeddings  # type: ignore
        self.chatmodel = rag_engine._chat_model   # type: ignore
      
    def to_dict(self) -> dict[str, bool]:
        return {
                "is_summary":      self.is_summary,
                "is_dual_extreme": self.is_dual_extreme,
                "is_comparison":   self.is_comparison,
                "has_aggregation": self.has_aggregation,
        }

 
    # Text helpers functions
    @staticmethod
    def preprocess(text: str) -> str:
        """Lowercase, strip punctuation, collapse whitespace."""
        text = text.lower()
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        return re.sub(r"\s+", " ", text).strip()

    @staticmethod
    def _schema_hash(labels_id_map: dict[str, str]) -> str:
        """Deterministic hash of the label set — used as cache key."""
        key = json.dumps(sorted(labels_id_map.keys()), sort_keys=True)
        return hashlib.md5(key.encode()).hexdigest()

    # Prompt for the LLM to generate a synonym map for the given schema labels. 
    _SYNONYM_PROMPT = """\
    You are a data-understanding assistant. Given the list of database field labels below, \
    generate a JSON object where each key is a common English word or phrase that a user \
    might type when asking about that field, and the value is a list of 1-3 field labels \
    (from the given list) that the word is semantically related to.

    Rules:
    - Cover synonyms, related concepts, colloquial terms, abbreviations, and domain jargon.
    - Every label must appear as a value for AT LEAST 2-3 different query words.
    - Include words for vague/implicit references (e.g. "expensive" -> price fields).
    - Output ONLY valid JSON. No explanation, no markdown, no extra text.
    - Use this exact format:
    {{"word_or_phrase": ["label1", "label2"], ...}}

    Field labels:
    {labels}

    JSON:"""


    def _load_disk_cache(self, schema_hash: str) -> dict[str, list[str]] | None:
        if self._DISK_CACHE_DIR is None:
            return None
        cache_file = self._DISK_CACHE_DIR / f"{schema_hash}.json"
        if cache_file.exists():
            try:
                return json.loads(cache_file.read_text(encoding="utf-8"))
            except Exception:
                return None
        return None


    def _save_disk_cache(self, schema_hash: str, synonym_map: dict[str, list[str]]) -> None:
        if self._DISK_CACHE_DIR is None:
            return
        try:
            self._DISK_CACHE_DIR.mkdir(parents=True, exist_ok=True)
            cache_file = self._DISK_CACHE_DIR / f"{schema_hash}.json"
            cache_file.write_text(json.dumps(synonym_map, indent=2), encoding="utf-8")
        except Exception:
            pass  # disk cache is best-effort


    def _parse_synonym_json(self, raw: str) -> dict[str, list[str]]:
        """Robustly extract a JSON object from the LLM response."""
        text = raw.strip()
        text = re.sub(r"```json|```", "", text).strip()

        # Find first complete JSON object
        start = text.find("{")
        if start == -1:
            raise ValueError("No JSON object found in LLM response.")

        depth, in_str, escape = 0, False, False
        for i in range(start, len(text)):
            ch = text[i]
            if escape:
                escape = False
                continue
            if ch == "\\":
                escape = True
                continue
            if ch == '"':
                in_str = not in_str
                continue
            if in_str:
                continue
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    raw_json = text[start : i + 1]
                    # Remove trailing commas before } or ]
                    raw_json = re.sub(r",\s*([}\]])", r"\1", raw_json)
                    return json.loads(raw_json)

        raise ValueError("Incomplete JSON in LLM response.")


    def build_synonym_map(self,
        labels_id_map: dict[str, str],
        llm_model:Any,
    ) -> dict[str, list[str]]:
        """
        Generate (and cache) a synonym map for the given schema labels.

        The LLM is called ONCE per unique schema. All subsequent calls for the
        same label set return from the in-memory or disk cache instantly.

        Parameters
        ----------
        labels_id_map : {label_text: field_id}
        llm_model     : Any object with .invoke(str) -> object having .content attribute
                        (compatible with LangChain ChatModel / HuggingFaceEndpoint)

        Returns
        -------
        {query_word: [label1, label2, ...]}
        """
        schema_hash = self._schema_hash(labels_id_map)

        # 1. In-memory cache
        with self._SYNONYM_LOCK:
            if schema_hash in self._SYNONYM_CACHE:
                return self._SYNONYM_CACHE[schema_hash]

        # 2. Disk cache
        disk_hit = self._load_disk_cache(schema_hash)
        if disk_hit is not None:
            with self._SYNONYM_LOCK:
                self._SYNONYM_CACHE[schema_hash] = disk_hit
            return disk_hit

        # 3. Generate via LLM
        labels_list = "\n".join(f"- {lbl}" for lbl in labels_id_map.keys())
        prompt_text = self._SYNONYM_PROMPT.format(labels=labels_list)

        try:
            response = llm_model.invoke(prompt_text)
            raw_content = response.content if hasattr(response, "content") else str(response)
            synonym_map = self._parse_synonym_json(raw_content)

            # Normalize: lowercase keys, filter values to only known labels
            known_labels_lower = {lbl.lower() for lbl in labels_id_map}
            clean_map: dict[str, list[str]] = {}

            for word, label_refs in synonym_map.items():
                if not isinstance(label_refs, list):
                    continue
                word_clean = self.preprocess(word)
                valid_refs = [
                    ref for ref in label_refs
                    if isinstance(ref, str) and ref.lower() in known_labels_lower
                ]
                if word_clean and valid_refs:
                    clean_map[word_clean] = valid_refs

        except Exception as e:
            # Graceful degradation: empty map means only direct similarity is used
            print(f"[SynonymBuilder] LLM generation failed: {e}. Falling back to no synonyms.")
            clean_map = {}

        # Cache results
        with self._SYNONYM_LOCK:
            self._SYNONYM_CACHE[schema_hash] = clean_map

        self._save_disk_cache(schema_hash, clean_map)

        return clean_map

    # Candidate phrase extraction  (now uses dynamic synonym map)
    def extract_candidate_phrases(
        self,
        query: str,
        synonym_map: dict[str, list[str]],
    ) -> list[str]:
        """
        Build an enriched phrase set:
        1. Full normalized query
        2. Individual informative tokens
        3. Bigrams of informative tokens
        4. Dynamically generated synonym / concept expansions
        """
        normalized = self.preprocess(query)
        if not normalized:
            return []

        tokens = normalized.split()
        filtered = [t for t in tokens if t not in self._STOPWORDS] or tokens

        seen: set[str] = set()
        candidates: list[str] = []

        def add(phrase: str) -> None:
            if phrase and phrase not in seen:
                seen.add(phrase)
                candidates.append(phrase)

        add(normalized)
        for t in filtered:
            add(t)
        for i in range(len(filtered) - 1):
            add(f"{filtered[i]} {filtered[i + 1]}")

        # Dynamic expansions from the schema-specific synonym map
        for t in filtered:
            for expansion in synonym_map.get(t, []):
                add(self.preprocess(expansion))

            # Also try bigrams as synonym keys
            if filtered.index(t) < len(filtered) - 1:
                bigram = f"{t} {filtered[filtered.index(t) + 1]}"
                for expansion in synonym_map.get(bigram, []):
                    add(self.preprocess(expansion))

        return candidates[:50]


    # Embedding helpers
    def _get_label_embeddings(
        self,
        labels_id_map: dict[str, str],
        embedding_model
    ) -> tuple[list[str], np.ndarray]:
        
        
        label_texts = [self.preprocess(lbl) for lbl in labels_id_map]
        cache_key = (id(embedding_model), tuple(label_texts))

        with self._EMBEDDING_LOCK:
            hit = self._EMBEDDING_CACHE.get(cache_key)
            if hit:
                return hit

        vecs = np.asarray(
            embedding_model.embed_documents(label_texts), dtype=np.float32
        )

        with self._EMBEDDING_LOCK:
            self._EMBEDDING_CACHE[cache_key] = (label_texts, vecs)

        return label_texts, vecs


    def _embed_phrases(self, phrases: list[str], embedding_model) -> np.ndarray:
        if not phrases:
            return np.empty((0, 0), dtype=np.float32)
        return np.asarray(
            embedding_model.embed_documents(phrases), dtype=np.float32
        )


  
    # Matching passes
    def _semantic_match(
        self,
        query: str,
        labels_id_map: dict[str, str],
        embedding_model: Any,
        synonym_map: dict[str, list[str]],
        threshold: float,
        top_k: int,
    ) -> dict[str, str]:
        phrases = self.extract_candidate_phrases(query, synonym_map)
        if not phrases:
            return {}

        label_texts, label_vecs = self._get_label_embeddings(labels_id_map, embedding_model)
        query_vecs = self._embed_phrases(phrases, embedding_model)

        if query_vecs.size == 0 or label_vecs.size == 0:
            return {}

        sim = cosine_similarity(query_vecs, label_vecs)  # shape: (phrases, labels)
        norm_to_orig = {self.preprocess(lbl): lbl for lbl in labels_id_map}
        matched: dict[str, str] = {}
        max_k = min(top_k, len(label_texts))

        for row in sim:
            for idx in np.argsort(row)[::-1][:max_k]:
                score = float(row[idx])
                if score < threshold:
                    break
                orig = norm_to_orig.get(label_texts[idx])
                if orig:
                    matched[orig] = labels_id_map[orig]

        return matched


    def _fuzzy_match(
        self,
        query: str,
        labels_id_map: dict[str, str],
        synonym_map: dict[str, list[str]],
        score_threshold: int = 78,
    ) -> dict[str, str]:
        normalized = self.preprocess(query)
        if not normalized or not labels_id_map:
            return {}

        phrases = self.extract_candidate_phrases(normalized, synonym_map)
        if not phrases:
            return {}

        matched: dict[str, str] = {}
        for label, field_id in labels_id_map.items():
            result = process.extractOne(
                self.preprocess(label), phrases, scorer=fuzz.WRatio
            )
            if result and result[1] >= score_threshold:
                matched[label] = field_id

        return matched


    def match_labels(
        self,
        query: str,
        labels_id_map: dict[str, str],
        threshold: float = 0.48,
        top_k: int = 5,
    ) -> dict[str, Any]:
        """
        Match a natural-language query to form-schema field IDs.

        Automatically adapts to any database schema by generating synonyms via LLM.

        Parameters
        ----------
        query           : Raw user query string.
        labels_id_map   : {label_text: field_id}
        embedding_model : Object with .embed_documents(list[str]) -> list[list[float]]
        llm_model       : LangChain chat model for synonym generation (called once per schema).
        threshold       : Cosine similarity floor (0.48 works well for MiniLM).
        top_k           : Candidate labels considered per query phrase.

        Returns
        -------
        {
            "matched_labels"    : {label: field_id},   # relevant to this query
            "intent"            : {is_summary, is_dual_extreme, is_comparison, has_aggregation},
            "all_labels"        : {label: field_id},   # full schema map
            "matched_field_ids" : ["records.data.<field_id>", ...],
            "all_field_ids"     : ["records.data.<field_id>", ...],
        }
        """
        embedding_model = self.embeddings
        llm_model = self.chatmodel
        all_labels = dict(labels_id_map)

        def _paths(label_map: dict[str, str]) -> list[str]:
            return [f"records.data.{fid}" for fid in label_map.values()]

        # Summary intent: expose everything to the LLM
        if self.is_summary:
            return {
                "matched_labels":    all_labels,
                "intent":            self.to_dict(),
                "all_labels":        all_labels,
                "matched_field_ids": _paths(all_labels),
                "all_field_ids":     _paths(all_labels),
            }

        if not query.strip() or not labels_id_map:
            return {
                "matched_labels":    {},
                "intent":            self.to_dict(),
                "all_labels":        all_labels,
                "matched_field_ids": [],
                "all_field_ids":     _paths(all_labels),
            }

        # Get (or generate) the schema-specific synonym map
        synonym_map = self.build_synonym_map(labels_id_map, llm_model)

        # Fuzzy + semantic matching, both using dynamic synonyms
        fuzzy    = self._fuzzy_match(query, labels_id_map, synonym_map)
        semantic = self._semantic_match(
            query, labels_id_map, embedding_model, synonym_map, threshold, top_k
        )

        merged = {**fuzzy, **semantic}

        # Lenient fallback
        if not merged:
            merged = self._semantic_match(
                query, labels_id_map, embedding_model, synonym_map,
                threshold=0.28, top_k=1,
            )

        return {
            "matched_labels":    merged,
            "intent":            self.to_dict(),
            "all_labels":        all_labels,
            "matched_field_ids": _paths(merged),
            "all_field_ids":     _paths(all_labels),
        }