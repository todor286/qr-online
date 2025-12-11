const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

let projects = [];
let users = [];
let records = [];

/* ---------- PROJECTS ---------- */
app.get("/projects", (req, res) => {
  res.json(projects.map(p => p.name || p));
});

app.post("/projects", (req, res) => {
  const name = req.body.name;
  if (!name) return res.status(400).send("Missing name");
  projects.push(name);
  res.json({ ok: true });
});

/* ---------- USERS ---------- */
app.get("/users", (req, res) => {
  res.json(users.map(u => u.name || u));
});

app.post("/users", (req, res) => {
  const name = req.body.name;
  if (!name) return res.status(400).send("Missing name");
  users.push(name);
  res.json({ ok: true });
});

/* ---------- SAVE REPORT ---------- */
app.post("/save", (req, res) => {
  const { project, qty, time, operator, notes } = req.body;
  records.push({
    project,
    qty,
    time,
    operator,
    notes,
    date: new Date().toISOString()
  });
  res.json({ saved: true });
});

/* ---------- GET DATA (WITH FILTERS) ---------- */
app.get("/data", (req, res) => {
  let out = [...records];
  const { project, from, to } = req.query;

  if (project) out = out.filter(r => r.project === project);
  if (from) out = out.filter(r => r.date >= from);
  if (to) out = out.filter(r => r.date <= to);

  res.json(out);
});

/* ---------- EXPORT CSV ---------- */
app.get("/export", (req, res) => {
  let out = [...records];
  const { project, from, to } = req.query;

  if (project) out = out.filter(r => r.project === project);
  if (from) out = out.filter(r => r.date >= from);
  if (to) out = out.filter(r => r.date <= to);

  let csv = "date,project,operator,qty,time,notes\n";
  out.forEach(r => {
    csv += `${r.date},${r.project},${r.operator || ""},${r.qty || ""},${r.time || ""},${(r.notes || "").replace(/,/g, ";")}\n`;
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=report.csv");
  res.send(csv);
});

/* ---------- STATIC FRONTEND ---------- */
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("SERVER STARTED on " + PORT));

app.post("/users", (req, res) => {
  users.push(req.body);
  res.json({ ok: true });
});

// ===== ОТЧЕТИ =====
app.get("/records", (req, res) => {
  res.json(records);
});

app.post("/records", (req, res) => {
  records.push(req.body);
  res.json({ saved: true });
});

// ===== САЙТ =====
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("SERVER STARTED ON PORT " + PORT);
});



