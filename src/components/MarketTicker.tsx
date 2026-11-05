import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, AlertCircle, Sparkles } from "lucide-react";
import { MarketCommodity } from "../types";
import { INITIAL_COMMODITIES } from "../data/initialData";

interface MarketTickerProps {
  onSelectCrop?: (crop: string) => void;
  isDark?: boolean;
}

export const MarketTicker: React.FC<MarketTickerProps> = ({ onSelectCrop, isDark = true }) => {
  const [commodities, setCommodities] = useState<MarketCommodity[]>(INITIAL_COMMODITIES);

  useEffect(() => {
    fetch("/api/market/live-feed", {
      headers: { "Accept": "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          setCommodities(data.data);
        }
      })
      .catch((err) => {
        console.warn("Ticker running on offline cached rates:", err);
      });
  }, []);

  if (commodities.length === 0) return null;

  // Double the list for infinite seamless marquee
  const tickerItems = [...commodities, ...commodities];

  return (
    <div className={`w-full ${isDark ? "bg-[#061A14] border-emerald-500/20 text-white" : "bg-[#0A2E24] border-emerald-800/30 text-white"} border-b overflow-hidden py-2 px-4 shadow-inner relative z-30 transition-colors duration-300`}>
      <div className="flex items-center gap-3">
        {/* Marquee Track */}
        <div className="flex-1 overflow-hidden whitespace-nowrap mask-gradient relative">
          <div className="inline-flex items-center gap-8 animate-marquee">
            {tickerItems.map((c, i) => (
              <button
                key={`${c.marketId}-${i}`}
                onClick={() => onSelectCrop?.(c.cropCategory)}
                className="inline-flex items-center gap-2 hover:bg-white/10 px-2 py-0.5 rounded transition-colors cursor-pointer text-xs"
              >
                <span className="font-bold text-white">{c.cropCategory}</span>
                <span className="text-gray-400 text-[11px]">({c.variety.split(" ")[0]})</span>
                <span className="font-mono font-bold text-emerald-300">
                  ₹{c.localModalPrice.toLocaleString()}
                </span>
                <span
                  className={`inline-flex items-center font-bold text-[10px] ${
                    c.dailyDeltaPercentage >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {c.dailyDeltaPercentage >= 0 ? "▲ +" : "▼ "}
                  {c.dailyDeltaPercentage}%
                </span>
                {c.arbitrageAlert && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-extrabold uppercase border border-amber-500/40">
                    +₹{c.netArbitrageSpread} spread
                  </span>
                )}
                <span className="text-gray-600 ml-1">•</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
