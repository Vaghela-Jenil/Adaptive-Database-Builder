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

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
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
      content: `Hello! I'm your AI assistant for the "${database?.DatabaseName || "Unknown"}" database. I can help you analyze your ${database?.recordCount || 0} records, answer questions about your data, and provide insights. What would you like to know?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const query = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      const formName = database?.DatabaseName;

      if (!formName) {
        throw new Error("Database information is missing.");
      }

      const res = await axios.get("/api/chatbot/database", {
        params: {
          form_name: formName,
          query: query,
        },
      });

      const data = res.data;
      console.log("[DatabaseChatbot] Received response:", data);
      
      // Format the results into a readable response
      let responseContent: string;
      if (data.results && Array.isArray(data.results)) {
        if (data.results.length === 0) {
          responseContent = "No results found for your query.";
        } else {
          responseContent = formatResults(data.results);
        }
      } else if (data.response) {
        responseContent = data.response;
      } else {
        responseContent = JSON.stringify(data, null, 2);
      }

      const aiResponse: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error: unknown) {
      const errMsg =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : error instanceof Error
          ? error.message
          : "An unexpected error occurred.";

      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${errMsg}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatResults = (results: Record<string, unknown>[]): string => {
    if (results.length === 1) {
      const record = results[0];
      return Object.entries(record)
        .filter(([key]) => key !== "_id")
        .map(([key, value]) => {
          if (typeof value === "object" && value !== null) {
            return `**${key}:** ${JSON.stringify(value)}`;
          }
          return `**${key}:** ${value}`;
        })
        .join("\n");
    }

    return results
      .map((record, index) => {
        const fields = Object.entries(record)
          .filter(([key]) => key !== "_id")
          .map(([key, value]) => `  ${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`)
          .join("\n");
        return `**Record ${index + 1}:**\n${fields}`;
      })
      .join("\n\n");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: currentTheme.background }}
    >
      {/* Header */}
      <div
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{
          backgroundColor: currentTheme.surface,
          borderColor: currentTheme.border,
        }}
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            style={{ color: currentTheme.text }}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="h-6 w-px" style={{ backgroundColor: currentTheme.border }} />
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: currentTheme.primary }}
            >
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: currentTheme.text }}>
                AI Assistant
              </h1>
              <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                {database?.DatabaseName || "Unknown Database"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: currentTheme.primary }} />
          <span className="text-sm font-medium" style={{ color: currentTheme.text }}>
            AI-Powered
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: currentTheme.primary }}
              >
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl px-4 py-3 ${
                message.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"
              }`}
              style={{
                backgroundColor:
                  message.role === "user" ? currentTheme.primary : currentTheme.surface,
                color: message.role === "user" ? "#ffffff" : currentTheme.text,
                border: message.role === "assistant" ? `1px solid ${currentTheme.border}` : "none",
              }}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              <p
                className="text-xs mt-2"
                style={{
                  color: message.role === "user" ? "rgba(255,255,255,0.7)" : currentTheme.textSecondary,
                }}
              >
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>

            {message.role === "user" && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: currentTheme.surface, border: `1px solid ${currentTheme.border}` }}
              >
                <User className="w-4 h-4" style={{ color: currentTheme.text }} />
              </div>
            )}
          </motion.div>
        ))}

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-4"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: currentTheme.primary }}
              >
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div
                className="rounded-2xl rounded-bl-sm px-4 py-3"
                style={{
                  backgroundColor: currentTheme.surface,
                  border: `1px solid ${currentTheme.border}`,
                }}
              >
                <div className="flex gap-1">
                  <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: currentTheme.textSecondary }}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: currentTheme.textSecondary }}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: currentTheme.textSecondary }}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        className="border-t px-6 py-4"
        style={{
          backgroundColor: currentTheme.surface,
          borderColor: currentTheme.border,
        }}
      >
        <div className="flex gap-3 max-w-4xl mx-auto">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your database..."
            className="flex-1"
            style={{
              backgroundColor: currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
              color: currentTheme.text,
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            style={{
              backgroundColor: currentTheme.primary,
              color: "#ffffff",
            }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Suggested Questions */}
        <div className="flex flex-wrap gap-2 mt-4 max-w-4xl mx-auto">
          {[
            "Show me the database schema",
            "How many records do I have?",
            "How do I add new data?",
            "How can I filter records?",
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInputValue(suggestion)}
              className="text-xs px-3 py-1.5 rounded-full transition-colors"
              style={{
                backgroundColor: currentTheme.background,
                border: `1px solid ${currentTheme.border}`,
                color: currentTheme.textSecondary,
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
