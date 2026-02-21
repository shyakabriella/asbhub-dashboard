import React from "react";

const BRAND = {
  purple: "#2F0D34",
  gold: "#BD9F75",
};

function StatCard({ title, value, subText, icon = "⚡", positive = true }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-gray-500">{title}</div>

          <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>

          <div
            className={`mt-1 text-xs ${
              positive ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {subText}
          </div>
        </div>

        {/* ✅ softer icon pill (gold border, not heavy yellow) */}
        <div
          className="h-10 w-10 rounded-2xl flex items-center justify-center border"
          style={{
            borderColor: "rgba(189,159,117,0.35)",
            backgroundColor: "rgba(189,159,117,0.14)",
          }}
        >
          <span className="text-base">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children, right }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {right ? right : null}
      </div>

      {/* ✅ tiny accent line */}
      <div
        className="mt-3 h-[2px] w-10 rounded-full"
        style={{ backgroundColor: "rgba(47,13,52,0.15)" }}
      />

      <div className="mt-4">{children}</div>
    </div>
  );
}

function MiniBarChart() {
  const bars = [
    { day: "Mon", v: 60 },
    { day: "Tue", v: 35 },
    { day: "Wed", v: 20 },
    { day: "Thu", v: 55 },
    { day: "Fri", v: 15 },
  ];

  return (
    <div>
      <div className="flex items-end gap-4 h-40">
        {bars.map((b) => (
          <div key={b.day} className="flex flex-col items-center gap-2">
            <div
              className="w-10 rounded-xl"
              style={{
                height: `${b.v * 2}px`,
                background:
                  "linear-gradient(180deg, rgba(47,13,52,0.85) 0%, rgba(189,159,117,0.95) 100%)",
              }}
              title={`${b.v}`}
            />
            <div className="text-[11px] text-gray-500">{b.day}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-gray-500">
        Revenue generation (demo chart)
      </div>
    </div>
  );
}

function FakePie() {
  // ✅ softer pro colors (not bright red/green)
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
      <div
        className="h-36 w-36 sm:h-40 sm:w-40 rounded-full"
        style={{
          background:
            "conic-gradient(rgba(47,13,52,0.85) 0 30%, rgba(189,159,117,0.95) 30% 70%, rgba(17,24,39,0.35) 70% 100%)",
        }}
      />

      <div className="space-y-2 text-sm w-full max-w-sm">
        {[
          { label: "Accepted", pct: "30%", color: "rgba(47,13,52,0.85)" },
          { label: "Pending", pct: "40%", color: "rgba(189,159,117,0.95)" },
          { label: "Rejected", pct: "30%", color: "rgba(17,24,39,0.35)" },
        ].map((x) => (
          <div key={x.label} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: x.color }}
            />
            <span className="text-gray-700">{x.label}</span>
            <span className="ml-auto text-gray-500">{x.pct}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminIndex() {
  return (
    <div className="space-y-5">
      {/* ✅ Welcome (clean, premium) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Welcome Back Alex Morgan 👋
          </h2>
          <p className="text-sm text-gray-500">Updates: Today, 10:30 AM</p>
        </div>

        {/* ✅ Primary button: purple with gold focus ring */}
        <button
          className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white
                     shadow-sm transition hover:brightness-95 active:brightness-90
                     focus:outline-none focus-visible:ring-2"
          style={{
            backgroundColor: BRAND.purple,
            border: "1px solid rgba(47,13,52,0.18)",
            boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
          }}
        >
          + New Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Task due today"
          value="12"
          subText="↑ 20% from yesterday"
          icon="⚠️"
          positive
        />
        <StatCard
          title="On boarding status"
          value="85%"
          subText="↑ 5% this week"
          icon="👥"
          positive
        />
        <StatCard
          title="Invoices due"
          value="4"
          subText="↓ 2% from target"
          icon="🧾"
          positive={false}
        />
        <StatCard
          title="Approvals pending"
          value="7"
          subText="↑ 10% workload"
          icon="✅"
          positive
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Revenue Generation" right={<span className="text-xs text-gray-400">⋯</span>}>
          <MiniBarChart />
        </Card>

        <Card title="Request Analysis" right={<span className="text-xs text-gray-400">⋯</span>}>
          <FakePie />
        </Card>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card
          title="Tasks"
          right={
            <button
              className="text-xs font-semibold hover:underline"
              style={{ color: BRAND.purple }}
            >
              View all
            </button>
          }
        >
          <div className="space-y-3">
            {[
              { t: "Finalize Q3 Compliance Report", due: "Due in 2 hours", tag: "Urgent" },
              { t: "Finance Q3 Compliance Report", due: "Due in 5 hours", tag: "Medium" },
              { t: "Finalize Q3 Compliance Report", due: "Due tomorrow", tag: "Low" },
              { t: "Finalize Q3 Compliance Report", due: "Due in 2 days", tag: "Low" },
            ].map((x, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-900">
                    {x.t}
                  </div>
                  <div className="text-xs text-gray-500">{x.due}</div>
                </div>

                {/* ✅ tags less yellow */}
                <span
                  className="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold border"
                  style={{
                    color: BRAND.purple,
                    borderColor: "rgba(189,159,117,0.45)",
                    backgroundColor: "rgba(189,159,117,0.14)",
                  }}
                >
                  {x.tag}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recent Activity" right={<span className="text-xs text-gray-400">⋯</span>}>
          <div className="space-y-3">
            {[
              { name: "Sarah M.", msg: "Uploaded a new client profile", time: "10 mins ago", icon: "👤" },
              { name: "John D.", msg: "Submitted a new invoice", time: "45 mins ago", icon: "🧾" },
              { name: "System", msg: "Automatically archived 12 items", time: "2 hours ago", icon: "⚙️" },
              { name: "Elena R.", msg: "Added a comment on Q3 compliance", time: "1 day ago", icon: "💬" },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center border"
                  style={{
                    borderColor: "rgba(47,13,52,0.10)",
                    backgroundColor: "rgba(47,13,52,0.06)",
                    color: BRAND.purple,
                  }}
                >
                  {a.icon}
                </div>

                <div className="flex-1">
                  <div className="text-sm text-gray-900">
                    <span className="font-semibold">{a.name}</span>{" "}
                    <span className="text-gray-600">{a.msg}</span>
                  </div>
                  <div className="text-xs text-gray-500">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        {["+ Create Client", "+ Create Task", "+ Create Invoice"].map((label) => (
          <button
            key={label}
            className="rounded-xl px-4 py-2 text-sm font-semibold transition
                       border border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}