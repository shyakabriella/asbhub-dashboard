import React, { useState } from "react";

export default function HomeHotelTeam() {
  const [teamTitle, setTeamTitle] = useState("");

  const save = () => {
    console.log("HomeHotelTeam:", teamTitle);
    alert("✅ Saved (demo)");
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        Team section title (later you can add team members CRUD).
      </div>

      <input
        value={teamTitle}
        onChange={(e) => setTeamTitle(e.target.value)}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(47,13,52,0.18)]"
        placeholder="Meet our Team"
      />

      <button
        onClick={save}
        className="rounded-xl bg-[#2F0D34] px-4 py-2 text-sm font-semibold text-white"
      >
        💾 Save Team
      </button>
    </div>
  );
}