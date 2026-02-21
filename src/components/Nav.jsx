import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

function getTitle(pathname) {
  if (pathname.startsWith("/admin")) return "Admin Dashboard";
  if (pathname.startsWith("/manager")) return "Manager Dashboard";
  if (pathname.startsWith("/waiter")) return "Waiter Dashboard";
  return "Dashboard";
}

function getAuthUser() {
  const raw =
    localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function Nav() {
  const { pathname } = useLocation();
  const title = useMemo(() => getTitle(pathname), [pathname]);
  const [user, setUser] = useState(() => getAuthUser());

  const COLORS = {
    purple: "#2F0D34",
    gold: "#BD9F75",
  };

  useEffect(() => {
    const sync = () => setUser(getAuthUser());
    window.addEventListener("storage", sync);
    sync();
    return () => window.removeEventListener("storage", sync);
  }, []);

  const displayName = user?.name || "User";
  const displayRole = user?.role ? String(user.role) : "staff";
  const initials = (displayName?.[0] || "U").toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      {/* ✅ thin brand line */}
      <div
        className="h-[3px]"
        style={{
          background: `linear-gradient(90deg, ${COLORS.purple} 0%, ${COLORS.gold} 100%)`,
        }}
      />

      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-3 sm:px-4 py-3">
        {/* Left */}
        <div className="min-w-0">
          <div className="text-[11px] sm:text-xs text-gray-500">
            Home <span className="opacity-70">/</span> Dashboard
          </div>
          <div className="truncate text-sm sm:text-base font-semibold text-gray-900">
            {title}
          </div>
        </div>

        {/* Search desktop */}
        <div className="hidden md:block flex-1 max-w-xl">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔎
            </span>
            <input
              type="text"
              placeholder="Search here..."
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm
                         outline-none focus:border-[rgba(47,13,52,0.45)] focus:ring-2 focus:ring-[rgba(47,13,52,0.12)]"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-2xl
                       border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition"
            aria-label="Notifications"
            title="Notifications"
          >
            🔔
          </button>

          <button
            type="button"
            className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-2xl
                       border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition"
            aria-label="Messages"
            title="Messages"
          >
            💬
          </button>

          <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-2 py-1.5">
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: "rgba(47,13,52,0.08)",
                color: COLORS.purple,
                border: "1px solid rgba(47,13,52,0.12)",
              }}
            >
              {initials}
            </div>

            <div className="hidden sm:block leading-tight">
              <div className="text-xs font-semibold text-gray-900">
                {displayName}
              </div>
              <div className="text-[11px] text-gray-500">
                {displayRole.charAt(0).toUpperCase() + displayRole.slice(1)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-3 sm:px-4 pb-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔎
          </span>
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm
                       outline-none focus:border-[rgba(47,13,52,0.45)] focus:ring-2 focus:ring-[rgba(47,13,52,0.12)]"
          />
        </div>
      </div>
    </header>
  );
}