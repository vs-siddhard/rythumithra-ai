import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  RefreshCw,
  User,
  Bot,
  Zap,
  Globe,
  CornerDownLeft,
} from "lucide-react";
import { LanguageCode, ChatMessage } from "../types";

interface MultilingualAssistantProps {
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
}

const PRESET_QUICK_CHIPS: Record<LanguageCode, string[]> = {
  te: [
    "మిర్చి తోటలో నల్లి & తామర పురుగుల నివారణ ఏమిటి?",
    "నేడు వాతావరణం ఎలా ఉంది, మందు పిచికారీ చేయవచ్చా?",
    "గుంటూరు మార్కెట్లో మిర్చి క్వింటాలు ధర ఎంత?",
    "వరిలో పిలకలు ఎక్కువగా రావడానికి ఏ ఎరువు వాడాలి?",
  ],
  hi: [
    "टमाटर में झुलसा रोग (Blight) का जैविक उपचार बताएं?",
    "क्या आज कीटनाशक का छिड़काव करना सुरक्षित है?",
    "नासिक मंडी में प्याज का आज का भाव क्या है?",
    "कपास में गुलाबी सुंडी नियंत्रण के उपाय बताएं?",
  ],
  ta: [
    "நெல் பயிரில் இலைக்கருகல் நோய் தடுக்கும் முறை என்ன?",
    "இன்று பூச்சிக்கொல்லி தெளிக்க உகந்த வானிலையா?",
    "மதுரை சந்தையில் நெல் கொள்முதல் விலை என்ன?",
  ],
  en: [
    "What is the best bio-control for chilli thrips and mites?",
    "Is it favorable to spray fungicide in South Deccan zone today?",
    "What is the current arbitrage spread for cotton in Warangal?",
    "Recommend fertilizer schedule for vegetative stage paddy.",
  ],
};

export const MultilingualAssistant: React.FC<MultilingualAssistantProps> = ({
  language,
  onLanguageChange,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text:
        language === "te"
          ? "నమస్కారం! నేను రైతుమిత్ర వ్యవసాయ సహాయకుడిని. మీ పంట తెగుళ్ళు, మార్కెట్ ధరలు లేదా పిచికారీ సలహాల గురించి మీ స్వభాషలో అడగండి."
          : language === "hi"
          ? "नमस्ते! मैं रैथुमित्र सहायक हूँ। अपनी फसल, मंडी भाव या मौसम पर अपनी भाषा में सवाल पूछें।"
          : language === "ta"
          ? "வணக்கம்! நான் ரைத்துமித்ரா வேளாண் உதவியாளர். பயிர் பாதுகாப்பு மற்றும் சந்தை நிலவரம் பற்றி உங்கள் மொழியில் கேளுங்கள்."
          : "Hello! I am RythuMithra Agricultural Assistant. Ask me anything about crop diseases, market prices, or spray advisories in your preferred language.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      language,
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      language,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputText("");
    setIsTyping(true);

    try {
      const startTime = Date.now();
      const res = await fetch("/api/gemini/fast-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          context: {
            language,
            location: "South Deccan Agricultural Cluster",
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const latency = data.latencyMs || Date.now() - startTime;

        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          sender: "assistant",
          text: data.text,
          latencyMs: latency,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          language,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      console.warn("Assistant chat error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handlePlayTTS = async (msgId: string, text: string) => {
    if (activePlayingId === msgId) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setActivePlayingId(null);
      return;
    }

    try {
      const res = await fetch("/api/gemini/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voiceName: "Kore",
          language,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          audioRef.current = audio;
          audio.onended = () => setActivePlayingId(null);
          audio.play().catch((e) => console.warn("Audio play prevented:", e));
          setActivePlayingId(msgId);
        }
      }
    } catch (err) {
      console.warn("TTS play error:", err);
    }
  };

  const chips = PRESET_QUICK_CHIPS[language] || PRESET_QUICK_CHIPS.en;

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-2xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#09261E] text-emerald-400 flex items-center justify-center font-bold shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-600" />
                gemini-3.1-flash-lite & gemini-3.8-flash-tts
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#061A14] mt-0.5">
              Multilingual Agricultural Voice & Text Assistant
            </h3>
          </div>
        </div>

        {/* Language dialect switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 border border-gray-200 text-xs font-bold">
          {(["en", "te", "hi", "ta"] as const).map((l) => (
            <button
              key={l}
              onClick={() => onLanguageChange(l)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                language === l
                  ? "bg-emerald-600 text-white shadow-sm font-extrabold"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              {l === "te" ? "తెలుగు" : l === "hi" ? "हिंदी" : l === "ta" ? "தமிழ்" : "English"}
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          Suggested Regional Inquiries (1-Tap):
        </span>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="px-3 py-1.5 rounded-xl bg-[#09261E]/5 hover:bg-emerald-100 border border-emerald-500/20 text-[#061A14] text-xs font-semibold transition-colors cursor-pointer text-left"
            >
              "{chip}"
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="h-[360px] overflow-y-auto p-4 rounded-2xl bg-gray-50/80 border border-gray-200 flex flex-col gap-4 shadow-inner">
        {messages.map((m) => {
          const isUser = m.sender === "user";
          const isPlaying = activePlayingId === m.id;

          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-[#09261E] text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  🌱
                </div>
              )}

              <div
                className={`p-4 rounded-2xl max-w-[85%] sm:max-w-md shadow-sm ${
                  isUser
                    ? "rounded-tr-none bg-emerald-700 text-white"
                    : "rounded-tl-none bg-white border border-gray-200 text-[#061A14]"
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span
                    className={`text-[10px] font-bold ${
                      isUser ? "text-emerald-200" : "text-emerald-800"
                    }`}
                  >
                    {isUser ? "You (Farmer)" : "RythuMithra Agronomist"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {m.latencyMs && (
                      <span className="text-[10px] font-mono text-gray-400">
                        ⚡ {m.latencyMs}ms
                      </span>
                    )}
                    <span className={`text-[10px] ${isUser ? "text-emerald-200" : "text-gray-400"}`}>
                      {m.timestamp}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line">
                  {m.text}
                </p>

                {!isUser && (
                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-end">
                    <button
                      onClick={() => handlePlayTTS(m.id, m.text)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isPlaying
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300"
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      {isPlaying ? "Pause Voice" : "Listen in Dialect"}
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-emerald-950 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  👨‍🌾
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 p-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
            <span>Consulting regional agricultural knowledge base...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Type or speak in Telugu, Hindi, Tamil, or English..."
          className="flex-1 p-3.5 rounded-2xl bg-white border border-gray-300 text-sm text-[#061A14] focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim() || isTyping}
          className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-40"
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
