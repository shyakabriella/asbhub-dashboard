// src/pages/PropertyPage/PropertyForm.jsx

import React, { memo, useEffect, useMemo, useState } from "react";
import {
  COUNTRIES,
  OTA_STATUSES,
  ONBOARDING_STAGES,
  PROPERTY_TYPES,
  SEO_STATUSES,
  SERVICE_OPTIONS,
  STAR_RATINGS,
} from "./property.constants";

const STEPS = [
  { id: 1, title: "Basic Info" },
  { id: 2, title: "Contact" },
  { id: 3, title: "Status & Services" },
  { id: 4, title: "Notes & Save" },
];

const MAX_LOGO_SIZE_MB = 5;

function FieldLabel({ children, required = false }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {children} {required ? <span className="text-rose-600">*</span> : null}
    </label>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-purple-700 focus:ring-2 focus:ring-purple-100 ${className}`}
    />
  );
}

function Select({ className = "", children, ...props }) {
  return (
    <select
      {...props}
      className={`mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-purple-700 focus:ring-2 focus:ring-purple-100 ${className}`}
    >
      {children}
    </select>
  );
}

function TextArea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={`mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-purple-700 focus:ring-2 focus:ring-purple-100 ${className}`}
    />
  );
}

// ---- Helpers for fetch submit ----
function buildPropertyFormData(form, editingId) {
  const fd = new FormData();

  fd.append("property_name", form?.propertyName || "");
  fd.append("property_type", form?.propertyType || "");
  fd.append("star_rating", form?.starRating || "");
  fd.append("country", form?.country || "");
  fd.append("city", form?.city || "");
  fd.append("address", form?.address || "");

  fd.append("contact_person", form?.contactPerson || "");
  fd.append("phone", form?.phone || "");
  fd.append("email", form?.email || "");

  fd.append("onboarding_stage", form?.onboardingStage || "");
  fd.append("ota_status", form?.otaStatus || "");
  fd.append("seo_status", form?.seoStatus || "");
  fd.append("notes", form?.notes || "");

  (Array.isArray(form?.services) ? form.services : []).forEach((service) => {
    fd.append("services[]", service);
  });

  if (typeof File !== "undefined" && form?.logoFile instanceof File) {
    fd.append("logo", form.logoFile);
  }

  if (form?.removeLogo) {
    fd.append("remove_logo", "1");
  }

  if (editingId) {
    fd.append("_method", "PUT");
  }

  return fd;
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
  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }
  return "";
}

function isLaravelRouteNotFoundMessage(message) {
  if (!message) return false;
  return /the route .* could not be found\.?/i.test(String(message));
}

function normalizeFetchError(status, data) {
  if (status === 422 && data?.errors) {
    const firstKey = Object.keys(data.errors)[0];
    return data.errors[firstKey]?.[0] || "Validation failed.";
  }

  const backendMessage = getBackendMessage(data);

  // Hide/replace ugly Laravel route text
  if (isLaravelRouteNotFoundMessage(backendMessage)) {
    return "API endpoint not found. Please check API base URL.";
  }

  if (status === 401) return "Unauthenticated. Please login first.";
  if (status === 403) return "Forbidden.";
  if (status === 404) return "API endpoint not found. Please check API base URL.";
  if (status >= 500) return "Server error. Please check Laravel logs.";

  if (backendMessage) return backendMessage;

  return "Request failed.";
}

function normalizeClientSideError(err) {
  const msg = err?.message || "";

  if (/Failed to fetch/i.test(msg)) {
    return "Cannot connect to API server. Make sure Laravel is running on http://127.0.0.1:8000.";
  }

  if (isLaravelRouteNotFoundMessage(msg)) {
    return "API endpoint not found. Please check API base URL.";
  }

  return msg || "Something went wrong.";
}

function PropertyForm({
  form,
  editingId,
  error,
  onChange,
  onToggleService,
  onSubmit,
  onReset,
  isSubmitting = false,

  // direct fetch mode
  useFetchSubmit = true,
  apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  authToken,
  withCredentials = false, // true only if using Sanctum cookie auth
  onSaveSuccess,
}) {
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState("");
  const [filePreview, setFilePreview] = useState("");
  const [logoError, setLogoError] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [internalSubmitting, setInternalSubmitting] = useState(false);

  const effectiveSubmitting = isSubmitting || internalSubmitting;

  // ✅ In internal fetch mode, ignore parent error to avoid stale old errors
  const effectiveError = submitError || (useFetchSubmit ? "" : error);

  // ✅ final error shown in UI (hide raw Laravel route message if parent still passes it)
  const displayError =
    typeof effectiveError === "string" && isLaravelRouteNotFoundMessage(effectiveError)
      ? ""
      : effectiveError;

  useEffect(() => {
    setStep(1);
    setStepError("");
    setLogoError("");
    setSubmitError("");
    setSubmitSuccess("");
    setFileInputKey((k) => k + 1);
  }, [editingId]);

  useEffect(() => {
    if (typeof File !== "undefined" && form?.logoFile instanceof File) {
      const url = URL.createObjectURL(form.logoFile);
      setFilePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setFilePreview("");
  }, [form?.logoFile]);

  const previewLogo = useMemo(() => {
    if (form?.removeLogo) return "";
    return filePreview || form?.logo || "";
  }, [filePreview, form?.logo, form?.removeLogo]);

  const selectedServices = Array.isArray(form?.services) ? form.services : [];
  const isLastStep = step === STEPS.length;

  const clearMessages = () => {
    if (stepError) setStepError("");
    if (logoError) setLogoError("");
    if (submitError) setSubmitError("");
    if (submitSuccess) setSubmitSuccess("");
  };

  const wrappedOnChange = (e) => {
    clearMessages();

    const target = e?.target;
    if (!target) {
      onChange?.(e);
      return;
    }

    const { name, type } = target;

    if (type === "file") {
      const file = target.files?.[0] || null;

      if (file && file.size > MAX_LOGO_SIZE_MB * 1024 * 1024) {
        setLogoError(
          `Logo image is too large. Please use an image under ${MAX_LOGO_SIZE_MB}MB.`
        );
        return;
      }

      onChange?.({
        target: {
          name,
          type: "file",
          files: file ? [file] : [],
          value: file,
        },
      });
      return;
    }

    if (type === "checkbox") {
      onChange?.({
        target: {
          name,
          type: "checkbox",
          checked: !!target.checked,
          value: !!target.checked,
        },
      });
      return;
    }

    onChange?.(e);
  };

  const wrappedToggleService = (service) => {
    clearMessages();
    onToggleService?.(service);
  };

  const handleResetClick = () => {
    setStep(1);
    setStepError("");
    setLogoError("");
    setSubmitError("");
    setSubmitSuccess("");
    setFileInputKey((k) => k + 1);
    onReset?.();
  };

  const validateCurrentStep = () => {
    if (step === 1) {
      if (!form?.propertyName?.trim()) return "Property name is required.";
      if (!form?.city?.trim()) return "City is required.";
      return "";
    }

    if (step === 2) {
      if (!form?.contactPerson?.trim()) return "Contact person is required.";
      if (!form?.phone?.trim()) return "Phone number is required.";
      if (!form?.email?.trim()) return "Email is required.";
      return "";
    }

    return "";
  };

  const validateFinalBeforeSubmit = () => {
    if (!form?.propertyName?.trim()) return "Property name is required.";
    if (!form?.city?.trim()) return "City is required.";
    if (!form?.contactPerson?.trim()) return "Contact person is required.";
    if (!form?.phone?.trim()) return "Phone number is required.";
    if (!form?.email?.trim()) return "Email is required.";
    return "";
  };

  const handleNext = () => {
    const msg = validateCurrentStep();
    if (msg) {
      setStepError(msg);
      return;
    }

    setStepError("");
    setStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => {
    setStepError("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const submitWithFetch = async () => {
    const finalValidationError = validateFinalBeforeSubmit();
    if (finalValidationError) {
      setStepError(finalValidationError);
      return;
    }

    const base = String(apiBaseUrl || "").replace(/\/+$/, "");
    const url = editingId
      ? `${base}/api/admin/property/properties/${editingId}`
      : `${base}/api/admin/property/properties`;

    const payload = buildPropertyFormData(form, editingId);

    try {
      setInternalSubmitting(true);
      setSubmitError("");
      setSubmitSuccess("");

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
        method: "POST",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // do not set Content-Type for FormData
        },
        body: payload,
        ...(withCredentials ? { credentials: "include" } : {}),
      });

      const data = await parseResponseBody(res);

      if (!res.ok) {
        throw new Error(normalizeFetchError(res.status, data));
      }

      setSubmitSuccess(
        editingId ? "Property updated successfully ✅" : "Property saved successfully ✅"
      );

      onSaveSuccess?.(data);
      onReset?.();

      setStep(1);
      setFileInputKey((k) => k + 1);
    } catch (err) {
      console.error("Property save error:", err);
      setSubmitError(normalizeClientSideError(err));
    } finally {
      setInternalSubmitting(false);
    }
  };

  const handleFormSubmit = async (e) => {
    if (!isLastStep) {
      e.preventDefault();
      handleNext();
      return;
    }

    setStepError("");

    if (useFetchSubmit) {
      e.preventDefault();
      await submitWithFetch();
      return;
    }

    onSubmit?.(e);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-900">
          {editingId ? "Edit Property" : "Add Property"}
        </h2>

        {editingId ? (
          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
            Editing
          </span>
        ) : null}
      </div>

      {/* Stepper */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
          <span>
            Step {step} of {STEPS.length}
          </span>
          <span className="font-medium text-gray-700">{STEPS[step - 1].title}</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {STEPS.map((s) => {
            const done = s.id < step;
            const active = s.id === step;

            return (
              <div key={s.id} className="space-y-1">
                <div
                  className={`h-2 rounded-full transition ${
                    done ? "bg-emerald-500" : active ? "bg-purple-700" : "bg-gray-200"
                  }`}
                />
                <p
                  className={`truncate text-[11px] ${
                    active ? "font-semibold text-gray-900" : "text-gray-500"
                  }`}
                  title={s.title}
                >
                  {s.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Errors / success */}
      {stepError ? (
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {stepError}
        </div>
      ) : null}

      {logoError ? (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {logoError}
        </div>
      ) : null}

      {displayError ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {typeof displayError === "string"
            ? displayError
            : "Something went wrong. Please try again."}
        </div>
      ) : null}

      {submitSuccess ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {submitSuccess}
        </div>
      ) : null}

      <form onSubmit={handleFormSubmit} className="space-y-4">
        {/* STEP 1 */}
        {step === 1 ? (
          <>
            <div>
              <FieldLabel>Logo</FieldLabel>

              <div className="mt-2 flex items-start gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  {previewLogo ? (
                    <img
                      src={previewLogo}
                      alt="Property logo preview"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-xl">🏨</span>
                  )}
                </div>

                <div className="flex-1">
                  <Input
                    key={fileInputKey}
                    type="file"
                    name="logoFile"
                    accept=".png,.jpg,.jpeg,.webp,image/*"
                    onChange={wrappedOnChange}
                    className="mt-0 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Optional. PNG/JPG/WebP, max {MAX_LOGO_SIZE_MB}MB.
                  </p>

                  {editingId && (form?.logo || form?.logoFile) ? (
                    <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        name="removeLogo"
                        checked={!!form?.removeLogo}
                        onChange={wrappedOnChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      Remove current logo
                    </label>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel required>Property Name</FieldLabel>
                <Input
                  name="propertyName"
                  value={form?.propertyName || ""}
                  onChange={wrappedOnChange}
                  placeholder="e.g.Olympic Hotel"
                />
              </div>

              <div>
                <FieldLabel>Property Type</FieldLabel>
                <Select
                  name="propertyType"
                  value={form?.propertyType || "Hotel"}
                  onChange={wrappedOnChange}
                >
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <FieldLabel>Star Rating</FieldLabel>
                <Select
                  name="starRating"
                  value={form?.starRating || ""}
                  onChange={wrappedOnChange}
                >
                  <option value="">No rating</option>
                  {STAR_RATINGS.filter(Boolean).map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} Star
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <FieldLabel>Country</FieldLabel>
                <Select
                  name="country"
                  value={form?.country || "Rwanda"}
                  onChange={wrappedOnChange}
                >
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <FieldLabel required>City</FieldLabel>
                <Input
                  name="city"
                  value={form?.city || ""}
                  onChange={wrappedOnChange}
                  placeholder="e.g. Kigali"
                />
              </div>

              <div>
                <FieldLabel>Address</FieldLabel>
                <Input
                  name="address"
                  value={form?.address || ""}
                  onChange={wrappedOnChange}
                  placeholder="Street / Area"
                />
              </div>
            </div>
          </>
        ) : null}

        {/* STEP 2 */}
        {step === 2 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel required>Contact Person</FieldLabel>
              <Input
                name="contactPerson"
                value={form?.contactPerson || ""}
                onChange={wrappedOnChange}
                placeholder="Manager or Owner"
              />
            </div>

            <div>
              <FieldLabel required>Phone</FieldLabel>
              <Input
                name="phone"
                value={form?.phone || ""}
                onChange={wrappedOnChange}
                placeholder="+250..."
              />
            </div>

            <div className="sm:col-span-2">
              <FieldLabel required>Email</FieldLabel>
              <Input
                type="email"
                name="email"
                value={form?.email || ""}
                onChange={wrappedOnChange}
                placeholder="info@example.com"
              />
            </div>
          </div>
        ) : null}

        {/* STEP 3 */}
        {step === 3 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <FieldLabel>Onboarding Stage</FieldLabel>
                <Select
                  name="onboardingStage"
                  value={form?.onboardingStage || "Draft"}
                  onChange={wrappedOnChange}
                >
                  {ONBOARDING_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <FieldLabel>OTA Status</FieldLabel>
                <Select
                  name="otaStatus"
                  value={form?.otaStatus || "Not Started"}
                  onChange={wrappedOnChange}
                >
                  {OTA_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <FieldLabel>SEO Status</FieldLabel>
                <Select
                  name="seoStatus"
                  value={form?.seoStatus || "Not Started"}
                  onChange={wrappedOnChange}
                >
                  {SEO_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <FieldLabel>Services</FieldLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {SERVICE_OPTIONS.map((service) => {
                  const active = selectedServices.includes(service);

                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => wrappedToggleService(service)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? "border-purple-200 bg-purple-50 text-purple-700"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {active ? "✓ " : ""}
                      {service}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}

        {/* STEP 4 */}
        {step === 4 ? (
          <>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm font-semibold text-gray-800">Quick Review</p>
              <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-gray-600 sm:grid-cols-2">
                <p>
                  <span className="font-medium">Property:</span>{" "}
                  {form?.propertyName || "-"}
                </p>
                <p>
                  <span className="font-medium">Type:</span>{" "}
                  {form?.propertyType || "-"}
                </p>
                <p>
                  <span className="font-medium">Location:</span>{" "}
                  {form?.city || "-"}, {form?.country || "-"}
                </p>
                <p>
                  <span className="font-medium">Contact:</span>{" "}
                  {form?.contactPerson || "-"}
                </p>
                <p className="sm:col-span-2">
                  <span className="font-medium">Email:</span> {form?.email || "-"}
                </p>
              </div>
            </div>

            <div>
              <FieldLabel>Notes</FieldLabel>
              <TextArea
                name="notes"
                rows={4}
                value={form?.notes || ""}
                onChange={wrappedOnChange}
                placeholder="Add onboarding notes, pending documents, reminders..."
              />
            </div>
          </>
        ) : null}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={effectiveSubmitting}
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              ← Back
            </button>
          ) : null}

          {!isLastStep ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={effectiveSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-purple-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next →
            </button>
          ) : (
            <button
              type="submit"
              disabled={effectiveSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-purple-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {effectiveSubmitting
                ? editingId
                  ? "Updating..."
                  : "Saving..."
                : editingId
                ? "Update Property"
                : "Save Property"}
            </button>
          )}

          <button
            type="button"
            onClick={handleResetClick}
            disabled={effectiveSubmitting}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}

export default memo(PropertyForm);