"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Home,
  ImageIcon,
  LogIn,
  Maximize2,
  Minimize2,
  Settings2,
  Sparkles,
  Volume2,
  VolumeX,
  Waves,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";

import { useServiceFlags } from "~/components/providers/app-providers";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  fallbackBackgrounds,
  type RetreatBackground,
} from "~/lib/fallback-backgrounds";
import { useFullscreen } from "~/lib/use-fullscreen";
import { cn } from "~/lib/utils";

const splashKey = "stayfocused-splash-seen";

const backgroundQuery = makeFunctionReference<
  "query",
  Record<string, never>,
  RetreatBackground[]
>("backgrounds:list");

type AmbientNoiseMode = "brown" | "fireplace" | "train";

type AmbientNoiseOption = {
  mode: AmbientNoiseMode;
  label: string;
  helperText: string;
  source: "synth" | "file";
  src?: string;
  volume: number;
};

type BrownNoiseRuntime = {
  kind: "brown";
  context: AudioContext;
  source: AudioBufferSourceNode;
  gain: GainNode;
  filter: BiquadFilterNode;
};

type FileNoiseRuntime = {
  kind: "file";
  mode: Exclude<AmbientNoiseMode, "brown">;
  audio: HTMLAudioElement;
};

type NoiseRuntime = BrownNoiseRuntime | FileNoiseRuntime;

const AMBIENT_NOISE_OPTIONS: AmbientNoiseOption[] = [
  {
    mode: "brown",
    label: "Brown noise",
    helperText: "Low-frequency hush that softens distracting edges.",
    source: "synth",
    volume: 0.09,
  },
  {
    mode: "fireplace",
    label: "Fireplace",
    helperText: "Warm crackle loop from your bundled local audio file.",
    source: "file",
    src: "/audio/fireplace.mp3",
    volume: 0.32,
  },
  {
    mode: "train",
    label: "Train",
    helperText: "Steady rail rhythm from your bundled local audio file.",
    source: "file",
    src: "/audio/train.mp3",
    volume: 0.34,
  },
];

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

function getAmbientNoiseOption(mode: AmbientNoiseMode) {
  return (
    AMBIENT_NOISE_OPTIONS.find((option) => option.mode === mode) ??
    AMBIENT_NOISE_OPTIONS[0]!
  );
}

function getClockLabel(now: Date) {
  const parts = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(now);

  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

function getDateLabel(now: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
}

function AuthShortcut() {
  const services = useServiceFlags();

  if (!services.clerk) {
    return (
      <Link href="/sign-in" className="dock-btn" title="Sign in">
        <LogIn className="h-4 w-4" />
      </Link>
    );
  }

  return <AuthShortcutWithClerk />;
}

function AuthShortcutWithClerk() {
  const { isSignedIn } = useUser();

  if (!isSignedIn) {
    return (
      <Link href="/sign-in" className="dock-btn" title="Sign in">
        <LogIn className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <div className="dock-btn overflow-hidden p-0" title="Account">
      <UserButton />
    </div>
  );
}

function RetreatDashboardContent({
  backgrounds,
  backgroundSource,
}: {
  backgrounds: RetreatBackground[];
  backgroundSource: "convex" | "fallback";
}) {
  const services = useServiceFlags();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const [showSplash, setShowSplash] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedNoiseMode, setSelectedNoiseMode] =
    useState<AmbientNoiseMode>("brown");
  const [ambientEnabled, setAmbientEnabled] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const noiseRef = useRef<NoiseRuntime | null>(null);
  const defaultBackground = fallbackBackgrounds[0]!;
  const activeBackground = backgrounds[activeIndex] ?? defaultBackground;
  const selectedNoiseOption = getAmbientNoiseOption(selectedNoiseMode);

  useEffect(() => {
    const splashSeen = sessionStorage.getItem(splashKey);

    if (splashSeen) {
      setShowSplash(false);
      return;
    }

    const splashTimer = window.setTimeout(() => {
      sessionStorage.setItem(splashKey, "1");
      setShowSplash(false);
    }, 2200);

    return () => window.clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (backgrounds.length < 2) {
      return;
    }

    const rotation = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % backgrounds.length);
    }, 18000);

    return () => window.clearInterval(rotation);
  }, [backgrounds.length]);

  useEffect(() => {
    setActiveIndex((current) => (current < backgrounds.length ? current : 0));
  }, [backgrounds.length]);

  useEffect(() => {
    return () => {
      const runtime = noiseRef.current;
      noiseRef.current = null;

      if (!runtime) {
        return;
      }

      if (runtime.kind === "brown") {
        runtime.source.stop();
        void runtime.context.close();
        return;
      }

      runtime.audio.pause();
      runtime.audio.removeAttribute("src");
      runtime.audio.load();
    };
  }, []);

  async function pauseAmbientNoise() {
    const runtime = noiseRef.current;

    if (!runtime) {
      setAmbientEnabled(false);
      return;
    }

    if (runtime.kind === "brown") {
      try {
        await runtime.context.suspend();
      } catch (error) {
        console.warn("Failed to suspend brown noise context", error);
      }
    } else {
      runtime.audio.pause();
    }

    setAmbientEnabled(false);
  }

  async function disposeAmbientNoise() {
    const runtime = noiseRef.current;
    noiseRef.current = null;

    if (!runtime) {
      return;
    }

    if (runtime.kind === "brown") {
      try {
        runtime.source.stop();
      } catch {
        // no-op: source may already be stopped
      }

      runtime.source.disconnect();
      runtime.filter.disconnect();
      runtime.gain.disconnect();

      try {
        await runtime.context.close();
      } catch (error) {
        console.warn("Failed to close brown noise context", error);
      }

      return;
    }

    runtime.audio.pause();
    runtime.audio.currentTime = 0;
    runtime.audio.removeAttribute("src");
    runtime.audio.load();
  }

  async function startAmbientNoise(mode: AmbientNoiseMode) {
    const option = getAmbientNoiseOption(mode);
    const runtime = noiseRef.current;

    if (runtime) {
      if (runtime.kind === "brown" && mode === "brown") {
        try {
          await runtime.context.resume();
          setAmbientEnabled(true);
          return true;
        } catch (error) {
          console.warn("Failed to resume brown noise context", error);
          await disposeAmbientNoise();
        }
      } else if (runtime.kind === "file" && runtime.mode === mode) {
        runtime.audio.volume = option.volume;

        try {
          await runtime.audio.play();
          setAmbientEnabled(true);
          return true;
        } catch (error) {
          console.warn(`Failed to resume ${mode} ambient audio`, error);
          await disposeAmbientNoise();
          setAmbientEnabled(false);
          return false;
        }
      } else {
        await disposeAmbientNoise();
      }
    }

    if (mode === "brown") {
      const AudioContextCtor =
        window.AudioContext ?? window.webkitAudioContext ?? null;

      if (!AudioContextCtor) {
        console.warn("AudioContext is unavailable for brown noise");
        setAmbientEnabled(false);
        return false;
      }

      const context = new AudioContextCtor();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      const source = context.createBufferSource();
      const buffer = context.createBuffer(
        1,
        context.sampleRate * 2,
        context.sampleRate,
      );
      const channel = buffer.getChannelData(0);

      let last = 0;
      for (let index = 0; index < channel.length; index += 1) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.025 * white) / 1.025;
        channel[index] = last * 3.2;
      }

      source.buffer = buffer;
      source.loop = true;
      filter.type = "lowpass";
      filter.frequency.value = 780;
      gain.gain.value = option.volume;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      source.start();

      noiseRef.current = { kind: "brown", context, source, gain, filter };
      setAmbientEnabled(true);
      return true;
    }

    if (!option.src) {
      console.warn(`Missing audio src for ambient mode "${mode}"`);
      setAmbientEnabled(false);
      return false;
    }

    const audio = new Audio(option.src);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = option.volume;

    try {
      await audio.play();
      noiseRef.current = { kind: "file", mode, audio };
      setAmbientEnabled(true);
      return true;
    } catch (error) {
      console.warn(`Failed to start ${mode} ambient audio`, error);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      setAmbientEnabled(false);
      return false;
    }
  }

  async function setAmbientNoiseMode(nextMode: AmbientNoiseMode) {
    if (nextMode === selectedNoiseMode) {
      return;
    }

    const wasPlaying = ambientEnabled;
    setSelectedNoiseMode(nextMode);

    if (!wasPlaying) {
      await disposeAmbientNoise();
      return;
    }

    await disposeAmbientNoise();
    const started = await startAmbientNoise(nextMode);

    if (!started) {
      setAmbientEnabled(false);
    }
  }

  async function toggleAmbientNoise() {
    if (ambientEnabled) {
      await pauseAmbientNoise();
      posthog.capture("ambient_noise_toggled", { enabled: false });
      return;
    }

    await startAmbientNoise(selectedNoiseMode);
    posthog.capture("ambient_noise_toggled", { enabled: true });
  }

  function goToNextScene() {
    setActiveIndex((current) => {
      const next = (current + 1) % backgrounds.length;
      const nextScene = backgrounds[next] ?? defaultBackground;

      posthog.capture("scene_changed", {
        source: backgroundSource,
        next_scene: nextScene?.id,
      });

      return next;
    });
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeBackground.id}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${activeBackground.imageUrl})` }}
          />
        </AnimatePresence>
        <div className="hero-gradient-screen absolute inset-0" />
        <div className="hero-film absolute inset-0" />
        <div className="hero-blur-orb absolute top-[14%] left-[6%] h-64 w-64 bg-indigo-500/70" />
        <div className="hero-blur-orb absolute right-[6%] bottom-[22%] h-72 w-72 bg-fuchsia-500/65" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col px-4 pt-4 pb-20 sm:px-6 lg:px-8">
        <header className="mx-auto flex w-full max-w-7xl items-start justify-between gap-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-black/25 px-4 py-2 backdrop-blur-xl">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/16 bg-white/10">
              <Image
                src="/stay-focused-icon.png"
                alt="stayfocused.site icon"
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <div>
              <p className="text-xs tracking-[0.36em] text-white/60 uppercase">
                stayfocused.site
              </p>
              <p className="text-xl font-bold text-white sm:text-2xl">
                Focus Atmosphere
              </p>
            </div>
          </div>

          <p className="hero-quote max-w-[20rem] text-right text-2xl leading-[1.25] sm:text-[2rem]">
            “Quiet momentum today becomes clarity tomorrow.”
          </p>
        </header>

        <section className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <div className="hero-time text-[clamp(5.5rem,17vw,14rem)] leading-none">
              {getClockLabel(now)}
            </div>
            <p className="mt-4 text-xs tracking-[0.32em] text-white/72 uppercase">
              {getDateLabel(now)}
            </p>
          </motion.div>
        </section>
      </div>

      <div className="fixed bottom-4 left-4 z-20 sm:bottom-6 sm:left-6">
        <div className="dock">
          <button
            type="button"
            className="dock-btn"
            onClick={goToNextScene}
            title="Next scene"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={cn("dock-btn", ambientEnabled && "dock-btn-active")}
            onClick={() => {
              void toggleAmbientNoise();
            }}
            title={
              ambientEnabled
                ? `Pause ${selectedNoiseOption.label.toLowerCase()}`
                : `Start ${selectedNoiseOption.label.toLowerCase()}`
            }
          >
            {ambientEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            className="dock-btn"
            onClick={() => setIsControlsOpen(true)}
            title="Open controls"
          >
            <Waves className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="fixed right-4 bottom-4 z-20 sm:right-6 sm:bottom-6">
        <div className="dock">
          <Link href="/" className="dock-btn dock-btn-active" title="Home">
            <Home className="h-4 w-4" />
          </Link>
          <button
            type="button"
            className="dock-btn"
            onClick={() => setIsControlsOpen(true)}
            title="Settings"
          >
            <Settings2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="dock-btn"
            onClick={() => {
              void toggleFullscreen();
            }}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
          <AuthShortcut />
        </div>
      </div>

      <Dialog open={isControlsOpen} onOpenChange={setIsControlsOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] max-w-3xl overflow-y-auto border-white/14 bg-[#0d0d23d8] p-4 text-white backdrop-blur-2xl sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              Scene & sound controls
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Tune the room without leaving the main focus view.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <section className="control-panel">
              <p className="control-eyebrow">Sound</p>
              <h3 className="control-title">Settle the room</h3>
              <p className="mt-2 text-sm leading-6 text-white/72">
                {selectedNoiseOption.helperText}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {AMBIENT_NOISE_OPTIONS.map((option) => (
                  <button
                    key={option.mode}
                    type="button"
                    onClick={() => {
                      void setAmbientNoiseMode(option.mode);
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition",
                      selectedNoiseMode === option.mode
                        ? "border-violet-300/60 bg-violet-500/18 text-white"
                        : "border-white/14 bg-black/10 text-white/72 hover:bg-white/10",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-white/56">
                Switching the mode while sound is active updates the room
                instantly.
              </p>

              <button
                type="button"
                onClick={() => {
                  void toggleAmbientNoise();
                }}
                className={cn(
                  "mt-4 flex w-full items-center justify-between rounded-[1.2rem] border px-4 py-4 text-left transition",
                  ambientEnabled
                    ? "border-violet-300/60 bg-violet-500/18 text-white"
                    : "border-white/10 bg-black/10 text-white/72 hover:bg-white/10",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-white/14 bg-black/10 p-2">
                    {ambientEnabled ? (
                      <Volume2 className="h-5 w-5 text-violet-200" />
                    ) : (
                      <VolumeX className="h-5 w-5 text-white/70" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {ambientEnabled
                        ? `${selectedNoiseOption.label} on`
                        : `${selectedNoiseOption.label} off`}
                    </div>
                    <div className="text-sm text-white/58">
                      Click to {ambientEnabled ? "pause" : "start"} the{" "}
                      {selectedNoiseOption.label.toLowerCase()} layer
                    </div>
                  </div>
                </div>
                <Waves className="h-5 w-5 text-white/58" />
              </button>

              <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-black/10 px-4 py-4">
                <div className="flex items-center gap-2 text-sm tracking-[0.2em] text-white/52 uppercase">
                  <ImageIcon className="h-4 w-4" />
                  Scene library
                </div>
                <p className="mt-3 text-white">
                  {backgroundSource === "convex"
                    ? "Convex background library connected"
                    : "Starter background library active"}
                </p>
                <p className="mt-1 text-sm leading-6 text-white/62">
                  {backgrounds.length} rotating retreats are available for the
                  landing page backdrop.
                </p>
              </div>

              <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-black/10 px-4 py-4">
                <div className="flex items-center gap-2 text-sm tracking-[0.2em] text-white/52 uppercase">
                  <Sparkles className="h-4 w-4" />
                  Auth status
                </div>
                <p className="mt-3 text-white">
                  {services.clerk
                    ? "Clerk authentication is wired into the experience."
                    : "Clerk is optional until you add its environment keys."}
                </p>
                <p className="mt-1 text-sm leading-6 text-white/62">
                  Signed-in routes are already prepared, so enabling member
                  access is mostly configuration now.
                </p>
              </div>
            </section>

            <section className="control-panel">
              <p className="control-eyebrow">Current scene</p>
              <h3 className="control-title">{activeBackground.title}</h3>
              <p className="mt-1 text-sm text-white/66">
                {activeBackground.location}
              </p>
              <p className="mt-4 text-sm leading-6 text-white/72">
                {activeBackground.description}
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full shadow-[0_0_18px_rgba(255,255,255,0.28)]"
                    style={{ backgroundColor: activeBackground.accent }}
                  />
                  <span className="text-sm text-white/62">
                    Image source: {activeBackground.credit}
                  </span>
                </div>
                <Button
                  onClick={goToNextScene}
                  variant="ghost"
                  className="rounded-full border border-white/12 bg-white/8 text-white hover:bg-white/14"
                >
                  Change view
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {showSplash ? (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="hero-blackout absolute inset-0 z-40 flex items-center justify-center px-6 text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-xl"
            >
              <p className="text-xs tracking-[0.4em] text-white/56 uppercase">
                stayfocused.site
              </p>
              <h2 className="mt-4 text-6xl font-bold leading-none text-white sm:text-7xl">
                Your focus retreat
              </h2>
              <p className="mt-5 text-base leading-7 text-white/72 sm:text-lg">
                A clear screen, a living backdrop, and just enough controls to
                stay in deep work.
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function RetreatDashboardWithConvex() {
  const convexBackgrounds = useQuery(backgroundQuery, {});
  const backgrounds =
    convexBackgrounds && convexBackgrounds.length > 0
      ? convexBackgrounds
      : fallbackBackgrounds;

  return (
    <RetreatDashboardContent
      backgrounds={backgrounds}
      backgroundSource={
        convexBackgrounds && convexBackgrounds.length > 0
          ? "convex"
          : "fallback"
      }
    />
  );
}

export function RetreatDashboard() {
  const services = useServiceFlags();

  if (services.convex) {
    return <RetreatDashboardWithConvex />;
  }

  return (
    <RetreatDashboardContent
      backgrounds={fallbackBackgrounds}
      backgroundSource="fallback"
    />
  );
}
