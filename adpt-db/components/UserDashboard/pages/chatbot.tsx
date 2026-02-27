import { motion } from "motion/react";
import { useState } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Database,
  FileText,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import axios from "axios";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function Chatbot() {
  const { currentTheme } = useTheme();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI assistant. I can help you manage your databases, analyze data, generate reports, and answer questions about your records. How can I assist you today?",
      timestamp: new Date(Date.now() - 300000),
    },
  ]);

  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const quickPrompts = [
    {
      icon: Database,
      label: "Create a Database",
      prompt: "How to create database?",
    },
    {
      icon: FileText,
      label: "Find a near store",
      prompt: "How to find near by store?",
    },
    {
      icon: TrendingUp,
      label: "AI Assistance",
      prompt: "Tell me about AI assistant",
    },
    {
      icon: Zap,
      label: "Change Setting",
      prompt: "How to change settings?",
    },
  ];

  const handleSend = async (customMessage?: string) => {
    const messageToSend = customMessage || input;

    if (!messageToSend.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("/api/chatbot", { payload: messageToSend });
      const aiResponse: Message = {
        role: "assistant",
        content: res.data.response || "No response from Python",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Chat Error:", error);

      const errorMessage: Message = {
        role: "assistant",
        content:
          "Sorry, I'm having trouble connecting to my Python brain.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <div className="h-full flex flex-col p-8">
      {/* Header */}
      <div className="mb-6">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-2"
          style={{ color: currentTheme.text }}
        >
          AI Assistant
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ color: currentTheme.textSecondary }}
        >
          Ask questions and get insights about your data
        </motion.p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Quick Prompts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {quickPrompts.map((prompt, index) => {
            const Icon = prompt.icon;
            return (
              <motion.button
                key={prompt.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickPrompt(prompt.prompt)}
                className="p-2 flex rounded-xl text-left transition-all"
                style={{
                  backgroundColor: currentTheme.surface,
                  border: `1px solid ${currentTheme.border}`,
                }}
              >
                <div className="flex items-center justify-center gap-3">
                  <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center "
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-medium" style={{ color: currentTheme.text }}>
                  {prompt.label}
                </p>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Messages Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex-1 overflow-y-auto rounded-2xl p-6 space-y-4"
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
          }}
        >
          {/* 1. First, map your messages as usual */}
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4`}>
              <div
                className={`flex-1 max-w-[80%] p-2 rounded-2xl ${message.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"
                  }`}
                style={{
                  backgroundColor: message.role === "assistant" ? currentTheme.background : currentTheme.primary,
                  border: `1px solid ${message.role === "assistant" ? currentTheme.border : currentTheme.primary}`,
                  color: message.role === "assistant" ? currentTheme.text : "#ffffff",
                }}
              >               
                <div className="p-4 rounded-xl">
                  <div className="prose dark:prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
                <p
                  className="text-xs mt-1 ml-5"
                  style={{
                    color: message.role === "assistant" ? currentTheme.textSecondary : "rgba(255,255,255,0.7)",
                  }}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

          {/* 2. Place the Loading state OUTSIDE the map, specifically for the assistant */}
          {loading && (
            <div className="flex justify-start mb-4 animate-in fade-in duration-300">
              <div
                className="max-w-[80%] p-6 rounded-2xl rounded-tl-sm shadow-sm"
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                }}
              >
                <div className="flex space-x-2 justify-center items-center h-4">
                  <div
                    className="h-2 w-2 rounded-full animate-bounce [animation-delay:-0.3s]"
                    style={{ backgroundColor: currentTheme.primary }}
                  ></div>
                  <div
                    className="h-2 w-2 rounded-full animate-bounce [animation-delay:-0.15s]"
                    style={{ backgroundColor: currentTheme.primary }}
                  ></div>
                  <div
                    className="h-2 w-2 rounded-full animate-bounce"
                    style={{ backgroundColor: currentTheme.primary }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3 p-4 rounded-2xl"
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
          }}
        >
          <div
            className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl"
            style={{
              backgroundColor: currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            <Sparkles className="w-5 h-5" style={{ color: currentTheme.primary }} />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me anything about your data..."
              className="flex-1 bg-transparent outline-none"
              style={{ color: currentTheme.text }}
            />
          </div>
          <button
            onClick={() => handleSend()}
            className="px-6 py-3 rounded-xl font-medium text-white transition-all"
            style={{ backgroundColor: currentTheme.primary }}
          >
            <Send className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
