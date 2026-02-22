import React, { memo, useEffect, useMemo, useState } from "react";

function StatCard({ title, value = 0, sub, emoji }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {sub ? <p className="mt-1 text-xs text-gray-500">{sub}</p> : null}
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-lg">
          {emoji}
        </div>
      </div>
    </div>
  );
}

function normalizeStage(value) {
  return String(value || "").trim().toLowerCase();
}

function toSafeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function percent(part, total) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function hasObjectData(value) {
  return value && typeof value === "object" && Object.keys(value).length > 0;
}

function joinUrl(base, path) {
  const cleanBase = String(base || "").replace(/\/+$/, "");
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return `${cleanBase}/${cleanPath}`;
}

function readStoredToken(explicitToken) {
  if (explicitToken) return explicitToken;

  // Try common keys (adjust if your app uses a different key)
  const keys = ["token", "auth_token", "access_token", "sanctum_token"];

  try {
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value) return value;
    }

    // Optional: if you store user object JSON
    const authRaw = localStorage.getItem("auth");
    if (authRaw) {
      const auth = JSON.parse(authRaw);
      if (auth?.token) return auth.token;
      if (auth?.access_token) return auth.access_token;
    }
  } catch {
    // ignore localStorage parsing errors
  }

  return null;
}

function extractProperties(responseJson) {
  // Flexible parsing for different backend response shapes
  if (Array.isArray(responseJson)) return responseJson;
  if (Array.isArray(responseJson?.data)) return responseJson.data;
  if (Array.isArray(responseJson?.properties)) return responseJson.properties;
  if (Array.isArray(responseJson?.data?.properties)) return responseJson.data.properties;
  if (Array.isArray(responseJson?.data?.data)) return responseJson.data.data; // paginated
  return [];
}

function extractStats(responseJson) {
  if (hasObjectData(responseJson?.stats)) return responseJson.stats;
  if (hasObjectData(responseJson?.data?.stats)) return responseJson.data.stats;
  if (hasObjectData(responseJson?.meta?.stats)) return responseJson.meta.stats;
  if (hasObjectData(responseJson?.data?.meta?.stats)) return responseJson.data.meta.stats;
  return {};
}

/**
 * Props:
 * - stats?: optional stats from parent (overrides API stats if provided)
 * - properties?: optional properties from parent (overrides API list if provided)
 * - token?: optional bearer token (if not passed, tries localStorage)
 * - endpoint?: optional custom endpoint path (default admin properties route)
 */
function PropertyStats({
  stats,
  properties = [],
  token,
  endpoint = "/api/admin/property/properties",
}) {
  const [apiProperties, setApiProperties] = useState([]);
  const [apiStats, setApiStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchProperties() {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const url = joinUrl(baseUrl, endpoint);
      const authToken = readStoredToken(token);

      setLoading(true);
      setApiError("");

      try {
        const headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
        };

        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`;
        }

        const res = await fetch(url, {
          method: "GET",
          headers,
          credentials: "include", // supports Sanctum cookie auth too
          signal: controller.signal,
        });

        const rawText = await res.text();
        let data = {};

        try {
          data = rawText ? JSON.parse(rawText) : {};
        } catch {
          throw new Error("Invalid JSON response from server.");
        }

        if (!res.ok) {
          const message =
            data?.message ||
            data?.error ||
            `Request failed (${res.status})`;
          throw new Error(message);
        }

        if (!isMounted) return;

        setApiProperties(extractProperties(data));
        setApiStats(extractStats(data));
      } catch (err) {
        if (err.name === "AbortError") return;
        if (!isMounted) return;

        setApiError(
          err?.message ||
            "Failed to load properties. Check API URL, endpoint, and auth token."
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProperties();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [endpoint, token]);

  // If parent passed props, use them first; otherwise use API data
  const effectiveProperties =
    Array.isArray(properties) && properties.length > 0 ? properties : apiProperties;

  const effectiveStats = hasObjectData(stats) ? stats : apiStats;

  const computed = useMemo(() => {
    const list = Array.isArray(effectiveProperties) ? effectiveProperties : [];

    const fromProps = {
      total: list.length,
      live: 0,
      onboarding: 0,
      draft: 0,
      inactive: 0,
      contacted: 0,
      documentsPending: 0,
    };

    for (const item of list) {
      const stage = normalizeStage(item?.onboardingStage ?? item?.onboarding_stage);

      if (stage === "live") fromProps.live += 1;
      else if (stage === "onboarding") fromProps.onboarding += 1;
      else if (stage === "draft") fromProps.draft += 1;
      else if (stage === "inactive") fromProps.inactive += 1;
      else if (stage === "contacted") fromProps.contacted += 1;
      else if (stage === "documents pending") fromProps.documentsPending += 1;
    }

    const hasStatsProp = hasObjectData(effectiveStats);

    if (!hasStatsProp) return fromProps;

    return {
      total: toSafeNumber(effectiveStats?.total ?? fromProps.total),
      live: toSafeNumber(effectiveStats?.live ?? fromProps.live),
      onboarding: toSafeNumber(effectiveStats?.onboarding ?? fromProps.onboarding),
      draft: toSafeNumber(effectiveStats?.draft ?? fromProps.draft),
      inactive: toSafeNumber(effectiveStats?.inactive ?? fromProps.inactive),
      contacted: toSafeNumber(effectiveStats?.contacted ?? fromProps.contacted),
      documentsPending: toSafeNumber(
        effectiveStats?.documentsPending ??
          effectiveStats?.documents_pending ??
          fromProps.documentsPending
      ),
    };
  }, [effectiveStats, effectiveProperties]);

  return (
    <div className="space-y-3">
      {apiError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {apiError}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          Loading property stats...
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Properties"
          value={computed.total}
          sub="All records"
          emoji="🏨"
        />

        <StatCard
          title="Live"
          value={computed.live}
          sub={`${percent(computed.live, computed.total)} of total`}
          emoji="✅"
        />

        <StatCard
          title="Onboarding"
          value={computed.onboarding}
          sub={`${percent(computed.onboarding, computed.total)} of total`}
          emoji="🚀"
        />

        <StatCard
          title="Draft"
          value={computed.draft}
          sub={`${percent(computed.draft, computed.total)} of total`}
          emoji="📝"
        />
      </div>
    </div>
  );
}

export default memo(PropertyStats);