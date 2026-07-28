"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const ALL_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📋", roles: ["HOTEL_ADMIN", "MANAGER"] },
  { href: "/admin/kitchen", label: "Kitchen", icon: "🍳", roles: ["KITCHEN", "HOTEL_ADMIN", "MANAGER"] },
  { href: "/admin/orders", label: "Orders", icon: "🤵", roles: ["WAITER", "HOTEL_ADMIN", "MANAGER"] },
  { href: "/admin/analytics", label: "Analytics", icon: "📊", roles: ["HOTEL_ADMIN", "MANAGER"] },
  { href: "/admin/customers", label: "Customers", icon: "👥", roles: ["HOTEL_ADMIN", "MANAGER"] },
  { href: "/admin/menu", label: "Menu", icon: "🍴", roles: ["HOTEL_ADMIN"] },
  { href: "/admin/tables", label: "Tables & QR", icon: "📱", roles: ["HOTEL_ADMIN"] },
  { href: "/admin/staff",    label: "Staff",    icon: "👔", roles: ["HOTEL_ADMIN", "MANAGER"] },
  { href: "/admin/settings", label: "Settings", icon: "⚙️", roles: ["HOTEL_ADMIN"] },
];

const ROLE_LABELS: Record<string, string> = {
  HOTEL_ADMIN: "Hotel Admin",
  MANAGER: "Manager",
  WAITER: "Waiter",
  KITCHEN: "Kitchen",
  SUPER_ADMIN: "Super Admin",
};

export default function AdminNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "HOTEL_ADMIN";

  const visibleLinks = ALL_LINKS.filter((l) => l.roles.includes(role));

  return (
    <nav className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <div>
              <span className="font-bold text-lg text-amber-400">
                {session?.user?.name ?? "Admin"}
              </span>
              <span className="text-slate-500 text-xs ml-2">
                {ROLE_LABELS[role] ?? role}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
            onClick={async () => { await signOut({ redirect: false }); window.location.href = "/admin"; }}
            className="flex-shrink-0 text-slate-400 hover:text-white text-sm font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
