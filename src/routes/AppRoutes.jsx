import { Routes, Route, Navigate } from "react-router-dom";

import Main from "../pages/Main"; // ✅ fixed case (Linux is case-sensitive)
import DashboardLayouts from "../components/DashboardLayouts";

import AdminIndex from "../pages/admin/AdminIndex";
import AdminUsersCreate from "../pages/admin/AdminUsersCreate";

import ManagerIndex from "../pages/manager/ManagerIndex";
import WaiterIndex from "../pages/waiters/WaiterIndex";

// ✅ Property Page
import PropertyPage from "../pages/PropertyPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Login */}
      <Route path="/" element={<Main />} />

      {/* Dashboard Layout wrapper */}
      <Route element={<DashboardLayouts />}>
        {/* Admin */}
        <Route path="/admin" element={<AdminIndex />} />
        <Route path="/admin/users/create" element={<AdminUsersCreate />} />
        <Route path="/admin/property" element={<PropertyPage />} />

        {/* Manager */}
        <Route path="/manager" element={<ManagerIndex />} />

        {/* Waiter */}
        <Route path="/waiter" element={<WaiterIndex />} />
      </Route>

      {/* Redirect unknown pages */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}