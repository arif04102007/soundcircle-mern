import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL, getIceServers, getToken } from "../lib/api";
import { addIce, enqueue, flushIce, tuneOpus } from "./rtc";

const AUDIO_CONSTRAINTS = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };

function captureError(e) {
  if (e?.name === "NoAudio") return "No audio was shared. In the picker choose a Chrome tab (or whole screen on Windows) and tick “Also share tab audio” before pressing Share.";
  if (e?.name === "Unsupported") return "This browser can't capture tab audio. Use Chrome or Edge on a laptop, or choose “Use microphone”.";
  if (e?.name === "NotAllowedError" || e?.name === "AbortError") return "Sharing was cancelled or blocked. Press Go live and allow it to start broadcasting.";
  if (e?.name === "NotFoundError") return "No audio input was found on this device.";
  return "Couldn't start capturing audio. Try again, or use the microphone option.";
}

export function useHostRoom({ title }) {
  const [status, setStatus] = useState("connecting"); // connecting | ready | error | ended | taken_over
  const [error, setError] = useState(null);
  const [room, setRoom] = useState(null);
  const [live, setLive] = useState(false);
  const [stream, setStream] = useState(null);
  const [online, setOnline] = useState(true);
  const [listeners, setListeners] = useState([]);
  const [reactions, setReactions] = useState([]);

  const socketRef = useRef(null);
  const peers = useRef(new Map());
  const streamRef = useRef(null);
  const iceRef = useRef(null);
  const titleRef = useRef(title);
  const listenersRef = useRef([]);
  listenersRef.current = listeners;

  const patchListener = (id, patch) => setListeners((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const closePeer = useCallback((id) => {
    const pc = peers.current.get(id);
    if (pc) { pc.onconnectionstatechange = null; pc.close(); peers.current.delete(id); }
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => { t.onended = null; t.stop(); });
    streamRef.current = null;
    setStream(null);
    [...peers.current.keys()].forEach(closePeer);
  }, [closePeer]);

  const connectPeer = useCallback(async (id, iceRestart = false) => {
    const s = streamRef.current, socket = socketRef.current;
    if (!s || !socket) return;
    let pc = peers.current.get(id);
    if (!pc || pc.connectionState === "closed") {
      pc = new RTCPeerConnection({ iceServers: iceRef.current || undefined });
      peers.current.set(id, pc);
      s.getTracks().forEach((t) => pc.addTrack(t, s));
      pc.onicecandidate = (e) => e.candidate && socket.emit("signal", { to: id, data: { type: "ice", candidate: e.candidate } });
      pc.onconnectionstatechange = () => {
        patchListener(id, { conn: pc.connectionState });
        if (pc.connectionState === "failed" && peers.current.get(id) === pc) connectPeer(id, true);
      };
    }
    enqueue(pc, async () => {
      const offer = await pc.createOffer({ iceRestart });
      offer.sdp = tuneOpus(offer.sdp);
      await pc.setLocalDescription(offer);
      socket.emit("signal", { to: id, data: { type: "offer", sdp: pc.localDescription } });
    });
  }, []);

  useEffect(() => {
    getIceServers().then((s) => (iceRef.current = s));
    const socket = io(API_URL, { auth: { token: getToken() }, transports: ["websocket", "polling"], reconnectionDelayMax: 4000 });
    socketRef.current = socket;

    const attach = () =>
      socket.emit("host:create", { title: titleRef.current }, (res) => {
        if (!res?.ok) { setError(res?.error || "Couldn't open the room."); setStatus("error"); return; }
        setOnline(true);
        setRoom(res.room);
        setListeners(res.room.listeners.map((l) => ({ ...l, rtt: null, conn: "new" })));
        setStatus("ready");
        if (streamRef.current) {
          // We kept the audio through a network blip: tell the server and re-offer to everyone with an ICE restart.
          if (!res.room.live) socket.emit("host:live", { live: true });
          setLive(true);
          res.room.listeners.forEach((l) => connectPeer(l.id, true));
        } else if (res.room.live) {
          // Page was reloaded: the capture is gone, so the room can't still be live.
          socket.emit("host:live", { live: false });
          setLive(false);
        }
      });

    socket.on("connect", attach);
    socket.on("disconnect", () => setOnline(false));
    socket.on("connect_error", (e) => {
      if (e.message === "UNAUTHORIZED") { setError("Your session expired. Please sign in again."); setStatus("error"); socket.disconnect(); }
    });
    socket.on("room:taken_over", () => { releaseStream(); setLive(false); setStatus("taken_over"); socket.disconnect(); });
    socket.on("room:closed", () => { releaseStream(); setLive(false); setStatus("ended"); socket.disconnect(); });

    socket.on("listener:joined", ({ id, name }) => {
      setListeners((l) => (l.some((x) => x.id === id) ? l : [...l, { id, name, rtt: null, conn: "new" }]));
      if (streamRef.current) connectPeer(id);
    });
    socket.on("listener:left", ({ id }) => { closePeer(id); setListeners((l) => l.filter((x) => x.id !== id)); });
    socket.on("listener:latency", ({ id, rtt }) => patchListener(id, { rtt }));
    socket.on("reaction", ({ emoji }) => {
      const id = Math.random();
      setReactions((r) => [...r.slice(-12), { id, emoji, x: 8 + Math.random() * 84 }]);
      setTimeout(() => setReactions((r) => r.filter((x) => x.id !== id)), 2500);
    });
    socket.on("signal", ({ from, data }) => {
      const pc = peers.current.get(from);
      if (data.type === "request") return connectPeer(from);
      if (!pc) return;
      if (data.type === "answer") enqueue(pc, async () => { await pc.setRemoteDescription(data.sdp); }).then(() => flushIce(pc));
      if (data.type === "ice") addIce(pc, data.candidate);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      streamRef.current?.getTracks().forEach((t) => { t.onended = null; t.stop(); });
      peers.current.forEach((pc) => pc.close());
      peers.current.clear();
    };
  }, [connectPeer, closePeer, releaseStream]);

  const stopLive = useCallback(() => {
    releaseStream();
    setLive(false);
    socketRef.current?.emit("host:live", { live: false });
    setListeners((l) => l.map((x) => ({ ...x, conn: "new" })));
  }, [releaseStream]);

  const startLive = useCallback(async (source = "tab") => {
    let s;
    try {
      if (source === "mic") {
        s = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS });
      } else {
        if (!navigator.mediaDevices?.getDisplayMedia) throw { name: "Unsupported" };
        s = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: AUDIO_CONSTRAINTS });
        s.getVideoTracks().forEach((t) => { t.stop(); s.removeTrack(t); });
        if (!s.getAudioTracks().length) { s.getTracks().forEach((t) => t.stop()); throw { name: "NoAudio" }; }
      }
    } catch (e) {
      return { ok: false, error: captureError(e) };
    }
    const track = s.getAudioTracks()[0];
    track.contentHint = "music";
    track.onended = () => stopLive(); // user clicked "Stop sharing" in the browser bar
    streamRef.current = s;
    setStream(s);
    setLive(true);
    socketRef.current?.emit("host:live", { live: true });
    listenersRef.current.forEach((l) => connectPeer(l.id));
    return { ok: true };
  }, [connectPeer, stopLive]);

  const endRoom = useCallback(() => {
    releaseStream();
    socketRef.current?.emit("host:end", {}, () => { setLive(false); setStatus("ended"); });
    setTimeout(() => setStatus((s) => (s === "ended" ? s : "ended")), 1500);
  }, [releaseStream]);

  return { status, error, room, live, stream, online, listeners, reactions, startLive, stopLive, endRoom };
}
