require("dotenv").config();
const express = require("express");
const cors = require("cors");
const chatStore = require("./chatStore");

const app = express();
const PORT = process.env.PORT || 5000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// --- Health Check ---
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ===========================
// Chat History API (REST)
// ===========================

/** List all chat sessions */
app.get("/api/sessions", (_req, res) => {
  const sessions = chatStore.listSessions();
  res.json({ sessions });
});

/** Create a new session */
app.post("/api/sessions", (req, res) => {
  const { title } = req.body;
  const session = chatStore.createSession(title || "New Chat");
  res.status(201).json({ session });
});

/** Get a specific session with messages */
app.get("/api/sessions/:id", (req, res) => {
  const session = chatStore.getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json({ session });
});

/** Add a message to a session */
app.post("/api/sessions/:id/messages", (req, res) => {
  const { role, content, sources } = req.body;
  if (!role || !content) {
    return res.status(400).json({ error: "role and content are required" });
  }
  const session = chatStore.addMessage(req.params.id, { role, content, sources });
  res.json({ session });
});

/** Delete a session */
app.delete("/api/sessions/:id", (req, res) => {
  chatStore.deleteSession(req.params.id);
  res.json({ success: true });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`\n🚀 Backend API running on http://localhost:${PORT}`);
  console.log(`   Chat History API: http://localhost:${PORT}/api/sessions`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
