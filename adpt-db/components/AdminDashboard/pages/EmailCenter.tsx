import { motion } from "motion/react";
import { useState } from "react";
import { Send, Paperclip, Image, AtSign, Users } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function EmailCenter() {
  const { currentTheme } = useTheme();
  const [recipients, setRecipients] = useState("all");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const recipientOptions = [
    { id: "all", label: "All Users", count: 248 },
    { id: "active", label: "Active Users Only", count: 142 },
    { id: "inactive", label: "Inactive Users", count: 106 },
    { id: "admins", label: "Administrators", count: 12 },
    { id: "custom", label: "Custom Selection", count: 0 },
  ];

  const recentEmails = [
    {
      subject: "Monthly Newsletter - January 2024",
      recipients: 248,
      sent: "2 days ago",
      opens: 186,
      clicks: 94,
    },
    {
      subject: "System Maintenance Notice",
      recipients: 248,
      sent: "5 days ago",
      opens: 221,
      clicks: 45,
    },
    {
      subject: "New Features Release",
      recipients: 142,
      sent: "1 week ago",
      opens: 118,
      clicks: 67,
    },
  ];

  const handleSend = () => {
    console.log("Sending email:", { recipients, subject, message });
    // Reset form
    setSubject("");
    setMessage("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Compose Email - Main Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 space-y-6"
      >
        {/* Compose Card */}
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
          }}
        >
          <h3 className="text-xl font-bold mb-6" style={{ color: currentTheme.text }}>
            Compose Email
          </h3>

          <div className="space-y-4">
            {/* Recipients Selector */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: currentTheme.textSecondary }}
              >
                Recipients
              </label>
              <div className="grid grid-cols-2 gap-3">
                {recipientOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setRecipients(option.id)}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{
                      backgroundColor:
                        recipients === option.id
                          ? currentTheme.primary
                          : currentTheme.background,
                      border: `1px solid ${
                        recipients === option.id
                          ? currentTheme.primary
                          : currentTheme.border
                      }`,
                      color:
                        recipients === option.id ? "#ffffff" : currentTheme.text,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{option.label}</span>
                      <span className="text-xs opacity-75">{option.count}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: currentTheme.textSecondary }}
              >
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject..."
                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                  color: currentTheme.text,
                }}
              />
            </div>

            {/* Message */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: currentTheme.textSecondary }}
              >
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
                rows={12}
                className="w-full px-4 py-3 rounded-xl outline-none resize-none transition-all"
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                  color: currentTheme.text,
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <button
                  className="p-3 rounded-lg transition-all"
                  style={{
                    backgroundColor: currentTheme.background,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <Paperclip className="w-5 h-5" style={{ color: currentTheme.text }} />
                </button>
                <button
                  className="p-3 rounded-lg transition-all"
                  style={{
                    backgroundColor: currentTheme.background,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <Image className="w-5 h-5" style={{ color: currentTheme.text }} />
                </button>
                <button
                  className="p-3 rounded-lg transition-all"
                  style={{
                    backgroundColor: currentTheme.background,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <AtSign className="w-5 h-5" style={{ color: currentTheme.text }} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="px-6 py-3 rounded-xl font-medium transition-all"
                  style={{
                    backgroundColor: currentTheme.background,
                    border: `1px solid ${currentTheme.border}`,
                    color: currentTheme.text,
                  }}
                >
                  Save Draft
                </button>
                <button
                  onClick={handleSend}
                  className="px-6 py-3 rounded-xl font-medium text-white flex items-center gap-2"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  <Send className="w-4 h-4" />
                  Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sidebar - Recent Emails & Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        {/* Email Stats */}
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
          }}
        >
          <h3 className="font-bold mb-4" style={{ color: currentTheme.text }}>
            Email Stats
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: currentTheme.textSecondary }}>
                  Total Sent
                </span>
                <span className="font-bold" style={{ color: currentTheme.text }}>
                  1,248
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: currentTheme.background }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ backgroundColor: currentTheme.primary, width: "100%" }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: currentTheme.textSecondary }}>
                  Avg Open Rate
                </span>
                <span className="font-bold" style={{ color: currentTheme.text }}>
                  74.8%
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: currentTheme.background }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ backgroundColor: currentTheme.primary, width: "74.8%" }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: currentTheme.textSecondary }}>
                  Click Rate
                </span>
                <span className="font-bold" style={{ color: currentTheme.text }}>
                  38.2%
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: currentTheme.background }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ backgroundColor: currentTheme.primary, width: "38.2%" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Emails */}
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
          }}
        >
          <h3 className="font-bold mb-4" style={{ color: currentTheme.text }}>
            Recent Emails
          </h3>
          <div className="space-y-3">
            {recentEmails.map((email, index) => (
              <div
                key={index}
                className="p-3 rounded-lg"
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                }}
              >
                <p className="font-medium text-sm mb-2" style={{ color: currentTheme.text }}>
                  {email.subject}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: currentTheme.textSecondary }}>{email.sent}</span>
                  <div className="flex items-center gap-2">
                    <span style={{ color: currentTheme.textSecondary }}>
                      {email.opens} opens
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
