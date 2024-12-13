const webSocket = require("ws");
const path = require("path");
const fs = require("fs");
const express = require("express");

const app = express();

const httpServer = app.listen(8080, () => {
  console.log("server is running on 8080");
});
app.use(express.json());

const socket = new webSocket.WebSocketServer({ server: httpServer });

const filePath = path.join(__dirname, "log.txt");

function readFileAndSend(ws) {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.log("Error while reading file");
      ws.send("Error while reading file");
      return;
    }
    const lines = data.split("\n");
    const lastLines = lines.slice(-10).join("\n");

    console.log(lastLines);
    ws.send(lastLines);
  });
}

socket.on("connection", (ws) => {

  readFileAndSend(ws);

  const watcher = fs.watch(filePath, (eventType) => {
    if (eventType === "change") {
      console.log("File changed, sending updated content");
      readFileAndSend(ws);
    }
  });

  ws.on("message", (message) => {
    console.log("Message received from client:", message);
    ws.send(`Server received: ${message}`);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    watcher.close();
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});
