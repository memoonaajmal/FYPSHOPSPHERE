const Chat = require("../models/Chat");


// GET chat history
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id; // from requireAuth middleware

    const chat = await Chat.findOne({ userId });

    return res.json({
      messages: chat?.messages || [],
    });
  } catch (err) {
    console.error("Error fetching chat history:", err);
    res.status(500).json({ error: "Server error" });
  }
};


// SAVE message
exports.saveMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messages } = req.body; // extract messages array

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "No messages to save" });
    }

    let chat = await Chat.findOne({ userId });

    if (!chat) {
      // Create new chat
      chat = await Chat.create({
        userId,
        messages: messages, // save all messages at once
      });
    } else {
      // Append messages
      chat.messages.push(...messages);
      await chat.save();
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error saving chat:", err);
    res.status(500).json({ error: "Server error" });
  }
};

