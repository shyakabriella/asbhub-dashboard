import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Main from "../pages/Main";
import DashboardLayouts from "../components/DashboardLayouts";

import AdminIndex from "../pages/admin/AdminIndex";
import AdminUsersCreate from "../pages/admin/AdminUsersCreate";
import ManagerIndex from "../pages/manager/ManagerIndex";
import WaiterIndex from "../pages/waiters/WaiterIndex";

import Property from "../pages/PropertyPage/Property";
import PropertyInfo from "../pages/PropertyPage/PropertyInfo";
import PropertyRoomsPage from "../pages/PropertyPage"; // ✅ loads pages/PropertyPage/index.jsx

// ✅ Simple placeholder for pages not built yet
function ComingSoonPage({ title = "Page" }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">
        This page is coming soon 🚧
      </p>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* ✅ Login routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Main />} />

      {/* ✅ Admin */}
      <Route path="/admin" element={<DashboardLayouts />}>
        <Route index element={<AdminIndex />} />
        <Route path="users/create" element={<AdminUsersCreate />} />

        {/* ✅ Property pages (kept if you still use them somewhere) */}
        <Route path="property" element={<Property />} />
        <Route path="property/:id" element={<PropertyInfo />} />

        {/* ✅ NEW: Hotel Room menu -> pages/PropertyPage/index.jsx */}
        <Route path="hotel-room" element={<PropertyRoomsPage />} />

        {/* ✅ Optional old path alias (keep for backward compatibility) */}
        <Route path="property/rooms" element={<PropertyRoomsPage />} />

        {/* ✅ Optional placeholders so sidebar links don't break */}
        <Route path="support" element={<ComingSoonPage title="Support & Msg" />} />
        <Route path="settings" element={<ComingSoonPage title="Settings" />} />
      </Route>

      {/* ✅ Manager */}
      <Route path="/manager" element={<DashboardLayouts />}>
        <Route index element={<ManagerIndex />} />

        {/* Optional manager aliases (useful if later you change sidebar paths) */}
        <Route path="hotel-room" element={<PropertyRoomsPage />} />
        <Route path="support" element={<ComingSoonPage title="Support & Msg" />} />
        <Route path="settings" element={<ComingSoonPage title="Settings" />} />
      </Route>

      {/* ✅ Waiter */}
      <Route path="/waiter" element={<DashboardLayouts />}>
        <Route index element={<WaiterIndex />} />
      </Route>

      {/* ✅ Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}