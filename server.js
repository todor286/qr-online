const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

let projects = [];
let users = [];
let records = [];

// ✅ ПРОЕКТИ
app.get("/projects", (req, res) => {
  res.json(projects);
});

app.post("/projects", (req, res) => {
  const project = req.body;
  projects.push(project);
  res.json({ status: "ok" });
});

// ✅ ПОТРЕБИТЕЛИ
app.get("/users", (req, res) => {
  res.json(users);
});

app.post("/users", (req, res) => {
  const user = req.body;
  users.push(user);
  res.json({ status: "ok" });
});

// ✅ ЗАПИСИ
app.get("/records", (req, res) => {
  res.json(records);
});

app.post("/records", (req, res) => {
  records.push(req.body);
  res.json({ status: "saved" });
});

// ✅ СТАТИЧНИ ФАЙЛОВЕ
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));

fix auth
