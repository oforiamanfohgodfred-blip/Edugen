require("dotenv").config();

const express = require("express");
const cors = require("cors");

const questionRoutes = require("./routes/questionRoutes");

const app = express();

const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "EduGen backend is running 🚀",
  });
});

app.use("/api/questions", questionRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 EduGen Backend running on http://localhost:${PORT}`);
});

server.on("error", (error) => {
  console.error("❌ SERVER ERROR:", error);
});