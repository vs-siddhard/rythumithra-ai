import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Truck,
  AlertCircle,
  Calculator,
  ArrowRight,
  RefreshCw,
  Coins,
  ShieldCheck,
} from "lucide-react";
import { MarketCommodity, LanguageCode } from "../types";
import { INITIAL_COMMODITIES } from "../data/initialData";

interface MarketArbitrageGridProps {
  language: LanguageCode;
}

export const MarketArbitrageGrid: React.FC<MarketArbitrageGridProps> = ({ language }) => {
  const [commodities, setCommodities] = useState<MarketCommodity[]>(INITIAL_COMMODITIES);
  const [loading, setLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<string>("Chilli");
  const [harvestVolumeQtl, setHarvestVolumeQtl] = useState<number>(45); // quintals slider

  const fetchMarketPrices = async (retries = 2) => {
    setLoading(true);
    try {
      const res = await fetch("/api/market/live-feed", {
        headers: { "Accept": "application/json" },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setCommodities(json.data);
        }
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      if (retries > 0) {
        setTimeout(() => fetchMarketPrices(retries - 1), 1000);
      } else {
        console.warn("Using offline cached commodity prices:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketPrices();
  }, []);

  const currentCommodity =
    commodities.find((c) => c.cropCategory === selectedCrop) || commodities[0];

  // Intermediary vs Direct Arbitrage calculation
  // Middleman typically pockets the spread (Terminal - Local - Logistics)
  const spreadPerQtl = currentCommodity
    ? Math.max(0, currentCommodity.netArbitrageSpread)
    : 0;
  const totalMiddlemanLeakage = spreadPerQtl * harvestVolumeQtl;
  const directGrossRevenue = currentCommodity
    ? (currentCommodity.terminalModalPrice - currentCommodity.logisticsCostPerQtl) * harvestVolumeQtl
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Title & Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A34]">
              Real-Time Commodity Arbitrage Engine
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#061A14]">
            Terminal Wholesale vs. Local Mandi Benchmarks
          </h2>
        </div>

        <button
          onClick={() => fetchMarketPrices(2)}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white/70 hover:bg-white/95 border border-white/60 text-[#061A14] text-xs font-bold flex items-center gap-2 shadow-sm transition-transform active:scale-97 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          Sync Live Rates
        </button>
      </div>

      {/* Bento Grid of Commodities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {commodities.map((item) => {
          const isSelected = item.cropCategory === selectedCrop;
          const isProfitableArbitrage = item.arbitrageAlert;

          // Sparkline SVG points
          const maxVal = Math.max(...item.history7d);
          const minVal = Math.min(...item.history7d);
          const range = maxVal - minVal || 1;
          const points = item.history7d
            .map((val, idx) => {
              const x = (idx / 6) * 120;
              const y = 35 - ((val - minVal) / range) * 30;
              return `${x},${y}`;
            })
            .join(" ");

          return (
            <div
              key={item.marketId}
              onClick={() => setSelectedCrop(item.cropCategory)}
              className={`p-5 rounded-3xl backdrop-blur-xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                isSelected
                  ? "bg-white/90 border-emerald-500/80 shadow-xl ring-2 ring-emerald-500/20"
                  : "bg-white/70 hover:bg-white/85 border-white/50 shadow-md"
              }`}
            >
              {/* Top metadata */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-bold uppercase text-[#1E3A34]/80 tracking-wide">
                    {item.variety}
                  </span>
                  <h3 className="text-xl font-extrabold text-[#061A14]">
                    {item.cropCategory}
                  </h3>
                  <span className="text-xs font-medium text-emerald-800">
                    {item.marketName} • {item.state}
                  </span>
                </div>

                {isProfitableArbitrage ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold border border-emerald-300 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    +{item.spreadPercentage}% Arbitrage
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[11px] font-bold">
                    Standard Rate
                  </span>
                )}
              </div>

              {/* Price Comparison Bento */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#09261E]/5 border border-[#09261E]/10">
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-gray-600">Local Mandi</span>
                  <span className="text-lg font-black text-[#061A14]">
                    ₹{item.localModalPrice.toLocaleString()}
                    <span className="text-[11px] font-normal text-gray-500"> /qtl</span>
                  </span>
                </div>
                <div className="flex flex-col border-l border-gray-300/80 pl-2.5">
                  <span className="text-[11px] font-semibold text-gray-600">Terminal Hub</span>
                  <span className="text-lg font-black text-emerald-700">
                    ₹{item.terminalModalPrice.toLocaleString()}
                    <span className="text-[11px] font-normal text-gray-500"> /qtl</span>
                  </span>
                </div>
              </div>

              {/* Net Spread & Sparkline */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                    <Truck className="w-3 h-3 text-gray-500" /> Net Spread (deducting ₹{item.logisticsCostPerQtl}/qtl freight)
                  </span>
                  <span
                    className={`text-sm font-black ${
                      item.netArbitrageSpread > 0 ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    +₹{item.netArbitrageSpread.toLocaleString()} /quintal
                  </span>
                </div>

                {/* 7-day sparkline SVG */}
                <div className="flex flex-col items-end">
                  <svg width="70" height="24" className="overflow-visible">
                    <polyline
                      fill="none"
                      stroke={item.dailyDeltaPercentage >= 0 ? "#059669" : "#dc2626"}
                      strokeWidth="2.5"
                      points={points}
                    />
                  </svg>
                  <span
                    className={`text-[10px] font-bold mt-1 ${
                      item.dailyDeltaPercentage >= 0 ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {item.dailyDeltaPercentage >= 0 ? "+" : ""}
                    {item.dailyDeltaPercentage}% 7d
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Direct-to-Buyer Profit Estimation Calculator */}
      {currentCommodity && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-2xl flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A34]">
                  Interactive Arbitrage Estimator
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#061A14]">
                  Direct-to-Buyer Savings Calculator ({currentCommodity.cropCategory})
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Anti-Intermediary Protection
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Slider Control */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-[#061A14]">
                  Estimated Harvest Volume to Liquidate:
                </label>
                <span className="px-3 py-1 rounded-lg bg-emerald-950 text-white font-mono text-sm font-bold shadow-inner">
                  {harvestVolumeQtl} Quintals (~{(harvestVolumeQtl * 100).toLocaleString()} kg)
                </span>
              </div>

              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={harvestVolumeQtl}
                onChange={(e) => setHarvestVolumeQtl(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />

              <div className="flex justify-between text-xs text-gray-500 font-medium">
                <span>5 qtl (Small plot)</span>
                <span>100 qtl</span>
                <span>250 qtl</span>
                <span>500 qtl (Large farm harvest)</span>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                By bypassing local middlemen syndicates who depress rates below fair market value and selling directly into certified wholesale terminals or FPO aggregation centers, you protect your full harvest margin.
              </p>
            </div>

            {/* Calculations Display Cards */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-emerald-100 uppercase tracking-wide">
                    Additional Money in Farmer's Pocket
                  </span>
                  <div className="text-2xl sm:text-3xl font-black mt-0.5">
                    +₹{totalMiddlemanLeakage.toLocaleString()}
                  </div>
                </div>
                <Coins className="w-8 h-8 text-amber-300 shrink-0" />
              </div>

              <div className="p-4 rounded-2xl bg-[#061A14] text-white shadow-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-emerald-300 uppercase tracking-wide">
                    Direct Gross Harvest Realization
                  </span>
                  <div className="text-xl sm:text-2xl font-black mt-0.5 text-white">
                    ₹{directGrossRevenue.toLocaleString()}
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-emerald-400 shrink-0" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
