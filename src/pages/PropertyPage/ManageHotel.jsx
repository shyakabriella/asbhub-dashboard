import React, { memo, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

function safeText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function uniqueStrings(arr) {
  return [...new Set((arr || []).filter(Boolean))];
}

function buildImageCandidates(url, apiBaseUrl) {
  const value = safeText(url, "").trim();
  if (!value) return [];

  if (/^(https?:|data:|blob:)/i.test(value)) return [value];

  const base = String(apiBaseUrl || "").replace(/\/+$/, "");
  const clean = value.replace(/^\/+/, "");

  const candidates = [`${base}/${clean}`];

  if (clean.startsWith("public/")) {
    candidates.push(`${base}/storage/${clean.replace(/^public\//, "")}`);
  }

  if (!clean.startsWith("storage/")) {
    candidates.push(`${base}/storage/${clean}`);
  }

  return uniqueStrings(candidates);
}

function badgeClass(stage) {
  switch (stage) {
    case "Live":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Onboarding":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Draft":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "Inactive":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "Contacted":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Documents Pending":
      return "bg-violet-100 text-violet-700 border-violet-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function PropertyMiniLogo({ logo, propertyName, apiBaseUrl }) {
  const candidates = useMemo(
    () => buildImageCandidates(logo, apiBaseUrl),
    [logo, apiBaseUrl]
  );

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [logo, apiBaseUrl]);

  const currentSrc = idx >= 0 && idx < candidates.length ? candidates[idx] : "";

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
      {currentSrc ? (
        <img
          src={currentSrc}
          alt={`${propertyName} logo`}
          className="h-full w-full object-contain"
          onError={() => {
            setIdx((prev) => {
              const next = prev + 1;
              return next < candidates.length ? next : -1;
            });
          }}
        />
      ) : (
        <span className="text-lg">🏨</span>
      )}
    </div>
  );
}

function MenuItem({ label, icon, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg border px-2 py-1.5 text-left text-xs transition ${
        active
          ? "border-purple-200 bg-purple-50 text-purple-700"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="shrink-0">{icon}</span>
        <span className="truncate font-medium">{label}</span>
      </span>
      {active ? <span className="ml-2 text-[10px]">●</span> : null}
    </button>
  );
}

function ManageHotel({
  property,
  navigate,
  apiBaseUrl,
  onMenuClick,
  activeKey,
}) {
  const location = useLocation();
  const propertyId = property?.id;
  const currentPath = location?.pathname || "";

  // ✅ Rooms now goes to /admin/property/rooms (which should render pages/PropertyPage/index.jsx)
  const menuItems = [
    {
      key: "overview",
      label: "Overview",
      icon: "🏨",
      path: propertyId ? `/admin/property/${propertyId}` : null,
    },
    {
      key: "rooms",
      label: "Rooms",
      icon: "🛏️",
      path: "/admin/property/rooms",
    },
    { key: "bookings", label: "Bookings", icon: "📅", path: null },
    { key: "rates", label: "Rates & Pricing", icon: "💳", path: null },
    { key: "ota", label: "OTA Channels", icon: "🌐", path: null },
    { key: "seo", label: "SEO & Website", icon: "🚀", path: null },
    { key: "documents", label: "Documents", icon: "📁", path: null },
    { key: "reports", label: "Reports", icon: "📊", path: null },
    { key: "settings", label: "Settings", icon: "⚙️", path: null },
    { key: "support", label: "Support", icon: "🛟", path: null },
  ];

  const resolvedActiveKey = useMemo(() => {
    if (activeKey) return activeKey;

    // ✅ check static route first
    if (currentPath === "/admin/property/rooms") return "rooms";

    // ✅ details route (/admin/property/:id) but NOT /rooms
    if (/^\/admin\/property\/[^/]+$/.test(currentPath)) return "overview";

    return "overview";
  }, [activeKey, currentPath]);

  const handleMenuClick = (item) => {
    onMenuClick?.(item.key, item);

    if (!item.path) return;

    navigate(item.path, {
      state: property ? { property } : undefined,
    });
  };

  return (
    <div className="space-y-2">
      {/* Main menu card */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="mb-2">
          <p className="text-xs font-semibold text-gray-900">Manage Hotel</p>
          <p className="mt-0.5 text-[11px] text-gray-500">
            Quick actions and sections
          </p>
        </div>

        {/* 2-column menu */}
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {menuItems.map((item) => (
            <MenuItem
              key={item.key}
              label={item.label}
              icon={item.icon}
              active={resolvedActiveKey === item.key}
              onClick={() => handleMenuClick(item)}
            />
          ))}
        </div>
      </div>

      {/* Quick hotel card */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex items-start gap-2">
          <PropertyMiniLogo
            logo={property?.logo}
            propertyName={safeText(property?.propertyName, "Hotel")}
            apiBaseUrl={apiBaseUrl}
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {safeText(property?.propertyName, "Hotel")}
            </p>
            <p className="truncate text-xs text-gray-500">
              {safeText(property?.city, "-")}, {safeText(property?.country, "-")}
            </p>

            <div className="mt-1 flex flex-wrap gap-1">
              <span
                className={`inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${badgeClass(
                  safeText(property?.onboardingStage, "Draft")
                )}`}
              >
                {safeText(property?.onboardingStage, "Draft")}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/property")}
            className="rounded-md bg-purple-900 px-2 py-1.5 text-xs font-semibold text-white hover:opacity-95"
          >
            All Hotels
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(ManageHotel);