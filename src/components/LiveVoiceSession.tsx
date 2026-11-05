import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, Sparkles, AlertCircle, X, Radio } from "lucide-react";
import { LanguageCode } from "../types";

interface LiveVoiceSessionProps {
  language: LanguageCode;
  onClose?: () => void;
}

export const LiveVoiceSession: React.FC<LiveVoiceSessionProps> = ({
  language,
  onClose,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeakingUser, setIsSpeakingUser] = useState(false);
  const [isModelReplying, setIsModelReplying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Helper: Convert Float32Array to 16-bit PCM Base64
  const floatTo16BitPCMBase64 = (float32Array: Float32Array): string => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Helper: Play back 24kHz audio chunk from Base64
  const playAudioChunk = (base64Data: string) => {
    if (!outputAudioCtxRef.current) return;
    const ctx = outputAudioCtxRef.current;

    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit PCM little endian to Float32
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      setIsModelReplying(true);

      source.onended = () => {
        if (ctx.currentTime >= nextStartTimeRef.current - 0.05) {
          setIsModelReplying(false);
        }
      };
    } catch (e) {
      console.warn("Error playing audio chunk:", e);
    }
  };

  const startSession = async () => {
    setErrorMessage(null);

    try {
      // 1. Microphone capture at 16kHz
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      inputAudioCtxRef.current = inputCtx;

      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      // 2. Connect to WebSocket
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Connected to Gemini 3.8 Live WebSocket");
        setIsConnected(true);

        // Pipe mic audio to ws
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = processor;

        source.connect(processor);
        processor.connect(inputCtx.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const inputData = e.inputBuffer.getChannelData(0);

          // Detect user speech volume
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += Math.abs(inputData[i]);
          }
          const avg = sum / inputData.length;
          setIsSpeakingUser(avg > 0.02);

          const base64Audio = floatTo16BitPCMBase64(inputData);
          ws.send(JSON.stringify({ audio: base64Audio }));
        };
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "audio" && msg.audio) {
            playAudioChunk(msg.audio);
          } else if (msg.type === "interrupted") {
            // User interrupted model speaking: reset playback queue
            if (outputAudioCtxRef.current) {
              nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
            }
            setIsModelReplying(false);
          } else if (msg.type === "error") {
            setErrorMessage(msg.error || "Live API error occurred");
          }
        } catch (err) {
          console.warn("Error parsing Live API message:", err);
        }
      };

      ws.onerror = (err) => {
        console.warn("Live WebSocket error:", err);
        setErrorMessage("Unable to connect to Live API session. Please check your network.");
      };

      ws.onclose = () => {
        setIsConnected(false);
      };
    } catch (err: any) {
      console.warn("Failed to start Live Audio session:", err);
      setErrorMessage(err?.message || "Microphone access denied or Live API failed to initialize.");
      stopSession();
    }
  };

  const stopSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }
    setIsConnected(false);
    setIsSpeakingUser(false);
    setIsModelReplying(false);
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#09261E] to-[#04140F] border border-emerald-500/30 shadow-2xl text-white flex flex-col items-center justify-between min-h-[460px] relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Top Header */}
      <div className="w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
            Gemini 3.8 Live API • Real-Time Voice
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-emerald-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Center Interactive Organic Orb */}
      <div className="my-8 flex flex-col items-center justify-center gap-6 z-10">
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
          {/* Animated concentric rings */}
          <div
            className={`absolute inset-0 rounded-full border border-emerald-500/30 transition-all duration-300 ${
              isModelReplying
                ? "scale-125 border-emerald-400 animate-pulse"
                : isSpeakingUser
                ? "scale-115 border-amber-400"
                : "scale-100"
            }`}
          />
          <div
            className={`absolute -inset-3 rounded-full border border-emerald-400/20 transition-all duration-500 ${
              isModelReplying ? "scale-140 opacity-70" : "scale-100 opacity-20"
            }`}
          />

          {/* Central Core Sphere */}
          <div
            className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
              isModelReplying
                ? "bg-gradient-to-tr from-emerald-600 via-teal-400 to-amber-300 shadow-[0_0_40px_#10b981]"
                : isSpeakingUser
                ? "bg-gradient-to-tr from-amber-600 to-emerald-500 shadow-[0_0_35px_#f59e0b]"
                : isConnected
                ? "bg-emerald-800 shadow-[0_0_20px_#065f46]"
                : "bg-gray-800"
            }`}
          >
            {isConnected ? (
              isModelReplying ? (
                <Volume2 className="w-12 h-12 text-[#061A14] animate-bounce" />
              ) : isSpeakingUser ? (
                <Mic className="w-12 h-12 text-[#061A14] animate-pulse" />
              ) : (
                <Radio className="w-10 h-10 text-emerald-200 animate-pulse" />
              )
            ) : (
              <MicOff className="w-10 h-10 text-gray-400" />
            )}
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center">
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">
            {isConnected
              ? isModelReplying
                ? "Agronomist is speaking..."
                : isSpeakingUser
                ? "Listening to your voice..."
                : "Listening... Speak naturally in your language"
              : "Live Voice Assistant Ready"}
          </h3>
          <p className="text-xs text-emerald-200/80 max-w-md mt-1">
            {isConnected
              ? "Zero delay full-duplex audio. You can interrupt anytime by speaking."
              : "Connect for a live, real-time voice conversation with Gemini 3.8 Live API about your farm, pests, or market prices."}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="w-full max-w-md p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Bottom Action Controls */}
      <div className="w-full flex items-center justify-center gap-4 z-10">
        {!isConnected ? (
          <button
            onClick={startSession}
            className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#061A14] font-black text-sm flex items-center gap-2.5 shadow-xl transition-all active:scale-95 cursor-pointer"
          >
            <Mic className="w-5 h-5 fill-current" />
            Start Live Conversation
          </button>
        ) : (
          <button
            onClick={stopSession}
            className="px-8 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm flex items-center gap-2.5 shadow-xl transition-all active:scale-95 cursor-pointer"
          >
            <MicOff className="w-5 h-5" />
            End Conversation
          </button>
        )}
      </div>
    </div>
  );
};
