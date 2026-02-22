import React from "react";
import { Outlet } from "react-router-dom";
import SideBar from "./SideBar";
import Nav from "./Nav";
import Footer from "./Footer";

const SIDEBAR_W = 270; // must match SideBar desktop width

export default function DashboardLayouts() {
  return (
    <div className="min-h-[100dvh] bg-gray-50 overflow-x-hidden">
      {/* ✅ Keep SideBar mounted (important for mobile toggle button)
          ✅ Apply fixed width ONLY on desktop */}
      <div
        className="lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:border-r lg:border-gray-200"
        style={{ width: window.innerWidth >= 1024 ? SIDEBAR_W : "auto" }}
      >
        <SideBar />
      </div>

      {/* ✅ Main area shifts only on desktop */}
      <div
        className="flex min-h-[100dvh] min-w-0 flex-col"
        style={{ marginLeft: window.innerWidth >= 1024 ? SIDEBAR_W : 0 }}
      >
        <Nav />

        {/* ✅ min-w-0 helps prevent flex overflow issues */}
        <main className="flex-1 min-w-0">
          <div className="mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-4 sm:py-5">
            <Outlet />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}