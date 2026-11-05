import React, { useState } from "react";
import { Sparkles, ShieldAlert, CheckCircle, X, FlaskConical, Sliders, AlertTriangle } from "lucide-react";

interface ComplexAgronomyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComplexAgronomyModal: React.FC<ComplexAgronomyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [crop, setCrop] = useState("Chilli (Capsicum annuum)");
  const [selectedChemicals, setSelectedChemicals] = useState<string[]>([
    "Imidacloprid 17.8% SL (Neonicotinoid)",
    "Mancozeb 75% WP (Contact Dithiocarbamate)",
    "19:19:19 NPK Foliar Fertilizer",
  ]);
  const [soilProfile, setSoilProfile] = useState("Red Sandy Loam, pH 6.8, 34% rootzone moisture");
  const [irrigationType, setIrrigationType] = useState("Drip Fertigation");
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    analysis: string;
    safetyScore: number;
    tankMixVerdict: string;
  } | null>(null);

  if (!isOpen) return null;

  const chemicalOptions = [
    "Imidacloprid 17.8% SL (Neonicotinoid)",
    "Mancozeb 75% WP (Contact Dithiocarbamate)",
    "Copper Oxychloride 50% WP (Inorganic Copper)",
    "Chlorantraniliprole 18.5% SC (Anthranilic Diamide)",
    "Streptocycline (Bactericide)",
    "19:19:19 NPK Foliar Fertilizer",
    "Neem Kernel Oil Extract (Azadirachtin)",
    "Hexaconazole 5% SC (Triazole)",
  ];

  const toggleChemical = (chem: string) => {
    if (selectedChemicals.includes(chem)) {
      setSelectedChemicals(selectedChemicals.filter((c) => c !== chem));
    } else {
      setSelectedChemicals([...selectedChemicals, chem]);
    }
  };

  const handleRunAnalysis = async () => {
    setLoading(true);
    setAnalysisResult(null);
    try {
      const res = await fetch("/api/gemini/complex-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop,
          chemicals: selectedChemicals,
          soilProfile,
          irrigationType,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
      }
    } catch (e) {
      console.warn("Complex analysis error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-gray-200 shadow-2xl p-6 sm:p-8 flex flex-col gap-6 text-[#061A14]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#09261E] text-emerald-400 flex items-center justify-center shadow-md">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-xs font-bold border border-purple-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  Complex Reasoning Core (gemini-4-argon)
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold mt-1">
                Tank-Mix Compatibility & Soil Phytotoxicity Workbench
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700">Target Crop</label>
            <input
              type="text"
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700">Soil Profile & Moisture</label>
            <input
              type="text"
              value={soilProfile}
              onChange={(e) => setSoilProfile(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Multi-Chemical Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-700">
            Select Active Ingredients & Fertilizers to Mix in Spray Tank:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {chemicalOptions.map((chem) => {
              const isChecked = selectedChemicals.includes(chem);
              return (
                <button
                  key={chem}
                  type="button"
                  onClick={() => toggleChemical(chem)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                    isChecked
                      ? "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="truncate">{chem}</span>
                  {isChecked ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRunAnalysis}
          disabled={loading || selectedChemicals.length === 0}
          className="w-full py-3.5 rounded-xl bg-[#09261E] hover:bg-[#0d3b32] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            "Evaluating Antagonism & Residue Limits (gemini-4-argon)..."
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-emerald-400" /> Run Deep Tank-Mix Compatibility Evaluation
            </>
          )}
        </button>

        {/* Results */}
        {analysisResult && (
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-gray-500">Verdict</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    analysisResult.tankMixVerdict === "SAFE"
                      ? "bg-emerald-100 text-emerald-800"
                      : analysisResult.tankMixVerdict === "CAUTION"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-red-100 text-red-900"
                  }`}
                >
                  {analysisResult.tankMixVerdict}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                Safety Score:{" "}
                <span className="text-base font-black text-emerald-700">
                  {analysisResult.safetyScore}/100
                </span>
              </div>
            </div>

            <div className="prose prose-sm max-w-none text-xs text-gray-700 leading-relaxed whitespace-pre-line">
              {analysisResult.analysis}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
