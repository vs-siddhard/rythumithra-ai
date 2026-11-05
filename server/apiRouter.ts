import express, { Request, Response } from "express";
import {
  diagnoseCropLeaf,
  fastAgriQuery,
  complexAgronomyAnalysis,
  synthesizeSpeechAudio,
  processTelephonyVoiceQuery,
} from "./geminiService.ts";

export const apiRouter = express.Router();

export const apiApp = express();

// Universal CORS & Preflight handler for browser iframes
apiApp.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (_req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

apiApp.use(express.json({ limit: "25mb" }));
apiApp.use("/api", apiRouter);

// Mock/Live market price datasets modeled on Agmarknet & USDA terminal hubs
const MARKET_COMMODITIES = [
  {
    marketId: "AP_GUNTUR_01",
    marketName: "Guntur Mirchi Yard",
    state: "Andhra Pradesh",
    district: "Guntur",
    cropCategory: "Chilli",
    variety: "Teja Super",
    localModalPrice: 19800,
    terminalModalPrice: 22800,
    dailyDeltaPercentage: 4.8,
    logisticsCostPerQtl: 950,
    history7d: [18900, 19100, 19400, 19300, 19600, 19750, 19800],
  },
  {
    marketId: "TS_WARANGAL_02",
    marketName: "Warangal Cotton Market",
    state: "Telangana",
    district: "Warangal",
    cropCategory: "Cotton",
    variety: "Long Staple (Bunny/Brahma)",
    localModalPrice: 7200,
    terminalModalPrice: 8350,
    dailyDeltaPercentage: 3.2,
    logisticsCostPerQtl: 420,
    history7d: [6900, 7000, 7050, 7150, 7100, 7180, 7200],
  },
  {
    marketId: "TS_NIZAMABAD_03",
    marketName: "Nizamabad Turmeric Hub",
    state: "Telangana",
    district: "Nizamabad",
    cropCategory: "Turmeric",
    variety: "Finger Quality",
    localModalPrice: 13500,
    terminalModalPrice: 15400,
    dailyDeltaPercentage: -1.4,
    logisticsCostPerQtl: 600,
    history7d: [14100, 13950, 13800, 13700, 13650, 13600, 13500],
  },
  {
    marketId: "TN_MADURAI_04",
    marketName: "Madurai Paddy Wholesale Yard",
    state: "Tamil Nadu",
    district: "Madurai",
    cropCategory: "Paddy (Rice)",
    variety: "BPT 5204 (Samba Mahsuri)",
    localModalPrice: 2450,
    terminalModalPrice: 2950,
    dailyDeltaPercentage: 2.1,
    logisticsCostPerQtl: 160,
    history7d: [2380, 2390, 2400, 2410, 2430, 2440, 2450],
  },
  {
    marketId: "KA_KOLAR_05",
    marketName: "Kolar Vegetable Terminal",
    state: "Karnataka",
    district: "Kolar",
    cropCategory: "Tomato",
    variety: "Hybrid US-440",
    localModalPrice: 1650,
    terminalModalPrice: 2200,
    dailyDeltaPercentage: 7.9,
    logisticsCostPerQtl: 180,
    history7d: [1200, 1300, 1450, 1500, 1550, 1600, 1650],
  },
  {
    marketId: "MH_NASHIK_06",
    marketName: "Lasalgaon Onion Mandi",
    state: "Maharashtra",
    district: "Nashik",
    cropCategory: "Onion",
    variety: "Red Garwa",
    localModalPrice: 1850,
    terminalModalPrice: 2350,
    dailyDeltaPercentage: -2.3,
    logisticsCostPerQtl: 210,
    history7d: [1980, 1950, 1920, 1900, 1880, 1860, 1850],
  },
];

// Helper: compute Net Spread & Arbitrage Alert (Spread > 8%)
function enrichMarketData(item: typeof MARKET_COMMODITIES[0]) {
  const netSpread = item.terminalModalPrice - (item.localModalPrice + item.logisticsCostPerQtl);
  const spreadPercentage = (netSpread / item.localModalPrice) * 100;
  const arbitrageOpportunity = spreadPercentage > 8.0;

  return {
    ...item,
    netArbitrageSpread: Math.round(netSpread),
    spreadPercentage: Number(spreadPercentage.toFixed(1)),
    arbitrageAlert: arbitrageOpportunity,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * GET /api/market/live-feed
 */
apiRouter.get("/market/live-feed", (_req: Request, res: Response) => {
  const enriched = MARKET_COMMODITIES.map(enrichMarketData);
  res.json({
    timestamp: new Date().toISOString(),
    source: "Agmarknet & Terminal Arbitrage Index v3.0",
    data: enriched,
  });
});

/**
 * GET /api/weather/microclimate
 */
apiRouter.get("/weather/microclimate", (req: Request, res: Response) => {
  const region = (req.query.region as string) || "South Deccan Agronomic Zone";

  // Agrometeorological indicators
  const tempCelsius = 29.4;
  const humidityPercent = 71;
  const soilMoistureSurface = 34; // 0-10cm optimal
  const soilMoistureDeep = 48; // 10-40cm
  const precipitationProb12h = 68; // Rain likely

  // Compute spray window decision pill
  // If precipitation > 50% or humidity > 85%, spraying is not recommended due to rain wash-off
  const isSprayUnfavorable = precipitationProb12h >= 50 || humidityPercent > 85;
  const spraySuitability = isSprayUnfavorable ? "UNFAVORABLE" : "FAVORABLE";
  const sprayGuidance = isSprayUnfavorable
    ? "Do Not Spray Pesticides Today. 68% precipitation forecasted within 12h will cause pesticide run-off and financial loss."
    : "Favorable Spray Window Active. Low wind (<10 km/h) and dry leaf canopy allow systemic absorption.";

  res.json({
    regionId: "AGRI_ZONE_DECCAN",
    regionName: region,
    tempCelsius,
    humidityPercent,
    soilMoistureSurface, // 0-10cm rootzone
    soilMoistureDeep, // 10-40cm subsoil
    precipitationProb12h,
    windSpeedKmh: 14.2,
    solarRadiationWm2: 540,
    soilTempCelsius: 26.8,
    spraySuitability,
    sprayGuidance,
    riskLevel: precipitationProb12h > 60 ? "Medium" : "Low",
    conditionText: "Scattered Rain & High Humidity",
    severeWeatherAlert: "Monsoon Convective Thunderstorm Watch: Heavy showers expected within 12–18 hours. Avoid foliar chemical application and inspect drainage trenches.",
    updatedAt: new Date().toISOString(),
  });
});

/**
 * POST /api/gemini/diagnose-leaf
 */
apiRouter.post("/gemini/diagnose-leaf", async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, context } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 payload" });
    }

    const diagnosis = await diagnoseCropLeaf(
      imageBase64,
      mimeType || "image/jpeg",
      context
    );
    res.json(diagnosis);
  } catch (error: any) {
    console.error("Diagnosis error:", error);
    res.status(500).json({ error: error?.message || "Crop diagnosis failed" });
  }
});

/**
 * POST /api/gemini/fast-query
 */
apiRouter.post("/gemini/fast-query", async (req: Request, res: Response) => {
  try {
    const { query, context } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }
    const result = await fastAgriQuery(query, context);
    res.json(result);
  } catch (error: any) {
    console.error("Fast query error:", error);
    res.status(500).json({ error: error?.message || "Fast query failed" });
  }
});

/**
 * POST /api/gemini/complex-analysis
 */
apiRouter.post("/gemini/complex-analysis", async (req: Request, res: Response) => {
  try {
    const { crop, chemicals, soilProfile, irrigationType } = req.body;
    const result = await complexAgronomyAnalysis(
      crop || "Chilli / Cotton",
      chemicals || ["Imidacloprid", "Mancozeb"],
      soilProfile || "Red sandy loam, 32% moisture",
      irrigationType || "Drip fertigation"
    );
    res.json(result);
  } catch (error: any) {
    console.error("Complex analysis error:", error);
    res.status(500).json({ error: error?.message || "Agronomy analysis failed" });
  }
});

/**
 * POST /api/gemini/tts
 */
apiRouter.post("/gemini/tts", async (req: Request, res: Response) => {
  try {
    const { text, voiceName, language } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Missing text for speech synthesis" });
    }
    const result = await synthesizeSpeechAudio(text, voiceName || "Kore", language || "en");
    res.json(result);
  } catch (error: any) {
    console.error("TTS error:", error);
    res.status(500).json({ error: error?.message || "Text-to-speech synthesis failed" });
  }
});

/**
 * POST /api/telephony/ivr-webhook
 * Inbound Twilio / Exotel telephony gateway webhook simulator
 */
apiRouter.post("/telephony/ivr-webhook", async (req: Request, res: Response) => {
  try {
    const { SpeechResult, From, CallSid, Dialect, QueryText } = req.body;
    const transcribed = SpeechResult || QueryText || "వరి పంటలో ఆకు ఎండు తెగులు వచ్చింది, ఏమి చేయాలి?";
    const dialect = Dialect || "te";

    const resolution = await processTelephonyVoiceQuery(transcribed, dialect);

    res.json({
      status: "success",
      callSid: CallSid || `CA_${Date.now().toString(36)}`,
      caller: From || "+91-98480-XXXXX",
      transcribedQuery: transcribed,
      intent: resolution.intent,
      spokenReply: resolution.spokenReply,
      audioBase64: resolution.audioBase64,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Telephony IVR error:", error);
    res.status(500).json({ error: error?.message || "Telephony IVR processing failed" });
  }
});

// Extension Support Call Logs & Analytics Dataset
const SAMPLE_IVR_LOGS = [
  {
    callSid: "CA_9a8f12c4e0",
    caller: "+91-98480-12948",
    callerLocation: "Guntur Rural, AP",
    transcribedQuery: "మిర్చి తోటలో నల్లి తెగులు మరియు తామర పురుగులు ఉన్నాయి, ఏ మందు పిచికారీ చేయాలి?",
    intent: "CROP_DISEASE",
    spokenReply: "నమస్కారం రైతు సోదరా. మిర్చిలో తామర పురుగుల నివారణకు ఎకరాకు 100 మి.లీ ఇమిడాక్లోప్రిడ్ లేదా 80 గ్రాముల డయాఫెంథియురాన్ 200 లీటర్ల నీటిలో కలిపి పిచికారీ చేయండి.",
    durationSeconds: 42,
    status: "completed",
    timestamp: "2026-11-05T06:14:22Z",
    dialect: "te",
    resolutionQuality: "High",
  },
  {
    callSid: "CA_3b7d81a9f1",
    caller: "+91-94402-83190",
    callerLocation: "Warangal Dist, TS",
    transcribedQuery: "నేడు వరంగల్ మార్కెట్లో పత్తి క్వింటాలు ధర ఎంత పలుకుతోంది?",
    intent: "MARKET_PRICE",
    spokenReply: "వరంగల్ మార్కెట్లో నేడు మధ్యస్థ పత్తి క్వింటాలు రూ. 7,200 నుండి రూ. 8,350 వరకు పలుకుతోంది. ఆర్బిట్రేజ్ ధర వ్యత్యాసం సానుకూలంగా ఉంది.",
    durationSeconds: 28,
    status: "completed",
    timestamp: "2026-11-05T05:48:10Z",
    dialect: "te",
    resolutionQuality: "High",
  },
  {
    callSid: "CA_4c1e90d2a8",
    caller: "+91-98101-54021",
    callerLocation: "Karnal, Haryana",
    transcribedQuery: "गेहूं की फसल में यूरिया डालने का सही समय और मौसम क्या है?",
    intent: "FERTILIZER",
    spokenReply: "किसान भाई, पहले पानी के बाद जब मिट्टी में पैर न धंसे, तब 45 किलो यूरिया प्रति एकड़ छिड़कें। तेज हवा या भारी बारिश से पहले न डालें।",
    durationSeconds: 35,
    status: "completed",
    timestamp: "2026-11-05T04:22:05Z",
    dialect: "hi",
    resolutionQuality: "High",
  },
  {
    callSid: "CA_7f2b18c9e3",
    caller: "+91-94431-77209",
    callerLocation: "Thanjavur, TN",
    transcribedQuery: "நெல் பயிரில் இலைக்கருகல் நோய் தென்படுகிறது. மழை காலத்தில் மருந்து தெளிக்கலாமா?",
    intent: "WEATHER_SPRAY",
    spokenReply: "வணக்கம். அடுத்த 12 மணி நேரத்தில் மழை பெய்ய வாய்ப்புள்ளதால் இன்று ரசாயன தெளிப்பு வேண்டாம். மழை நின்ற பின் காப்பர் ஆக்சிகுளோரைடு தெளிக்கவும்.",
    durationSeconds: 39,
    status: "completed",
    timestamp: "2026-11-05T03:55:18Z",
    dialect: "ta",
    resolutionQuality: "Satisfactory",
  },
  {
    callSid: "CA_1e8d44b2c7",
    caller: "+91-97010-66412",
    callerLocation: "Khammam, TS",
    transcribedQuery: "PM కిసాన్ 18వ విడత నిధుల జమ వివరాలు ఎలా సరిచూసుకోవాలి?",
    intent: "GOVT_SCHEME",
    spokenReply: "మీ ఆధార్ నంబర్ మరియు బ్యాంక్ ఈ-కేవైసీ సరిగ్గా ఉంటే నిధులు నేరుగా ఖాతాలో జమవుతాయి. వివరాల కోసం స్థానిక వ్యవసాయ అధికారిని కలవండి.",
    durationSeconds: 31,
    status: "completed",
    timestamp: "2026-11-05T02:10:44Z",
    dialect: "te",
    resolutionQuality: "Satisfactory",
  },
];

/**
 * GET /api/telephony/logs
 */
apiRouter.get("/telephony/logs", (_req: Request, res: Response) => {
  res.json({
    totalCalls: 1428,
    resolvedPercentage: 94.2,
    avgDurationSec: 36,
    activeDialects: { te: 58, hi: 24, ta: 12, en: 6 },
    intentBreakdown: {
      CROP_DISEASE: 41,
      MARKET_PRICE: 29,
      WEATHER_SPRAY: 18,
      FERTILIZER: 8,
      GOVT_SCHEME: 4,
    },
    logs: SAMPLE_IVR_LOGS,
  });
});
