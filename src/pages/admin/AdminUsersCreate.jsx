import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function AdminUsersCreate() {
  const formRef = useRef(null);

  const BRAND = {
    purple: "#2F0D34",
    gold: "#BD9F75",
  };

  const API_URL = useMemo(() => {
    return (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(
      /\/$/,
      ""
    );
  }, []);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "waiters",
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [generated, setGenerated] = useState(null);

  // ✅ dynamic registered users
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  const token =
    localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");

  const onChange = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
  };

  const resetForm = () => {
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role: "waiters",
    });
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pill = (r) => {
    const map = {
      admin: {
        bg: "rgba(47,13,52,0.10)",
        bd: "rgba(47,13,52,0.20)",
        tx: BRAND.purple,
      },
      manager: {
        bg: "rgba(189,159,117,0.18)",
        bd: "rgba(189,159,117,0.40)",
        tx: BRAND.purple,
      },
      waiters: {
        bg: "rgba(17,24,39,0.06)",
        bd: "rgba(17,24,39,0.12)",
        tx: "rgb(55,65,81)",
      },
    };
    return map[r] || map.waiters;
  };

  const fetchRegisteredUsers = async () => {
    setUsersLoading(true);
    setUsersError("");

    try {
      const res = await fetch(`${API_URL}/api/admin/users?limit=4`, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Failed to load registered users.");
      }

      setRegisteredUsers(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setUsersError(e?.message || "Failed to load registered users.");
      setRegisteredUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchRegisteredUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setGenerated(null);

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setErrorMsg("First name and last name are required.");
      return;
    }
    if (!form.email.trim()) {
      setErrorMsg("Email is required.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: `${form.first_name} ${form.last_name}`.trim(),
        email: form.email.trim(),
        phone: form.phone?.trim() || null,
        role: form.role,
      };

      const res = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        const firstValidationError =
          data?.data?.name?.[0] ||
          data?.data?.email?.[0] ||
          data?.data?.phone?.[0] ||
          data?.message ||
          "Failed to create user.";
        throw new Error(firstValidationError);
      }

      setSuccessMsg("✅ User created successfully!");

      // keep credentials visible if backend sends them (optional)
      const creds = data?.data?.credentials;
      if (creds?.username || creds?.password) {
        setGenerated({
          username: creds?.username || "",
          password: creds?.password || "",
        });
      }

      resetForm();

      // ✅ refresh the left list
      await fetchRegisteredUsers();

      // ✅ stay on page (NO navigate)

      // optional: scroll a bit up so user sees updated list
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorMsg(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const previewName =
    `${form.first_name} ${form.last_name}`.trim() || "New User";

  const inputClass =
    "mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none " +
    "focus:border-[rgba(47,13,52,0.45)] focus:ring-2 focus:ring-[rgba(47,13,52,0.12)]";

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Left card */}
      <div className="lg:col-span-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {/* Header preview */}
          <div className="flex items-center gap-4">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center text-2xl border"
              style={{
                backgroundColor: "rgba(47,13,52,0.06)",
                borderColor: "rgba(47,13,52,0.10)",
                color: BRAND.purple,
              }}
            >
              👤
            </div>

            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-gray-900">
                {previewName}
              </div>
              <div className="text-sm text-gray-500">
                Role:{" "}
                <span className="font-medium text-gray-700">{form.role}</span>
              </div>
            </div>
          </div>

          {/* ✅ Registered Users FIRST */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                Registered Users
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchRegisteredUsers}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: BRAND.purple }}
                  title="Refresh"
                >
                  Refresh
                </button>

                <Link
                  to="/admin/users"
                  className="text-xs font-semibold hover:underline"
                  style={{ color: BRAND.purple }}
                >
                  View all
                </Link>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {usersLoading && (
                <div className="text-xs text-gray-500">Loading users...</div>
              )}

              {!usersLoading && usersError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {usersError}
                </div>
              )}

              {!usersLoading && !usersError && registeredUsers.length === 0 && (
                <div className="text-xs text-gray-500">No users found.</div>
              )}

              {!usersLoading &&
                registeredUsers.map((u) => {
                  const s = pill(u.role);
                  return (
                    <div
                      key={u.id || u.email}
                      className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-gray-900">
                            {u.name}
                          </div>
                          <div className="truncate text-xs text-gray-500">
                            {u.email}
                          </div>
                        </div>

                        <span
                          className="shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold"
                          style={{
                            backgroundColor: s.bg,
                            borderColor: s.bd,
                            color: s.tx,
                          }}
                        >
                          {u.role}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={scrollToForm}
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:brightness-95"
                style={{ backgroundColor: BRAND.purple }}
              >
                + Create User
              </button>
            </div>
          </div>

          {/* Personal Information buttons */}
          <div className="mt-5 space-y-2">
            <button
              type="button"
              className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold border"
              style={{
                color: BRAND.purple,
                borderColor: "rgba(189,159,117,0.45)",
                backgroundColor: "rgba(189,159,117,0.14)",
              }}
              onClick={scrollToForm}
            >
              👤 Personal Information
            </button>

            <button
              type="button"
              className="w-full rounded-xl px-4 py-3 text-left text-sm text-gray-700 border border-gray-100 hover:bg-gray-50"
              onClick={scrollToForm}
            >
              ⚙️ System Preferences
            </button>

            <button
              type="button"
              className="w-full rounded-xl px-4 py-3 text-left text-sm text-gray-700 border border-gray-100 hover:bg-gray-50"
              onClick={scrollToForm}
            >
              👥 Teams Management
            </button>
          </div>

          {/* Generated credentials */}
          {generated && (
            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900">
                Generated Credentials
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Username: <span className="font-mono">{generated.username}</span>
              </div>
              <div className="mt-1 text-xs text-gray-600">
                Password: <span className="font-mono">{generated.password}</span>
              </div>
              <div className="mt-2 text-[11px] text-gray-500">
                Note: System emails these credentials to the user automatically.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right form */}
      <div className="lg:col-span-8" ref={formRef}>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                Create User
              </div>
              <div className="text-sm text-gray-500">
                Fill user details then click “Save”.
              </div>
            </div>

            <Link
              to="/admin/users"
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              ← Back
            </Link>
          </div>

          {errorMsg && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMsg}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  First Name(s)
                </label>
                <input
                  value={form.first_name}
                  onChange={onChange("first_name")}
                  className={inputClass}
                  placeholder="Samuel"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  value={form.last_name}
                  onChange={onChange("last_name")}
                  className={inputClass}
                  placeholder="Jonathan"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  value={form.email}
                  onChange={onChange("email")}
                  type="email"
                  className={inputClass}
                  placeholder="name@ashbhub.mail.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Phone Number (optional)
                </label>
                <input
                  value={form.phone}
                  onChange={onChange("phone")}
                  className={inputClass}
                  placeholder="+250 78 600 8389"
                />
                <div className="mt-1 text-[11px] text-gray-500">
                  If phone is provided, it becomes the username.
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <select
                  value={form.role}
                  onChange={onChange("role")}
                  className={inputClass}
                >
                  <option value="admin">admin</option>
                  <option value="manager">manager</option>
                  <option value="waiters">waiters</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setGenerated(null);
                  setErrorMsg("");
                  setSuccessMsg("");
                  resetForm();
                }}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                Discard
              </button>

              <button
                disabled={loading}
                type="submit"
                className="rounded-xl px-6 py-3 text-sm font-semibold text-white
                           disabled:opacity-60 disabled:cursor-not-allowed transition"
                style={{ backgroundColor: BRAND.purple }}
              >
                {loading ? "Saving..." : "Save changes"}
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Tip: Password is auto-generated by system (example: <b>RC48291</b>)
              and sent to the user via email.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}