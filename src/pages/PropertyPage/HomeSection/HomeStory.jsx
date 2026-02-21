import React, { useState } from "react";

export default function HomeStory() {
  const [story, setStory] = useState("");

  const save = () => {
    console.log("HomeStory:", story);
    alert("✅ Saved (demo)");
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">Write the Story section content.</div>

      <textarea
        value={story}
        onChange={(e) => setStory(e.target.value)}
        rows={6}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(47,13,52,0.18)]"
        placeholder="Our story..."
      />

      <button
        onClick={save}
        className="rounded-xl bg-[#2F0D34] px-4 py-2 text-sm font-semibold text-white"
      >
        💾 Save Story
      </button>
    </div>
  );
}