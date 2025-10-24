const express = require("express");
const { chatWithBot } = require("../controllers/chatbot.controller");

const router = express.Router();

router.post("/chat", chatWithBot);

module.exports = router;
