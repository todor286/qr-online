// server.js
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());

const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";
const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const TOKEN_EXPIRY = "12h";

let projects = [];   // array of names
let users = [];      // array of names
let records = [];    // array of objects {project, qty, time, operator, notes, date}

// auth middleware
function verifyToken(req, res, next){
  const auth = req.headers.authorization || req.headers["x-auth"];
  if(!auth) return res.status(401).send("Unauthorized");
  const parts = auth.split(" ");
  const token = (parts.length===2 && parts[0].toLowerCase()==="bearer")? parts[1] : auth;
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if(err) return res.status(401).send("Unauthorized");
    req.user = payload;
    next();
  });
}

// login -> returns token
app.post("/login", (req, res) => {
  const { password } = req.body || {};
  if(!password) return res.status(400).send("missing password");
  if(password !== ADMIN_PASS) return res.status(401).send("invalid password");
  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  res.json({ token });
});

/* Public read endpoints */
app.get("/projects", (req, res) => res.json(projects));
app.get("/users", (req, res) => res.json(users));
app.get("/data", (req, res) => {
  // optional filters: project, from, to (ISO)
  let out = [...records];
  const { project, from, to } = req.query;
  if(project) out = out.filter(r => r.project === project);
  if(from) out = out.filter(r => new Date(r.date) >= new Date(from));
  if(to) out = out.filter(r => new Date(r.date) <= new Date(to));
  res.json(out);
});

/* Protected admin actions */
app.post("/projects", verifyToken, (req, res) => {
  const { name } = req.body;
  if(!name) return res.status(400).send("missing name");
  if(projects.includes(name)) return res.status(409).send("exists");
  projects.unshift(name);
  res.json({ ok: true });
});
app.post("/users", verifyToken, (req, res) => {
  const { name } = req.body;
  if(!name) return res.status(400).send("missing name");
  if(users.includes(name)) return res.status(409).send("exists");
  users.unshift(name);
  res.json({ ok: true });
});

// save report (public)
app.post("/save", (req, res) => {
  const { project, qty, time, operator, notes } = req.body;
  if(!project) return res.status(400).send("missing project");
  records.unshift({
    project, qty, time, operator, notes,
    date: new Date().toISOString()
  });
  res.json({ saved: true });
});

// export CSV (protected)
app.get("/export", verifyToken, (req, res) => {
  let out = [...records];
  const { project, from, to } = req.query;
  if(project) out = out.filter(r => r.project === project);
  if(from) out = out.filter(r => new Date(r.date) >= new Date(from));
  if(to) out = out.filter(r => new Date(r.date) <= new Date(to));

  const header = ["date","project","operator","qty","time","notes"];
  const rows = out.map(r => header.map(h => `"${String(r[h] ?? "").replace(/"/g,'""')}"`).join(","));
  const csv = [header.join(",")].concat(rows).join("\n");
  res.setHeader("Content-Type","text/csv");
  res.setHeader("Content-Disposition","attachment; filename=\"reports.csv\"");
  res.send(csv);
});

/* Serve admin SPA under /admin and public files */
app.use("/admin", express.static(path.join(__dirname, "public", "admin")));
app.use(express.static(path.join(__dirname, "public")));

// fallback: send public index for SPA routing (optional)
app.get("*", (req, res, next) => {
  // if request asks for HTML root, serve main index
  if(req.accepts && req.accepts("html")) {
    return res.sendFile(path.join(__dirname, "public", "index.html"));
  }
  next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));




