import { Link } from "react-router-dom";
import {
  Radio, Zap, Shield, Server, Cpu, Database,
  ArrowRight, CheckCircle2, ChevronRight, Headphones, Sparkles, Layers
} from "lucide-react";
import { Button, Panel } from "../components/ui";

const ARCH_LAYERS = [
  {
    icon: Radio,
    color: "lavender",
    title: "1. Audio Capture & Opus Encoding",
    desc: "Host initiates getDisplayMedia or getUserMedia in Chrome/Edge. Video tracks are immediately discarded to conserve bandwidth, and the single audio track is tuned to music mode with stereo=1, sprop-stereo=1, and maxaveragebitrate=192000."
  },
  {
    icon: Server,
    color: "rose",
    title: "2. Real-Time Signaling (Socket.io)",
    desc: "Clients exchange WebRTC SDP offers, answers, and ICE candidate trickles over bidirectional Socket.io events. All signaling is secured and rate-limited to prevent brute-force probing of 4-digit room passcodes."
  },
  {
    icon: Cpu,
    color: "lavender",
    title: "3. Direct Peer-to-Peer Mesh (WebRTC)",
    desc: "Once signaling concludes, media flows directly from host to listeners via RTCPeerConnection. Audio packets never traverse the application server, achieving sub-second glass-to-ear latency."
  },
  {
    icon: Database,
    color: "rose",
    title: "4. State & Session Persistence (MongoDB)",
    desc: "Ephemeral in-memory room registries handle live connections. When broadcasts conclude, aggregate metrics (peak listeners, unique listeners, duration, reactions) are persisted to MongoDB."
  }
];

const FAQS = [
  {
    q: "Why WebRTC instead of HLS or RTMP streaming?",
    a: "Standard streaming protocols (HLS/DASH) induce 5 to 15 seconds of buffer latency. SoundCircle is designed for shared spaces (movie nights, silent discos, collaborative music listening) where synchronization under 200 milliseconds is paramount. WebRTC delivers true real-time audio."
  },
  {
    q: "Why do listeners not need an account or an app?",
    a: "Zero friction was the core engineering objective. Any smartphone browser (iOS Safari, Android Chrome) natively supports WebRTC and modern audio decoding. A simple 4-digit code and a web link is all that is required."
  },
  {
    q: "How are NATs and firewalls handled?",
    a: "SoundCircle queries STUN servers (Google STUN) and supports TURN relays for clients behind symmetric or restrictive institutional NATs, ensuring peer connectivity across heterogeneous networks."
  },
  {
    q: "What happens if a host drops connection momentarily?",
    a: "The server maintains an in-memory 30-second grace window. If the host re-opens the tab or recovers from a network blip, the room session re-attaches seamlessly without kicking listeners out."
  }
];

export default function About() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 md:py-16">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-lavender/30 bg-lavender/10 px-4 py-1.5 text-xs font-semibold text-lavender uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" /> Engineering & System Design
        </span>
        <h1 className="mt-5 font-display text-4xl md:text-5xl font-black tracking-tight">
          How SoundCircle Works
        </h1>
        <p className="mt-4 text-base md:text-lg text-white/60 leading-relaxed">
          SoundCircle is a real-time, low-latency audio distribution platform built on the MERN stack with native WebRTC mesh signaling.
        </p>
      </div>

      {/* Problem & Solution Card */}
      <section className="mt-14 grid gap-6 md:grid-cols-2">
        <Panel className="p-8 border-white/8 shadow-xl">
          <h2 className="text-sm font-bold uppercase tracking-wider text-rose">The Problem</h2>
          <h3 className="font-display text-2xl font-bold mt-2">Audio sharing in groups is broken</h3>
          <p className="mt-3 text-sm text-white/55 leading-relaxed">
            Watching a movie together in a public space, library, dorm room, or airport usually requires headphone splitters, Bluetooth pairing headaches, or blasted speakers. Existing solutions require heavy native app installations and accounts.
          </p>
        </Panel>
        <Panel className="p-8 border-lavender/25 bg-lavender/5 shadow-xl">
          <h2 className="text-sm font-bold uppercase tracking-wider text-lavender">The Solution</h2>
          <h3 className="font-display text-2xl font-bold mt-2">Zero-install ephemeral web broadcast</h3>
          <p className="mt-3 text-sm text-white/70 leading-relaxed">
            One host streams directly from a laptop browser tab. Anyone with a smartphone simply opens the URL, enters a 4-digit room code, and listens in perfect sync with studio-grade Opus fidelity.
          </p>
        </Panel>
      </section>

      {/* Architecture Deep Dive */}
      <section className="mt-16">
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-lavender">System Architecture</span>
          <h2 className="font-display text-3xl font-extrabold mt-1">Four-Layer Real-Time Pipeline</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {ARCH_LAYERS.map((layer) => {
            const Icon = layer.icon;
            const isRose = layer.color === "rose";
            return (
              <div
                key={layer.title}
                className="rounded-3xl border border-white/8 bg-char p-7 shadow-xl hover:border-lavender/30 transition-colors"
              >
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${isRose ? "bg-rose/15 text-rose" : "bg-lavender/15 text-lavender"} mb-4`}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-bold">{layer.title}</h3>
                <p className="mt-2 text-sm text-white/50 leading-relaxed">{layer.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Evaluator Tech Specs */}
      <section className="mt-16 rounded-3xl border border-white/10 bg-raised/70 p-8 md:p-10 shadow-2xl">
        <div className="flex items-center gap-2 text-lavender text-sm font-semibold uppercase tracking-wider">
          <Layers className="h-4 w-4" /> Technical Specifications
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold mt-2">Engineering Decisions &amp; Stack</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div className="rounded-2xl border border-white/6 bg-char p-4">
            <span className="text-xs text-white/40 block">Audio Codec</span>
            <span className="font-semibold text-white mt-1 block">Opus @ 192kbps Stereo</span>
            <span className="text-xs text-white/50 mt-1 block">Tuned via SDP munging (fmtp:111 stereo=1)</span>
          </div>
          <div className="rounded-2xl border border-white/6 bg-char p-4">
            <span className="text-xs text-white/40 block">Transport Layer</span>
            <span className="font-semibold text-white mt-1 block">WebRTC Data &amp; Media</span>
            <span className="text-xs text-white/50 mt-1 block">P2P SRTP with STUN/TURN fallback</span>
          </div>
          <div className="rounded-2xl border border-white/6 bg-char p-4">
            <span className="text-xs text-white/40 block">Signaling Channel</span>
            <span className="font-semibold text-white mt-1 block">Socket.io WebSocket</span>
            <span className="text-xs text-white/50 mt-1 block">Bi-directional event dispatch</span>
          </div>
          <div className="rounded-2xl border border-white/6 bg-char p-4">
            <span className="text-xs text-white/40 block">Backend Framework</span>
            <span className="font-semibold text-white mt-1 block">Node.js + Express</span>
            <span className="text-xs text-white/50 mt-1 block">REST API + JWT Bearer Auth</span>
          </div>
          <div className="rounded-2xl border border-white/6 bg-char p-4">
            <span className="text-xs text-white/40 block">Database</span>
            <span className="font-semibold text-white mt-1 block">MongoDB Atlas</span>
            <span className="text-xs text-white/50 mt-1 block">Mongoose schemas with indexes</span>
          </div>
          <div className="rounded-2xl border border-white/6 bg-char p-4">
            <span className="text-xs text-white/40 block">Frontend Framework</span>
            <span className="font-semibold text-white mt-1 block">React 18 + Vite + Tailwind v4</span>
            <span className="text-xs text-white/50 mt-1 block">Custom hooks, Context API</span>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="mt-16">
        <h2 className="font-display text-3xl font-extrabold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <Panel key={faq.q} className="p-6 md:p-7 border-white/8 shadow-md">
              <h3 className="font-bold text-base md:text-lg text-white">{faq.q}</h3>
              <p className="mt-2 text-sm text-white/60 leading-relaxed">{faq.a}</p>
            </Panel>
          ))}
        </div>
      </section>

      {/* CTA Bottom */}
      <div className="mt-16 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-lavender px-8 py-4 text-base font-semibold text-white shadow-[0_0_30px_rgba(166,107,255,0.35)] hover:bg-lavender-hi transition-all"
        >
          Try SoundCircle Now <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
