"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/superadmin/dashboard", label: "Organizations", icon: "🏢" },
];

export default function SuperAdminNav() {
  const pathname = usePathname();
  return (
    <nav className="bg-slate-900 border-b border-slate-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <span className="font-bold text-lg text-violet-400">Super Admin</span>
              <span className="text-slate-500 text-xs ml-2">Platform Control</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? "bg-violet-600 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          <button
            onClick={async () => { await signOut({ redirect: false }); window.location.href = "/admin"; }}
            className="text-slate-400 hover:text-white text-sm font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
