import React, { useState, useRef, useEffect } from "react";
import {
  PhoneCall,
  PhoneOff,
  Mic,
  Volume2,
  Radio,
  FileText,
  Clock,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle,
} from "lucide-react";
import { LanguageCode, TelephonyCallRecord } from "../types";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

interface TelephonySimulatorProps {
  language: LanguageCode;
}

const PRESET_QUERIES: Record<LanguageCode, { text: string; label: string }[]> = {
  te: [
    {
      label: "మిర్చి తామర పురుగులు (Chilli Thrips)",
      text: "నమస్కారం సార్, నా మిర్చి తోటలో నల్లి మరియు తామర పురుగులు ఎక్కువగా ఉన్నాయి. ఆకులు ముడుచుకుపోతున్నాయి. ఏ మందు పిచికారీ చేయాలి?",
    },
    {
      label: "వరిలో అగ్గితెగులు (Paddy Blast)",
      text: "వరి పైరులో ఆకులపై కంటి ఆకారపు మచ్చలు వచ్చాయి, చివర్లు ఎండిపోతున్నాయి. తక్షణ నివారణ చెప్పండి.",
    },
    {
      label: "పత్తిలో గులాబీ రంగు పురుగు (Pink Bollworm)",
      text: "పత్తి కాయలు తొలుస్తున్న గులాబీ రంగు పురుగులను ఎలా అరికట్టాలి? ఏ ట్రాప్స్ పెట్టాలి?",
    },
  ],
  hi: [
    {
      label: "गेहूं में पीला रतुआ (Wheat Yellow Rust)",
      text: "नमस्ते, गेहूं की पत्तियों पर पीले रंग की धारियां और पाउडर दिख रहा है। कौन सी फफूंदनाशी दवा का छिड़काव करें?",
    },
    {
      label: "टमाटर में झुलसा रोग (Tomato Blight)",
      text: "टमाटर के पौधों की पत्तियां काली पड़ रही हैं। क्या आज छिड़काव करना सुरक्षित रहेगा?",
    },
    {
      label: "कपास में गुलाबी सुंडी (Cotton Bollworm)",
      text: "कपास के टिंडों में कीड़ा लग गया है, कम लागत में जैविक और रासायनिक उपाय बताएं।",
    },
  ],
  ta: [
    {
      label: "நெல் இலைக்கருகல் (Paddy Leaf Blight)",
      text: "வணக்கம், நெல் பயிரில் இலைகளின் ஓரங்கள் மஞ்சள் நிறமாக மாறி காய்ந்து வருகிறது. என்ன மருந்து தெளிக்க வேண்டும்?",
    },
    {
      label: "பருத்தி சாறு உறிஞ்சும் பூச்சிகள்",
      text: "பருத்தி இலைகள் சுருண்டு காணப்படுகின்றன. எந்த உயிரியல் முறையை பின்பற்றலாம்?",
    },
  ],
  en: [
    {
      label: "Paddy Blast & Blight Remediation",
      text: "Hello agronomist, my rice paddy has spindle-shaped brown lesions on leaf tips. What immediate fungicide spray is recommended?",
    },
    {
      label: "Chilli Black Thrips Outbreak",
      text: "We are noticing upward leaf curling and black thrips on chilli flowers in Guntur district. Please advise safe dosage.",
    },
  ],
};

export const TelephonySimulator: React.FC<TelephonySimulatorProps> = ({ language }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [callStatus, setCallStatus] = useState<"idle" | "ringing" | "connected" | "processing">("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [activeQuery, setActiveQuery] = useState(PRESET_QUERIES[language]?.[0]?.text || PRESET_QUERIES.en[0].text);
  const [callHistory, setCallHistory] = useState<TelephonyCallRecord[]>([]);
  const [currentCallRecord, setCurrentCallRecord] = useState<TelephonyCallRecord | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync active query if language changes
  useEffect(() => {
    if (PRESET_QUERIES[language]?.[0]) {
      setActiveQuery(PRESET_QUERIES[language][0].text);
    }
  }, [language]);

  // Duration timer
  useEffect(() => {
    let interval: any = null;
    if (callStatus === "connected") {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else if (callStatus === "idle") {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  // Waveform canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isVoiceActive = callStatus === "connected" || isPlayingAudio;

      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = isVoiceActive ? "#10b981" : "#065f46";

      const sliceWidth = canvas.width / 60;
      let x = 0;

      for (let i = 0; i < 60; i++) {
        const amplitude = isVoiceActive ? Math.sin(i * 0.2 + phase) * 22 + Math.cos(i * 0.4 + phase) * 12 : 3;
        const y = canvas.height / 2 + amplitude;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();

      phase += isVoiceActive ? 0.08 : 0.02;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [callStatus, isPlayingAudio]);

  const handleStartCall = async () => {
    setCallStatus("ringing");
    setTimeout(async () => {
      setCallStatus("connected");

      // Ingest into IVR endpoint
      try {
        const res = await fetch("/api/telephony/ivr-webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            QueryText: activeQuery,
            Dialect: language,
            From: "+91-98480-23451",
            CallSid: `CA_${Date.now().toString(36)}`,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const record: TelephonyCallRecord = {
            callSid: data.callSid,
            caller: data.caller,
            transcribedQuery: data.transcribedQuery,
            intent: data.intent,
            spokenReply: data.spokenReply,
            audioBase64: data.audioBase64,
            durationSeconds: 18,
            status: "completed",
            timestamp: new Date().toLocaleTimeString(),
            dialect: language,
          };
          setCurrentCallRecord(record);
          setCallHistory((prev) => [record, ...prev]);

          // Play synthesized audio
          if (data.audioBase64) {
            playTtsAudio(data.audioBase64);
          }

          // Save to Firestore
          const user = auth.currentUser;
          if (user) {
            try {
              await addDoc(collection(db, "farmer_calls"), {
                callSid: record.callSid,
                userId: user.uid,
                callerNumber: record.caller,
                transcribedQuery: record.transcribedQuery,
                intentClassified: record.intent,
                synthesizedResponse: record.spokenReply,
                language,
                durationSeconds: 18,
                status: "completed",
                timestamp: new Date().toISOString(),
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, "farmer_calls");
            }
          }
        }
      } catch (err) {
        console.warn("Telephony error:", err);
      }
    }, 1500);
  };

  const handleEndCall = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setIsPlayingAudio(false);
    setCallStatus("idle");
  };

  const playTtsAudio = (base64: string) => {
    const audio = new Audio(`data:audio/wav;base64,${base64}`);
    audioRef.current = audio;
    audio.onended = () => setIsPlayingAudio(false);
    audio.play().then(() => setIsPlayingAudio(true)).catch((e) => console.warn("Audio play prevented:", e));
  };

  const presets = PRESET_QUERIES[language] || PRESET_QUERIES.en;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner & Toll Free Identity */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#09261E] to-[#0D3B32] border border-white/20 text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-[#061A14] flex items-center justify-center font-black shadow-lg">
            <Radio className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold border border-amber-400/30">
                PSTN / 2G Feature Phone Accessible
              </span>
              <span className="text-xs text-emerald-200">Zero Internet Required</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
              Toll-Free 1800-180-1551 Voice Hotline Simulator
            </h2>
          </div>
        </div>

        {/* Live Call Control Button */}
        <div className="flex items-center gap-3">
          {callStatus === "idle" ? (
            <button
              onClick={handleStartCall}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#061A14] font-black text-sm flex items-center gap-2.5 shadow-lg transition-transform active:scale-97 cursor-pointer"
            >
              <PhoneCall className="w-5 h-5 fill-current" />
              Simulate Inbound Hotline Call
            </button>
          ) : (
            <button
              onClick={handleEndCall}
              className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm flex items-center gap-2.5 shadow-lg transition-transform active:scale-97 cursor-pointer"
            >
              <PhoneOff className="w-5 h-5 fill-current" />
              Hang Up Call ({callDuration}s)
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Phone Call Interface & Presets (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-2xl flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A34]">
                Caller Dialpad & Dialect Selector
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                  callStatus === "connected"
                    ? "bg-emerald-100 text-emerald-800"
                    : callStatus === "ringing"
                    ? "bg-amber-100 text-amber-800 animate-pulse"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {callStatus}
              </span>
            </div>

            {/* Presets */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-700">
                Choose a Farmer Query Preset (Regional Dialect):
              </label>
              <div className="flex flex-col gap-1.5">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveQuery(preset.text)}
                    className={`p-3 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                      activeQuery === preset.text
                        ? "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="font-bold text-[#061A14]">{preset.label}</div>
                    <div className="line-clamp-2 text-gray-600 text-[11px] mt-0.5">
                      "{preset.text}"
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Query Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700">
                Or Enter Custom Spoken Query:
              </label>
              <textarea
                rows={3}
                value={activeQuery}
                onChange={(e) => setActiveQuery(e.target.value)}
                placeholder="Enter question in Telugu, Hindi, Tamil, or English..."
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-xs text-[#061A14] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Real-time Audio Waveform Visualizer */}
          <div className="p-4 rounded-2xl bg-[#061A14] flex flex-col gap-2 shadow-inner">
            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400">
              <span className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                G.711 / 8kHz Telephony Stream
              </span>
              <span>{callStatus === "connected" ? `CALL 00:${callDuration < 10 ? "0" : ""}${callDuration}` : "LINE READY"}</span>
            </div>
            <canvas ref={canvasRef} width={380} height={50} className="w-full h-12" />
          </div>
        </div>

        {/* Right: Live Two-Way Transcript & Voice Core (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-2xl flex flex-col justify-between gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A34]">
                Telephony ASR & NLU Knowledge Sync
              </span>
              <h3 className="text-xl font-extrabold text-[#061A14]">
                Live Two-Way Voice Transcript
              </h3>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Gemini 3.8 Grounded
            </div>
          </div>

          {/* Transcript Chat Bubbles */}
          <div className="flex flex-col gap-4 min-h-[280px]">
            {currentCallRecord ? (
              <>
                {/* Farmer Caller Bubble */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                    👨‍🌾
                  </div>
                  <div className="p-4 rounded-2xl rounded-tl-none bg-amber-50 border border-amber-200 text-[#061A14] max-w-[85%] shadow-sm">
                    <span className="text-[11px] font-bold text-amber-800 block mb-1">
                      Farmer ({currentCallRecord.caller}) • ASR Transcribed
                    </span>
                    <p className="text-sm font-medium leading-relaxed">
                      "{currentCallRecord.transcribedQuery}"
                    </p>
                  </div>
                </div>

                {/* AI Agronomist Response Bubble */}
                <div className="flex items-start gap-3 justify-end">
                  <div className="p-4 rounded-2xl rounded-tr-none bg-[#09261E] border border-emerald-500/30 text-white max-w-[85%] shadow-lg">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-bold text-emerald-300">
                        AI Agronomist • Intent: {currentCallRecord.intent}
                      </span>
                      {currentCallRecord.audioBase64 && (
                        <button
                          onClick={() => playTtsAudio(currentCallRecord.audioBase64!)}
                          className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 transition-all"
                        >
                          <Play className="w-3 h-3 fill-current" /> Replay Voice
                        </button>
                      )}
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-emerald-50">
                      {currentCallRecord.spokenReply}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                    🌱
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500 border border-dashed border-gray-300 rounded-2xl">
                <PhoneCall className="w-10 h-10 text-gray-400 mb-2 animate-bounce" />
                <h4 className="font-bold text-gray-700">No Active Hotline Call</h4>
                <p className="text-xs text-gray-500 max-w-sm mt-1">
                  Click "Simulate Inbound Hotline Call" to experience how a rural farmer on a 2G keypad phone connects to Gemini voice agronomist without requiring an app or internet.
                </p>
              </div>
            )}
          </div>

          {/* Call Metadata Footer */}
          {currentCallRecord && (
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-wrap items-center justify-between text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Call SID: <strong className="font-mono text-[#061A14]">{currentCallRecord.callSid}</strong>
              </span>
              <span>Duration: <strong>{currentCallRecord.durationSeconds}s</strong></span>
              <span>Synthesizer: <strong>gemini-3.8-flash-tts</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
