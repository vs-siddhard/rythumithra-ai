import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from "http";
import { ai } from "./geminiService";
import { Modality, LiveServerMessage } from "@google/genai";

export function setupLiveWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    if (url.pathname === "/live") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  wss.on("connection", async (clientWs: WebSocket) => {
    console.log("Client connected to Gemini 3.8 Live API bridge");
    let session: any = null;

    try {
      session = await ai.live.connect({
        model: "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
          },
          systemInstruction:
            "You are RythuMithra Kisan AI Agronomist on a live audio call with a smallholder farmer. Speak empathetically, practically, and concisely in rural plain terms about crop health, pest diagnosis, market rates, and weather.",
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const parts = message.serverContent?.modelTurn?.parts ?? [];
            for (const part of parts) {
              if (part.inlineData?.data && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: "audio",
                    audio: part.inlineData.data,
                  })
                );
              }
            }
            if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "interrupted" }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "session_closed" }));
            }
          },
        },
      });

      clientWs.on("message", (raw) => {
        try {
          const parsed = JSON.parse(raw.toString());
          if (parsed.audio && session) {
            session.sendRealtimeInput({
              audio: {
                data: parsed.audio,
                mimeType: "audio/pcm;rate=16000",
              },
            });
          }
        } catch (err) {
          console.error("Error processing client audio chunk:", err);
        }
      });

      clientWs.on("close", () => {
        if (session) {
          try {
            session.close();
          } catch (_) {}
        }
      });
    } catch (err: any) {
      console.error("Failed to connect to Gemini Live session:", err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: "error",
            error: err?.message || "Live API session initialization failed",
          })
        );
      }
    }
  });

  return wss;
}
