import React, { useState, useEffect } from "react";
import {
  Sprout,
  Radio,
  PhoneCall,
  Volume2,
  Sparkles,
  CloudRain,
  TrendingUp,
  Camera,
  Layers,
  FlaskConical,
  User as UserIcon,
  Globe,
  Wifi,
  WifiOff,
  Mic,
  ShieldCheck,
  ChevronRight,
  MessageSquareText,
  BarChart3,
  Sliders,
  Sun,
  Moon,
} from "lucide-react";
import { LanguageCode } from "./types";
import { translations } from "./i18n/translations";
import { auth, testFirestoreConnection } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { MarketTicker } from "./components/MarketTicker";
import { WeatherEarlyWarning } from "./components/WeatherEarlyWarning";
import { MarketArbitrageGrid } from "./components/MarketArbitrageGrid";
import { LeafScannerHUD } from "./components/LeafScannerHUD";
import { TelephonySimulator } from "./components/TelephonySimulator";
import { TelephonyAnalytics } from "./components/TelephonyAnalytics";
import { MultilingualAssistant } from "./components/MultilingualAssistant";
import { ThreeAgriTwin } from "./components/ThreeAgriTwin";
import { LiveVoiceSession } from "./components/LiveVoiceSession";
import { ComplexAgronomyModal } from "./components/ComplexAgronomyModal";
import { AuthModal } from "./components/AuthModal";

export default function App() {
  const [language, setLanguage] = useState<LanguageCode>("te"); // Default to Telugu (RythuMithra native dialect)
  const [activeTab, setActiveTab] = useState<
    "market" | "climate" | "diagnostics" | "assistant" | "ivr" | "analytics" | "threed"
  >("market");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isComplexModalOpen, setIsComplexModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Light / Dark Theme State
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("rythu_theme");
      if (saved === "light" || saved === "dark") return saved;
    }
    return "dark";
  });
  const isDark = theme === "dark";

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("rythu_theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // 3D Twin target crop/disease sync
  const [twinCrop, setTwinCrop] = useState("Paddy (Rice)");
  const [twinDisease, setTwinDisease] = useState<string | null>("Bacterial Leaf Blight");

  const t = translations[language];

  useEffect(() => {
    testFirestoreConnection();

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => {
      unsubAuth();
    };
  }, []);

  const handleOpen3DTwin = (crop: string, disease: string) => {
    setTwinCrop(crop);
    setTwinDisease(disease);
    setActiveTab("threed");
  };

  return (
    <div className={`min-h-screen ${isDark
        ? "bg-gradient-to-b from-[#09261E] via-[#0D3B32] to-[#061A14] text-white"
        : "bg-gradient-to-b from-[#F2F8F5] via-[#E8F3EE] to-[#DCEDE5] text-[#061A14]"
      } font-sans antialiased selection:bg-emerald-500 selection:text-white pb-28 transition-colors duration-300`}>
      {/* Background ambient lighting meshes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full ${isDark ? "bg-emerald-500/15" : "bg-emerald-400/20"} blur-3xl`} />
        <div className={`absolute top-1/3 -right-40 w-96 h-96 rounded-full ${isDark ? "bg-amber-500/10" : "bg-amber-400/15"} blur-3xl`} />
        <div className={`absolute -bottom-40 left-1/3 w-96 h-96 rounded-full ${isDark ? "bg-teal-500/15" : "bg-teal-400/20"} blur-3xl`} />
      </div>

      {/* 1. Live Market Ticker & Real-Time Price Stream */}
      <MarketTicker onSelectCrop={() => setActiveTab("market")} isDark={isDark} />

      {/* Sticky Frosted Top Navigation Bar */}
      <header className={`sticky top-0 z-40 w-full backdrop-blur-2xl ${isDark
          ? "bg-[#09261E]/90 border-b border-white/15 text-white"
          : "bg-white/90 border-b border-emerald-900/10 text-[#061A14] shadow-sm"
        } px-4 sm:px-8 py-3.5 shadow-lg transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-[#061A14] flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
              <Sprout className="w-6 h-6 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-[#061A14]"}`}>
                  {t.appName}
                </h1>
                <span className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${isDark
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-emerald-100 text-emerald-800 border-emerald-300"
                  }`}>
                  v3.0 Production
                </span>
              </div>
              <p className={`text-[11px] font-medium hidden md:block ${isDark ? "text-emerald-200/80" : "text-emerald-800/80"}`}>
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Controls: Light/Dark Mode Toggle, Language Toggle, Complex Tank-Mix Workbench, and Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm border ${isDark
                  ? "bg-white/10 hover:bg-white/20 text-amber-300 border-white/20 active:scale-95"
                  : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200 active:scale-95 shadow-amber-500/10"
                }`}
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 animate-[spin_12s_linear_infinite]" />
                  <span className="hidden sm:inline text-amber-200 text-xs font-bold">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-emerald-900 fill-emerald-900" />
                  <span className="hidden sm:inline text-emerald-950 text-xs font-bold">Dark</span>
                </>
              )}
            </button>

            {/* 4-Language Toggle Pill */}
            <div className={`flex items-center p-1 rounded-xl border text-xs font-bold ${isDark
                ? "bg-black/40 border-white/10 text-white"
                : "bg-white/80 border-emerald-900/10 text-[#061A14] shadow-sm"
              }`}>
              {(["en", "te", "hi", "ta"] as const).map((code) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all cursor-pointer ${language === code
                      ? isDark
                        ? "bg-emerald-500 text-[#061A14] shadow-sm font-extrabold"
                        : "bg-emerald-700 text-white shadow-sm font-extrabold"
                      : isDark
                        ? "text-emerald-100/70 hover:text-white"
                        : "text-emerald-900/70 hover:text-[#061A14]"
                    }`}
                >
                  {code === "te" ? "తెలుగు" : code === "hi" ? "हिंदी" : code === "ta" ? "தமிழ்" : "EN"}
                </button>
              ))}
            </div>

            {/* Complex Agronomy Button (gemini-4-argon) */}
            <button
              onClick={() => setIsComplexModalOpen(true)}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${isDark
                  ? "bg-purple-950/60 hover:bg-purple-900/80 border-purple-500/40 text-purple-200"
                  : "bg-purple-100/90 hover:bg-purple-200 border-purple-300 text-purple-900"
                }`}
              title="Tank-mix compatibility & phytotoxicity"
            >
              <FlaskConical className={`w-3.5 h-3.5 ${isDark ? "text-purple-400" : "text-purple-700"}`} />
              <span>Tank-Mix Workbench</span>
            </button>

            {/* Google Auth / Farmer Profile */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className={`flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${isDark
                  ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                  : "bg-white/90 hover:bg-white border-emerald-900/15 text-[#061A14] shadow-sm"
                }`}
            >
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || "Farmer"}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <UserIcon className={`w-4 h-4 ${isDark ? "text-emerald-400" : "text-emerald-700"}`} />
              )}
              <span className="hidden sm:inline">
                {currentUser ? currentUser.displayName?.split(" ")[0] : "Sign In"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Inclusive Telephony Call Assistant Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-4">
        <div className={`p-3.5 sm:p-4 rounded-2xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg border transition-colors ${isDark
            ? "bg-amber-500/15 border-amber-400/40 text-white"
            : "bg-amber-500/10 border-amber-500/30 text-[#061A14]"
          }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-[#061A14] flex items-center justify-center font-bold shrink-0 shadow-sm">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className={`text-[11px] font-extrabold uppercase tracking-wide ${isDark ? "text-amber-300" : "text-amber-800"}`}>
                Inclusive Zero-Screen Voice Telephony AI
              </span>
              <p className={`text-xs sm:text-sm font-semibold ${isDark ? "text-white/95" : "text-[#061A14]"}`}>
                {t.tollFreeBanner}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("ivr")}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#061A14] text-xs font-black flex items-center gap-2 shadow-md transition-transform active:scale-97 cursor-pointer shrink-0"
            >
              <PhoneCall className="w-3.5 h-3.5 fill-current" />
              {t.callTollFree}
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 hidden sm:block ${isDark
                  ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                  : "bg-white hover:bg-gray-50 border-gray-300 text-[#061A14] shadow-sm"
                }`}
            >
              Call Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Main 6-Feature Platform Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-5">
        <div className={`flex items-center gap-2 p-1.5 rounded-2xl backdrop-blur-xl border overflow-x-auto shadow-xl scrollbar-none transition-colors ${isDark
            ? "bg-white/10 border-white/20 text-white"
            : "bg-white/80 border-emerald-900/10 text-[#061A14] shadow-sm"
          }`}>
          {/* Feature 1: Live Market Ticker & Price Intelligence */}
          <button
            onClick={() => setActiveTab("market")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === "market"
                ? isDark
                  ? "bg-white text-[#061A14] shadow-md"
                  : "bg-[#09261E] text-white shadow-md"
                : isDark
                  ? "text-emerald-100 hover:bg-white/10"
                  : "text-[#061A14]/70 hover:bg-black/5"
              }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            1. {t.tabMarket}
          </button>

          {/* Feature 2: Early Warning Climate System */}
          <button
            onClick={() => setActiveTab("climate")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === "climate"
                ? isDark
                  ? "bg-white text-[#061A14] shadow-md"
                  : "bg-[#09261E] text-white shadow-md"
                : isDark
                  ? "text-emerald-100 hover:bg-white/10"
                  : "text-[#061A14]/70 hover:bg-black/5"
              }`}
          >
            <CloudRain className="w-4 h-4 text-cyan-500" />
            2. {t.tabClimate}
          </button>

          {/* Feature 3: Intelligent Crop Diagnostics */}
          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === "diagnostics"
                ? isDark
                  ? "bg-white text-[#061A14] shadow-md"
                  : "bg-[#09261E] text-white shadow-md"
                : isDark
                  ? "text-emerald-100 hover:bg-white/10"
                  : "text-[#061A14]/70 hover:bg-black/5"
              }`}
          >
            <Camera className="w-4 h-4 text-amber-500" />
            3. {t.tabDiagnostics}
          </button>

          {/* Feature 4: Multilingual AI Interface & Assistant */}
          <button
            onClick={() => setActiveTab("assistant")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === "assistant"
                ? isDark
                  ? "bg-white text-[#061A14] shadow-md"
                  : "bg-[#09261E] text-white shadow-md"
                : isDark
                  ? "text-emerald-100 hover:bg-white/10"
                  : "text-[#061A14]/70 hover:bg-black/5"
              }`}
          >
            <MessageSquareText className="w-4 h-4 text-emerald-400" />
            4. {t.tabAssistant}
          </button>

          {/* Feature 5: Inclusive AI Voice Call Assistant (IVR) */}
          <button
            onClick={() => setActiveTab("ivr")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === "ivr"
                ? isDark
                  ? "bg-white text-[#061A14] shadow-md"
                  : "bg-[#09261E] text-white shadow-md"
                : isDark
                  ? "text-emerald-100 hover:bg-white/10"
                  : "text-[#061A14]/70 hover:bg-black/5"
              }`}
          >
            <Radio className="w-4 h-4 text-amber-400" />
            5. {t.tabIVR}
          </button>

          {/* Feature 6: Telephony IVR Call Logs & Analytics */}
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === "analytics"
                ? isDark
                  ? "bg-white text-[#061A14] shadow-md"
                  : "bg-[#09261E] text-white shadow-md"
                : isDark
                  ? "text-emerald-100 hover:bg-white/10"
                  : "text-[#061A14]/70 hover:bg-black/5"
              }`}
          >
            <BarChart3 className="w-4 h-4 text-blue-400" />
            6. {t.tabAnalytics}
          </button>

          {/* Extra: 3D Agri-Twin Lab */}
          <button
            onClick={() => setActiveTab("threed")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === "threed"
                ? isDark
                  ? "bg-white text-[#061A14] shadow-md"
                  : "bg-[#09261E] text-white shadow-md"
                : isDark
                  ? "text-emerald-100 hover:bg-white/10"
                  : "text-[#061A14]/70 hover:bg-black/5"
              }`}
          >
            <Layers className="w-4 h-4 text-teal-400" />
            {t.tab3DTwin}
          </button>
        </div>
      </div>

      {/* Main Feature View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        {/* 1. Live Market Ticker & Price Intelligence */}
        {activeTab === "market" && (
          <div className="flex flex-col gap-8">
            <MarketArbitrageGrid language={language} />
          </div>
        )}

        {/* 2. Early Warning Climate System */}
        {activeTab === "climate" && (
          <div className="flex flex-col gap-8">
            <WeatherEarlyWarning language={language} />
          </div>
        )}

        {/* 3. Intelligent Crop Diagnostics */}
        {activeTab === "diagnostics" && (
          <LeafScannerHUD language={language} onOpen3DTwin={handleOpen3DTwin} />
        )}

        {/* 4. Multilingual AI Interface & Assistant */}
        {activeTab === "assistant" && (
          <MultilingualAssistant
            language={language}
            onLanguageChange={(l) => setLanguage(l)}
          />
        )}

        {/* 5. Inclusive AI Voice Call Assistant (IVR) */}
        {activeTab === "ivr" && (
          <TelephonySimulator language={language} />
        )}

        {/* 6. Telephony IVR Call Logs & Analytics */}
        {activeTab === "analytics" && (
          <TelephonyAnalytics language={language} />
        )}

        {/* 7. 3D Agri-Twin & Plant Pathology Lab */}
        {activeTab === "threed" && (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/50 text-[#061A14] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A34]">
                  Three.js Procedural Agronomic Digital Twin
                </span>
                <h3 className="text-lg font-black text-[#061A14]">
                  Interactive 3D Crop Physiology & Strata Pathology Inspector
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Active Host:</span>
                <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                  {twinCrop}
                </span>
              </div>
            </div>

            <ThreeAgriTwin cropName={twinCrop} activeDisease={twinDisease} />
          </div>
        )}
      </main>

      {/* Persistent Voice Interaction Floating Action Button (Centered Floating Glass Pill) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setIsLiveVoiceOpen(true)}
          className="relative px-6 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#061A14] font-black text-sm sm:text-base flex items-center gap-3 shadow-2xl transition-all duration-200 active:scale-95 cursor-pointer border-2 border-white/50"
        >
          {/* Ambient animated emerald audio-pulse ring */}
          <span className="absolute -inset-1 rounded-full bg-emerald-400/40 animate-ping pointer-events-none" />

          <Mic className="w-5 h-5 fill-current shrink-0" />
          <span>{t.tapToSpeak}</span>
          <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-mono uppercase tracking-wider">
            Gemini 3.8 Live
          </span>
        </button>
      </div>

      {/* Gemini 3.8 Live Voice Session Modal */}
      {isLiveVoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl">
            <LiveVoiceSession
              language={language}
              onClose={() => setIsLiveVoiceOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Complex Agronomy Tank-Mix Modal (gemini-4-argon) */}
      <ComplexAgronomyModal
        isOpen={isComplexModalOpen}
        onClose={() => setIsComplexModalOpen(false)}
      />

      {/* Firebase Auth & Farmer Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        language={language}
        onLanguageChange={(newLang) => setLanguage(newLang)}
      />
    </div>
  );
}
