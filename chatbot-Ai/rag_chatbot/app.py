from dotenv import load_dotenv
from pathlib import Path
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableSequence
from pymongo import MongoClient
from pymongo.errors import OperationFailure
from fastapi import HTTPException
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from typing import Optional
import os
import io
import sys
import json
import traceback
import re


if __package__:
    from .rag_engine import RAGEngine
    from .rag_engine import DatabaseEngine
else:
    from rag_engine import RAGEngine
    from rag_engine import DatabaseEngine

load_dotenv()

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

with io.open(CURRENT_DIR / "prompt.txt", "r", encoding="utf-8") as f:
    prompt = f.read()



username = os.getenv("user")
password = os.getenv("pwd")
cluster  = os.getenv("cluster_name")
database = os.getenv("database_name")

uri = (
    f"mongodb+srv://{username}:{password}@{cluster}.mongodb.net/"
    f"{database}?retryWrites=true&w=majority&appName=Adaptive-Database-System"
)

client     = MongoClient(uri)
db         = client[database]
collection = db["databases"]

app = FastAPI()


engine = RAGEngine()

DEFAULT_PDF = r"C:\Users\jha02\OneDrive\Desktop\Adaptive-Database-Builder\chatbot-Ai\rag_chatbot\CORE SYSTEM OVERVIEW.pdf"

print(f"Initializing Knowledge Base with: {DEFAULT_PDF}")
try:
    engine.load_pdf(DEFAULT_PDF)
    print("Knowledge Base is ready!")
except Exception as e:
    print(f"Warning: Could not auto-load default PDF: {e}")


def make_json_safe(value):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, dict):
        return {k: make_json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [make_json_safe(item) for item in value]
    return value


def infer_schema(document):
    schema = {}
    for key, value in document.items():
        if key == "clerkId":
            continue
        if isinstance(value, dict):
            schema[key] = infer_schema(value)
        elif isinstance(value, list):
            if value:
                parsed_items = []
                for item in value:
                    if isinstance(item, dict):
                        parsed_items.append(infer_schema(item))
                    elif isinstance(item, list):
                        parsed_items.append(
                            [infer_schema(n) if isinstance(n, dict) else n for n in item]
                        )
                    else:
                        parsed_items.append(item)
                schema[key] = parsed_items
            else:
                schema[key] = []
        else:
            schema[key] = value
    return schema



def get_schema(
    clerk_id: Optional[str] = "user_39hiCRRfZziJNmLzr1wCVrwUFwz",
    form_name: Optional[str] = "sales db2",
):
    doc = collection.find_one({"clerkId": str(clerk_id), "DatabaseName": form_name})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    schema       = infer_schema(doc)
    id_values    = []
    label_values = []

    for field in schema.get("formSchema", []):
        if isinstance(field, dict):
            if "id"    in field: id_values.append(field["id"])
            if "label" in field: label_values.append(field["label"])

    return {
        "ids":    make_json_safe(id_values),
        "labels": make_json_safe(label_values),
    }


def normalize_pipeline(value):
    if isinstance(value, dict):
        return {
            ("$literal" if k == "$lit" else k): normalize_pipeline(v)
            for k, v in value.items()
        }
    if isinstance(value, list):
        return [normalize_pipeline(item) for item in value]
    if isinstance(value, str):
        return "$$this" if value == "$this" else value
    return value


def _extract_first_json_object(text: str) -> str:
    start = text.find("{")
    if start == -1:
        return text
    depth, in_string, escape = 0, False, False
    for idx in range(start, len(text)):
        ch = text[idx]
        if escape:
            escape = False
            continue
        if ch == "\\":
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : idx + 1]
    return text[start:]


def parse_model_json(raw_content: str) -> dict:
    """Extract and parse a JSON object from LLM output, handling prompt echo."""
    text = raw_content.strip()

    # Strip markdown code fences
    text = re.sub(r"```(?:json)?\s*\n?", "", text).strip()

    # If the model echoed the prompt, take content after the last "Output:" marker
    output_marker = text.rfind("Output:")
    if output_marker != -1:
        text = text[output_marker + len("Output:"):].strip()

    # Try parsing the full remaining text directly
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        pass

    # Extract the first JSON object from remaining text
    candidate = _extract_first_json_object(text)

    # Try progressively more aggressive cleanup strategies
    for attempt in [
        candidate,
        re.sub(r",\s*([}\]])", r"\1", candidate),
        re.sub(r",\s*([}\]])", r"\1", candidate.replace("'", '"')),
    ]:
        try:
            return json.loads(attempt)
        except (json.JSONDecodeError, ValueError):
            continue

    raise ValueError(f"Model returned invalid JSON: {candidate[:500]}")


FORBIDDEN_COMMANDS = {
    "insertOne", "insertMany", "updateOne", "updateMany",
    "deleteOne", "deleteMany", "replaceOne",
    "$set", "$unset", "$out", "$merge",
}


def verify_response_format(response: dict) -> dict | None:
    if not isinstance(response, dict):
        print(f"[validate] FAIL: response is not a dict, got {type(response)}")
        return None

    # Auto-inject missing keys the LLM sometimes omits
    response.setdefault("collection", "databases")
    response.setdefault("operation",  "READ")
    response.setdefault("pipeline",   [])
    response.setdefault("filter",     {})
    response.setdefault("update",     {})
    response.setdefault("document",   {})

    operation = response.get("operation", "").strip().upper()
    if not operation:
        operation = "READ"  # LLM left it blank — default to READ
    response["operation"] = operation

    if operation == "READ":
        if not isinstance(response.get("pipeline"), list):
            print(f"[validate] FAIL: pipeline is not a list: {response.get('pipeline')}")
            return None

    if operation not in ("READ", "WRITE"):
        print(f"[validate] FAIL: unknown operation '{operation}'")
        return None

    return response


def verify_forbidden_presence(response: dict) -> bool:
    if response.get("operation") != "READ":
        return True
    for stage in response.get("pipeline", []):
        if isinstance(stage, dict):
            if any(k in FORBIDDEN_COMMANDS for k in stage):
                return True
    return False



@app.get("/")
def index():
    return {"message": "Welcome to the Adaptive Database Builder Chatbot API", "default_pdf": DEFAULT_PDF}


@app.post("/api/load-pdf")
async def load_pdf(request: Request):
    try:
        try:
            data = await request.json()
        except Exception:
            data = {}

        pdf_path = (data.get("pdf_path") or DEFAULT_PDF).strip()

        result = engine.load_pdf(pdf_path)

        return JSONResponse(
            {
                "success": True,
                "message": "Knowledge base is ready.",
                "pdf_path": result["pdf_path"],
                "chunk_count": result["chunk_count"],
                "cache_source": result["cache_source"],
            }
        )
    except FileNotFoundError as exc:
        return JSONResponse({"error": str(exc)}, status_code=400)
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)


@app.post("/api/chat")
async def chat_pdf(request: Request):
    try:
        try:
            data = await request.json()
        except Exception:
            data = {}
        print("Received:", data)

        if not data or not data.get("message"):
            return JSONResponse({"error": "Please enter a question."}, status_code=400)

        result = engine.ask(data.get("message"))

        return JSONResponse(
            {
                "success": True,
                "response": result["answer"],
                "context_preview": result["context_preview"],
            }
        )
    except RuntimeError as exc:
        print("RUNTIME ERROR:")
        traceback.print_exc()
        return JSONResponse({"error": str(exc)}, status_code=400)

    except Exception as exc:
        print("FULL ERROR:")
        traceback.print_exc()
        return JSONResponse({"error": str(exc)}, status_code=500)
        
        


@app.post("/api/clear-chat")
def clear_chat():
    try:
        engine.clear_history()
        return JSONResponse({"success": True})
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)


@app.get("/api/pdf-info")
def pdf_info():
    return JSONResponse(engine.status())

@app.get("/api/chatbot/{clerk_id}/{form_name}/{query}")
def chatbot_query(clerk_id: str, form_name: str, query: str):


    dbengine = DatabaseEngine(query)

    # ── 1. Schema lookup ─────────────────────────────────────────────
    schema = get_schema(clerk_id=clerk_id, form_name=form_name)

    final_schema_ids = [str(i).strip() for i in schema.get("ids", []) if str(i).strip()]
    final_schema     = ", ".join(final_schema_ids) or "No schema IDs available"

    labels = schema.get("labels", [])
    ids    = schema.get("ids",    [])

    labels_id_map: dict[str, str] = {
        label.lower(): str(fid)
        for label, fid in zip(labels, ids)
    }

    # ── 2. Semantic + adaptive matching ──────────────────────────────
    match_result = dbengine.match_labels(
        query           = query,
        labels_id_map   = labels_id_map,
        threshold       = 0.48,
        top_k           = 5,
    )

    matched      = match_result["matched_labels"]
    query_intent = match_result["intent"]

    # ── 3. LLM chain (unchanged) ──────────────────────────────────────
    engine._ensure_chain()
    query_with_prompt = PromptTemplate(
        template        = prompt,
        input_variables = ["question", "final_schema", "clerk_id",
                           "DatabaseName", "matched", "query_intent"],
    )
    chain = RunnableSequence(query_with_prompt, engine._chat_model)

    raw_response = chain.invoke({
        "question":     query,
        "final_schema": final_schema,
        "clerk_id":     clerk_id,
        "DatabaseName": form_name,
        "matched":      matched,
        "query_intent": query_intent,
    })

    # ── 4. Parse, validate, execute (unchanged) ───────────────────────
    content = raw_response.content if hasattr(raw_response, "content") else str(raw_response)

    try:
        response = parse_model_json(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON from model: {e}")

    validated = verify_response_format(response)
    if not validated:
        raise HTTPException(status_code=500, detail="Model response format invalid.")

    if validated.get("operation") != "READ":
        if verify_forbidden_presence(validated):
            raise HTTPException(status_code=403, detail="Forbidden operators detected.")
        raise HTTPException(status_code=403, detail="Only READ operations are allowed.")

    pipeline = normalize_pipeline(validated.get("pipeline", []))
    if not pipeline:
        raise HTTPException(status_code=400, detail="Empty pipeline from model.")

    try:
        results = list(collection.aggregate(pipeline))
    except OperationFailure as e:
        raise HTTPException(
            status_code=500,
            detail=f"MongoDB aggregation failed: {e.details.get('errmsg', str(e))}"
        )

    return JSONResponse({"results": make_json_safe(results)})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)