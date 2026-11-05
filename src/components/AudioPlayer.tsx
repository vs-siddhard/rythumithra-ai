import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";

interface AudioPlayerProps {
  audioBase64?: string;
  audioUrl?: string;
  label?: string;
  autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioBase64,
  audioUrl,
  label = "Audio Advisory",
  autoPlay = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const src = audioUrl || (audioBase64 ? `data:audio/wav;base64,${audioBase64}` : "");

  useEffect(() => {
    if (!src) return;
    const audio = new Audio(src);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    if (autoPlay) {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [src, autoPlay]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.warn("Audio play prevented:", e));
    }
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.warn("Audio play prevented:", e));
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  if (!src) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#09261E] border border-emerald-500/30 text-white shadow-lg">
      <button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#061A14] flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-md"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center gap-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            {label}
          </span>
          <span className="font-mono text-[11px] text-emerald-200/80">
            {Math.floor(currentTime)}s / {Math.floor(duration || 0)}s
          </span>
        </div>

        {/* Audio Waveform visualization */}
        <div className="flex items-center gap-1 h-4">
          {[20, 45, 80, 50, 95, 30, 70, 40, 85, 60, 90, 35, 75, 55, 30].map((height, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isPlaying ? "bg-emerald-400 animate-pulse" : "bg-emerald-800"
              }`}
              style={{
                height: isPlaying ? `${Math.max(4, (height * (progressPercent + 20)) / 100)}px` : "4px",
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={handleRestart}
          className="p-2 rounded-lg hover:bg-white/10 text-emerald-300 transition-colors cursor-pointer"
          title="Restart audio"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={toggleMute}
          className="p-2 rounded-lg hover:bg-white/10 text-emerald-300 transition-colors cursor-pointer"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
