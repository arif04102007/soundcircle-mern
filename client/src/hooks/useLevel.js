import { useEffect } from "react";

// Drives a row of DOM bars from a MediaStream's real audio level (no React re-renders per frame).
export function useLevel(stream, containerRef) {
  useEffect(() => {
    const bars = containerRef.current ? [...containerRef.current.children] : [];
    const reset = () => bars.forEach((b) => (b.style.transform = "scaleY(.08)"));
    reset();
    if (!stream || !stream.getAudioTracks().length) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    ctx.resume?.();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.78;
    let source;
    try { source = ctx.createMediaStreamSource(stream); source.connect(analyser); } catch { ctx.close(); return; }
    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf;
    const tick = () => {
      analyser.getByteFrequencyData(data);
      bars.forEach((b, i) => {
        const v = data[Math.min(data.length - 1, Math.floor((i / bars.length) * data.length * 0.7))] / 255;
        b.style.transform = `scaleY(${Math.max(0.08, v)})`;
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); source.disconnect(); ctx.close(); reset(); };
  }, [stream, containerRef]);
}
