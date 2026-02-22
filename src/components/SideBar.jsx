// src/components/SideBar.jsx

import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

export default function SideBar() {
  const [open, setOpen] = useState(false);
  const [soonMsg, setSoonMsg] = useState("");
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(false);
    setSoonMsg("");
  }, [pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const COLORS = {
    purple: "#2F0D34",
    gold: "#BD9F75",
  };

  // ✅ Read role safely
  const role = useMemo(() => {
    const raw =
      localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");

    if (!raw) return "admin";

    try {
      const user = JSON.parse(raw);
      return String(user?.role || "admin").toLowerCase();
    } catch {
      return "admin";
    }
  }, []);

  const dashboardPath = useMemo(() => {
    if (role === "manager") return "/manager";
    if (role === "waiters" || role === "waiter") return "/waiter";
    return "/admin";
  }, [role]);

  // ✅ Property menu removed
  // ✅ Hotel Room is the live menu linked to pages/PropertyPage/index.jsx route
  const menuAll = useMemo(
    () => [
      { to: dashboardPath, end: true, icon: "🏠", label: "Dashboard", comingSoon: false },
      { to: "/admin/hotel-room", icon: "🛏️", label: "Hotel Room", comingSoon: false },
      { to: "/admin/support", icon: "🎧", label: "Support & Msg", comingSoon: false },
      { to: "/admin/settings", icon: "⚙️", label: "Settings", comingSoon: false },

      // Coming soon menus
      { to: "/admin/reports", icon: "📊", label: "Reports", comingSoon: true },
      { to: "/admin/clients", icon: "👥", label: "Clients", comingSoon: true },
      { to: "/admin/users/create", icon: "👤", label: "Users", comingSoon: true },
      { to: "/admin/approvals", icon: "✅", label: "Approvals", comingSoon: true },
      { to: "/admin/finance", icon: "💳", label: "Finance", comingSoon: true },
      { to: "/admin/invoices", icon: "🧾", label: "Invoices", comingSoon: true },
    ],
    [dashboardPath]
  );

  const menu = useMemo(() => {
    // ✅ Waiter: dashboard only
    if (role === "waiters" || role === "waiter") {
      return menuAll.filter((m) => m.to === dashboardPath);
    }

    // ✅ Manager: dashboard + Hotel Room + Support + Settings
    if (role === "manager") {
      const managerAllowed = new Set([
        dashboardPath,
        "/admin/hotel-room",
        "/admin/support",
        "/admin/settings",
      ]);

      return menuAll.filter((m) => managerAllowed.has(m.to));
    }

    // ✅ Admin: full menu
    return menuAll;
  }, [menuAll, role, dashboardPath]);

  const itemBase =
    "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(47,13,52,0.25)]";

  const itemInactive = "text-gray-700 hover:bg-gray-50 hover:text-gray-900";
  const itemActive = "bg-[rgba(189,159,117,0.14)] text-gray-900 font-semibold";
  const itemSoon = "text-gray-500 hover:bg-gray-50 hover:text-gray-800";

  const isPathActive = (item) => {
    if (item.end) return pathname === item.to;
    return pathname === item.to || pathname.startsWith(`${item.to}/`);
  };

  const handleComingSoon = (label) => {
    setSoonMsg(`${label} is coming soon 🚧`);
    setTimeout(() => setSoonMsg(""), 2500);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("token");
    localStorage.removeItem("remember_auth");

    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("remember_auth");

    setOpen(false);
    navigate("/login", { replace: true });
  };

  const SidebarInner = (
    <aside className="flex h-full w-[270px] flex-col border-r border-gray-200 bg-white">
      <div
        className="h-[3px]"
        style={{
          background: `linear-gradient(90deg, ${COLORS.purple} 0%, ${COLORS.gold} 100%)`,
        }}
      />

      {/* ✅ Single logo header */}
      <div className="border-b border-gray-100 px-4 pb-4 pt-5">
        <div className="flex items-center justify-center gap-3">
          <img
            src="/logo.png"
            alt="Olympic Hotel"
            className="h-11 w-11 rounded-xl border border-gray-100 bg-gray-50 object-contain p-1"
          />
          <div className="min-w-0 leading-tight text-center">
            <div className="truncate text-[13px] font-bold text-gray-900">
              Olympic Hotel
            </div>
            <div className="text-[10px] text-gray-500">Portal</div>
          </div>
        </div>

        <div className="mt-3 text-center text-[11px] text-gray-500">
          Console • <span className="font-semibold capitalize">{role}</span>
        </div>

        {soonMsg ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-center text-[11px] text-amber-700">
            {soonMsg}
          </div>
        ) : null}
      </div>

      <nav className="flex flex-col gap-1 overflow-y-auto px-3 py-4">
        {menu.map((m) => {
          const active = isPathActive(m);

          if (m.comingSoon) {
            return (
              <button
                key={m.to}
                type="button"
                onClick={() => handleComingSoon(m.label)}
                className={`${itemBase} ${itemSoon} text-left`}
                title={`${m.label} - Coming soon`}
              >
                <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-gray-300 opacity-0 group-hover:opacity-40" />
                <span className="w-6 text-center text-base">{m.icon}</span>
                <span className="flex-1">{m.label}</span>
                <span className="text-[10px] font-medium text-amber-700">Soon</span>
              </button>
            );
          }

          return (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              className={`${itemBase} ${active ? itemActive : itemInactive}`}
            >
              <span
                className={`absolute bottom-2 left-0 top-2 w-[3px] rounded-full ${
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                }`}
                style={{ backgroundColor: COLORS.gold }}
              />
              <span className="w-6 text-center text-base">{m.icon}</span>
              <span className="flex-1">{m.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-gray-100 px-3 pb-4 pt-3">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
        >
          🚪 Logout
        </button>

        <div className="mt-3 text-center text-[10px] text-gray-400">
          Olympic Hotel • Portal
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">{SidebarInner}</div>

      {/* Mobile button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-3 top-[10px] z-[60] inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-lg lg:hidden"
        aria-label="Open sidebar"
        title="Menu"
      >
        ☰
      </button>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 transition lg:hidden ${
          open ? "visible" : "invisible"
        }`}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`absolute left-0 top-0 h-full w-[84vw] max-w-[340px] bg-white shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-3">
            <div className="text-sm font-semibold text-gray-900">Menu</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-10 w-10 rounded-2xl border border-gray-200 bg-white"
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>

          {SidebarInner}
        </div>
      </div>
    </>
  );
}