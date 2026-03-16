"use client";

import { ArrowLeft, Home, LogIn, Maximize2, Minimize2, Settings2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { useFullscreen } from "~/lib/use-fullscreen";
import { cn } from "~/lib/utils";

export function AuthShell({
  title,
  description,
  children,
  alternateHref,
  alternateLabel,
}: {
  title: string;
  description: string;
  children: ReactNode;
  alternateHref: string;
  alternateLabel: string;
}) {
  const pathname = usePathname();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80)",
        }}
      />
      <div className="hero-gradient-screen absolute inset-0" />
      <div className="hero-film absolute inset-0" />
      <div className="hero-blur-orb absolute top-[18%] left-[7%] h-64 w-64 bg-indigo-500/70" />
      <div className="hero-blur-orb absolute right-[8%] bottom-[22%] h-72 w-72 bg-fuchsia-500/65" />

      <div className="relative z-10 flex min-h-screen flex-col px-4 pt-4 pb-20 sm:px-6 lg:px-8">
        <header className="mx-auto flex w-full max-w-6xl items-start justify-between gap-4">
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
                Member access
              </p>
            </div>
          </div>

          <p className="hero-quote max-w-[20rem] text-right text-2xl leading-[1.25] sm:text-[2rem]">
            “Stay focused now so tomorrow feels lighter.”
          </p>
        </header>

        <section className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/16 bg-black/35 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8">
            <p className="text-xs tracking-[0.34em] text-white/58 uppercase">
              stayfocused.site
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/72 sm:text-base">
              {description}
            </p>

            <div className="mt-7">{children}</div>

            <p className="mt-6 text-sm text-white/62">
              {alternateLabel}{" "}
              <Link
                href={alternateHref}
                className="text-violet-200 transition hover:text-white"
              >
                Continue here.
              </Link>
            </p>
          </div>
        </section>
      </div>

      <div className="fixed right-4 bottom-4 z-20 sm:right-6 sm:bottom-6">
        <div className="dock">
          <Link
            href="/"
            className={cn("dock-btn", pathname === "/" && "dock-btn-active")}
            title="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
          <button
            type="button"
            className="dock-btn"
            onClick={() => setIsSettingsOpen(true)}
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
          <Link href={alternateHref} className="dock-btn" title={alternateLabel}>
            {alternateHref.includes("sign-in") ? (
              <LogIn className="h-4 w-4" />
            ) : (
              <ArrowLeft className="h-4 w-4" />
            )}
          </Link>
        </div>
      </div>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md border-white/14 bg-[#0d0d23d8] text-white backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              Quick controls
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Use the dock to move between pages, enter fullscreen, and switch
              auth routes.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-3 text-sm text-white/72">
            <p className="rounded-xl border border-white/10 bg-black/10 px-3 py-3">
              The home icon takes you back to the main focus dashboard.
            </p>
            <p className="rounded-xl border border-white/10 bg-black/10 px-3 py-3">
              Fullscreen removes distractions while you sign in or sign up.
            </p>
            <p className="rounded-xl border border-white/10 bg-black/10 px-3 py-3">
              The last icon switches between sign-in and sign-up.
            </p>
            <Button
              asChild
              className="mt-2 w-full rounded-full bg-white text-slate-900 hover:bg-white/92"
            >
              <Link href="/">Back to dashboard</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
