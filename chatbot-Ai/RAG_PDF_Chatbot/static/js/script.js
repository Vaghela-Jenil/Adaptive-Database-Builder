const state = {
    loaded: false,
    lastResponse: "",
};

const THEME_KEY = "pdf_rag_theme";

const loadStatus = document.getElementById("loadStatus");
const pdfInfo = document.getElementById("pdfInfo");
const messages = document.getElementById("messages");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const chatStatus = document.getElementById("chatStatus");
const themeToggle = document.getElementById("themeToggle");

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function markdownToHtml(markdown) {
    let html = escapeHtml(markdown);

    html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    html = html.replace(/^#### (.*)$/gm, "<h4>$1</h4>");
    html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>");
    html = html.replace(/^> (.*)$/gm, "<blockquote>$1</blockquote>");

    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/_(.*?)_/g, "<em>$1</em>");

    html = html.replace(/^\s*[-*] (.*)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>");
    html = html.replace(/<\/ul>\s*<ul>/g, "");

    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    html = html.replace(/\n{2,}/g, "</p><p>");
    html = `<p>${html}</p>`;
    html = html.replace(/<p>\s*(<h[1-4]>)/g, "$1");
    html = html.replace(/(<\/h[1-4]>)\s*<\/p>/g, "$1");
    html = html.replace(/<p>\s*(<ul>)/g, "$1");
    html = html.replace(/(<\/ul>)\s*<\/p>/g, "$1");
    html = html.replace(/<p>\s*(<pre>)/g, "$1");
    html = html.replace(/(<\/pre>)\s*<\/p>/g, "$1");
    html = html.replace(/<p>\s*(<blockquote>)/g, "$1");
    html = html.replace(/(<\/blockquote>)\s*<\/p>/g, "$1");
    html = html.replace(/\n/g, "<br>");

    return html;
}

function addMessage(text, role) {
    const div = document.createElement("div");
    div.className = `msg ${role}`;
    if (role === "assistant") {
        div.classList.add("markdown");
        div.innerHTML = markdownToHtml(text);
    } else {
        div.textContent = text;
    }
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function addThinkingLoader() {
    removeThinkingLoader();
    const div = document.createElement("div");
    div.className = "msg assistant thinking-loader";
    div.id = "thinkingLoader";
    div.innerHTML = `
        <span class="loader-dot"></span>
        <span class="loader-dot"></span>
        <span class="loader-dot"></span>
    `;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function removeThinkingLoader() {
    const loader = document.getElementById("thinkingLoader");
    if (loader) {
        loader.remove();
    }
}

function setChatEnabled(enabled) {
    state.loaded = enabled;
    chatInput.disabled = !enabled;
    sendBtn.disabled = !enabled;
}

function setLoadStatus(text, isError = false) {
    loadStatus.textContent = text;
    loadStatus.className = isError ? "status error" : "status";
}

function setChatStatus(text) {
    chatStatus.textContent = text;
}

function setTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark-mode", isDark);
    themeToggle.textContent = isDark ? "Light Mode" : "Dark Mode";
    localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
    const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
    setTheme(nextTheme);
}

async function autoLoadDefaultPdf() {
    setLoadStatus("Loading configured PDF knowledge base...");

    try {
        const res = await fetch("/api/load-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
        const data = await res.json();

        if (!res.ok) {
            setLoadStatus(data.error || "Failed to load default PDF.", true);
            setChatEnabled(false);
            return;
        }

        setLoadStatus(`Ready. Cache source: ${data.cache_source}.`);
        setChatEnabled(true);

        // pdfInfo.classList.remove("hidden");
        // pdfInfo.innerHTML = `
        //     <div><strong>PDF:</strong> ${data.pdf_path}</div>
        //     <div><strong>Chunks:</strong> ${data.chunk_count}</div>
        //     <div><strong>Load mode:</strong> ${data.cache_source}</div>
        // `;

        messages.innerHTML = "";
        addMessage("Knowledge base is loaded. Ask your question.", "assistant");
        chatInput.focus();
    } catch (err) {
        setLoadStatus("Network error while loading the default PDF.", true);
        setChatEnabled(false);
    }
}

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message || !state.loaded) {
        return;
    }

    addMessage(message, "user");
    chatInput.value = "";
    sendBtn.disabled = true;

    const startedAt = performance.now();
    setChatStatus("Thinking...");
    addThinkingLoader();

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
        });

        const data = await res.json();
        removeThinkingLoader();

        if (!res.ok) {
            addMessage(data.error || "Request failed.", "assistant");
            return;
        }

        state.lastResponse = data.response;
        addMessage(data.response, "assistant");

        const elapsed = ((performance.now() - startedAt) / 1000).toFixed(2);
        setChatStatus(`Response time: ${elapsed}s`);
    } catch (err) {
        removeThinkingLoader();
        addMessage("Network error while querying the chatbot.", "assistant");
        setChatStatus("Request failed");
    } finally {
        removeThinkingLoader();
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

async function clearChat() {
    try {
        await fetch("/api/clear-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        // Keep UI clear behavior even if backend clear fails.
    }

    messages.innerHTML = "";
    addMessage("Chat cleared. Conversation memory reset.", "assistant");
    setChatStatus("");
}

async function init() {
    setChatEnabled(false);

    const savedTheme = localStorage.getItem(THEME_KEY) || "light";
    setTheme(savedTheme);

    await autoLoadDefaultPdf();
}

sendBtn.addEventListener("click", sendMessage);
clearBtn.addEventListener("click", clearChat);
themeToggle.addEventListener("click", toggleTheme);

chatInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

init();
