import React, { useState } from "react";

export default function HomeHotelTitle() {
  const [title, setTitle] = useState("");

  const save = () => {
    console.log("HomeHotelTitle:", title);
    alert("✅ Saved (demo)");
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-gray-700">Hotel Section Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(47,13,52,0.18)]"
          placeholder="Discover our Hotel"
        />
      </div>

      <button
        onClick={save}
        className="rounded-xl bg-[#2F0D34] px-4 py-2 text-sm font-semibold text-white"
      >
        💾 Save Title
      </button>
    </div>
  );
}