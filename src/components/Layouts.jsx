import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Nav from "./Nav";
import SideBar from "./SideBar";
import Footer from "./Footer";

export default function Layouts() {
  const location = useLocation();

  // ✅ Pages where we don't want Nav/Sidebar/Footer
  const hideLayoutOnPaths = ["/login", "/register"];

  const shouldHideLayout = hideLayoutOnPaths.some(
    (path) =>
      location.pathname === path || location.pathname.startsWith(path + "/")
  );

  if (shouldHideLayout) {
    return <Outlet />;
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      {/* ✅ Desktop fixed sidebar (Tailwind width only) */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-[270px]">
        <SideBar />
      </div>

      {/* ✅ Main content (desktop shifted by sidebar width) */}
      <div className="flex min-h-[100dvh] flex-col lg:ml-[270px]">
        <Nav />

        <main className="flex-1">
          <div className="w-full px-2 py-2 sm:px-3 sm:py-3">
            <Outlet />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}