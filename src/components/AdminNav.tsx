"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navLinks = [
  { href: "/admin/dashboard", label: "Orders", icon: "📋" },
  { href: "/admin/menu", label: "Menu", icon: "🍴" },
  { href: "/admin/tables", label: "Tables & QR", icon: "📱" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="font-bold text-lg text-amber-400">Hotel Admin</span>
          </div>

          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? "bg-amber-500 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/admin" })}
            className="text-slate-400 hover:text-white text-sm font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
