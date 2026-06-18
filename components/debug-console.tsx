"use client";

import { useEffect } from "react";

// On-screen mobile dev console (Eruda). Loads ONLY when ?debug=1 is in the URL,
// so it's invisible to normal customers. Works inside in-app browsers
// (Facebook/Instagram WebViews) where USB remote debugging can't reach.
//
// Usage on a phone:
//   shapparels.pk/?debug=1   -> enables it (persists until you turn it off)
//   shapparels.pk/?debug=0   -> disables it
// Once enabled, a floating button appears; tap it for Console / Network /
// Elements / Performance panels you can screenshot.
export function DebugConsole() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("debug");

    // Let the URL flip the persisted setting on/off.
    if (flag === "1") localStorage.setItem("eruda", "1");
    if (flag === "0") localStorage.removeItem("eruda");

    if (localStorage.getItem("eruda") !== "1") return;

    // Avoid double-loading on client navigations.
    if ((window as unknown as { eruda?: unknown }).eruda) return;

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/eruda";
    script.onload = () => {
      (window as unknown as { eruda: { init: () => void } }).eruda.init();
    };
    document.body.appendChild(script);
  }, []);

  return null;
}
