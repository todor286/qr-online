const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// --------- ДАННИ В ПАМЕТТА ----------
let projects = [];
let users = [];
let records = [];

// --------- ПРОЕКТИ ----------
app.get("/projects", (req, res) => {
  res.json(projects);
});

app.post("/projects", (req, res) => {
  projects.push(req.body);
  res.json({ ok: true });
});

// --------- ПОТРЕБИТЕЛИ ----------
app.get("/users", (req, res) => {
  res.json(users);
});

app.post("/users", (req, res) => {
  users.push(req.body);
  res.json({ ok: true });
});

// --------- ОТЧЕТИ ----------
app.get("/records", (req, res) => {
  res.json(records);
});

app.post("/records", (req, res) => {
  records.push(req.body);
  res.json({ saved: true });
});

// --------- СТАТИЧЕН САЙТ ----------
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Server started on port " + PORT)
);
remove auth completely

