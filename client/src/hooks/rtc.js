// Small WebRTC helpers shared by the host and listener hooks.

// Serialise async work per peer connection so offers, answers and ICE candidates are applied in order.
export function enqueue(pc, task) {
  pc._q = (pc._q || Promise.resolve()).then(task).catch((e) => console.warn("RTC task failed:", e?.message || e));
  return pc._q;
}

// Opus tuned for music: stereo and a high bitrate instead of the speech-oriented defaults.
export function tuneOpus(sdp) {
  return sdp.replace(/a=fmtp:(\d+) ([^\r\n]*useinbandfec=1[^\r\n]*)/g, (m, pt, rest) =>
    rest.includes("stereo=1") ? m : `a=fmtp:${pt} ${rest};stereo=1;sprop-stereo=1;maxaveragebitrate=192000`
  );
}

export function addIce(pc, candidate) {
  return enqueue(pc, async () => {
    if (!candidate) return;
    if (pc.remoteDescription) await pc.addIceCandidate(candidate);
    else (pc._pendingIce ||= []).push(candidate);
  });
}

export function flushIce(pc) {
  return enqueue(pc, async () => {
    for (const c of pc._pendingIce || []) await pc.addIceCandidate(c).catch(() => {});
    pc._pendingIce = [];
  });
}
