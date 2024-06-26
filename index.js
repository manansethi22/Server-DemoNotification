const express = require("express");
const { Expo } = require("expo-server-sdk");
const app = express();
const expo = new Expo();

// In-memory storage for tokens (replace with a database in production)
const pushTokens = new Set();

app.use(express.json());

// New endpoint to receive and store push tokens
app.post("/register-push-token", (req, res) => {
  const { token } = req.body;

  if (!token || !Expo.isExpoPushToken(token)) {
    return res.status(400).json({ error: "Invalid Expo push token" });
  }

  pushTokens.add(token);
  console.log("Registered new push token:", token);
  res.json({ success: true, message: "Push token registered successfully" });
});

app.post("/send-notification", async (req, res) => {
  try {
    const { token, title, body, data } = req.body;
    if (!Expo.isExpoPushToken(token)) {
      return res.status(400).json({ error: "Invalid Expo push token" });
    }
    const message = {
      to: token,
      sound: "default",
      title: title,
      body: body,
      data: { route, params },
    };
    const chunks = expo.chunkPushNotifications([message]);
    for (let chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(ticketChunk);
        return res.json({ success: true, ticket: ticketChunk[0] });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error sending notification" });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});