const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ----- ENV -----
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// ===== DATA STORAGE =====
let projects = [];
let users = [];
let records = [];

// ===== AUTH =====
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASS) {
    return res.status(401).json({ error: "Wrong password" });
  }

  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "12h" });
  res.json({ token });
});

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "Missing token" });

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ===== PROJECTS =====
app.get("/api/projects", verifyToken, (req, res) => {
  res.json(projects);
});

app.post("/api/projects", verifyToken, (req, res) => {
  projects.push(req.body);
  res.json({ ok: true });
});

// ===== USERS =====
app.get("/api/users", verifyToken, (req, res) => {
  res.json(users);
});

app.post("/api/users", verifyToken, (req, res) => {
  users.push(req.body);
  res.json({ ok: true });
});

// ===== RECORDS =====
app.get("/api/records", verifyToken, (req, res) => {
  res.json(records);
});

app.post("/api/records", (req, res) => {
  records.push(req.body);
  res.json({ saved: true });
});

// ===== STATIC WEBSITE =====
app.use(express.static("public"));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== START =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started on " + PORT));


