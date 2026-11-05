import React, { useState, useEffect } from "react";
import {
  auth,
  googleProvider,
  db,
  handleFirestoreError,
  OperationType,
} from "../firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { X, LogIn, LogOut, User as UserIcon, Shield, Check, MapPin, Sprout } from "lucide-react";
import { FarmerProfile, LanguageCode } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  language,
  onLanguageChange,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [district, setDistrict] = useState("Guntur");
  const [state, setState] = useState("Andhra Pradesh");
  const [acreage, setAcreage] = useState(4.5);
  const [primaryCrops, setPrimaryCrops] = useState("Paddy, Chilli, Cotton");
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const docSnap = await getDoc(doc(db, "farmers", user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data() as FarmerProfile;
            setProfile(data);
            if (data.district) setDistrict(data.district);
            if (data.state) setState(data.state);
            if (data.acreage) setAcreage(data.acreage);
            if (data.primaryCrops) setPrimaryCrops(data.primaryCrops);
            if (data.preferredLanguage) onLanguageChange(data.preferredLanguage);
          } else {
            // Create default profile
            const newProfile: FarmerProfile = {
              userId: user.uid,
              displayName: user.displayName || "Farmer",
              email: user.email || "",
              preferredLanguage: language,
              district: "Guntur",
              state: "Andhra Pradesh",
              acreage: 4.5,
              primaryCrops: "Paddy, Chilli, Cotton",
            };
            await setDoc(doc(db, "farmers", user.uid), {
              ...newProfile,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            setProfile(newProfile);
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `farmers/${user.uid}`);
        }
      } else {
        setProfile(null);
      }
    });

    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.warn("Google sign in warning:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Sign out warning:", err);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const updated: FarmerProfile = {
        userId: currentUser.uid,
        displayName: currentUser.displayName || "Farmer",
        email: currentUser.email || "",
        preferredLanguage: language,
        district,
        state,
        acreage: Number(acreage),
        primaryCrops,
      };

      await setDoc(doc(db, "farmers", currentUser.uid), {
        ...updated,
        updatedAt: new Date().toISOString(),
      });
      setProfile(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `farmers/${currentUser.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white border border-gray-200 shadow-2xl p-6 sm:p-8 flex flex-col gap-6 text-[#061A14]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#09261E] text-emerald-400 flex items-center justify-center shadow-md">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#061A14]">
                Farmer Identity & Auth
              </h3>
              <span className="text-xs text-gray-500 font-medium">
                Firebase Firestore Multi-Tenant Security
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User state */}
        {!currentUser ? (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#061A14]">
                Sign in with Google
              </h4>
              <p className="text-xs text-gray-600 max-w-xs mt-1">
                Securely persist your crop pathology records, personalized mandi alert subscriptions, and voice call transcripts across all devices.
              </p>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#09261E] hover:bg-[#0d3b32] text-white font-bold text-sm flex items-center justify-center gap-3 shadow-lg transition-transform active:scale-97 cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4 text-emerald-400" />
              {loading ? "Signing in..." : "Continue with Google Account"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* User profile card */}
            <div className="p-4 rounded-2xl bg-[#09261E]/5 border border-[#09261E]/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "User"}
                    className="w-11 h-11 rounded-full border border-emerald-500"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold">
                    {currentUser.displayName?.[0] || "F"}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-extrabold text-[#061A14]">
                    {currentUser.displayName}
                  </h4>
                  <span className="text-xs text-gray-500 font-mono">
                    {currentUser.email}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="p-2 rounded-xl hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Farm Profile Settings */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Farm Parameters
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-700">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full mt-1 p-2 rounded-lg border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700">Acreage</label>
                  <input
                    type="number"
                    value={acreage}
                    onChange={(e) => setAcreage(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-lg border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700">Primary Crops</label>
                <input
                  type="text"
                  value={primaryCrops}
                  onChange={(e) => setPrimaryCrops(e.target.value)}
                  className="w-full mt-1 p-2 rounded-lg border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Language Selector */}
              <div>
                <label className="text-[11px] font-bold text-gray-700">Preferred Dialect</label>
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {(["en", "te", "hi", "ta"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => onLanguageChange(l)}
                      className={`py-1.5 rounded-lg border text-xs font-bold uppercase transition-all ${
                        language === l
                          ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {l === "te" ? "తెలుగు" : l === "hi" ? "हिंदी" : l === "ta" ? "தமிழ்" : "EN"}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="mt-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" /> Preferences Updated!
                  </>
                ) : (
                  "Update Farm Profile"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
