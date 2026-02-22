// src/pages/PropertyPage/Property.jsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropertyForm from "./PropertyForm";
import PropertyList from "./PropertyList";
import PropertyStats from "./PropertyStats";
import { createEmptyForm } from "./property.constants";

/**
 * ✅ API config
 * Supports both VITE_API_URL and VITE_API_BASE_URL
 */
const API_BASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000"
).replace(/\/+$/, "");

const joinUrl = (base, path) =>
  `${String(base).replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;

const PROPERTIES_URL = joinUrl(API_BASE, "/api/admin/property/properties");

/**
 * ✅ Token helper
 */
const getAuthToken = () =>
  localStorage.getItem("auth_token") ||
  localStorage.getItem("token") ||
  localStorage.getItem("access_token") ||
  sessionStorage.getItem("auth_token") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("access_token") ||
  "";

/**
 * ✅ Safe JSON parse helper (works even if backend returns HTML error page)
 */
async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

/**
 * ✅ snake_case (API) -> camelCase (UI)
 */
function mapApiPropertyToUi(p) {
  let logoUrl = "";

  if (p?.logo_url) {
    logoUrl = p.logo_url;
  } else if (p?.logo) {
    logoUrl = String(p.logo).startsWith("http")
      ? p.logo
      : joinUrl(API_BASE, `/storage/${String(p.logo).replace(/^\/+/, "")}`);
  }

  let services = [];
  if (Array.isArray(p?.services)) {
    services = p.services;
  } else if (typeof p?.services === "string") {
    try {
      const parsed = JSON.parse(p.services);
      services = Array.isArray(parsed) ? parsed : [];
    } catch {
      services = [];
    }
  }

  return {
    id: p?.id,
    logo: logoUrl,
    logoFile: null,
    removeLogo: false,

    propertyName: p?.property_name || "",
    propertyType: p?.property_type || "Hotel",
    starRating: p?.star_rating || "",

    contactPerson: p?.contact_person || "",
    phone: p?.phone || "",
    email: p?.email || "",

    country: p?.country || "Rwanda",
    city: p?.city || "",
    address: p?.address || "",

    onboardingStage: p?.onboarding_stage || "Draft",
    otaStatus: p?.ota_status || "Not Started",
    seoStatus: p?.seo_status || "Not Started",

    services,
    notes: p?.notes || "",
    createdAt: p?.created_at || "",
  };
}

/**
 * ✅ Extract list from different Laravel response shapes
 */
function extractPropertyList(data) {
  // Common shapes:
  // { data: [...] }
  // { data: { data: [...] } }  (paginator nested)
  // [...]
  // { properties: [...] }
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.data)) return data.data.data;
  if (Array.isArray(data?.properties)) return data.properties;
  return [];
}

export default function Property() {
  const [form, setForm] = useState(createEmptyForm);
  const [properties, setProperties] = useState([]);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * ✅ Frontend filter
   */
  const filteredProperties = useMemo(() => {
    const q = search.trim().toLowerCase();

    return properties.filter((p) => {
      const matchesSearch =
        q === "" ||
        String(p?.propertyName || "").toLowerCase().includes(q) ||
        String(p?.city || "").toLowerCase().includes(q) ||
        String(p?.contactPerson || "").toLowerCase().includes(q) ||
        String(p?.email || "").toLowerCase().includes(q);

      const matchesStage =
        stageFilter === "All" || p?.onboardingStage === stageFilter;

      return matchesSearch && matchesStage;
    });
  }, [properties, search, stageFilter]);

  /**
   * ✅ Stats
   */
  const stats = useMemo(() => {
    const total = properties.length;
    const live = properties.filter((p) => p?.onboardingStage === "Live").length;
    const onboarding = properties.filter(
      (p) => p?.onboardingStage === "Onboarding"
    ).length;
    const draft = properties.filter(
      (p) => p?.onboardingStage === "Draft"
    ).length;

    return { total, live, onboarding, draft };
  }, [properties]);

  /**
   * ✅ Validation
   */
  const validateForm = useCallback(() => {
    if (!form.propertyName?.trim()) return "Property name is required.";
    if (!form.contactPerson?.trim()) return "Contact person is required.";
    if (!form.phone?.trim()) return "Phone number is required.";
    if (!form.email?.trim()) return "Email is required.";
    if (!form.city?.trim()) return "City is required.";
    return "";
  }, [form]);

  /**
   * ✅ Generic form change (safe for text/select/file/checkbox)
   */
  const handleChange = useCallback(
    (e) => {
      const target = e?.target;
      if (!target || !target.name) return;

      const { name, type, value, checked, files } = target;

      setForm((prev) => {
        const next = { ...prev };

        if (type === "checkbox") {
          next[name] = checked;

          // If user removes logo, clear selected file
          if (name === "removeLogo" && checked) {
            next.logoFile = null;
          }
        } else if (type === "file") {
          next[name] = files?.[0] || null;

          // selecting a file means do not remove logo
          if (name === "logoFile" && (files?.[0] || null)) {
            next.removeLogo = false;
          }
        } else {
          next[name] = value;
        }

        return next;
      });

      if (error) setError("");
      if (success) setSuccess("");
    },
    [error, success]
  );

  /**
   * ✅ Services toggle
   */
  const toggleService = useCallback(
    (service) => {
      setForm((prev) => {
        const prevServices = Array.isArray(prev.services) ? prev.services : [];
        const exists = prevServices.includes(service);

        return {
          ...prev,
          services: exists
            ? prevServices.filter((s) => s !== service)
            : [...prevServices, service],
        };
      });

      if (error) setError("");
      if (success) setSuccess("");
    },
    [error, success]
  );

  /**
   * ✅ Reset
   */
  const resetForm = useCallback(() => {
    setForm(createEmptyForm());
    setEditingId(null);
    setError("");
    setSuccess("");
  }, []);

  /**
   * ✅ Load properties
   */
  const fetchProperties = useCallback(async (signal) => {
    try {
      setIsLoading(true);
      setError("");

      const token = getAuthToken();

      const headers = {
        Accept: "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(PROPERTIES_URL, {
        method: "GET",
        headers,
        credentials: "include", // ✅ supports Sanctum cookie auth too
        signal,
      });

      const data = await parseJsonSafe(res);

      if (!res.ok) {
        throw new Error(
          data?.message ||
            (res.status === 401
              ? "Unauthorized. Please log in again."
              : res.status === 404
              ? "API route not found. Check VITE_API_URL and endpoint."
              : "Failed to load properties.")
        );
      }

      const list = extractPropertyList(data);
      setProperties(list.map(mapApiPropertyToUi));
    } catch (err) {
      if (err?.name === "AbortError") return;
      setError(err?.message || "Failed to load properties.");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchProperties(controller.signal);
    return () => controller.abort();
  }, [fetchProperties]);

  /**
   * ✅ Submit create/update
   */
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        return;
      }

      try {
        setIsSubmitting(true);
        setError("");
        setSuccess("");

        const token = getAuthToken();
        const headers = { Accept: "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const fd = new FormData();

        // Laravel expects snake_case
        fd.append("property_name", form.propertyName || "");
        fd.append("property_type", form.propertyType || "Hotel");
        fd.append("star_rating", form.starRating || "");

        fd.append("contact_person", form.contactPerson || "");
        fd.append("phone", form.phone || "");
        fd.append("email", form.email || "");

        fd.append("country", form.country || "Rwanda");
        fd.append("city", form.city || "");
        fd.append("address", form.address || "");

        fd.append("onboarding_stage", form.onboardingStage || "Draft");
        fd.append("ota_status", form.otaStatus || "Not Started");
        fd.append("seo_status", form.seoStatus || "Not Started");

        fd.append("services", JSON.stringify(form.services || []));
        fd.append("notes", form.notes || "");

        if (form.logoFile instanceof File) {
          fd.append("logo", form.logoFile);
        }

        if (editingId && form.removeLogo) {
          fd.append("remove_logo", "1");
        }

        let url = PROPERTIES_URL;

        // Laravel update via POST + _method=PUT
        if (editingId) {
          url = `${PROPERTIES_URL}/${editingId}`;
          fd.append("_method", "PUT");
        }

        const res = await fetch(url, {
          method: "POST",
          headers,
          body: fd,
          credentials: "include",
        });

        const data = await parseJsonSafe(res);

        if (!res.ok) {
          const firstValidationError =
            data?.errors && typeof data.errors === "object"
              ? Object.values(data.errors)?.[0]?.[0]
              : null;

          throw new Error(
            firstValidationError ||
              data?.message ||
              (editingId
                ? "Failed to update property."
                : "Failed to create property.")
          );
        }

        await fetchProperties();
        resetForm();

        setSuccess(
          editingId
            ? "Property updated successfully ✅"
            : "Property created successfully ✅"
        );
      } catch (err) {
        setError(err?.message || "Failed to save property.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingId, fetchProperties, form, resetForm, validateForm]
  );

  /**
   * ✅ Start edit
   */
  const startEdit = useCallback((property) => {
    setEditingId(property?.id ?? null);
    setError("");
    setSuccess("");

    setForm({
      logo: property?.logo || "",
      logoFile: null,
      removeLogo: false,

      propertyName: property?.propertyName || "",
      propertyType: property?.propertyType || "Hotel",
      starRating: property?.starRating || "",

      contactPerson: property?.contactPerson || "",
      phone: property?.phone || "",
      email: property?.email || "",

      country: property?.country || "Rwanda",
      city: property?.city || "",
      address: property?.address || "",

      onboardingStage: property?.onboardingStage || "Draft",
      otaStatus: property?.otaStatus || "Not Started",
      seoStatus: property?.seoStatus || "Not Started",

      services: Array.isArray(property?.services) ? property.services : [],
      notes: property?.notes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /**
   * ✅ Delete
   */
  const handleDelete = useCallback(
    async (id) => {
      const confirmed = window.confirm("Delete this property?");
      if (!confirmed) return;

      try {
        setError("");
        setSuccess("");

        const token = getAuthToken();
        const headers = { Accept: "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${PROPERTIES_URL}/${id}`, {
          method: "DELETE",
          headers,
          credentials: "include",
        });

        const data = await parseJsonSafe(res);

        if (!res.ok) {
          throw new Error(data?.message || "Failed to delete property.");
        }

        if (editingId === id) resetForm();

        await fetchProperties();
        setSuccess("Property deleted successfully ✅");
      } catch (err) {
        setError(err?.message || "Failed to delete property.");
      }
    },
    [editingId, fetchProperties, resetForm]
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Property Management
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Add and manage hotels, lodges, apartments, and other properties
                for AshbHub onboarding (OTA, SEO, and more).
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => fetchProperties()}
                type="button"
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                ↻ Refresh
              </button>
              <button
                onClick={resetForm}
                type="button"
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                + New Property
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        {/* Stats */}
        <PropertyStats stats={stats} properties={properties} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          {/* Form */}
          <div className="xl:col-span-2">
            <PropertyForm
              form={form}
              editingId={editingId}
              error={error}
              onChange={handleChange}
              onToggleService={toggleService}
              onSubmit={handleSubmit}
              onReset={resetForm}
              isSubmitting={isSubmitting}
            />
          </div>

          {/* List */}
          <div className="xl:col-span-3">
            <PropertyList
              properties={filteredProperties}
              search={search}
              setSearch={setSearch}
              stageFilter={stageFilter}
              setStageFilter={setStageFilter}
              onEdit={startEdit}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}