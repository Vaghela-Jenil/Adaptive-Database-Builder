from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request

try:
    from flask_cors import CORS
except ImportError:
    CORS = None

if __package__:
    from .rag_engine import RAGEngine
else:
    from rag_engine import RAGEngine

load_dotenv()

app = Flask(__name__)
if CORS is not None:
    CORS(app)

engine = RAGEngine()
DEFAULT_PDF = r"C:\Users\jenil\Documents\Final-year-project\chatbot-Ai\RAG_PDF_Chatbot\CORE SYSTEM OVERVIEW.pdf"

# --- ADD THIS LOGIC HERE ---
print(f"Initializing Knowledge Base with: {DEFAULT_PDF}")
try:
    engine.load_pdf(DEFAULT_PDF)
    print("Knowledge Base is ready!")
except Exception as e:
    print(f"Warning: Could not auto-load default PDF: {e}")


@app.route("/")
def index():
    return render_template("index.html", default_pdf=DEFAULT_PDF)


@app.route("/api/load-pdf", methods=["POST"])
def load_pdf():
    try:
        data = request.get_json(silent=True) or {}
        pdf_path = (data.get("pdf_path") or DEFAULT_PDF).strip()

        result = engine.load_pdf(pdf_path)

        return jsonify(
            {
                "success": True,
                "message": "Knowledge base is ready.",
                "pdf_path": result["pdf_path"],
                "chunk_count": result["chunk_count"],
                "cache_source": result["cache_source"],
            }
        )
    except FileNotFoundError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(silent=True) or {}
        message = (data.get("message") or "").strip()

        if not message:
            return jsonify({"error": "Please enter a question."}), 400

        result = engine.ask(message)

        return jsonify(
            {
                "success": True,
                "response": result["answer"],
                "context_preview": result["context_preview"],
            }
        )
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/clear-chat", methods=["POST"])
def clear_chat():
    try:
        engine.clear_history()
        return jsonify({"success": True})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/pdf-info", methods=["GET"])
def pdf_info():
    return jsonify(engine.status())


if __name__ == "__main__":
    app.run(debug=True, port=5001)
