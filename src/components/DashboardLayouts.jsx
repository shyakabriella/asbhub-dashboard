import React from "react";
import { Outlet } from "react-router-dom";
import SideBar from "./SideBar";
import Nav from "./Nav";
import Footer from "./Footer";

const SIDEBAR_W = 270; // must match sidebar desktop width

export default function DashboardLayouts() {
  return (
    <div className="min-h-[100dvh] bg-gray-50">
      {/* ✅ IMPORTANT: SideBar must render on mobile too (for toggle button) */}
      <div className="lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:border-r lg:border-white/10"
           style={{ width: SIDEBAR_W }}>
        <SideBar />
      </div>

      {/* ✅ Main content shifts ONLY on desktop */}
      <div className="flex min-h-[100dvh] flex-col lg:ml-[270px]">
        <Nav />

        <main className="flex-1">
          <div className="mx-auto max-w-[1400px] px-3 sm:px-4 py-4 sm:py-5">
            <Outlet />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}