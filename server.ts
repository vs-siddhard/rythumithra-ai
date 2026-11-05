import express from "express";
import http from "http";
import path from "path";
import dotenv from "dotenv";
import { apiRouter } from "./server/apiRouter";
import { setupLiveWebSocket } from "./server/liveHandler";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use("/api", apiRouter);

const distPath = path.resolve(__dirname, "dist");
app.use(express.static(distPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const server = http.createServer(app);
setupLiveWebSocket(server);

server.listen(port, () => {
  console.log(`RythuMithra Server listening on port ${port}`);
});
