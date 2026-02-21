import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

export default function SideBar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const COLORS = {
    purple: "#2F0D34",
    gold: "#BD9F75",
  };

  // ✅ Get role from stored user info
  const role = useMemo(() => {
    const raw =
      localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");

    if (!raw) return "admin";

    try {
      const u = JSON.parse(raw);
      return (u?.role || "admin").toLowerCase();
    } catch {
      return "admin";
    }
  }, []);

  // ✅ Dashboard route depends on role
  const dashboardPath = useMemo(() => {
    if (role === "manager") return "/manager";
    if (role === "waiters" || role === "waiter") return "/waiter";
    return "/admin"; // default admin
  }, [role]);

  // ✅ Full menu (we set dashboard to dynamic route)
  const menuAll = useMemo(
    () => [
      { to: dashboardPath, end: true, icon: "🏠", label: "Dashboard" },
      { to: "/admin/reports", icon: "📊", label: "Reports" },
      { to: "/admin/property", icon: "🏨", label: "Property" },
      { to: "/admin/clients", icon: "👥", label: "Clients" },
      { to: "/admin/users/create", icon: "👤", label: "Users" },
      { to: "/admin/approvals", icon: "✅", label: "Approvals" },
      { to: "/admin/finance", icon: "💳", label: "Finance" },
      { to: "/admin/invoices", icon: "🧾", label: "Invoices" },
      { to: "/admin/support", icon: "🎧", label: "Support & Msg" },
      { to: "/admin/settings", icon: "⚙️", label: "Settings" },
    ],
    [dashboardPath]
  );

  // ✅ Permissions
  const menu = useMemo(() => {
    if (role === "waiters" || role === "waiter") {
      // waiter sees only dashboard (dynamic)
      return menuAll.filter((m) => m.to === dashboardPath);
    }

    if (role === "manager") {
      // manager can see dashboard + most admin pages (adjust as you want)
      return menuAll.filter(
        (m) => !["/admin/settings", "/admin/support"].includes(m.to)
      );
    }

    return menuAll; // admin sees all
  }, [menuAll, role, dashboardPath]);

  const itemBase =
    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(47,13,52,0.25)]";

  const itemInactive = "text-gray-700 hover:bg-gray-50 hover:text-gray-900";
  const itemActive = "bg-[rgba(189,159,117,0.14)] text-gray-900 font-semibold";

  // ✅ Logout handler
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("token");

    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_user");
    sessionStorage.removeItem("token");

    setOpen(false);
    navigate("/login", { replace: true });
  };

  const SidebarInner = (
    <aside className="h-full w-[270px] bg-white flex flex-col border-r border-gray-200">
      <div
        className="h-[3px]"
        style={{
          background: `linear-gradient(90deg, ${COLORS.purple} 0%, ${COLORS.gold} 100%)`,
        }}
      />

      <div className="px-4 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/ash.png"
              alt="ASHBHUB"
              className="h-10 w-10 rounded-xl bg-gray-50 p-1 object-contain border border-gray-100"
            />
            <div className="leading-tight min-w-0">
              <div className="text-[12px] font-bold text-gray-900 truncate">
                ASHBHUB
              </div>
              <div className="text-[10px] text-gray-500">Partner</div>
            </div>
          </div>

          <div className="h-9 w-px bg-gray-200" />

          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/royal.png"
              alt="ROYALCROWN"
              className="h-10 w-10 rounded-xl bg-gray-50 p-1 object-contain border border-gray-100"
            />
            <div className="leading-tight min-w-0">
              <div className="text-[12px] font-bold text-gray-900 truncate">
                ROYALCROWN
              </div>
              <div className="text-[10px] text-gray-500">Hotel</div>
            </div>
          </div>
        </div>

        <div className="mt-3 text-center text-[11px] text-gray-500">
          Console • <span className="font-semibold">{role}</span>
        </div>
      </div>

      {/* Menu */}
      <nav className="px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {menu.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            end={m.end}
            className={({ isActive }) =>
              `${itemBase} ${isActive ? itemActive : itemInactive}`
            }
          >
            <span
              className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full ${
                pathname === m.to ||
                (m.end && (pathname === "/admin" || pathname === "/manager" || pathname === "/waiter"))
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-40"
              }`}
              style={{ backgroundColor: COLORS.gold }}
            />
            <span className="text-base w-6 text-center">{m.icon}</span>
            <span className="flex-1">{m.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="mt-auto px-3 pb-4 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold
                     border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 transition"
        >
          🚪 Logout
        </button>

        <div className="mt-3 text-center text-[10px] text-gray-400">
          Royal Crown • Portal
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">{SidebarInner}</div>

      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed left-3 top-[10px] z-[60] inline-flex h-11 w-11 items-center justify-center
                   rounded-2xl border border-gray-200 bg-white shadow-lg"
        aria-label="Open sidebar"
        title="Menu"
      >
        ☰
      </button>

      {/* Mobile overlay + drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition ${
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
          className={`absolute left-0 top-0 h-full w-[84vw] max-w-[340px]
                      bg-white shadow-2xl transition-transform duration-300
                      ${open ? "translate-x-0" : "-translate-x-full"}`}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100">
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