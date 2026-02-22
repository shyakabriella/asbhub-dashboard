import React, { memo, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ONBOARDING_STAGES } from "./property.constants";

function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-purple-700 focus:ring-2 focus:ring-purple-100 ${className}`}
    />
  );
}

function Select({ className = "", children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-purple-700 focus:ring-2 focus:ring-purple-100 ${className}`}
    >
      {children}
    </select>
  );
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
  return [...new Set(arr.filter(Boolean))];
}

function buildImageCandidates(url, apiBaseUrl) {
  const value = safeText(url, "").trim();
  if (!value) return [];

  if (/^(https?:|data:|blob:)/i.test(value)) {
    return [value];
  }

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

function PropertyLogo({
  logo,
  propertyName = "Property",
  apiBaseUrl,
  className = "",
  boxClassName = "",
}) {
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
      className={`flex items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 ${boxClassName}`}
    >
      {currentSrc ? (
        <img
          src={currentSrc}
          alt={`${propertyName} logo`}
          className={`h-full w-full object-contain ${className}`}
          loading="lazy"
          onError={() => {
            setIdx((prev) => {
              const next = prev + 1;
              return next < candidates.length ? next : -1;
            });
          }}
        />
      ) : (
        <span className="text-xs">🏨</span>
      )}
    </div>
  );
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
  if (typeof data?.message === "string" && data.message.trim()) return data.message.trim();
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
  if (status === 404) return "API endpoint not found. Please check API base URL.";
  if (status >= 500) return "Server error. Please check Laravel logs.";

  return backendMessage || "Request failed.";
}

function extractListFromApiResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.properties)) return data.properties;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function PropertyList({
  properties = [],
  search = "",
  setSearch,
  stageFilter = "All",
  setStageFilter,
  onEdit,
  onDelete,
  isLoading = false,
  useFetchList = true,
  apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  authToken,
  withCredentials = false,
  refreshKey = 0,
  onListLoaded,
  detailsBasePath = "/admin/property",
}) {
  const navigate = useNavigate();

  const [dbProperties, setDbProperties] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const effectiveLoading = isLoading || fetchLoading;

  useEffect(() => {
    if (!useFetchList) return;

    const controller = new AbortController();

    const loadProperties = async () => {
      const base = String(apiBaseUrl || "").replace(/\/+$/, "");
      const url = `${base}/api/admin/property/properties`;

      try {
        setFetchLoading(true);
        setFetchError("");

        const token =
          authToken ||
          (typeof localStorage !== "undefined" &&
            (localStorage.getItem("token") ||
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

        const list = extractListFromApiResponse(data);
        const normalized = list.map((item) => normalizeProperty(item));

        setDbProperties(normalized);
        onListLoaded?.(normalized, data);
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error("Property list load error:", err);

        const msg =
          isLaravelRouteNotFoundMessage(err?.message) ||
          /api route not found/i.test(err?.message || "")
            ? "API endpoint not found. Please check API base URL."
            : err?.message || "Failed to load properties.";

        setFetchError(msg);
        setDbProperties([]);
      } finally {
        setFetchLoading(false);
      }
    };

    loadProperties();

    return () => controller.abort();
  }, [useFetchList, apiBaseUrl, authToken, withCredentials, refreshKey, onListLoaded]);

  const sourceProperties = useMemo(() => {
    const arr = useFetchList ? dbProperties : Array.isArray(properties) ? properties : [];
    return arr.map((p) => normalizeProperty(p));
  }, [useFetchList, dbProperties, properties]);

  const filteredProperties = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    const stage = String(stageFilter || "All");

    return sourceProperties.filter((p) => {
      const matchesStage = stage === "All" || p.onboardingStage === stage;

      const haystack = [
        p.propertyName,
        p.propertyType,
        p.city,
        p.country,
        p.contactPerson,
        p.phone,
        p.email,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");

      const matchesSearch = !q || haystack.includes(q);

      return matchesStage && matchesSearch;
    });
  }, [sourceProperties, search, stageFilter]);

  const handleOpenProperty = (property) => {
    if (!property?.id) return;
    const basePath = String(detailsBasePath || "/admin/property").replace(/\/+$/, "");
    navigate(`${basePath}/${property.id}`, {
      state: { property },
    });
  };

  const handleDeleteClick = async (id) => {
    if (!id) return;

    if (onDelete) {
      onDelete(id);
      return;
    }

    if (!useFetchList) return;

    const yes =
      typeof window === "undefined"
        ? true
        : window.confirm("Are you sure you want to delete this property?");
    if (!yes) return;

    const base = String(apiBaseUrl || "").replace(/\/+$/, "");
    const url = `${base}/api/admin/property/properties/${id}`;

    try {
      setDeletingId(id);
      setFetchError("");

      const token =
        authToken ||
        (typeof localStorage !== "undefined" &&
          (localStorage.getItem("token") ||
            localStorage.getItem("access_token") ||
            localStorage.getItem("authToken")));

      if (!token && !withCredentials) {
        throw new Error("Unauthenticated. Please login first.");
      }

      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(withCredentials ? { credentials: "include" } : {}),
      });

      const data = await parseResponseBody(res);

      if (!res.ok) {
        throw new Error(normalizeFetchError(res.status, data));
      }

      setDbProperties((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Property delete error:", err);
      setFetchError(err?.message || "Failed to delete property.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Properties List</h2>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={search}
            onChange={(e) => setSearch?.(e.target.value)}
            placeholder="Search name, city, contact..."
            className="sm:w-64"
          />

          <Select
            value={stageFilter}
            onChange={(e) => setStageFilter?.(e.target.value)}
            className="sm:w-44"
          >
            <option value="All">All Stages</option>
            {ONBOARDING_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {fetchError ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {fetchError}
        </div>
      ) : null}

      {effectiveLoading ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          Loading properties...
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-3">Property</th>
                  <th className="px-3 py-3">Location</th>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3">Stage</th>
                  <th className="px-3 py-3">Services</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                      No properties found.
                    </td>
                  </tr>
                ) : (
                  filteredProperties.map((p) => {
                    const propertyName = safeText(p?.propertyName, "Unnamed Property");
                    const propertyType = safeText(p?.propertyType, "Property");
                    const city = safeText(p?.city, "-");
                    const country = safeText(p?.country, "-");
                    const contactPerson = safeText(p?.contactPerson, "-");
                    const phone = safeText(p?.phone, "-");
                    const email = safeText(p?.email, "-");
                    const stage = safeText(p?.onboardingStage, "Draft");
                    const otaStatus = safeText(p?.otaStatus, "Not Started");
                    const seoStatus = safeText(p?.seoStatus, "Not Started");
                    const starRating = safeText(p?.starRating, "");
                    const logo = safeText(p?.logo, "");
                    const services = Array.isArray(p?.services) ? p.services : [];

                    return (
                      <tr
                        key={p?.id ?? `${propertyName}-${city}`}
                        className="cursor-pointer border-b border-gray-100 align-top hover:bg-gray-50"
                        onClick={() => handleOpenProperty(p)}
                        title="Click to view property details"
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-start gap-3">
                            <PropertyLogo
                              logo={logo}
                              propertyName={propertyName}
                              apiBaseUrl={apiBaseUrl}
                              boxClassName="h-10 w-10"
                            />

                            <div>
                              <div className="font-semibold text-gray-900 hover:text-purple-700">
                                {propertyName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {propertyType}
                                {starRating ? ` • ${starRating}★` : ""}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="text-gray-800">{city}</div>
                          <div className="text-xs text-gray-500">{country}</div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="text-gray-800">{contactPerson}</div>
                          <div className="text-xs text-gray-500">{phone}</div>
                          <div className="break-all text-xs text-gray-500">{email}</div>
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${badgeClass(
                              stage
                            )}`}
                          >
                            {stage}
                          </span>
                          <div className="mt-2 text-xs text-gray-500">OTA: {otaStatus}</div>
                          <div className="text-xs text-gray-500">SEO: {seoStatus}</div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex max-w-xs flex-wrap gap-1">
                            {services.length ? (
                              services.map((s) => (
                                <span
                                  key={`${p?.id}-${s}`}
                                  className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
                                >
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">None</span>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <div
                            className="flex justify-end gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleOpenProperty(p)}
                              className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() => onEdit?.(p)}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteClick(p?.id)}
                              disabled={deletingId === p?.id}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId === p?.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 lg:hidden">
            {filteredProperties.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                No properties found.
              </div>
            ) : (
              filteredProperties.map((p) => {
                const propertyName = safeText(p?.propertyName, "Unnamed Property");
                const propertyType = safeText(p?.propertyType, "Property");
                const city = safeText(p?.city, "-");
                const country = safeText(p?.country, "-");
                const contactPerson = safeText(p?.contactPerson, "-");
                const phone = safeText(p?.phone, "-");
                const email = safeText(p?.email, "-");
                const stage = safeText(p?.onboardingStage, "Draft");
                const otaStatus = safeText(p?.otaStatus, "Not Started");
                const seoStatus = safeText(p?.seoStatus, "Not Started");
                const starRating = safeText(p?.starRating, "");
                const logo = safeText(p?.logo, "");
                const services = Array.isArray(p?.services) ? p.services : [];

                return (
                  <div
                    key={p?.id ?? `${propertyName}-${city}-mobile`}
                    className="cursor-pointer rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50"
                    onClick={() => handleOpenProperty(p)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <PropertyLogo
                          logo={logo}
                          propertyName={propertyName}
                          apiBaseUrl={apiBaseUrl}
                          boxClassName="h-10 w-10"
                        />

                        <div>
                          <h3 className="font-semibold text-gray-900">{propertyName}</h3>
                          <p className="text-xs text-gray-500">
                            {propertyType}
                            {starRating ? ` • ${starRating}★` : ""}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${badgeClass(
                          stage
                        )}`}
                      >
                        {stage}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-gray-700">
                      <p>
                        <span className="font-medium">City:</span> {city}, {country}
                      </p>
                      <p>
                        <span className="font-medium">Contact:</span> {contactPerson}
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span> {phone}
                      </p>
                      <p className="break-all">
                        <span className="font-medium">Email:</span> {email}
                      </p>
                      <p>
                        <span className="font-medium">OTA:</span> {otaStatus} •{" "}
                        <span className="font-medium">SEO:</span> {seoStatus}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {services.length ? (
                        services.map((s) => (
                          <span
                            key={`${p?.id}-m-${s}`}
                            className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No services</span>
                      )}
                    </div>

                    <div
                      className="mt-4 flex gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenProperty(p)}
                        className="flex-1 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-medium text-purple-700 hover:bg-purple-100"
                      >
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit?.(p)}
                        className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteClick(p?.id)}
                        disabled={deletingId === p?.id}
                        className="flex-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === p?.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default memo(PropertyList);