import React, { useState, useEffect } from "react";
import classNames from 'classnames';

const cn = (...classes: (string | undefined | null | false)[]) => classNames(classes.filter(Boolean));

interface VoiceRecorderProps {
    isRecording: boolean;
    onStartRecording: () => void;
    onStopRecording: (duration: number) => void;
    visualizerBars?: number;
  }
  
export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
    isRecording,
    onStartRecording,
    onStopRecording,
    visualizerBars = 32,
  }) => {
    const [time, setTime] = useState(0);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  
    useEffect(() => {
      if (isRecording) {
        onStartRecording();
        timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
      } else {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        onStopRecording(time);
        setTime(0);
      }
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }, [isRecording, onStartRecording, onStopRecording]);
  
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
  
    return (
        <div
          className={cn(
            "flex flex-col items-center justify-center w-full transition-all duration-300 py-3",
            isRecording ? "opacity-100" : "opacity-100 h-100"
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-sm text-white/80">{formatTime(time)}</span>
          </div>
          <div className="w-full h-10 flex items-center justify-center gap-0.5 px-4">
          {[...Array(visualizerBars)].map((_, i) => {
  console.log(`Rendering bar ${i}`);
  return (
    <div
      key={i}
      className="w-0.5 rounded-full bg-white/50 animate-pulse"
      style={{
        height: `${Math.max(15, Math.random() * 100)}%`,
        animationDelay: `${i * 0.05}s`,
        animationDuration: `${0.5 + Math.random() * 0.5}s`,
      }}
    />
  );
})}
          </div>
        </div>
      );
    };