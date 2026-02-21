import React, { useEffect, useMemo, useState } from "react";

export default function HomeAbout() {
  const COLORS = useMemo(() => ({ purple: "#2F0D34" }), []);
  const API = import.meta.env.VITE_API_URL;

  const ROW_ID = 1;

  const [form, setForm] = useState({
    title: "About Us",
    description: "",
    mission_title: "Our Mission",
    mission_text: "",
    vision_title: "Our Vision",
    vision_text: "",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const onChange = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const getToken = () =>
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("auth_token");

  const makeUrl = (path) => `${API}${path}`;

  // ✅ Load row id=1
  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!API) return showToast("⚠️ Missing VITE_API_URL in .env");

      try {
        setLoading(true);
        const token = getToken();

        const res = await fetch(makeUrl(`/api/admin/property/home-about/${ROW_ID}`), {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.message || "Failed to load About");
        }

        const data = json?.data || json;

        if (!mounted) return;

        setForm({
          title: data?.title || "About Us",
          description: data?.description || "",
          mission_title: data?.mission_title || "Our Mission",
          mission_text: data?.mission_text || "",
          vision_title: data?.vision_title || "Our Vision",
          vision_text: data?.vision_text || "",
        });
      } catch (err) {
        console.error(err);
        showToast(err.message || "❌ Failed to load About");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [API]);

  // ✅ Save (resource update)
  const save = async () => {
    if (!API) return showToast("⚠️ Missing VITE_API_URL in .env");
    if (!form.title.trim()) return showToast("⚠️ Title is required");

    try {
      setSaving(true);
      const token = getToken();

      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description || "");
      fd.append("mission_title", form.mission_title || "");
      fd.append("mission_text", form.mission_text || "");
      fd.append("vision_title", form.vision_title || "");
      fd.append("vision_text", form.vision_text || "");

      // ✅ method override to hit PUT route
      fd.append("_method", "PUT");

      const res = await fetch(makeUrl(`/api/admin/property/home-about/${ROW_ID}`), {
        method: "POST",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // ❌ don't set Content-Type for FormData
        },
        body: fd,
      });

      const json = await res.json();

      if (!res.ok) {
        const msg =
          json?.message ||
          json?.errors?.title?.[0] ||
          "❌ Save failed";
        throw new Error(msg);
      }

      showToast("✅ About saved successfully!");
    } catch (err) {
      console.error(err);
      showToast(err.message || "❌ Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast ? (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">
          {toast}
        </div>
      ) : null}

      {/* Loading */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
          Loading...
        </div>
      ) : null}

      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4">
        <div className="text-sm text-gray-600">
          Update the <b>About Us</b>, <b>Mission</b>, and <b>Vision</b> texts shown on the website.
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700">Section Title</label>
          <input
            value={form.title}
            onChange={(e) => onChange("title", e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(47,13,52,0.18)]"
            placeholder="About Us"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(47,13,52,0.18)]"
            placeholder="Welcome to Royal Crown Hotel..."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-gray-700">Mission Title</label>
            <input
              value={form.mission_title}
              onChange={(e) => onChange("mission_title", e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(47,13,52,0.18)]"
              placeholder="Our Mission"
            />

            <label className="mt-3 block text-xs font-semibold text-gray-700">Mission Text</label>
            <textarea
              value={form.mission_text}
              onChange={(e) => onChange("mission_text", e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(47,13,52,0.18)]"
              placeholder="To provide unparalleled hospitality..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Vision Title</label>
            <input
              value={form.vision_title}
              onChange={(e) => onChange("vision_title", e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(47,13,52,0.18)]"
              placeholder="Our Vision"
            />

            <label className="mt-3 block text-xs font-semibold text-gray-700">Vision Text</label>
            <textarea
              value={form.vision_text}
              onChange={(e) => onChange("vision_text", e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(47,13,52,0.18)]"
              placeholder="To be the leading hotel in Kigali..."
            />
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving || loading}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: COLORS.purple }}
        >
          {saving ? "Saving..." : "💾 Save About"}
        </button>
      </div>
    </div>
  );
}