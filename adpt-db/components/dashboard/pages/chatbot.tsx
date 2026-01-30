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
import { Card } from "../../ui/card";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI assistant. I can help you manage your databases, analyze data, generate reports, and answer questions about your records. How can I assist you today?",
      timestamp: new Date(Date.now() - 300000),
    },
  ]);
  const [input, setInput] = useState("");

  const quickPrompts = [
    { icon: Database, label: "Show my database stats", prompt: "Show my database stats" },
    { icon: FileText, label: "Generate a report", prompt: "Generate a monthly report" },
    { icon: TrendingUp, label: "Analyze trends", prompt: "Analyze recent trends" },
    { icon: Zap, label: "Optimize queries", prompt: "Optimize my database queries" },
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Based on your data, performance is healthy 📊 Databases are stable with increasing usage. Want a deep breakdown?",
          timestamp: new Date(),
        },
      ]);
    }, 900);
  };

  return (
    <div className="h-full flex flex-col p-8">
      {/* Header */}
      <div className="mb-6">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-foreground mb-2"
        >
          AI Assistant
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground"
        >
          Ask questions about your data and get instant insights
        </motion.p>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 backdrop-blur-xl bg-background/60 border-border/50 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                    : "bg-muted/50 border border-border text-foreground"
                }`}
              >
                <p>{msg.content}</p>
                <p className="text-xs mt-1 opacity-60">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {msg.role === "user" && (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Quick Prompts */}
        {messages.length === 1 && (
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2 mb-3 text-muted-foreground text-sm">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Try asking
            </div>

            <div className="grid grid-cols-2 gap-3">
              {quickPrompts.map((p, i) => {
                const Icon = p.icon;
                return (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => setInput(p.prompt)}
                    className="flex gap-3 p-3 rounded-xl bg-muted/40 border border-border hover:border-cyan-500/40 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-foreground">{p.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-6 border-t border-border">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/50"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </motion.button>
          </div>
        </div>
      </Card>
    </div>
  );
}
