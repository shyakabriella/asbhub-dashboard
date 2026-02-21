import React, { useEffect, useMemo, useState } from "react";

export default function HomeSectionOne() {
  const COLORS = useMemo(() => ({ purple: "#2F0D34", gold: "#BD9F75" }), []);
  const API = import.meta.env.VITE_API_URL;

  const [rowId, setRowId] = useState(null);

  const [form, setForm] = useState({ title: "", subtitle: "", image: null });
  const [preview, setPreview] = useState("");
  const [serverImage, setServerImage] = useState("");
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

  // ✅ Load current row (auto-create on backend)
  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!API) return showToast("⚠️ Missing VITE_API_URL in .env");

      try {
        setLoading(true);
        const token = getToken();

        const res = await fetch(makeUrl("/api/admin/property/home-section-one/current"), {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Failed to load");

        const data = json?.data || json;

        if (!mounted) return;

        setRowId(data?.id || null);
        setForm({
          title: data?.title || "",
          subtitle: data?.subtitle || "",
          image: null,
        });

        // backend sends image_url from current()
        setServerImage(data?.image_url || "");
      } catch (err) {
        console.error(err);
        showToast(err.message || "❌ Failed to load HomeSectionOne");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [API]);

  // ✅ Image preview
  useEffect(() => {
    if (!form.image) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(form.image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.image]);

  // ✅ Save (update existing row)
  const submit = async (e) => {
    e.preventDefault();

    if (!API) return showToast("⚠️ Missing VITE_API_URL in .env");
    if (!rowId) return showToast("⚠️ Row not loaded yet (try refresh)");
    if (!form.title.trim()) return showToast("⚠️ Title is required");

    try {
      setSaving(true);
      const token = getToken();

      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("subtitle", form.subtitle || "");
      if (form.image) fd.append("image", form.image);

      // ✅ method override for Laravel resource PUT
      fd.append("_method", "PUT");

      const res = await fetch(makeUrl(`/api/admin/property/home-section-one/${rowId}`), {
        method: "POST",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) {
        const msg =
          json?.message ||
          json?.errors?.title?.[0] ||
          json?.errors?.image?.[0] ||
          "❌ Save failed";
        throw new Error(msg);
      }

      const data = json?.data || json;

      // update preview from server
      setServerImage(data?.image_url || (data?.image ? `${API}/storage/${data.image}` : ""));
      setForm((p) => ({ ...p, image: null }));
      showToast("✅ Saved successfully!");
    } catch (err) {
      console.error(err);
      showToast(err.message || "❌ Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {toast ? (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">{toast}</div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
          Loading...
        </div>
      ) : null}

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex items-start gap-4 flex-col sm:flex-row">
          <div className="w-full sm:w-[240px]">
            <div className="text-xs font-semibold text-gray-700">Preview</div>

            <div className="mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
              {preview || serverImage ? (
                <img src={preview || serverImage} alt="Home Section One" className="h-[140px] w-full object-cover" />
              ) : (
                <div className="flex h-[140px] w-full items-center justify-center text-xs text-gray-500">
                  No image
                </div>
              )}
            </div>

            <div className="mt-2 text-[11px] text-gray-500">Row ID: {rowId ?? "-"}</div>
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div>
              <label className="text-xs font-semibold text-gray-700">Title</label>
              <input
                value={form.title}
                onChange={(e) => onChange("title", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(47,13,52,0.18)]"
                placeholder="ROYAL CROWN HOTEL"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Subtitle</label>
              <input
                value={form.subtitle}
                onChange={(e) => onChange("subtitle", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(47,13,52,0.18)]"
                placeholder="Experience luxury in the heart of Kimironko, Kigali"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Background Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onChange("image", e.target.files?.[0] || null)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
              <div className="mt-1 text-xs text-gray-500">PNG/JPG/WebP</div>
            </div>

            <button
              type="submit"
              disabled={saving || loading || !rowId}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: COLORS.purple }}
            >
              {saving ? "Saving..." : "💾 Save Home Section One"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}