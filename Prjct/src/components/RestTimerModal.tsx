import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Bell } from 'lucide-react';

interface RestTimerModalProps {
  initialSeconds?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const RestTimerModal: React.FC<RestTimerModalProps> = ({
  initialSeconds = 60,
  isOpen,
  onClose,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const [targetSeconds, setTargetSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setTargetSeconds(initialSeconds);
    if (isOpen) setIsActive(true);
  }, [initialSeconds, isOpen]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      setIsActive(false);
      // Play web audio beep
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } catch (e) {
        // audio context fallback
      }
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  if (!isOpen) return null;

  const setTimerPreset = (secs: number) => {
    setTargetSeconds(secs);
    setSecondsLeft(secs);
    setIsActive(true);
  };

  const progress = targetSeconds > 0 ? ((targetSeconds - secondsLeft) / targetSeconds) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full mb-3">
            <Bell className="w-3.5 h-3.5" />
            <span>Rest Interval Timer</span>
          </div>

          {/* Timer Display */}
          <div className="my-4">
            <div className="text-5xl font-extrabold text-white font-mono tracking-tight">
              {Math.floor(secondsLeft / 60)}:
              {(secondsLeft % 60).toString().padStart(2, '0')}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {secondsLeft === 0 ? 'Rest complete! Start your next set.' : 'Recover & breathe'}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 mb-6 overflow-hidden">
            <div
              className={`h-2 transition-all duration-300 ${
                secondsLeft === 0 ? 'bg-emerald-400' : 'bg-emerald-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <button
              onClick={() => setIsActive(!isActive)}
              className="p-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-lg shadow-emerald-500/20"
            >
              {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              onClick={() => {
                setSecondsLeft(targetSeconds);
                setIsActive(false);
              }}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Presets */}
          <div className="flex items-center justify-center gap-2">
            {[30, 45, 60, 90, 120].map((s) => (
              <button
                key={s}
                onClick={() => setTimerPreset(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  targetSeconds === s
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}s
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
