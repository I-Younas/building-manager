"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui";

const IDLE_LIMIT_MS = 3 * 60 * 1000;
const WARNING_SECONDS = 30;
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;

export type IdleSessionDictionary = {
  title: string;
  body: string;
  countdown: string;
  stayButton: string;
};

export function IdleSessionMonitor({ dict }: { dict: IdleSessionDictionary }) {
  const [warningVisible, setWarningVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS);
  const lastActivityRef = useRef(Date.now());
  const warningVisibleRef = useRef(false);
  const secondsLeftRef = useRef(WARNING_SECONDS);

  const stayActive = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningVisibleRef.current = false;
    secondsLeftRef.current = WARNING_SECONDS;
    setWarningVisible(false);
    setSecondsLeft(WARNING_SECONDS);
  }, []);

  useEffect(() => {
    function handleActivity() {
      if (warningVisibleRef.current) return;
      lastActivityRef.current = Date.now();
    }

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));

    const interval = setInterval(() => {
      if (!warningVisibleRef.current) {
        if (Date.now() - lastActivityRef.current >= IDLE_LIMIT_MS) {
          warningVisibleRef.current = true;
          secondsLeftRef.current = WARNING_SECONDS;
          setWarningVisible(true);
          setSecondsLeft(WARNING_SECONDS);
        }
        return;
      }

      secondsLeftRef.current -= 1;
      if (secondsLeftRef.current <= 0) {
        logout();
        return;
      }
      setSecondsLeft(secondsLeftRef.current);
    }, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity));
      clearInterval(interval);
    };
  }, []);

  if (!warningVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div role="alertdialog" aria-modal="true" className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">{dict.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{dict.body}</p>
        <p className="mt-3 text-sm font-medium text-slate-900">
          {dict.countdown.replace("{seconds}", String(secondsLeft))}
        </p>
        <Button type="button" onClick={stayActive} className="mt-5 w-full">
          {dict.stayButton}
        </Button>
      </div>
    </div>
  );
}
