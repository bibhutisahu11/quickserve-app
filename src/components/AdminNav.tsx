"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const ALL_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📋", roles: ["HOTEL_ADMIN", "MANAGER"] },
  { href: "/admin/kitchen", label: "Kitchen", icon: "🍳", roles: ["KITCHEN", "HOTEL_ADMIN", "MANAGER"] },
  { href: "/admin/orders", label: "Orders", icon: "🤵", roles: ["WAITER", "HOTEL_ADMIN", "MANAGER"] },
  { href: "/admin/analytics", label: "Analytics", icon: "📊", roles: ["HOTEL_ADMIN", "MANAGER"] },
  { href: "/admin/customers", label: "Customers", icon: "👥", roles: ["HOTEL_ADMIN", "MANAGER"] },
  { href: "/admin/menu", label: "Menu", icon: "🍴", roles: ["HOTEL_ADMIN"] },
  { href: "/admin/tables", label: "Tables & QR", icon: "📱", roles: ["HOTEL_ADMIN"] },
  { href: "/admin/staff",    label: "Staff",    icon: "👔", roles: ["HOTEL_ADMIN", "MANAGER"] },
  { href: "/admin/inventory", label: "Inventory", icon: "📦", roles: ["HOTEL_ADMIN", "MANAGER"] },
  { href: "/admin/expenses",  label: "Expenses",  icon: "💰", roles: ["HOTEL_ADMIN", "MANAGER"] },
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
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    const cached = session.user.orgName;
    if (cached) { setOrgName(cached); return; }
    fetch("/api/admin/org-settings")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.name) setOrgName(d.name); })
      .catch(() => {});
  }, [session?.user?.email]);

  const visibleLinks = ALL_LINKS.filter((l) => l.roles.includes(role));

  return (
    <nav className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-amber-400 tracking-tight">QS</span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-amber-400 leading-tight">
                  {session?.user?.name ?? "Admin"}
                </span>
                {orgName && (
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-medium leading-tight">
                    {orgName}
                  </span>
                )}
              </div>
              <span className="text-slate-500 text-xs">
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
