import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

// ✅ Sections
import HomeSectionOne from "./HomeSection/HomeSectionOne";
import HomeAbout from "./HomeSection/HomeAbout";
import HomeStory from "./HomeSection/HomeStory";
import HomeHotelTitle from "./HomeSection/HomeHotelTitle";
import HomeHotelView from "./HomeSection/HomeHotelView";
import HomeHotelTeam from "./HomeSection/HomeHotelTeam";
import HomeHotelRoom from "./HomeSection/HomeHotelRoom";

export default function PropertyPage() {
  const COLORS = useMemo(
    () => ({
      purple: "#2F0D34",
      gold: "#BD9F75",
    }),
    []
  );

  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ Read role safely (same style as sidebar)
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

  // ✅ All tabs
  const ALL_HOME_SECTIONS = useMemo(
    () => [
      { id: "home-section-one", label: "🏠 Home Section One", component: <HomeSectionOne /> },
      { id: "home-about", label: "ℹ️ Home About", component: <HomeAbout /> },
      { id: "home-story", label: "📖 Home Story", component: <HomeStory /> },
      { id: "home-hotel-title", label: "🏨 Home Hotel Title", component: <HomeHotelTitle /> },
      { id: "home-hotel-view", label: "🖼️ Home Hotel View", component: <HomeHotelView /> },
      { id: "home-hotel-team", label: "👥 Home Hotel Team", component: <HomeHotelTeam /> },
      { id: "home-hotel-room", label: "🛏️ Home Hotel Room", component: <HomeHotelRoom /> },
    ],
    []
  );

  // ✅ Manager sees only Home Hotel Room
  const HOME_SECTIONS = useMemo(() => {
    if (role === "manager") {
      return ALL_HOME_SECTIONS.filter((s) => s.id === "home-hotel-room");
    }
    return ALL_HOME_SECTIONS;
  }, [ALL_HOME_SECTIONS, role]);

  // ✅ default tab (safe fallback)
  const defaultTab = HOME_SECTIONS[0]?.id || "home-hotel-room";

  const [activeTab, setActiveTab] = useState(() => {
    const tabFromUrl = searchParams.get("tab");
    const isAllowed = HOME_SECTIONS.some((s) => s.id === tabFromUrl);
    return isAllowed ? tabFromUrl : defaultTab;
  });

  // ✅ sync tab with URL + role permissions
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    const isAllowed = HOME_SECTIONS.some((s) => s.id === tabFromUrl);

    if (tabFromUrl && isAllowed) {
      setActiveTab(tabFromUrl);
      return;
    }

    // If URL tab is missing/invalid (or manager tries another tab), force default
    setActiveTab(defaultTab);

    if (tabFromUrl !== defaultTab) {
      setSearchParams({ tab: defaultTab }, { replace: true });
    }
  }, [searchParams, HOME_SECTIONS, defaultTab, setSearchParams]);

  const openTab = (id) => {
    // extra safety
    const isAllowed = HOME_SECTIONS.some((s) => s.id === id);
    if (!isAllowed) return;

    setActiveTab(id);
    setSearchParams({ tab: id });
  };

  const current = HOME_SECTIONS.find((x) => x.id === activeTab) || HOME_SECTIONS[0];

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏨 Property CMS</h1>
          <p className="text-sm text-gray-600">
            Manage website content section by section (Home, Hotel, Rooms, etc).
          </p>
        </div>

        <div
          className="h-2 w-full rounded-full sm:w-[240px]"
          style={{
            background: `linear-gradient(90deg, ${COLORS.purple} 0%, ${COLORS.gold} 100%)`,
          }}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* LEFT SIDEBAR */}
        <div className="rounded-2xl border border-gray-200 bg-white lg:col-span-1">
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="font-semibold text-gray-900">📌 Home Sections</div>
            <div className="text-xs text-gray-500">Choose what to edit</div>
          </div>

          <div className="flex flex-col gap-2 p-2">
            {HOME_SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => openTab(s.id)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                  activeTab === s.id
                    ? "bg-[rgba(189,159,117,0.16)] text-gray-900"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="rounded-2xl border border-gray-200 bg-white lg:col-span-3">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="font-semibold text-gray-900">{current?.label}</div>
            <div className="text-xs text-gray-500">Edit and save this section</div>
          </div>

          <div className="p-4">{current?.component}</div>
        </div>
      </div>
    </div>
  );
}