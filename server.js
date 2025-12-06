const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const DATA_DIR = __dirname;
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
const REPORTS_FILE  = path.join(DATA_DIR, "reports.json");
const USERS_FILE    = path.join(DATA_DIR, "users.json");

// helper read/write
function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file)); }
  catch(e){ return []; }
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Admin password (set on Render as ENV variable ADMIN_PASS)
const ADMIN_PASS = process.env.ADMIN_PASS || "admin";

// ----- Projects -----
app.get("/projects", (req, res) => {
  const projects = readJson(PROJECTS_FILE);
  res.json(projects);
});

// create project (admin)
app.post("/projects", (req, res) => {
  const pass = req.header("x-admin-pass") || req.body.admin_pass;
  if (pass !== ADMIN_PASS) return res.status(401).send("unauthorized");
  const { name } = req.body;
  if (!name) return res.status(400).send("missing name");
  const projects = readJson(PROJECTS_FILE);
  if (projects.includes(name)) return res.status(409).send("exists");
  projects.unshift(name);
  writeJson(PROJECTS_FILE, projects);
  res.json({ ok: true });
});

// ----- Users / Operators -----
app.get("/users", (req, res) => {
  const users = readJson(USERS_FILE);
  res.json(users);
});

// add operator (admin)
app.post("/users", (req, res) => {
  const pass = req.header("x-admin-pass") || req.body.admin_pass;
  if (pass !== ADMIN_PASS) return res.status(401).send("unauthorized");
  const { name } = req.body;
  if (!name) return res.status(400).send("missing name");
  const users = readJson(USERS_FILE);
  if (users.includes(name)) return res.status(409).send("exists");
  users.unshift(name);
  writeJson(USERS_FILE, users);
  res.json({ ok: true });
});

// ----- Reports -----
app.post("/save", (req, res) => {
  const { project, qty, time, operator, notes } = req.body;
  if (!project) return res.status(400).send("missing project");
  const reports = readJson(REPORTS_FILE);
  reports.unshift({
    project, qty, time, operator: operator || null, notes: notes || null,
    date: new Date().toISOString()
  });
  writeJson(REPORTS_FILE, reports);
  res.json({ ok: true });
});

// list reports with optional filters: project, from, to (ISO)
app.get("/data", (req, res) => {
  let data = readJson(REPORTS_FILE);
  const { project, from, to } = req.query;
  if (project) data = data.filter(r => r.project === project);
  if (from) data = data.filter(r => new Date(r.date) >= new Date(from));
  if (to) data = data.filter(r => new Date(r.date) <= new Date(to));
  res.json(data);
});

// export CSV - optional project filter
app.get("/export", (req, res) => {
  let data = readJson(REPORTS_FILE);
  const { project, from, to } = req.query;
  if (project) data = data.filter(r => r.project === project);
  if (from) data = data.filter(r => new Date(r.date) >= new Date(from));
  if (to) data = data.filter(r => new Date(r.date) <= new Date(to));

  const header = ["date","project","operator","qty","time","notes"];
  const rows = data.map(r => header.map(k => {
    const v = r[k] ?? "";
    // escape quotes
    return `"${String(v).replace(/"/g,'""')}"`;
  }).join(","));
  const csv = [header.join(",")].concat(rows).join("\n");
  res.setHeader("Content-Type","text/csv");
  res.setHeader("Content-Disposition","attachment; filename=\"reports.csv\"");
  res.send(csv);
});

// health
app.get("/health", (req,res) => res.send("ok"));

// start server (Render uses process.env.PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));


