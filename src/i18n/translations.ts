import { LanguageCode } from "../types";

export interface Translations {
  appName: string;
  tagline: string;
  tollFreeBanner: string;
  callTollFree: string;
  tapToSpeak: string;
  tabMarket: string;
  tabClimate: string;
  tabDiagnostics: string;
  tabAssistant: string;
  tabIVR: string;
  tabAnalytics: string;
  tab3DTwin: string;
  weatherTitle: string;
  soilMoistureSurface: string;
  soilMoistureDeep: string;
  humidity: string;
  rainProb12h: string;
  sprayDecision: string;
  marketTitle: string;
  localMandi: string;
  terminalWholesale: string;
  netSpread: string;
  arbitrageAlert: string;
  calculatorTitle: string;
  cropVolume: string;
  bypassingMiddlemanSavings: string;
  leafScannerTitle: string;
  dropImageOrClick: string;
  diagnoseButton: string;
  severityLabel: string;
  organicTab: string;
  chemicalTab: string;
  preventiveTab: string;
  audioAdvisory: string;
  telephonyVisualizerTitle: string;
  liveCallSimulation: string;
  farmerSpeech: string;
  agronomistResponse: string;
  threeDLabTitle: string;
  liveVoiceTitle: string;
  signInGoogle: string;
  signOut: string;
  savedDiagnostics: string;
  lowLatencyAdvisory: string;
  quickQueryPlaceholder: string;
  askAssistant: string;
}

export const translations: Record<LanguageCode, Translations> = {
  en: {
    appName: "RythuMithra",
    tagline: "Smart Agriculture Platform & Inclusive Telephony AI Ecosystem",
    tollFreeBanner: "No Smartphone? Call Toll-Free 1800-180-1551 for 24/7 Voice AI Agronomist",
    callTollFree: "Dial 1800-180-1551",
    tapToSpeak: "Tap to Speak (Live AI)",
    tabMarket: "Market Intelligence",
    tabClimate: "Climate & Soil",
    tabDiagnostics: "Crop Diagnostics",
    tabAssistant: "Multilingual AI Assistant",
    tabIVR: "Inclusive IVR Call",
    tabAnalytics: "Telephony Logs & Analytics",
    tab3DTwin: "3D Agri-Twin Lab",
    weatherTitle: "Microclimate & Early Warning Climate System",
    soilMoistureSurface: "Surface Soil Moisture (0–10 cm depth)",
    soilMoistureDeep: "Deep Subsoil Moisture (10–40 cm depth)",
    humidity: "Relative Air Humidity",
    rainProb12h: "Precipitation Probability (12h)",
    sprayDecision: "Spray Window Decision",
    marketTitle: "Live Market Ticker & Price Intelligence",
    localMandi: "Local Mandi Rate",
    terminalWholesale: "Terminal Wholesale Benchmark",
    netSpread: "Net Spread (After Freight)",
    arbitrageAlert: "Arbitrage Alert (>8%)",
    calculatorTitle: "Direct-to-Buyer Profit Estimator",
    cropVolume: "Harvest Volume (Quintals)",
    bypassingMiddlemanSavings: "Extra Revenue by Bypassing Middlemen",
    leafScannerTitle: "Intelligent Crop Diagnostics HUD (Gemini Vision)",
    dropImageOrClick: "Drop field leaf photo here or tap sample below",
    diagnoseButton: "Diagnose Leaf Lesion (Gemini Vision)",
    severityLabel: "Severity Level",
    organicTab: "Organic Bio-Control",
    chemicalTab: "Chemical Remediation",
    preventiveTab: "Agronomic Prevention",
    audioAdvisory: "Listen to Spoken Advisory (Gemini TTS)",
    telephonyVisualizerTitle: "Inclusive AI Voice Call Assistant (IVR)",
    liveCallSimulation: "Live 1800 Toll-Free Voice Stream",
    farmerSpeech: "Farmer Caller (ASR Output)",
    agronomistResponse: "AI Agronomist (Gemini Grounded)",
    threeDLabTitle: "3D Agri-Twin & Plant Pathology Lab",
    liveVoiceTitle: "Real-Time Gemini 3.8 Live Voice Session",
    signInGoogle: "Sign in with Google",
    signOut: "Sign Out",
    savedDiagnostics: "My Diagnostic Records",
    lowLatencyAdvisory: "Instant Advisory (Gemini 3.1 Flash Lite)",
    quickQueryPlaceholder: "Ask fast advice on fertilizer, pests, or market timing...",
    askAssistant: "Ask Advisory",
  },
  te: {
    appName: "రైతుమిత్ర",
    tagline: "స్మార్ట్ వ్యవసాయ మేధో వేదిక & వాయిస్ టెలిఫోనీ ఏఐ ఎకోసిస్టమ్",
    tollFreeBanner: "స్మార్ట్‌ఫోన్ లేదా? 24/7 ఉచిత వాయిస్ ఏఐ కోసం 1800-180-1551 కు కాల్ చేయండి",
    callTollFree: "1800-180-1551 కి కాల్ చేయండి",
    tapToSpeak: "మాట్లాడండి (లైవ్ ఏఐ)",
    tabMarket: "మార్కెట్ ధరలు & టిక్కర్",
    tabClimate: "వాతావరణం & మట్టి తేమ",
    tabDiagnostics: "తెగుళ్ళ గుర్తింపు",
    tabAssistant: "బహుభాషా ఏఐ అసిస్టెంట్",
    tabIVR: "వాయిస్ ఐవీఆర్ కాల్",
    tabAnalytics: "టెలిఫోనీ లాగ్‌లు & విశ్లేషణ",
    tab3DTwin: "3D డిజిటల్ ల్యాబ్",
    weatherTitle: "వాతావరణం & ముందస్తు హెచ్చరికల వ్యవస్థ",
    soilMoistureSurface: "ఉపరితల మట్టి తేమ (0–10 సెం.మీ)",
    soilMoistureDeep: "లోతు మట్టి తేమ (10–40 సెం.మీ)",
    humidity: "గాలిలో తేమ శాతం",
    rainProb12h: "వర్షపాత సంభావ్యత (12 గంటలు)",
    sprayDecision: "మందుల పిచికారీ నిర్ణయం",
    marketTitle: "లైవ్ మార్కెట్ టిక్కర్ & ధరల మేధస్సు",
    localMandi: "స్థానిక మార్కెట్ ధర",
    terminalWholesale: "ప్రధాన టెర్మినల్ మార్కెట్ ధర",
    netSpread: "నికర లాభ వ్యత్యాసం (రవాణా మినహాయించి)",
    arbitrageAlert: "అధిక లాభావకాశం (>8%)",
    calculatorTitle: "నేరుగా విక్రయ లాభ కాలిక్యులేటర్",
    cropVolume: "పంట పరిమాణం (క్వింటాళ్ళు)",
    bypassingMiddlemanSavings: "దళారులను దాటి పొందే అదనపు ఆదాయం",
    leafScannerTitle: "ఇంటెలిజెంట్ క్రాప్ డయాగ్నోస్టిక్స్ HUD (జెమినీ విజన్)",
    dropImageOrClick: "ఆకు ఫోటోను అప్‌లోడ్ చేయండి లేదా నమూనాను ఎంచుకోండి",
    diagnoseButton: "తెగులును గుర్తించండి (జెమినీ విజన్)",
    severityLabel: "తీవ్రత స్థాయి",
    organicTab: "సేంద్రీయ జీవ నియంత్రణ",
    chemicalTab: "రసాయన నివారణ చర్యలు",
    preventiveTab: "ముందస్తు జాగ్రత్తలు",
    audioAdvisory: "వాయిస్ సలహా వినండి (జెమినీ టీటీఎస్)",
    telephonyVisualizerTitle: "ఇన్‌క్లూజివ్ ఏఐ వాయిస్ కాల్ అసిస్టెంట్ (IVR)",
    liveCallSimulation: "1800 ఉచిత హాట్‌లైన్ ఆడియో స్ట్రీమ్",
    farmerSpeech: "రైతు ప్రశ్న (స్పీచ్-టు-టెక్స్ట్)",
    agronomistResponse: "ఏఐ వ్యవసాయ నిపుణుడు (జెమినీ)",
    threeDLabTitle: "3D డిజిటల్ పంట & తెగుళ్ల ప్రయోగశాల",
    liveVoiceTitle: "ప్రత్యక్ష జెమినీ 3.8 లైవ్ వాయిస్ సంభాషణ",
    signInGoogle: "గూగుల్‌తో లాగిన్ అవ్వండి",
    signOut: "లాగ్ అవుట్",
    savedDiagnostics: "నా తెగుళ్ల నివేదికలు",
    lowLatencyAdvisory: "తక్షణ పిచికారీ సలహా (జెమినీ 3.1 ఫ్లాష్ లైట్)",
    quickQueryPlaceholder: "ఎరువులు, పురుగులు లేదా మార్కెట్ సమయం గురించి అడగండి...",
    askAssistant: "సలహా పొందండి",
  },
  hi: {
    appName: "रैथुमित्र",
    tagline: "स्मार्ट कृषि प्लेटफॉर्म एवं समावेशी टेलीफोनी एआई पारिस्थितिकी तंत्र",
    tollFreeBanner: "स्मार्टफोन नहीं है? 24/7 निःशुल्क वॉयस एआई के लिए 1800-180-1551 पर कॉल करें",
    callTollFree: "1800-180-1551 डायल करें",
    tapToSpeak: "बोलें (लाइव एआई)",
    tabMarket: "मंडी भाव व आर्बिट्रेज",
    tabClimate: "मौसम व मृदा नमी",
    tabDiagnostics: "फसल रोग निदान",
    tabAssistant: "बहुभाषी एआई सहायक",
    tabIVR: "आईवीआर वॉयस कॉल",
    tabAnalytics: "कॉल लॉग व एनालिटिक्स",
    tab3DTwin: "3D फसल डिजिटल ट्विन",
    weatherTitle: "मौसम व प्रारंभिक चेतावनी प्रणाली",
    soilMoistureSurface: "सतह मृदा नमी (0–10 सेमी गहराई)",
    soilMoistureDeep: "गहरी मृदा नमी (10–40 सेमी गहराई)",
    humidity: "सापेक्षिक आर्द्रता",
    rainProb12h: "वर्षा की संभावना (12 घंटे)",
    sprayDecision: "कीटनाशक छिड़काव निर्णय",
    marketTitle: "लाइव मार्केट टिकर और मूल्य आसूचना",
    localMandi: "स्थानीय मंडी भाव",
    terminalWholesale: "टर्मिनल थोक बेंचमार्क",
    netSpread: "शुद्ध मूल्य अंतर (परिवहन पश्चात)",
    arbitrageAlert: "आर्बिट्रेज चेतावनी (>8%)",
    calculatorTitle: "सीधे खरीदार लाभ कैलकुलेटर",
    cropVolume: "फसल मात्रा (क्विंटल)",
    bypassingMiddlemanSavings: "बिचौलियों को हटाकर अतिरिक्त बचत",
    leafScannerTitle: "इंटेलिजेंट फसल रोग डायग्नोस्टिक्स (जेमिनी विजन)",
    dropImageOrClick: "पत्ती की फोटो अपलोड करें या नीचे दिए गए नमूने चुनें",
    diagnoseButton: "पत्ती रोग की जांच करें (जेमिनी विजन)",
    severityLabel: "रोग गंभीरता स्तर",
    organicTab: "जैविक जैव-नियंत्रण",
    chemicalTab: "रासायनिक उपचार",
    preventiveTab: "रोकथाम उपाय",
    audioAdvisory: "ऑडियो सलाह सुनें (जेमिनी टीटीएस)",
    telephonyVisualizerTitle: "समावेशी एआई वॉयस कॉल सहायक (IVR)",
    liveCallSimulation: "1800 टोल-फ्री लाइव ऑडियो स्ट्रीम",
    farmerSpeech: "किसान प्रश्न (स्पीच-टू-टेक्स्ट)",
    agronomistResponse: "एआई कृषि विशेषज्ञ (जेमिनी)",
    threeDLabTitle: "3D फसल डिजिटल ट्विन व रोग प्रयोगशाला",
    liveVoiceTitle: "रियल-टाइम जेमिनी 3.8 लाइव वॉयस सत्र",
    signInGoogle: "गूगल से साइन इन करें",
    signOut: "साइन आउट",
    savedDiagnostics: "मेरे निदान रिकॉर्ड",
    lowLatencyAdvisory: "त्वरित सलाह (जेमिनी 3.1 फ्लैश लाइट)",
    quickQueryPlaceholder: "उर्वरक, कीट या मंडी समय पर त्वरित प्रश्न पूछें...",
    askAssistant: "सलाह लें",
  },
  ta: {
    appName: "ரைத்துமித்ரா",
    tagline: "ஸ்மார்ட் வேளாண் தளம் & ஒருங்கிணைந்த குரல் AI",
    tollFreeBanner: "ஸ்மார்ட்போன் இல்லையா? 24/7 இலவச குரல் AI க்கு 1800-180-1551 ஐ அழைக்கவும்",
    callTollFree: "1800-180-1551 ஐ டயல் செய்க",
    tapToSpeak: "பேசவும் (நேரலை AI)",
    tabMarket: "சந்தை விலை & டிக்கர்",
    tabClimate: "வானிலை & மண் ஈரப்பதம்",
    tabDiagnostics: "இலை நோய் ஆய்வு",
    tabAssistant: "பன்மொழி AI உதவியாளர்",
    tabIVR: "IVR குரல் அழைப்பு",
    tabAnalytics: "அழைப்பு பதிவுகள் & பகுப்பாய்வு",
    tab3DTwin: "3D பயிர் ஆய்வகம்",
    weatherTitle: "நுண் தட்பவெப்பம் & முன்கூட்டிய எச்சரிக்கை",
    soilMoistureSurface: "மேற்பரப்பு மண் ஈரப்பதம் (0–10 செ.மீ)",
    soilMoistureDeep: "ஆழமான மண் ஈரப்பதம் (10–40 செ.மீ)",
    humidity: "ஒப்பீட்டு ஈரப்பதம்",
    rainProb12h: "மழைக்கான வாய்ப்பு (12 மணி நேரம்)",
    sprayDecision: "மருந்து தெளிப்பு முடிவு",
    marketTitle: "நேரலை சந்தை டிக்கர் & விலை பகுப்பாய்வு",
    localMandi: "உள்ளூர் சந்தை விலை",
    terminalWholesale: "முக்கிய மொத்த விற்பனை விலை",
    netSpread: "நிகர விலை வேறுபாடு",
    arbitrageAlert: "அதிக லாப வாய்ப்பு (>8%)",
    calculatorTitle: "இடைத்தரகர் இல்லாத கூடுதல் லாப கணிப்பான்",
    cropVolume: "அறுவடை அளவு (குவிண்டால்)",
    bypassingMiddlemanSavings: "இடைத்தரகர்களை தவிர்ப்பதால் கூடுதல் வருமானம்",
    leafScannerTitle: "நுண்ணறிவு பயிர் நோய் கண்டறிதல் (ஜெமினி விஷன்)",
    dropImageOrClick: "இலை புகைப்படத்தை பதிவேற்றவும் அல்லது மாதிரியை தேர்வு செய்யவும்",
    diagnoseButton: "நோயைக் கண்டறி (ஜெமினி விஷன்)",
    severityLabel: "தீவிர நிலை",
    organicTab: "இயற்கை உயிரியல் கட்டுப்பாடு",
    chemicalTab: "ரசாயன தீர்வுகள்",
    preventiveTab: "தடுப்பு நடவடிக்கைகள்",
    audioAdvisory: "குரல் ஆலோசனையைக் கேளுங்கள் (ஜெமினி TTS)",
    telephonyVisualizerTitle: "ஒருங்கிணைந்த AI குரல் அழைப்பு உதவியாளர் (IVR)",
    liveCallSimulation: "1800 இலவச நேரலை ஆடியோ",
    farmerSpeech: "விவசாயி கேள்வி (குரல் உரை)",
    agronomistResponse: "AI வேளாண் நிபுணர் (ஜெமினி)",
    threeDLabTitle: "3D பயிர் & நோய் ஆய்வுக்கூடம்",
    liveVoiceTitle: "நேரலை ஜெமினி 3.8 லைவ் குரல் உரையாடல்",
    signInGoogle: "கூகிள் மூலம் உள்நுழைக",
    signOut: "வெளியேறு",
    savedDiagnostics: "என் நோய் ஆய்வுகள்",
    lowLatencyAdvisory: "உடனடி ஆலோசனை (ஜெமினி 3.1 ஃபிளாஷ் லைட்)",
    quickQueryPlaceholder: "உரம், பூச்சிகள் அல்லது சந்தை நேரம் பற்றி கேளுங்கள்...",
    askAssistant: "கேள்வி கேட்க",
  },
};
