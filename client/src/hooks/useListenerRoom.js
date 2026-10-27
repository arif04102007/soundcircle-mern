import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL, getIceServers } from "../lib/api";
import { addIce, enqueue, flushIce } from "./rtc";
import { clientId } from "../lib/format";

const CLOSED_MESSAGES = {
  host_ended: "The host ended this session.",
  host_disconnected: "The host lost connection and didn't come back in time.",
  expired: "This room expired after sitting idle.",
  server_shutdown: "The server restarted. Ask the host to open a new room.",
};

export function useListenerRoom({ code, name, audioRef }) {
  const [status, setStatus] = useState("connecting"); // connecting | joined | error | closed
  const [error, setError] = useState(null);
  const [room, setRoom] = useState(null);
  const [live, setLive] = useState(false);
  const [hostOnline, setHostOnline] = useState(true);
  const [count, setCount] = useState(0);
  const [conn, setConn] = useState("idle"); // idle | connecting | connected | reconnecting
  const [stream, setStream] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [volume, setVolume] = useState(80);
  const [rtt, setRtt] = useState(null);
  const [reactions, setReactions] = useState([]);

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const hostIdRef = useRef(null);
  const iceRef = useRef(null);
  const nameRef = useRef(name);

  const dropPeer = useCallback(() => {
    if (pcRef.current) { pcRef.current.onconnectionstatechange = null; pcRef.current.close(); pcRef.current = null; }
    setStream(null);
    setConn("idle");
    if (audioRef.current) audioRef.current.srcObject = null;
  }, [audioRef]);

  const play = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
  }, [audioRef]);

  useEffect(() => {
    getIceServers().then((s) => (iceRef.current = s));
    const socket = io(API_URL, { transports: ["websocket", "polling"], reconnectionDelayMax: 4000 });
    socketRef.current = socket;
    let joinedOnce = false;

    const join = () =>
      socket.emit("listener:join", { code, name: nameRef.current, clientId: clientId() }, (res) => {
        if (!res?.ok) {
          setError({ code: res?.code, message: res?.error || "Couldn't join this room." });
          setStatus("error");
          // Only permanently disconnect on non-recoverable errors (room gone, rate-limited).
          // On transient errors during reconnect, the socket may retry naturally.
          const permanent = ["NOT_FOUND", "RATE_LIMITED", "ALREADY_IN_ROOM"].includes(res?.code);
          if (permanent || !joinedOnce) socket.disconnect();
          return;
        }
        joinedOnce = true;
        hostIdRef.current = res.room.hostId;
        setRoom(res.room);
        setLive(res.room.live);
        setHostOnline(res.room.hostOnline);
        setCount(res.room.count);
        setStatus("joined");
        // If the host is already live they will offer to us as soon as they see us join.
      });

    socket.on("connect", () => { if (joinedOnce) { dropPeer(); setConn("reconnecting"); } join(); });
    socket.on("connect_error", () => { if (!joinedOnce) setError({ code: "NETWORK", message: "Can't reach the server. Check your connection." }); });
    socket.on("room:live", ({ live: l }) => { setLive(l); if (!l) dropPeer(); });
    socket.on("room:count", ({ count: c }) => setCount(c));
    socket.on("room:host_status", ({ online, hostId }) => { setHostOnline(online); if (hostId) hostIdRef.current = hostId; });
    socket.on("room:closed", ({ reason }) => { dropPeer(); setError({ message: CLOSED_MESSAGES[reason] || "This session has ended." }); setStatus("closed"); socket.disconnect(); });
    socket.on("reaction", ({ emoji }) => {
      const id = Math.random();
      setReactions((r) => [...r.slice(-12), { id, emoji, x: 8 + Math.random() * 84 }]);
      setTimeout(() => setReactions((r) => r.filter((x) => x.id !== id)), 2500);
    });

    socket.on("signal", ({ from, data }) => {
      hostIdRef.current = from;
      if (data.type === "offer") {
        let pc = pcRef.current;
        if (!pc || pc.connectionState === "closed") {
          pc = new RTCPeerConnection({ iceServers: iceRef.current || undefined });
          pcRef.current = pc;
          setConn("connecting");
          pc.onicecandidate = (e) => e.candidate && socket.emit("signal", { to: hostIdRef.current, data: { type: "ice", candidate: e.candidate } });
          pc.ontrack = (e) => {
            const s = e.streams[0] || new MediaStream([e.track]);
            setStream(s);
            if (audioRef.current) { audioRef.current.srcObject = s; play(); }
          };
          pc.onconnectionstatechange = () => {
            if (pcRef.current !== pc) return;
            if (pc.connectionState === "connected") setConn("connected");
            else if (pc.connectionState === "disconnected") setConn("reconnecting");
            else if (pc.connectionState === "failed") { setConn("reconnecting"); socket.emit("signal", { to: hostIdRef.current, data: { type: "request" } }); }
          };
        }
        enqueue(pc, async () => {
          await pc.setRemoteDescription(data.sdp);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("signal", { to: from, data: { type: "answer", sdp: pc.localDescription } });
        }).then(() => flushIce(pc));
      } else if (data.type === "ice" && pcRef.current) {
        addIce(pcRef.current, data.candidate);
      }
    });

    // Round-trip time to the server; reported to the host so they can see who is lagging.
    const timer = setInterval(() => {
      if (!socket.connected) return;
      const t0 = performance.now();
      socket.emit("latency:ping", () => {
        const ms = performance.now() - t0;
        setRtt(Math.round(ms));
        socket.emit("listener:latency", { rtt: ms });
      });
    }, 3000);

    return () => {
      clearInterval(timer);
      socket.removeAllListeners();
      socket.emit("listener:leave");
      socket.disconnect();
      dropPeer();
    };
  }, [code, dropPeer, play, audioRef]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume / 100; }, [volume, audioRef, status]);

  const react = useCallback((emoji) => socketRef.current?.emit("reaction", { emoji }), []);
  return { status, error, room, live, hostOnline, count, conn, stream, blocked, volume, setVolume, rtt, reactions, react, play };
}
