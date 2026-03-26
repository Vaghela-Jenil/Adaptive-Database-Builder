"use client";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  Send,
  Bot,
  User,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { motion, AnimatePresence } from "motion/react";
import { DatabaseFolder } from "./types";
import axios from "axios";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type DatabaseChatbotProps = {
  database: DatabaseFolder | null;
  onBack: () => void;
};

export default function DatabaseChatbot({
  database,
  onBack,
}: DatabaseChatbotProps) {
  const { currentTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hello! I'm your AI assistant for the "${database?.DatabaseName || "Unknown"}" database. I can help you analyze your ${database?.recordCount || 0} records. What would you like to know?`,
      timestamp: new Date(Date.now()),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState<boolean>(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Helper to convert JSON results to Markdown Table
  const formatResults = (results: Record<string, unknown>[]): string => {
    if (!results || results.length === 0) return "No results found.";

    const allKeys = Array.from(
      new Set(results.flatMap((record) => Object.keys(record)))
    ).filter((key) => key !== "_id");

    const headerRow = `| ${allKeys.join(" | ")} |`;
    const separatorRow = `| ${allKeys.map(() => "---").join(" | ")} |`;
    const dataRows = results
      .map((record) => {
        const row = allKeys.map((key) => {
          const value = record[key];
          if (value === null || value === undefined) return "";
          return typeof value === "object"
            ? JSON.stringify(value).replace(/\|/g, "\\|")
            : String(value).replace(/\|/g, "\\|");
        });
        return `| ${row.join(" | ")} |`;
      })
      .join("\n");

    return `${headerRow}\n${separatorRow}\n${dataRows}`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue,
      timestamp: new Date(Date.now()),
    };

    setMessages((prev) => [...prev, userMessage]);
    const query = inputValue;
    setInputValue("");
    setIsTyping(true);
    setLoading(true);
    try {
      const formName = database?.DatabaseName;
      if (!formName) throw new Error("Database information is missing.");

      const res = await axios.get("/api/chatbot/database", {
        params: { databaseId: database._id, form_name: formName, query: query },
      });

      const data = res.data;
      let responseContent: string;

      // LOGIC: If results array exists and has multiple items, make a table
      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        responseContent = formatResults(data.results);
      } else {
        // Fallback to plain string response
        responseContent = data.response || data.message || "Query processed successfully.";
      }

      const aiResponse: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date(Date.now()),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error: any) {
      const errMsg = error.response?.data?.error || error.message || "An unexpected error occurred.";
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${errMsg}`,
        timestamp: new Date(Date.now()),
      }]);
    } finally {
      setIsTyping(false);
      setLoading(false)
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: currentTheme.background }}>
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between" style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border }}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} style={{ color: currentTheme.text }}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: currentTheme.primary }}>
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: currentTheme.text }}>AI Assistant</h1>
              <p className="text-xs" style={{ color: currentTheme.textSecondary }}>{database?.DatabaseName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => {
          const isTable = message.content.startsWith("|");
          
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: currentTheme.primary }}>
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user" ? "rounded-br-sm text-white" : "rounded-bl-sm"
                }`}
                style={{
                  backgroundColor: message.role === "user" ? currentTheme.primary : currentTheme.surface,
                  color: message.role === "user" ? "#FFFFFF" : currentTheme.text,
                  border: message.role === "assistant" ? `1px solid ${currentTheme.border}` : "none",
                }}
              >
                {isTable ? (
                  <div className="overflow-x-auto my-2 rounded-lg border border-gray-200 bg-white">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: (props) => <table className="w-full text-sm text-left border-collapse" {...props} />,
                        th: (props) => <th className="px-3 py-2 border-b bg-gray-100 font-bold text-gray-900" {...props} />,
                        td: (props) => <td className="px-3 py-2 border-b text-gray-700" {...props} />,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                )}
                
                <p className="text-[10px] mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border" style={{ backgroundColor: currentTheme.primary, borderColor: currentTheme.border }}>
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </motion.div>
          );
          
        })}
        {/* 1. Loading state is now OUTSIDE the map loop */}
  {loading && (
    <div className="flex justify-start items-start gap-4 mb-4 animate-in fade-in duration-300">
      {/* Bot Icon for Loading */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: currentTheme.primary }}>
        <Bot className="w-4 h-4 text-white" />
      </div>
      
      <div
        className="px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm"
        style={{
          backgroundColor: currentTheme.surface,
          border: `1px solid ${currentTheme.border}`,
        }}
      >
        <div className="flex space-x-2 justify-center items-center h-4">
          <div
            className="h-1.5 w-1.5 rounded-full animate-bounce [animation-delay:-0.3s]"
            style={{ backgroundColor: currentTheme.primary }}
          ></div>
          <div
            className="h-1.5 w-1.5 rounded-full animate-bounce [animation-delay:-0.15s]"
            style={{ backgroundColor: currentTheme.primary }}
          ></div>
          <div
            className="h-1.5 w-1.5 rounded-full animate-bounce"
            style={{ backgroundColor: currentTheme.primary }}
          ></div>
        </div>
      </div>
    </div>
  )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t px-6 py-4" style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border }}>
        <div className="flex gap-3 max-w-4xl mx-auto">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about your data..."
            className="flex-1"
            style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.border, color: currentTheme.text }}
          />
          <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping} style={{ backgroundColor: currentTheme.primary }}>
            <Send className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}