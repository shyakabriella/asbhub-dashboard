import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Main() {
  const [showPass, setShowPass] = useState(false);

  // ✅ Email or phone (no default value)
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const API_URL = useMemo(() => {
    return (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(
      /\/$/,
      ""
    );
  }, []);

  const redirectByRole = (role) => {
    const r = (role || "").toLowerCase();

    if (r === "admin") return navigate("/admin", { replace: true });
    if (r === "manager") return navigate("/manager", { replace: true });
    if (r === "waiters" || r === "waiter") return navigate("/waiter", { replace: true });

    return navigate("/admin", { replace: true });
  };

  // ✅ simple validators
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = (v) => {
    // accepts: 078..., +25078..., 25078..., and digits/spaces
    const cleaned = v.replace(/\s+/g, "");
    return /^[+]?\d{9,15}$/.test(cleaned);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const id = identifier.trim();
    if (!id || !password.trim()) {
      setErrorMsg("Email/Phone and password are required.");
      return;
    }

    // ✅ must be email OR phone
    if (!isEmail(id) && !isPhone(id)) {
      setErrorMsg("Please enter a valid email or phone number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },

        // ✅ send login identifier (email or phone)
        body: JSON.stringify({
          login: id,
          password: password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      const payload = data?.data || {};

      if (!res.ok || data?.success === false) {
        const msg =
          data?.message ||
          payload?.message ||
          data?.errors?.login?.[0] ||
          data?.errors?.password?.[0] ||
          "Login failed.";
        throw new Error(msg);
      }

      const token = payload?.token;
      const user = payload?.user;

      if (!token || !user) {
        throw new Error("Login response missing token or user. Please update Laravel response.");
      }

      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("auth_token", token);
      storage.setItem("auth_user", JSON.stringify(user));

      redirectByRole(user.role);
    } catch (err) {
      setErrorMsg(err?.message || "Failed to fetch. Check backend + API URL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-screen bg-gray-100 flex items-center justify-center p-3 overflow-hidden">
      <div className="w-full max-w-6xl h-full md:h-[92dvh] bg-white shadow-lg border rounded-xl overflow-hidden">
        <div className="h-full grid grid-cols-1 md:grid-cols-2">
          {/* Left side */}
          <div className="relative h-full hidden md:block">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1549366021-9f761d040a94?auto=format&fit=crop&w=1400&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-black/45" />

            <div className="absolute left-6 top-6 flex items-center gap-2 text-amber-400">
              <div className="h-10 w-10 rounded-lg border border-amber-400/40 flex items-center justify-center">
                <span className="text-xl font-bold">A</span>
              </div>
              <div className="font-semibold tracking-wide">ASHBHUB</div>
            </div>

            <div className="absolute bottom-8 left-6 right-6 text-white">
              <div className="text-2xl font-bold tracking-wide">ASHBHUB</div>
              <p className="mt-2 text-sm text-white/85 max-w-md">
                Orchestrating unforgettable African Journey <br />
                with precision and care
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="h-full flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
              {/* Partnership logos */}
              <div className="flex items-center justify-center gap-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <img
                    src="/ash.png"
                    alt="ASHBHUB Logo"
                    className="h-10 w-auto object-contain"
                  />
                  <div className="leading-tight">
                    <div className="text-sm font-semibold text-gray-900">ASHBHUB</div>
                    <div className="text-[11px] text-gray-500">Partner</div>
                  </div>
                </div>

                <div className="h-8 w-px bg-gray-200" />

                <div className="flex items-center gap-2">
                  <img
                    src="/royal.png"
                    alt="Royal Crown Hotel Logo"
                    className="h-10 w-auto object-contain"
                  />
                  <div className="leading-tight">
                    <div className="text-sm font-semibold text-gray-900">ROYALCROWN</div>
                    <div className="text-[11px] text-gray-500">Hotel</div>
                  </div>
                </div>
              </div>

              <h1 className="mt-4 text-2xl font-bold text-gray-900">
                Login in to your account
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back! Enter your credentials
              </p>

              {errorMsg && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={onSubmit} className="mt-5 space-y-3">
                {/* Email or Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email or phone
                  </label>
                  <div className="mt-2 relative">
                    <input
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      type="text"
                      autoComplete="username"
                      placeholder="aphone or email"
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pr-10 outline-none focus:border-amber-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      👤
                    </span>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-2 relative">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPass ? "text" : "password"}
                      autoComplete="current-password"
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pr-10 outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Toggle password"
                    >
                      {showPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {/* Row */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    Remember me
                  </label>

                  <button type="button" className="text-sm text-amber-500 hover:underline">
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-amber-500 py-3 font-semibold text-white hover:bg-amber-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Logging in..." : "Login →"}
                </button>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Don’t have an account?</span>
                  <Link to="/register" className="text-amber-500 hover:underline">
                    Register
                  </Link>
                </div>

                <div className="pt-3 text-center text-xs text-gray-400">
                  ASHBHUB ©2025. Authorized personal only <br />
                  <a className="underline" href="#">
                    Contact IT Support
                  </a>
                </div>
              </form>
            </div>
          </div>
          {/* end right */}
        </div>
      </div>
    </div>
  );
}