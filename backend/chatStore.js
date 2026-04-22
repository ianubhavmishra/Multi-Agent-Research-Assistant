/**
 * Chat History Store — JSON file-based persistence.
 * Lightweight alternative to MongoDB for 8GB RAM systems.
 * Stores conversations in backend/data/chats.json.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "data");
const CHATS_FILE = path.join(DATA_DIR, "chats.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadChats() {
  try {
    if (fs.existsSync(CHATS_FILE)) {
      return JSON.parse(fs.readFileSync(CHATS_FILE, "utf8"));
    }
  } catch (err) {
    console.error("[ChatStore] Error loading chats:", err.message);
  }
  return {};
}

function saveChats(chats) {
  try {
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2), "utf8");
  } catch (err) {
    console.error("[ChatStore] Error saving chats:", err.message);
  }
}

/**
 * Create a new conversation session.
 * @returns {{ id: string, title: string, createdAt: string }}
 */
function createSession(title = "New Chat") {
  const chats = loadChats();
  const id = crypto.randomUUID();
  chats[id] = {
    id,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };
  saveChats(chats);
  return chats[id];
}

/**
 * Add a message to an existing session.
 * @param {string} sessionId
 * @param {{ role: string, content: string, sources?: object[] }} message
 */
function addMessage(sessionId, message) {
  const chats = loadChats();
  if (!chats[sessionId]) {
    // Auto-create session
    chats[sessionId] = {
      id: sessionId,
      title: message.content?.slice(0, 60) || "Chat",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
  }

  chats[sessionId].messages.push({
    ...message,
    timestamp: new Date().toISOString(),
  });
  chats[sessionId].updatedAt = new Date().toISOString();

  // Auto-title from first user message
  if (
    chats[sessionId].messages.length === 1 &&
    message.role === "user"
  ) {
    chats[sessionId].title = message.content.slice(0, 60);
  }

  saveChats(chats);
  return chats[sessionId];
}

/**
 * Get a session with all its messages.
 * @param {string} sessionId
 */
function getSession(sessionId) {
  const chats = loadChats();
  return chats[sessionId] || null;
}

/**
 * List all sessions (without full messages, for sidebar).
 * @returns {Array}
 */
function listSessions() {
  const chats = loadChats();
  return Object.values(chats)
    .map(({ id, title, createdAt, updatedAt, messages }) => ({
      id,
      title,
      createdAt,
      updatedAt,
      messageCount: messages.length,
    }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

/**
 * Delete a session.
 * @param {string} sessionId
 */
function deleteSession(sessionId) {
  const chats = loadChats();
  delete chats[sessionId];
  saveChats(chats);
}

module.exports = {
  createSession,
  addMessage,
  getSession,
  listSessions,
  deleteSession,
};
