import { motion } from "motion/react";
import { useState } from "react";
import { Search, Clock, CheckCircle, AlertCircle, Send, X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function QueryManagement() {
  const { currentTheme } = useTheme();
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState("all");

  const queries = [
    {
      id: 1,
      user: "Sarah Chen",
      email: "sarah.chen@company.com",
      subject: "Cannot access database",
      message:
        "I'm having trouble accessing the customer database. Getting an error message that says 'Permission Denied'. Can you help?",
      status: "pending",
      priority: "high",
      timestamp: "2 hours ago",
      avatar: "SC",
    },
    {
      id: 2,
      user: "Mike Johnson",
      email: "mike.j@company.com",
      subject: "Feature request: Export to CSV",
      message:
        "It would be great to have the ability to export our records to CSV format. Is this something that's planned?",
      status: "pending",
      priority: "medium",
      timestamp: "5 hours ago",
      avatar: "MJ",
    },
    {
      id: 3,
      user: "Emily Rodriguez",
      email: "emily.r@company.com",
      subject: "Billing question",
      message:
        "I was charged twice this month. Can you please check my billing history and refund the duplicate charge?",
      status: "resolved",
      priority: "high",
      timestamp: "1 day ago",
      avatar: "ER",
    },
    {
      id: 4,
      user: "Alex Turner",
      email: "alex.turner@company.com",
      subject: "How to create custom fields?",
      message:
        "I want to add custom fields to my database but can't find the option. Where can I do this?",
      status: "pending",
      priority: "low",
      timestamp: "2 days ago",
      avatar: "AT",
    },
    {
      id: 5,
      user: "Jessica Williams",
      email: "j.williams@company.com",
      subject: "Account security concern",
      message:
        "I noticed some unusual login activity on my account. Can you help me verify if my account is secure?",
      status: "resolved",
      priority: "high",
      timestamp: "3 days ago",
      avatar: "JW",
    },
  ];

  const filteredQueries = queries.filter((q) => {
    if (filter === "all") return true;
    return q.status === filter;
  });

  const stats = [
    { label: "Total Queries", value: "89", color: currentTheme.text },
    { label: "Pending", value: "23", color: "#f97316" },
    { label: "Resolved", value: "66", color: "#10b981" },
  ];

  const handleSendReply = () => {
    console.log("Sending reply:", reply);
    setReply("");
    setSelectedQuery(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Queries List */}
      <div className="lg:col-span-1 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl text-center"
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <p className="text-2xl font-bold mb-1" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {["all", "pending", "resolved"].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all"
              style={{
                backgroundColor:
                  filter === filterOption ? currentTheme.primary : currentTheme.surface,
                border: `1px solid ${
                  filter === filterOption ? currentTheme.primary : currentTheme.border
                }`,
                color: filter === filterOption ? "#ffffff" : currentTheme.text,
              }}
            >
              {filterOption}
            </button>
          ))}
        </div>

        {/* Queries List */}
        <div className="space-y-3 max-h-150 overflow-y-auto">
          {filteredQueries.map((query, index) => (
            <motion.button
              key={query.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedQuery(query)}
              className="w-full p-4 rounded-xl text-left transition-all"
              style={{
                backgroundColor:
                  selectedQuery?.id === query.id
                    ? currentTheme.primary
                    : currentTheme.surface,
                border: `1px solid ${
                  selectedQuery?.id === query.id ? currentTheme.primary : currentTheme.border
                }`,
              }}
            >
              <div className="flex items-start gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0"
                  style={{
                    backgroundColor:
                      selectedQuery?.id === query.id ? "#ffffff" : currentTheme.primary,
                    color:
                      selectedQuery?.id === query.id ? currentTheme.primary : "#ffffff",
                  }}
                >
                  {query.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p
                      className="font-medium text-sm truncate"
                      style={{
                        color:
                          selectedQuery?.id === query.id ? "#ffffff" : currentTheme.text,
                      }}
                    >
                      {query.user}
                    </p>
                    {query.status === "pending" ? (
                      <Clock
                        className="w-4 h-4 flex-shrink-0"
                        style={{
                          color:
                            selectedQuery?.id === query.id
                              ? "#ffffff"
                              : currentTheme.textSecondary,
                        }}
                      />
                    ) : (
                      <CheckCircle
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: "#10b981" }}
                      />
                    )}
                  </div>
                  <p
                    className="text-sm font-medium mb-1 truncate"
                    style={{
                      color:
                        selectedQuery?.id === query.id
                          ? "#ffffff"
                          : currentTheme.textSecondary,
                    }}
                  >
                    {query.subject}
                  </p>
                  <p
                    className="text-xs"
                    style={{
                      color:
                        selectedQuery?.id === query.id
                          ? "rgba(255,255,255,0.7)"
                          : currentTheme.textSecondary,
                    }}
                  >
                    {query.timestamp}
                  </p>
                </div>
              </div>
              <div
                className={`text-xs px-2 py-1 rounded inline-block ${
                  query.priority === "high"
                    ? "bg-red-500 text-white"
                    : query.priority === "medium"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-500 text-white"
                }`}
              >
                {query.priority} priority
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Query Detail & Reply */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-2"
      >
        {selectedQuery ? (
          <div
            className="rounded-xl p-6 h-full flex flex-col"
            style={{
              backgroundColor: currentTheme.surface,
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-white"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  {selectedQuery.avatar}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1" style={{ color: currentTheme.text }}>
                    {selectedQuery.subject}
                  </h3>
                  <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
                    From: {selectedQuery.user} ({selectedQuery.email})
                  </p>
                  <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
                    {selectedQuery.timestamp}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedQuery(null)}
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                }}
              >
                <X className="w-5 h-5" style={{ color: currentTheme.text }} />
              </button>
            </div>

            {/* Message */}
            <div className="flex-1 mb-6">
              <div
                className="p-4 rounded-xl"
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                }}
              >
                <p className="leading-relaxed" style={{ color: currentTheme.text }}>
                  {selectedQuery.message}
                </p>
              </div>
            </div>

            {/* Reply Section */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: currentTheme.textSecondary }}
              >
                Your Reply
              </label>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your response here..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl outline-none resize-none mb-4"
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                  color: currentTheme.text,
                }}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: currentTheme.background,
                      border: `1px solid ${currentTheme.border}`,
                      color: currentTheme.text,
                    }}
                  >
                    Mark as Resolved
                  </button>
                </div>
                <button
                  onClick={handleSendReply}
                  className="px-6 py-3 rounded-xl font-medium text-white flex items-center gap-2"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  <Send className="w-4 h-4" />
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl p-12 h-full flex items-center justify-center"
            style={{
              backgroundColor: currentTheme.surface,
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            <div className="text-center">
              <AlertCircle
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: currentTheme.textSecondary }}
              />
              <p className="text-lg font-medium" style={{ color: currentTheme.textSecondary }}>
                Select a query to view details
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
