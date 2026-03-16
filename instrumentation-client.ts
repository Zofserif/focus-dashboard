import posthog from "posthog-js";

declare global {
  interface Window {
    __stayfocusedPosthogInitialized__?: boolean;
  }
}

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

if (
  typeof window !== "undefined" &&
  posthogKey &&
  !window.__stayfocusedPosthogInitialized__
) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_pageleave: true,
    capture_pageview: true,
    person_profiles: "identified_only",
  });

  window.__stayfocusedPosthogInitialized__ = true;
}
