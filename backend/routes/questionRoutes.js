const express = require("express");
const {
  generateQuestions,
} = require("../controllers/questionController");

const router = express.Router();

router.post("/generate", generateQuestions);

module.exports = router;