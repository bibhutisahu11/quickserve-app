"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const MESSAGES = [
  "Hope you have a fantastic day ahead!",
  "Ready to serve amazing food today? Let's go! 🚀",
  "Your restaurant awaits — let's make today great!",
  "Good things are coming. Let's get started!",
  "Have a productive and smooth shift today!",
  "Wishing you a busy (in the best way!) day.",
];

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { text: "Good Morning",  emoji: "☀️" };
  if (h >= 12 && h < 17) return { text: "Good Afternoon", emoji: "🌤️" };
  return                         { text: "Good Evening",  emoji: "🌙" };
}

export default function WelcomeToast() {
  const { data: session } = useSession();
  const [visible, setVisible] = useState(false);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    const key = `welcome_shown_${session.user.email}_${new Date().toDateString()}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    // Fetch org name if available
    fetch("/api/admin/org-settings")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.name) setOrgName(data.name); })
      .catch(() => {});

    const t = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(t);
  }, [session]);

  function dismiss() {
    setExiting(true);
    setTimeout(() => { setVisible(false); setDismissed(true); }, 300);
  }

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(dismiss, 6000);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible || dismissed || !session?.user) return null;

  const { text: greetText, emoji } = getGreeting();
  const name = session.user.name?.split(" ")[0] ?? "there";
  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  return (
    <div
      className={`fixed top-20 right-4 z-[200] w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 ${
        exiting ? "opacity-0 translate-x-8" : "opacity-100 translate-x-0"
      }`}
    >
      {/* Progress bar */}
      <div className="h-1 bg-amber-500 animate-[shrink_6s_linear_forwards]" style={{ transformOrigin: "left" }} />

      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="text-3xl flex-shrink-0">{emoji}</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-base leading-snug">
              {greetText}, {name}! 👋
            </p>
            {orgName && (
              <p className="text-amber-600 font-semibold text-sm mt-0.5">
                Welcome to {orgName}
              </p>
            )}
            <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">{msg}</p>
          </div>
          <button onClick={dismiss} className="text-slate-300 hover:text-slate-500 flex-shrink-0 text-xl leading-none mt-0.5">×</button>
        </div>
      </div>
    </div>
  );
}
