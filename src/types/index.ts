export type LanguageCode = "en" | "te" | "hi" | "ta";

export interface FarmerProfile {
  userId: string;
  displayName: string;
  email: string;
  phone?: string;
  preferredLanguage: LanguageCode;
  district?: string;
  state?: string;
  acreage?: number;
  primaryCrops?: string;
}

export interface MarketCommodity {
  marketId: string;
  marketName: string;
  state: string;
  district: string;
  cropCategory: string;
  variety: string;
  localModalPrice: number;
  terminalModalPrice: number;
  dailyDeltaPercentage: number;
  logisticsCostPerQtl: number;
  netArbitrageSpread: number;
  spreadPercentage: number;
  arbitrageAlert: boolean;
  history7d: number[];
  updatedAt: string;
}

export interface WeatherData {
  regionId: string;
  regionName: string;
  tempCelsius: number;
  humidityPercent: number;
  soilMoistureSurface: number; // 0-10 cm depth
  soilMoistureDeep: number; // 10-40 cm depth
  precipitationProb12h: number;
  windSpeedKmh: number;
  solarRadiationWm2: number;
  soilTempCelsius: number;
  spraySuitability: "FAVORABLE" | "UNFAVORABLE" | "CAUTION";
  sprayGuidance: string;
  riskLevel: "Low" | "Medium" | "Severe";
  conditionText: string;
  severeWeatherAlert?: string;
  updatedAt: string;
}

export interface DiagnosticResult {
  diagnosticId?: string;
  cropName: string;
  isPlantLeaf: boolean;
  diseaseDetected: string;
  confidenceScore: number;
  severity: "Low" | "Moderate" | "Severe";
  remedies: {
    organic: string[];
    chemical: string[];
  };
  preventiveMeasures: string[];
  localizedSummaryAudioScript: string;
  audioBase64?: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface TelephonyCallRecord {
  callSid: string;
  caller: string;
  callerLocation?: string;
  transcribedQuery: string;
  intent: "MARKET_PRICE" | "WEATHER_SPRAY" | "CROP_DISEASE" | "FERTILIZER" | "GOVT_SCHEME" | "GENERAL_QUERY";
  spokenReply: string;
  audioBase64?: string;
  durationSeconds: number;
  status: "completed" | "in-progress" | "queued";
  timestamp: string;
  dialect: LanguageCode;
  resolutionQuality?: "High" | "Satisfactory" | "Requires Extension Visit";
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  audioBase64?: string;
  latencyMs?: number;
  timestamp: string;
  language?: LanguageCode;
}
