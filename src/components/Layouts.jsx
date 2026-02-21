import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Nav from "./Nav";
import SideBar from "./SideBar";
import Footer from "./Footer";

export default function Layouts() {
  const location = useLocation();

  // ✅ Pages where we don't want Nav/Sidebar/Footer
  const hideLayoutOnPaths = ["/login", "/register"];

  // ✅ Match exact path OR sub-paths (optional but helpful)
  const shouldHideLayout = hideLayoutOnPaths.some(
    (path) =>
      location.pathname === path || location.pathname.startsWith(path + "/")
  );

  if (shouldHideLayout) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />

      <div className="flex flex-1">
        <SideBar />

        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
}