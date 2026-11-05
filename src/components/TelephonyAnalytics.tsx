import React, { useState, useEffect } from "react";
import {
  PhoneCall,
  CheckCircle,
  Clock,
  Radio,
  Search,
  Filter,
  Volume2,
  FileText,
  TrendingUp,
  MapPin,
  RefreshCw,
  Users,
  ShieldCheck,
  Play,
  RotateCcw,
} from "lucide-react";
import { TelephonyCallRecord, LanguageCode } from "../types";
import { INITIAL_IVR_LOGS } from "../data/initialData";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

interface TelephonyAnalyticsProps {
  language: LanguageCode;
}

export const TelephonyAnalytics: React.FC<TelephonyAnalyticsProps> = ({ language }) => {
  const [logs, setLogs] = useState<TelephonyCallRecord[]>(INITIAL_IVR_LOGS);
  const [loading, setLoading] = useState(false);
  const [filterIntent, setFilterIntent] = useState<string>("ALL");
  const [filterDialect, setFilterDialect] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [playingCallSid, setPlayingCallSid] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const [stats, setStats] = useState({
    totalCalls: 1428,
    resolvedPercentage: 94.2,
    avgDurationSec: 36,
    dialects: { te: 58, hi: 24, ta: 12, en: 6 },
    intents: {
      CROP_DISEASE: 41,
      MARKET_PRICE: 29,
      WEATHER_SPRAY: 18,
      FERTILIZER: 8,
      GOVT_SCHEME: 4,
    },
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // 1. Fetch from server API
      const res = await fetch("/api/telephony/logs");
      let combinedLogs: TelephonyCallRecord[] = [];
      if (res.ok) {
        const json = await res.json();
        setStats({
          totalCalls: json.totalCalls,
          resolvedPercentage: json.resolvedPercentage,
          avgDurationSec: json.avgDurationSec,
          dialects: json.activeDialects,
          intents: json.intentBreakdown,
        });
        combinedLogs = json.logs || [];
      }

      // 2. Fetch live logs from Firestore if user has call records
      try {
        const snap = await getDocs(
          query(collection(db, "farmer_calls"), limit(10))
        );
        const liveLogs: TelephonyCallRecord[] = [];
        snap.forEach((doc) => {
          const d = doc.data();
          liveLogs.push({
            callSid: d.callSid || doc.id,
            caller: d.callerNumber || "+91-98480-XXXXX",
            callerLocation: "Live Webhook Feed",
            transcribedQuery: d.transcribedQuery || "",
            intent: d.intentClassified || "GENERAL_QUERY",
            spokenReply: d.synthesizedResponse || "",
            durationSeconds: d.durationSeconds || 24,
            status: d.status || "completed",
            timestamp: d.timestamp || new Date().toISOString(),
            dialect: d.language || "te",
            resolutionQuality: "High",
          });
        });
        if (liveLogs.length > 0) {
          combinedLogs = [...liveLogs, ...combinedLogs];
        }
      } catch (err) {
        console.warn("Firestore live calls check (non-blocking):", err);
      }

      setLogs(combinedLogs);
    } catch (err) {
      console.warn("Using cached telephony logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handlePlayVoice = (callSid: string, text: string) => {
    if (playingCallSid === callSid) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingCallSid(null);
      return;
    }

    // Synthesize or play text
    fetch("/api/gemini/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceName: "Kore" }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          audioRef.current = audio;
          audio.onended = () => setPlayingCallSid(null);
          audio.play();
          setPlayingCallSid(callSid);
        }
      })
      .catch((e) => console.warn("Audio fetch or play prevented:", e));
  };

  const filteredLogs = logs.filter((l) => {
    const matchesIntent = filterIntent === "ALL" || l.intent === filterIntent;
    const matchesDialect = filterDialect === "ALL" || l.dialect === filterDialect;
    const matchesSearch =
      searchQuery === "" ||
      l.transcribedQuery.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.caller.includes(searchQuery) ||
      l.callSid.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesIntent && matchesDialect && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Title & Agricultural Extension Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A34]">
              Toll-Free 1800 IVR Extension Monitoring
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#061A14]">
            Telephony IVR Call Logs & Analytics
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Tracking inbound calls from rural farmers on basic feature phones. Automated ASR transcription, intent classification, and resolution logs for agricultural extension support.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white/80 hover:bg-white border border-white/60 text-[#061A14] text-xs font-bold flex items-center gap-2 shadow-sm transition-transform active:scale-97 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          Refresh Logs
        </button>
      </div>

      {/* Analytics KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Inbound Calls */}
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A34]">
              Total Inbound Calls
            </span>
            <PhoneCall className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-[#061A14] mt-3">
            {stats.totalCalls.toLocaleString()}
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 mt-1">
            +18% from last week (Pest Season)
          </span>
        </div>

        {/* Card 2: Automated Resolution Rate */}
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A34]">
              Resolution Rate
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-[#061A14] mt-3">
            {stats.resolvedPercentage}%
          </div>
          <span className="text-[11px] font-semibold text-blue-700 mt-1">
            Automated via Gemini Grounding
          </span>
        </div>

        {/* Card 3: Avg Call Duration */}
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A34]">
              Avg Call Duration
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-[#061A14] mt-3">
            {stats.avgDurationSec}s
          </div>
          <span className="text-[11px] font-semibold text-amber-700 mt-1">
            Concise speech turnaround
          </span>
        </div>

        {/* Card 4: Language Distribution */}
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A34]">
              Dialect Breakdown
            </span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-bold text-emerald-800">తెలుగు: {stats.dialects.te}%</span>
            <span className="text-xs font-bold text-amber-800">हिंदी: {stats.dialects.hi}%</span>
            <span className="text-xs font-bold text-blue-800">தமிழ்: {stats.dialects.ta}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden flex mt-2">
            <div style={{ width: `${stats.dialects.te}%` }} className="bg-emerald-500 h-full" />
            <div style={{ width: `${stats.dialects.hi}%` }} className="bg-amber-500 h-full" />
            <div style={{ width: `${stats.dialects.ta}%` }} className="bg-blue-500 h-full" />
            <div style={{ width: `${stats.dialects.en}%` }} className="bg-purple-500 h-full" />
          </div>
        </div>
      </div>

      {/* Intent Distribution Bento */}
      <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg flex flex-col gap-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A34]">
          Farmer Inquiry Intent Distribution
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col">
            <span className="text-[11px] font-bold text-emerald-800">Pest & Disease (41%)</span>
            <span className="text-lg font-black text-[#061A14]">585 calls</span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col">
            <span className="text-[11px] font-bold text-blue-800">Market Mandi Rates (29%)</span>
            <span className="text-lg font-black text-[#061A14]">414 calls</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col">
            <span className="text-[11px] font-bold text-amber-800">Weather & Spraying (18%)</span>
            <span className="text-lg font-black text-[#061A14]">257 calls</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col">
            <span className="text-[11px] font-bold text-purple-800">Fertilizer Dosage (8%)</span>
            <span className="text-lg font-black text-[#061A14]">114 calls</span>
          </div>
          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col">
            <span className="text-[11px] font-bold text-gray-700">Govt Schemes (4%)</span>
            <span className="text-lg font-black text-[#061A14]">58 calls</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-md flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcripts, caller phone, SID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-300 text-xs text-[#061A14] focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Intent filter */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-bold text-gray-500 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Intent:
          </span>
          {["ALL", "CROP_DISEASE", "MARKET_PRICE", "WEATHER_SPRAY", "FERTILIZER"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterIntent(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterIntent === cat
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat === "ALL" ? "All Intents" : cat.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Call Records Table */}
      <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#09261E]/5 border-b border-gray-200 text-[11px] font-extrabold uppercase text-[#1E3A34] tracking-wider">
                <th className="p-4">Call SID / Time</th>
                <th className="p-4">Farmer Phone & Location</th>
                <th className="p-4">Transcribed Query (ASR)</th>
                <th className="p-4">AI Spoken Resolution (Gemini)</th>
                <th className="p-4">Intent</th>
                <th className="p-4 text-center">Audio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs">
              {filteredLogs.map((log) => {
                const isPlaying = playingCallSid === log.callSid;
                return (
                  <tr key={log.callSid} className="hover:bg-emerald-50/50 transition-colors">
                    {/* Call SID & timestamp */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-[#061A14]">{log.callSid}</div>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {log.durationSeconds}s
                      </span>
                    </td>

                    {/* Caller info */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-bold text-gray-800">{log.caller}</div>
                      <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        {log.callerLocation || "Rural Cluster"}
                      </span>
                    </td>

                    {/* Transcribed query */}
                    <td className="p-4 max-w-xs">
                      <p className="font-medium text-[#061A14] leading-relaxed line-clamp-2">
                        "{log.transcribedQuery}"
                      </p>
                    </td>

                    {/* AI Resolution */}
                    <td className="p-4 max-w-sm">
                      <p className="text-gray-700 leading-relaxed line-clamp-2">
                        {log.spokenReply}
                      </p>
                    </td>

                    {/* Intent Tag */}
                    <td className="p-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {log.intent.replace("_", " ")}
                      </span>
                    </td>

                    {/* Audio Playback button */}
                    <td className="p-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handlePlayVoice(log.callSid, log.spokenReply)}
                        className={`p-2 rounded-xl transition-all cursor-pointer shadow-sm ${
                          isPlaying
                            ? "bg-red-600 text-white animate-pulse"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                        title="Replay spoken resolution"
                      >
                        {isPlaying ? <Volume2 className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
