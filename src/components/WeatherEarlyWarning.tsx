import React, { useState, useEffect } from "react";
import {
  CloudRain,
  Sun,
  Droplets,
  Wind,
  AlertOctagon,
  CheckCircle,
  Zap,
  Sparkles,
  Compass,
  Thermometer,
} from "lucide-react";
import { WeatherData, LanguageCode } from "../types";
import { INITIAL_WEATHER } from "../data/initialData";

interface WeatherEarlyWarningProps {
  language: LanguageCode;
}

export const WeatherEarlyWarning: React.FC<WeatherEarlyWarningProps> = ({ language }) => {
  const [weather, setWeather] = useState<WeatherData>(INITIAL_WEATHER);
  const [loading, setLoading] = useState(false);
  const [fastAdvisoryPrompt, setFastAdvisoryPrompt] = useState("");
  const [fastAdvisoryResponse, setFastAdvisoryResponse] = useState<string | null>(null);
  const [fastAdvisoryLatency, setFastAdvisoryLatency] = useState<number | null>(null);
  const [isAskingFastAdvisory, setIsAskingFastAdvisory] = useState(false);

  const fetchWeatherData = async (retries = 2) => {
    setLoading(true);
    try {
      const res = await fetch("/api/weather/microclimate?region=South+Deccan+Agronomic+Zone", {
        headers: { "Accept": "application/json" },
      });
      if (res.ok) {
        const json: WeatherData = await res.json();
        setWeather(json);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      if (retries > 0) {
        setTimeout(() => fetchWeatherData(retries - 1), 1000);
      } else {
        console.warn("Using offline cached weather data:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const handleFastQuery = async (queryText?: string) => {
    const q = queryText || fastAdvisoryPrompt || "Should I spray fungicide on my paddy crop this evening?";
    setIsAskingFastAdvisory(true);
    setFastAdvisoryResponse(null);

    try {
      const res = await fetch("/api/gemini/fast-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          context: {
            location: weather?.regionName || "South Deccan Zone",
            weatherCondition: `${weather?.tempCelsius}°C, ${weather?.humidityPercent}% humidity, ${weather?.precipitationProb12h}% rain probability, ${weather?.soilMoistureSurface}% surface moisture`,
            language,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFastAdvisoryResponse(data.text);
        setFastAdvisoryLatency(data.latencyMs);
      }
    } catch (e) {
      console.warn("Fast advisory error:", e);
    } finally {
      setIsAskingFastAdvisory(false);
    }
  };

  if (!weather && loading) {
    return (
      <div className="h-64 rounded-3xl bg-white/40 animate-pulse border border-white/40 flex items-center justify-center text-gray-500 font-medium">
        Loading agrometeorological sensors...
      </div>
    );
  }

  const isFavorable = weather?.spraySuitability === "FAVORABLE";

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-2xl flex flex-col gap-6">
      {/* Top Header & Spray Window Decision Pill */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A34]">
              {weather?.regionName} • NASA POWER & AgroNet Feed
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#061A14]">
            Microclimate & Spray Schedule Guard
          </h2>
        </div>

        {/* Dynamic Spray Decision Pill */}
        <div
          className={`px-4 py-2.5 rounded-2xl border font-bold text-sm flex items-center gap-2.5 shadow-md ${
            isFavorable
              ? "bg-emerald-100 border-emerald-400 text-emerald-900"
              : "bg-amber-100 border-amber-400 text-amber-950"
          }`}
        >
          {isFavorable ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <span>{isFavorable ? "Favorable Spray Window" : "Do Not Spray Pesticides Today"}</span>
        </div>
      </div>

      {/* Severe Weather Alert Card */}
      {weather?.severeWeatherAlert && (
        <div className="p-4 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 flex items-start gap-3 text-amber-950 shadow-sm">
          <AlertOctagon className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <span className="text-xs font-black uppercase tracking-wider text-amber-900 block">
              Severe Meteorological Early Warning
            </span>
            <p className="text-xs sm:text-sm font-semibold mt-0.5 text-[#061A14]">
              {weather.severeWeatherAlert}
            </p>
          </div>
        </div>
      )}

      {/* Main Meteorological Stats Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Ambient & Soil Temperature Gauge */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#09261E]/5 border border-[#09261E]/10 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-600">Thermal Profile</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              {weather?.conditionText}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase block">Ambient Canopy</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-4xl font-black text-[#061A14]">
                  {weather?.tempCelsius}°
                </span>
                <span className="text-sm font-bold text-gray-500">C</span>
              </div>
            </div>

            <div className="border-l border-gray-300 pl-4">
              <span className="text-[11px] font-bold text-gray-500 uppercase block">Soil Temperature</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-4xl font-black text-amber-800">
                  {weather?.soilTempCelsius || 26.8}°
                </span>
                <span className="text-sm font-bold text-gray-500">C</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-[#1E3A34] pt-2 border-t border-gray-200">
            <span className="flex items-center gap-1">
              <Wind className="w-4 h-4 text-emerald-600" /> {weather?.windSpeedKmh} km/h Wind
            </span>
            <span className="flex items-center gap-1 font-bold text-amber-700">
              <Sun className="w-4 h-4 text-amber-600" /> {weather?.solarRadiationWm2} W/m² Solar
            </span>
          </div>
        </div>

        {/* Right Column: Three Horizontal Progress Meters */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          {/* Meter 1: Surface Soil Moisture 0-10cm */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#061A14] flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-600" /> Rootzone Soil Moisture (0–10 cm depth)
              </span>
              <span className="text-emerald-800 font-black">
                {weather?.soilMoistureSurface}% (Optimal Range 30–45%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${Math.min(100, (weather?.soilMoistureSurface || 0) * 1.5)}%` }}
              />
            </div>
          </div>

          {/* Meter 1b: Deep Soil Moisture 10-40cm */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#061A14] flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-indigo-600" /> Deep Subsoil Moisture (10–40 cm depth)
              </span>
              <span className="text-indigo-800 font-black">
                {weather?.soilMoistureDeep || 48}% (Adequate Aquifer)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${Math.min(100, (weather?.soilMoistureDeep || 0) * 1.2)}%` }}
              />
            </div>
          </div>

          {/* Meter 2: Relative Humidity */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#061A14] flex items-center gap-1">
                <CloudRain className="w-3.5 h-3.5 text-cyan-600" /> Relative Air Humidity
              </span>
              <span className="text-cyan-800 font-black">
                {weather?.humidityPercent}% (Fungal Spore Risk &gt;70%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-cyan-600 transition-all duration-500"
                style={{ width: `${weather?.humidityPercent || 0}%` }}
              />
            </div>
          </div>

          {/* Meter 3: Precipitation Probability next 12h */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#061A14] flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5 text-amber-600" /> Rain Probability (Next 12 Hours)
              </span>
              <span className="text-amber-800 font-black">
                {weather?.precipitationProb12h}% (Run-off Risk)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${weather?.precipitationProb12h || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Guidance Note */}
      <div className="p-4 rounded-2xl bg-[#061A14] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm font-medium leading-relaxed text-emerald-100">
            {weather?.sprayGuidance}
          </p>
        </div>
      </div>

      {/* Low-Latency Instant Advisory Query (Powered by gemini-3.1-flash-lite) */}
      <div className="p-4 rounded-2xl bg-[#09261E]/5 border border-[#09261E]/10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A34] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Instant Agro-Advisory Engine (gemini-3.1-flash-lite)
          </span>
          {fastAdvisoryLatency && (
            <span className="text-[11px] font-mono text-emerald-700 font-semibold">
              ⚡ Response in {fastAdvisoryLatency}ms
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Ask instant advice: e.g. 'Can I spray Mancozeb on cotton today?'"
            value={fastAdvisoryPrompt}
            onChange={(e) => setFastAdvisoryPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleFastQuery();
            }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-sm text-[#061A14] focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
          <button
            onClick={() => handleFastQuery()}
            disabled={isAskingFastAdvisory}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-97 cursor-pointer disabled:opacity-50 shadow-md shrink-0"
          >
            {isAskingFastAdvisory ? "Querying..." : "Get Instant Advice"}
          </button>
        </div>

        {fastAdvisoryResponse && (
          <div className="p-3.5 rounded-xl bg-white border border-emerald-200 text-sm text-[#061A14] font-medium leading-relaxed shadow-sm">
            {fastAdvisoryResponse}
          </div>
        )}
      </div>
    </div>
  );
};
