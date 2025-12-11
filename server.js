// server.js (improved with JSON persistence)
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// CONFIG
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";
const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const TOKEN_EXPIRY = "12h";

// DATA FILE
const DB_FILE = path.join(__dirname, "db.json");

// Initialize DB
let DB = { projects: [], users: [], records: [] };
if (fs.existsSync(DB_FILE)) {
  try {
    DB = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (e) {
    console.error("DB read error", e);
  }
}

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(DB, null, 2));
}

// AUTH MIDDLEWARE
function verifyToken(req, res, next) {
  const auth = req.headers.authorization || req.headers["x-auth"];  
  if (!auth) return res.status(401).send("Unauthorized");

  const parts = auth.split(" ");
  const token = (parts.length === 2 && parts[0].toLowerCase() === "bearer") ? parts[1] : auth;

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).send("Unauthorized");
    req.user = payload;
    next();
  });
}

// LOGIN (return token)
app.post("/login", (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).send("missing password");
  if (password !== ADMIN_PASS) return res.status(401).send("invalid password");

  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  res.json({ token });
});

/* PUBLIC READ ENDPOINTS */
app.get("/projects", (req, res) => res.json(DB.projects));
app.get("/users", (req, res) => res.json(DB.users));

app.get("/data", (req, res) => {
  let out = [...DB.records];
  const { project, from, to } = req.query;

  if (project) out = out.filter(r => r.project === project);
  if (from) out = out.filter(r => new Date(r.date) >= new Date(from));
  if (to) out = out.filter(r => new Date(r.date) <= new Date(to));

  res.json(out);
});

/* ADMIN: ADD PROJECT */
app.post("/projects", verifyToken, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send("missing name");
  if (DB.projects.includes(name)) return res.status(409).send("exists");

  DB.projects.unshift(name);
  saveDB();
  res.json({ ok: true });
});

/* ADMIN: ADD USER */
app.post("/users", verifyToken, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send("missing name");
  if (DB.users.includes(name)) return res.status(409).send("exists");

  DB.users.unshift(name);
  saveDB();
  res.json({ ok: true });
});

/* PUBLIC: SAVE REPORT */
app.post("/save", (req, res) => {
  const { project, qty, time, operator, notes } = req.body;
  if (!project) return res.status(400).send("missing project");

  DB.records.unshift({
    project,
    qty,
    time,
    operator,
    notes,
    date: new Date().toISOString()
  });

  saveDB();
  res.json({ saved: true });
});

/* ADMIN: EXPORT CSV */
app.get("/export", verifyToken, (req, res) => {
  let out = [...DB.records];
  const { project, from, to } = req.query;

  if (project) out = out.filter(r => r.project === project);
  if (from) out = out.filter(r => new Date(r.date) >= new Date(from));
  if (to) out = out.filter(r => new Date(r.date) <= new Date(to));

  const header = ["date", "project", "operator", "qty", "time", "notes"];  
  const rows = out.map(r => header.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","));
  const csv = [header.join(",")].concat(rows).join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=reports.csv");
  res.send(csv);
});

/* STATIC FILES */
app.use("/admin", express.static(path.join(__dirname, "public", "admin")));
app.use(express.static(path.join(__dirname, "public")));

// FALLBACK
app.get("*", (req, res, next) => {
  if (req.accepts && req.accepts("html")) {
    return res.sendFile(path.join(__dirname, "public", "index.html"));
  }
  next();
});

/* START SERVER */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));

