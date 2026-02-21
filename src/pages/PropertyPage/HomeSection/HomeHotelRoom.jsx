import React, { useEffect, useMemo, useRef, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const ROOMS_ENDPOINT = `${API_BASE}/admin/property/rooms`;

export default function HomeHotelRoom() {
  const [roomsTitle, setRoomsTitle] = useState("Our Rooms");

  const [roomForm, setRoomForm] = useState({
    name: "",
    description: "",
    imageFiles: [],
    imagePreviews: [],
  });

  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [savingRooms, setSavingRooms] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState(null);
  const [errorText, setErrorText] = useState("");

  // ✅ Animated toast
  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success", // success | error | warning | info
  });

  // ✅ Animated delete confirm modal
  const [roomToDelete, setRoomToDelete] = useState(null);

  const fileInputRef = useRef(null);
  const toastTimerRef = useRef(null);

  // keep latest state for cleanup on unmount
  const roomsRef = useRef([]);
  const roomFormRef = useRef(roomForm);

  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  useEffect(() => {
    roomFormRef.current = roomForm;
  }, [roomForm]);

  const apiOrigin = useMemo(() => {
    try {
      return new URL(API_BASE).origin;
    } catch {
      return "";
    }
  }, [API_BASE]);

  // ✅ Read token from both localStorage and sessionStorage
  const getAuthToken = () => {
    return (
      localStorage.getItem("access_token") ||
      localStorage.getItem("auth_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("access_token") ||
      sessionStorage.getItem("auth_token") ||
      sessionStorage.getItem("token") ||
      ""
    );
  };

  const authHeaders = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const ensureAuth = () => {
    const token = getAuthToken();
    if (!token) {
      const msg = "Unauthorized. Please login first.";
      setErrorText(msg);
      notify(msg, "error");
      return false;
    }
    return true;
  };

  const notify = (message, type = "success") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    setToast({
      open: true,
      message,
      type,
    });

    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 2800);
  };

  const toAbsoluteUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/") && apiOrigin) return `${apiOrigin}${url}`;
    return url;
  };

  const normalizeApiRoom = (room) => {
    return {
      id: room.id,
      name: room.name || "",
      description: room.description || "",
      imageFiles: [],
      imagePreviews: Array.isArray(room.images)
        ? room.images
            .map((img) => toAbsoluteUrl(img.image_url || img.image_path))
            .filter(Boolean)
        : [],
      isPersisted: true,
    };
  };

  const cleanupPreviewUrls = (urls = []) => {
    urls.forEach((url) => {
      if (typeof url === "string" && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });
  };

  const onChangeField = (field, value) => {
    setRoomForm((prev) => ({ ...prev, [field]: value }));
  };

  const onImagesChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    if (files.length > 3) {
      notify("Please select maximum 3 images for one room.", "warning");
      e.target.value = "";
      return;
    }

    cleanupPreviewUrls(roomForm.imagePreviews);

    const previews = files.map((file) => URL.createObjectURL(file));

    setRoomForm((prev) => ({
      ...prev,
      imageFiles: files,
      imagePreviews: previews,
    }));
  };

  const resetForm = () => {
    cleanupPreviewUrls(roomForm.imagePreviews);

    setRoomForm({
      name: "",
      description: "",
      imageFiles: [],
      imagePreviews: [],
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    notify("Form reset", "info");
  };

  const addRoom = () => {
    if (!roomForm.name.trim()) {
      notify("Please enter room name", "warning");
      return;
    }

    if (!roomForm.description.trim()) {
      notify("Please enter room description", "warning");
      return;
    }

    if (roomForm.imageFiles.length === 0) {
      notify("Please select at least 1 room image", "warning");
      return;
    }

    if (roomForm.imageFiles.length > 3) {
      notify("One room can have maximum 3 images", "warning");
      return;
    }

    const newRoom = {
      id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: roomForm.name.trim(),
      description: roomForm.description.trim(),
      imageFiles: roomForm.imageFiles,
      imagePreviews: roomForm.imagePreviews,
      isPersisted: false,
    };

    setRooms((prev) => [...prev, newRoom]);

    setRoomForm({
      name: "",
      description: "",
      imageFiles: [],
      imagePreviews: [],
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    notify("Room added to list (not saved yet)", "success");
  };

  const getErrorMessage = async (res) => {
    let data = null;
    try {
      data = await res.json();
    } catch {
      // ignore
    }

    if (res.status === 401) {
      return "Unauthorized. Please login again.";
    }

    if (data?.errors && typeof data.errors === "object") {
      const lines = Object.values(data.errors).flat().join("\n");
      return lines || data?.message || "Request failed.";
    }

    return data?.message || `Request failed with status ${res.status}`;
  };

  const fetchRooms = async () => {
    if (!ensureAuth()) return;

    setLoadingRooms(true);
    setErrorText("");

    try {
      const res = await fetch(ROOMS_ENDPOINT, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...authHeaders(),
        },
      });

      if (!res.ok) {
        throw new Error(await getErrorMessage(res));
      }

      const data = await res.json();
      const serverRooms = Array.isArray(data?.data) ? data.data : [];
      setRooms(serverRooms.map(normalizeApiRoom));
    } catch (err) {
      console.error("Fetch rooms error:", err);
      setErrorText(err.message || "Failed to load rooms.");
      notify(err.message || "Failed to load rooms.", "error");
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

      roomsRef.current.forEach((room) => {
        if (!room.isPersisted) cleanupPreviewUrls(room.imagePreviews);
      });

      cleanupPreviewUrls(roomFormRef.current.imagePreviews);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const askRemoveRoom = (room) => {
    setRoomToDelete(room);
  };

  const confirmRemoveRoom = async () => {
    const room = roomToDelete;
    if (!room) return;

    // local only
    if (!room.isPersisted) {
      cleanupPreviewUrls(room.imagePreviews);
      setRooms((prev) => prev.filter((r) => r.id !== room.id));
      setRoomToDelete(null);
      notify(`Removed "${room.name}"`, "info");
      return;
    }

    if (!ensureAuth()) {
      setRoomToDelete(null);
      return;
    }

    setDeletingRoomId(room.id);
    setErrorText("");

    try {
      const res = await fetch(`${ROOMS_ENDPOINT}/${room.id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          ...authHeaders(),
        },
      });

      if (!res.ok) {
        throw new Error(await getErrorMessage(res));
      }

      setRooms((prev) => prev.filter((r) => r.id !== room.id));
      notify(`Deleted "${room.name}"`, "success");
    } catch (err) {
      console.error("Delete room error:", err);
      setErrorText(err.message || "Failed to delete room.");
      notify(err.message || "Failed to delete room.", "error");
    } finally {
      setDeletingRoomId(null);
      setRoomToDelete(null);
    }
  };

  const save = async () => {
    if (!ensureAuth()) return;

    const unsavedRooms = rooms.filter((room) => !room.isPersisted);

    if (unsavedRooms.length === 0) {
      notify("No new rooms to save.", "info");
      return;
    }

    setSavingRooms(true);
    setErrorText("");

    try {
      let nextRooms = [...rooms];

      for (let index = 0; index < unsavedRooms.length; index++) {
        const room = unsavedRooms[index];

        const formData = new FormData();
        formData.append("name", room.name);
        formData.append("description", room.description);

        // ✅ better sort_order based on current list position
        const currentIndex = nextRooms.findIndex((r) => r.id === room.id);
        formData.append("sort_order", String(currentIndex >= 0 ? currentIndex : index));

        room.imageFiles.forEach((file) => {
          formData.append("images[]", file);
        });

        const res = await fetch(ROOMS_ENDPOINT, {
          method: "POST",
          headers: {
            Accept: "application/json",
            ...authHeaders(),
          },
          body: formData,
        });

        if (!res.ok) {
          throw new Error(await getErrorMessage(res));
        }

        const data = await res.json();
        const savedRoom = normalizeApiRoom(data?.data || {});

        cleanupPreviewUrls(room.imagePreviews);

        nextRooms = nextRooms.map((r) => (r.id === room.id ? savedRoom : r));
        setRooms(nextRooms);
      }

      notify("Rooms saved successfully ✅", "success");
    } catch (err) {
      console.error("Save rooms error:", err);
      setErrorText(err.message || "Failed to save rooms.");
      notify(err.message || "Failed to save rooms.", "error");
    } finally {
      setSavingRooms(false);
    }
  };

  const toastStyle = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    warning: "bg-amber-500 text-white",
    info: "bg-slate-800 text-white",
  };

  return (
    <div className="space-y-4 relative">
      {/* ✅ Animated Toast */}
      <div className="pointer-events-none fixed top-4 right-4 z-[9999]">
        <div
          className={[
            "min-w-[260px] max-w-sm rounded-xl shadow-lg px-4 py-3 text-sm font-medium",
            "transition-all duration-300 ease-out",
            toastStyle[toast.type] || toastStyle.info,
            toast.open
              ? "translate-y-0 opacity-100"
              : "-translate-y-3 opacity-0",
          ].join(" ")}
        >
          {toast.message}
        </div>
      </div>

      {/* ✅ Animated Confirm Modal */}
      <div
        className={[
          "fixed inset-0 z-[9998] flex items-center justify-center p-4",
          "transition-all duration-300",
          roomToDelete
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setRoomToDelete(null)}
        />

        <div
          className={[
            "relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 p-5",
            "transition-all duration-300",
            roomToDelete ? "scale-100 translate-y-0" : "scale-95 translate-y-2",
          ].join(" ")}
        >
          <h3 className="text-base font-bold text-gray-900">Delete Room</h3>
          <p className="mt-2 text-sm text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">
              {roomToDelete?.name}
            </span>
            ? This action cannot be undone.
          </p>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRoomToDelete(null)}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmRemoveRoom}
              disabled={!!deletingRoomId}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {deletingRoomId ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        Rooms section title and room items (up to 3 images, name, description).
      </div>

      {errorText && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 whitespace-pre-line">
          {errorText}
        </div>
      )}

      {/* Section title (UI only for now) */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Rooms Section Title
        </label>
        <input
          value={roomsTitle}
          onChange={(e) => setRoomsTitle(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(47,13,52,0.18)]"
          placeholder="Our Rooms"
        />
      </div>

      {/* Add room form */}
      <div className="rounded-2xl border border-gray-200 p-4 space-y-3 bg-white">
        <h3 className="text-sm font-semibold text-gray-800">Add Room</h3>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Room Images (max 3)
          </label>
          <input
            ref={fileInputRef}
            id="room-images-input"
            type="file"
            accept="image/*"
            multiple
            onChange={onImagesChange}
            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-[#2F0D34] file:px-3 file:py-2 file:text-white hover:file:opacity-90"
          />
          <p className="mt-1 text-xs text-gray-500">
            You can upload 1 to 3 images for one room.
          </p>
        </div>

        {roomForm.imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {roomForm.imagePreviews.map((src, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-xl border border-gray-200"
              >
                <img
                  src={src}
                  alt={`Room preview ${index + 1}`}
                  className="h-28 w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Room Name
          </label>
          <input
            value={roomForm.name}
            onChange={(e) => onChangeField("name", e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(47,13,52,0.18)]"
            placeholder="Deluxe Room"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={roomForm.description}
            onChange={(e) => onChangeField("description", e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(47,13,52,0.18)]"
            placeholder="Spacious room with city view, king bed, free Wi-Fi..."
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addRoom}
            className="rounded-xl bg-[#2F0D34] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            ➕ Add Room
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Reset Form
          </button>
        </div>
      </div>

      {/* Rooms list preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-800">
            Rooms ({rooms.length})
          </h3>

          <button
            type="button"
            onClick={fetchRooms}
            disabled={loadingRooms || savingRooms}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {loadingRooms ? "Loading..." : "Reload"}
          </button>
        </div>

        {loadingRooms ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            Loading rooms...
          </div>
        ) : rooms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            No rooms added yet.
          </div>
        ) : (
          rooms.map((room) => (
            <div
              key={room.id}
              className="rounded-2xl border border-gray-200 p-3 bg-white"
            >
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {room.imagePreviews.map((src, imgIndex) => (
                    <img
                      key={imgIndex}
                      src={src}
                      alt={`${room.name} ${imgIndex + 1}`}
                      className="h-24 w-full rounded-xl object-cover border border-gray-200"
                    />
                  ))}
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {room.name}
                      </h4>

                      {room.isPersisted ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                          Saved
                        </span>
                      ) : (
                        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-semibold text-yellow-700">
                          Not saved
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
                      {room.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => askRemoveRoom(room)}
                    disabled={deletingRoomId === room.id}
                    className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    {deletingRoomId === room.id ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Save */}
      <button
        onClick={save}
        disabled={savingRooms}
        className="rounded-xl bg-[#2F0D34] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {savingRooms ? "Saving..." : "Save Rooms Section"}
      </button>
    </div>
  );
}