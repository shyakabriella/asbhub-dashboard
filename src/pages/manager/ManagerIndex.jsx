import React, { useMemo, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function ManagerIndex() {
  const navigate = useNavigate();

  const API_URL = useMemo(() => {
    return (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(
      /\/$/,
      ""
    );
  }, []);

  const [me, setMe] = useState(null);

  // optional: small stats
  const [stats, setStats] = useState({
    recentUsers: 0,
    activeStaff: 0,
    todaysOrders: 0,
  });

  const [loadingStats, setLoadingStats] = useState(false);

  // ✅ load user from storage
  useEffect(() => {
    const raw =
      localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");

    if (!raw) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const u = JSON.parse(raw);
      setMe(u);

      // protect route: only manager
      const role = (u?.role || "").toLowerCase();
      if (role !== "manager") {
        // send other roles where they belong
        if (role === "admin") navigate("/admin", { replace: true });
        else if (role === "waiters" || role === "waiter")
          navigate("/waiter", { replace: true });
        else navigate("/login", { replace: true });
      }
    } catch {
      navigate("/login", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    try {
      const token =
        localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");

      await fetch(`${API_URL}/api/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem("auth_token");
      sessionStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      sessionStorage.removeItem("auth_user");

      navigate("/login", { replace: true });
    }
  };

  // ✅ Optional: fake stats now, replace later with real endpoints
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      // Later you can call your API like:
      // const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
      // const res = await fetch(`${API_URL}/api/manager/stats`, { headers: {...} });
      // const data = await res.json();

      // Demo values for now:
      setStats({
        recentUsers: 12,
        activeStaff: 7,
        todaysOrders: 24,
      });
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const Card = ({ title, value, icon }) => (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {loadingStats ? "..." : value}
          </div>
        </div>
        <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-xl">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              M
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                Manager Dashboard
              </div>
              <div className="text-xs text-gray-500">
                Welcome{me?.name ? `, ${me.name}` : ""} 👋
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStats}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              🔄 Refresh
            </button>

            <button
              onClick={logout}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card title="Recent Users" value={stats.recentUsers} icon="👥" />
          <Card title="Active Staff" value={stats.activeStaff} icon="🧑‍🍳" />
          <Card title="Today Orders" value={stats.todaysOrders} icon="🧾" />
        </div>

        {/* Quick actions */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  Quick Actions ⚡
                </div>
                <div className="text-sm text-gray-500">
                  Manage users and operations from here.
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                to="/admin/users/create"
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 hover:bg-amber-100"
              >
                ➕ Create User
              </Link>

              <Link
                to="/admin/users"
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                📋 View Users
              </Link>

              <button
                type="button"
                onClick={() => alert("Coming soon: daily report 😊")}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                📊 Daily Report
              </button>

              <button
                type="button"
                onClick={() => alert("Coming soon: staff schedule 😊")}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                🗓️ Staff Schedule
              </button>
            </div>
          </div>

          {/* Profile / info */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">
              My Profile 👤
            </div>

            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-semibold text-gray-900">
                  {me?.name || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Role</span>
                <span className="font-semibold text-gray-900">
                  {me?.role || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-semibold text-gray-900 truncate max-w-[160px] text-right">
                  {me?.email || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="font-semibold text-gray-900">
                  {me?.phone || "-"}
                </span>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Tip: You can add manager-only APIs later (stats, reports, schedules).
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          ASHBHUB &Olympic Hotel ©2026 • Manager Portal
        </div>
      </div>
    </div>
  );
}