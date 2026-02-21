import React, { useState } from "react";

export default function HomeHotelView() {
  const [image, setImage] = useState(null);

  const save = () => {
    console.log("HomeHotelView:", image);
    alert("✅ Saved (demo)");
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        Upload image(s) used in Hotel View section (demo: 1 image).
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files?.[0] || null)}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
      />

      <button
        onClick={save}
        className="rounded-xl bg-[#2F0D34] px-4 py-2 text-sm font-semibold text-white"
      >
        💾 Save Hotel View
      </button>
    </div>
  );
}