"use client";

import { useEffect, useState } from "react";

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const syncState = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    syncState();
    document.addEventListener("fullscreenchange", syncState);

    return () => {
      document.removeEventListener("fullscreenchange", syncState);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (typeof document === "undefined") {
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Ignore browser-specific fullscreen errors.
    }
  };

  return {
    isFullscreen,
    toggleFullscreen,
  };
}
