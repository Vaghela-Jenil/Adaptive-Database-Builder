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

export default function Chatbot() {
  const { currentTheme } = useTheme();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your AI assistant. I can help you manage your databases, analyze data, generate reports, and answer questions about your records. How can I assist you today?",
      timestamp: new Date(Date.now() - 300000),
    },
  ]);
  const [input, setInput] = useState("");

  const quickPrompts = [
    {
      icon: Database,
      label: "Show my database stats",
      prompt: "Can you show me statistics about my databases?",
    },
    {
      icon: FileText,
      label: "Generate a report",
      prompt: "Generate a summary report of this month's activity",
    },
    {
      icon: TrendingUp,
      label: "Analyze trends",
      prompt: "Analyze usage trends over the last 3 months",
    },
    {
      icon: Zap,
      label: "Optimize queries",
      prompt: "Suggest ways to optimize my database queries",
    },
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        role: "assistant",
        content:
          "I understand you're asking about " +
          input +
          ". Based on your data, here's what I found: Your databases are performing well with 12,458 total records across 24 active databases. Would you like me to provide more detailed insights?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const handleQuickPrompt = (prompt : any) => {
    setInput(prompt);
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
                className="p-4 rounded-xl text-left transition-all"
                style={{
                  backgroundColor: currentTheme.surface,
                  border: `1px solid ${currentTheme.border}`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-medium" style={{ color: currentTheme.text }}>
                  {prompt.label}
                </p>
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
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: message.role === "assistant" ? currentTheme.primary : currentTheme.background,
                  border: message.role === "user" ? `2px solid ${currentTheme.border}` : "none",
                }}
              >
                {message.role === "assistant" ? (
                  <Bot className="w-5 h-5 text-white" />
                ) : (
                  <User className="w-5 h-5" style={{ color: currentTheme.text }} />
                )}
              </div>

              {/* Message */}
              <div
                className={`flex-1 max-w-[80%] p-4 rounded-2xl ${
                  message.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"
                }`}
                style={{
                  backgroundColor: message.role === "assistant" ? currentTheme.background : currentTheme.primary,
                  border: `1px solid ${message.role === "assistant" ? currentTheme.border : currentTheme.primary}`,
                  color: message.role === "assistant" ? currentTheme.text : "#ffffff",
                }}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p
                  className="text-xs mt-2"
                  style={{
                    color: message.role === "assistant" ? currentTheme.textSecondary : "rgba(255,255,255,0.7)",
                  }}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </motion.div>
          ))}
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
            onClick={handleSend}
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
