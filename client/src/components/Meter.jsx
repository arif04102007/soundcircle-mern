import { useRef } from "react";
import { useLevel } from "../hooks/useLevel";

export default function Meter({ stream, active, bars = 28, className = "" }) {
  const ref = useRef(null);
  useLevel(active ? stream : null, ref);
  return (
    <div ref={ref} aria-hidden className={`flex h-16 items-end gap-[3px] ${className}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={`h-full flex-1 origin-bottom rounded-sm transition-all duration-75 ${
            active
              ? "bg-gradient-to-t from-lavender to-rose shadow-[0_0_8px_rgba(166,107,255,0.35)]"
              : "bg-white/10"
          }`}
          style={{ transform: "scaleY(.08)" }}
        />
      ))}
    </div>
  );
}
