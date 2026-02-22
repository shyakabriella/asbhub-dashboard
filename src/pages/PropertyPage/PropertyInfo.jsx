// src/pages/PropertyPage/PropertyInfo.jsx

import React, { memo, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ManageHotel from "./ManageHotel";

function safeText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function parseServices(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {}

    if (value.includes(",")) {
      return value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    return value.trim() ? [value.trim()] : [];
  }

  return [];
}

function uniqueStrings(arr) {
  return [...new Set((arr || []).filter(Boolean))];
}

function buildImageCandidates(url, apiBaseUrl) {
  const value = safeText(url, "").trim();
  if (!value) return [];

  if (/^(https?:|data:|blob:)/i.test(value)) return [value];

  const base = String(apiBaseUrl || "").replace(/\/+$/, "");
  const clean = value.replace(/^\/+/, "");

  const candidates = [`${base}/${clean}`];

  if (clean.startsWith("public/")) {
    candidates.push(`${base}/storage/${clean.replace(/^public\//, "")}`);
  }

  if (!clean.startsWith("storage/")) {
    candidates.push(`${base}/storage/${clean}`);
  }

  return uniqueStrings(candidates);
}

function badgeClass(stage) {
  switch (stage) {
    case "Live":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Onboarding":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Draft":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "Inactive":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "Contacted":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Documents Pending":
      return "bg-violet-100 text-violet-700 border-violet-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function normalizeProperty(item) {
  return {
    id: item?.id,
    propertyName: item?.propertyName ?? item?.property_name ?? "",
    propertyType: item?.propertyType ?? item?.property_type ?? "Property",
    starRating: item?.starRating ?? item?.star_rating ?? "",
    country: item?.country ?? "",
    city: item?.city ?? "",
    address: item?.address ?? "",
    contactPerson: item?.contactPerson ?? item?.contact_person ?? "",
    phone: item?.phone ?? "",
    email: item?.email ?? "",
    onboardingStage: item?.onboardingStage ?? item?.onboarding_stage ?? "Draft",
    otaStatus: item?.otaStatus ?? item?.ota_status ?? "Not Started",
    seoStatus: item?.seoStatus ?? item?.seo_status ?? "Not Started",
    notes: item?.notes ?? "",
    services: parseServices(item?.services),
    logo: item?.logo ?? item?.logo_url ?? item?.logo_path ?? item?.image ?? "",
    createdAt: item?.created_at ?? item?.createdAt ?? "",
    updatedAt: item?.updated_at ?? item?.updatedAt ?? "",
    _raw: item,
  };
}

async function parseResponseBody(res) {
  const contentType = res.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) return await res.json();
    return await res.text();
  } catch {
    return null;
  }
}

function getBackendMessage(data) {
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message.trim();
  }
  if (typeof data === "string" && data.trim()) return data.trim();
  return "";
}

function isLaravelRouteNotFoundMessage(message) {
  return /the route .* could not be found\.?/i.test(String(message || ""));
}

function normalizeFetchError(status, data) {
  if (status === 422 && data?.errors) {
    const firstKey = Object.keys(data.errors)[0];
    return data.errors[firstKey]?.[0] || "Validation failed.";
  }

  const backendMessage = getBackendMessage(data);

  if (isLaravelRouteNotFoundMessage(backendMessage)) {
    return "API endpoint not found. Please check API base URL.";
  }

  if (status === 401) return "Unauthenticated. Please login first.";
  if (status === 403) return "Forbidden.";
  if (status === 404) return "Property not found.";
  if (status >= 500) return "Server error. Please check Laravel logs.";

  return backendMessage || "Request failed.";
}

function extractSingleFromApiResponse(data) {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] || null;
  if (data?.data && !Array.isArray(data.data)) return data.data;
  if (data?.property) return data.property;
  return data;
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function PropertyLogo({ logo, propertyName, apiBaseUrl, size = "h-16 w-16" }) {
  const candidates = useMemo(
    () => buildImageCandidates(logo, apiBaseUrl),
    [logo, apiBaseUrl]
  );

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [logo, apiBaseUrl]);

  const currentSrc = idx >= 0 && idx < candidates.length ? candidates[idx] : "";

  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50`}
    >
      {currentSrc ? (
        <img
          src={currentSrc}
          alt={`${propertyName} logo`}
          className="h-full w-full object-contain"
          onError={() => {
            setIdx((prev) => {
              const next = prev + 1;
              return next < candidates.length ? next : -1;
            });
          }}
        />
      ) : (
        <span className="text-2xl">🏨</span>
      )}
    </div>
  );
}

function TinyBadge({ children, tone = "gray" }) {
  const tones = {
    gray: "border-gray-200 bg-gray-50 text-gray-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${
        tones[tone] || tones.gray
      }`}
    >
      {children}
    </span>
  );
}

function SmallRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-2 border-b border-gray-100 py-1.5 last:border-b-0">
      <span className="min-w-[72px] text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span className="text-right text-xs text-gray-800 break-words">
        {safeText(value, "-")}
      </span>
    </div>
  );
}

function SmallCard({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
      <h3 className="mb-1.5 text-xs font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

function StatMini({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-0.5 truncate text-xs font-semibold text-gray-900">
        {safeText(value, "-")}
      </p>
    </div>
  );
}

function PropertyDetailsPanel({ property, apiBaseUrl }) {
  const servicesCount = Array.isArray(property.services) ? property.services.length : 0;

  return (
    <div className="space-y-2">
      {/* Profile-style top card */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <PropertyLogo
              logo={property.logo}
              propertyName={safeText(property.propertyName, "Property")}
              apiBaseUrl={apiBaseUrl}
              size="h-20 w-20"
            />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="truncate text-sm font-semibold text-gray-900">
                  {safeText(property.propertyName, "Unnamed Property")}
                </h1>
                <TinyBadge tone="purple">
                  {safeText(property.onboardingStage, "Draft")}
                </TinyBadge>
              </div>

              <p className="mt-0.5 text-xs text-gray-600">
                {safeText(property.propertyType, "Property")}
                {property.starRating ? ` • ${property.starRating}★` : ""}
              </p>

              <p className="mt-0.5 text-xs text-gray-600">
                {safeText(property.city, "-")}, {safeText(property.country, "-")}
              </p>

              <p className="mt-1 text-xs text-gray-700 break-words">
                {safeText(property.address, "No address")}
              </p>

              <div className="mt-2 flex flex-wrap gap-1">
                <TinyBadge tone="blue">OTA: {safeText(property.otaStatus, "-")}</TinyBadge>
                <TinyBadge tone="emerald">
                  SEO: {safeText(property.seoStatus, "-")}
                </TinyBadge>
              </div>
            </div>
          </div>

          <div className="flex gap-1.5">
            <button
              type="button"
              className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              type="button"
              className="rounded-md bg-purple-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-95"
            >
              Actions
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          <StatMini label="Property ID" value={property.id} />
          <StatMini label="Services" value={servicesCount} />
          <StatMini label="Contact" value={property.contactPerson || "-"} />
          <StatMini label="Updated" value={formatDateTime(property.updatedAt)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <SmallCard title="Contact">
          <SmallRow label="Person" value={property.contactPerson} />
          <SmallRow label="Phone" value={property.phone} />
          <SmallRow label="Email" value={property.email} />
        </SmallCard>

        <SmallCard title="Location">
          <SmallRow label="City" value={property.city} />
          <SmallRow label="Country" value={property.country} />
          <SmallRow label="Address" value={property.address} />
        </SmallCard>

        <SmallCard title="Hotel Setup">
          <SmallRow label="Type" value={property.propertyType} />
          <SmallRow
            label="Star"
            value={property.starRating ? `${property.starRating}★` : "-"}
          />
          <SmallRow label="Stage" value={property.onboardingStage} />
        </SmallCard>

        <SmallCard title="Channels">
          <SmallRow label="OTA" value={property.otaStatus} />
          <SmallRow label="SEO" value={property.seoStatus} />
          <SmallRow label="ID" value={property.id} />
        </SmallCard>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <SmallCard title="Services">
          <div className="flex flex-wrap gap-1">
            {Array.isArray(property.services) && property.services.length > 0 ? (
              property.services.map((service, index) => (
                <span
                  key={`${property.id || "p"}-${service}-${index}`}
                  className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700"
                >
                  {service}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500">No services listed.</span>
            )}
          </div>
        </SmallCard>

        <SmallCard title="Notes">
          <p className="max-h-24 overflow-auto whitespace-pre-wrap text-xs leading-5 text-gray-700">
            {safeText(property.notes, "No notes added.")}
          </p>
        </SmallCard>
      </div>

      <SmallCard title="Meta">
        <div className="grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-4">
          <div>
            <SmallRow label="Created" value={formatDateTime(property.createdAt)} />
          </div>
          <div>
            <SmallRow label="Updated" value={formatDateTime(property.updatedAt)} />
          </div>
        </div>
      </SmallCard>
    </div>
  );
}

function PropertyInfo({
  apiBaseUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000",
  authToken,
  withCredentials = false,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const preloaded = location.state?.property
    ? normalizeProperty(location.state.property)
    : null;

  const [property, setProperty] = useState(preloaded);
  const [loading, setLoading] = useState(!preloaded);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadProperty = async () => {
      if (!id) {
        setError("Property ID is missing.");
        setLoading(false);
        return;
      }

      const base = String(apiBaseUrl || "").replace(/\/+$/, "");
      const url = `${base}/api/admin/property/properties/${id}`;

      try {
        setLoading(true);
        setError("");

        const token =
          authToken ||
          (typeof localStorage !== "undefined" &&
            (localStorage.getItem("auth_token") ||
              localStorage.getItem("token") ||
              localStorage.getItem("access_token") ||
              localStorage.getItem("authToken")));

        if (!token && !withCredentials) {
          throw new Error("Unauthenticated. Please login first.");
        }

        const res = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          ...(withCredentials ? { credentials: "include" } : {}),
          signal: controller.signal,
        });

        const data = await parseResponseBody(res);

        if (!res.ok) {
          throw new Error(normalizeFetchError(res.status, data));
        }

        const item = extractSingleFromApiResponse(data);
        setProperty(item ? normalizeProperty(item) : null);
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error("Property info load error:", err);
        setError(err?.message || "Failed to load property.");
      } finally {
        setLoading(false);
      }
    };

    loadProperty();

    return () => controller.abort();
  }, [id, apiBaseUrl, authToken, withCredentials]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-xs text-gray-500">
              Loading menu...
            </div>
          </div>
        </div>
        <div className="xl:col-span-8">
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-xs text-gray-500">
              Loading property information...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs text-rose-700">
              {error}
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/property")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Properties
            </button>
          </div>
        </div>
        <div className="xl:col-span-8">
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-xs text-gray-500">
              Property panel unavailable.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-xs text-gray-500">
              Property not found.
            </div>
          </div>
        </div>
        <div className="xl:col-span-8">
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-xs text-gray-500">
              No details to show.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
      {/* LEFT: Manage Hotel (separate component) */}
      <div className="xl:col-span-4 2xl:col-span-3 xl:sticky xl:top-3 self-start">
        <ManageHotel
          property={property}
          navigate={navigate}
          apiBaseUrl={apiBaseUrl}
        />
      </div>

      {/* RIGHT: Property details */}
      <div className="xl:col-span-8 2xl:col-span-9">
        <PropertyDetailsPanel property={property} apiBaseUrl={apiBaseUrl} />
      </div>
    </div>
  );
}

export default memo(PropertyInfo);