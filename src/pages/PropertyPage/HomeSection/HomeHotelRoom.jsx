import React, { useState } from "react";

export default function HomeHotelRoom() {
  const [roomsTitle, setRoomsTitle] = useState("");

  const save = () => {
    console.log("HomeHotelRoom:", roomsTitle);
    alert("✅ Saved (demo)");
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        Rooms section title (later we can manage rooms list).
      </div>

      <input
        value={roomsTitle}
        onChange={(e) => setRoomsTitle(e.target.value)}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(47,13,52,0.18)]"
        placeholder="Our Rooms"
      />

      <button
        onClick={save}
        className="rounded-xl bg-[#2F0D34] px-4 py-2 text-sm font-semibold text-white"
      >
        💾 Save Rooms Section
      </button>
    </div>
  );
}