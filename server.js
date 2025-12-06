const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

app.post("/save", (req, res) => {
  let data = [];
  try {
    data = JSON.parse(fs.readFileSync("data.json"));
  } catch {}

  data.unshift({
    project: req.body.project,
    qty: req.body.qty,
    time: req.body.time,
    date: new Date().toLocaleString()
  });

  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
  res.send("OK");
});

app.get("/data", (req, res) => {
  let data = [];
  try {
    data = JSON.parse(fs.readFileSync("data.json"));
  } catch {}
  res.json(data);
});

// ⚠️ ВАЖНО ЗА RENDER:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
