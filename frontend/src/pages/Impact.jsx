import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiBox, FiCloud, FiUsers } from "react-icons/fi";

/**
 * ViewImpact page
 *
 * - Tailwind CSS (emerald theme) based layout
 * - Three stats cards: Items Shared, CO2 Saved (kg), Community Connections
 * - Simple responsive SVG bar chart for monthly impact
 * - "Back to Dashboard" button using useNavigate
 *
 * Usage:
 *  - Place this file in: frontend/src/pages/ViewImpact.jsx
 *  - Ensure Tailwind is configured for your project.
 *  - Install react-icons if not already: npm install react-icons
 */

const monthlyData = [
  { month: "Jan", value: 24 },
  { month: "Feb", value: 36 },
  { month: "Mar", value: 52 },
  { month: "Apr", value: 68 },
  { month: "May", value: 88 },
  { month: "Jun", value: 120 },
  { month: "Jul", value: 140 },
  { month: "Aug", value: 160 },
  { month: "Sep", value: 180 },
  { month: "Oct", value: 200 },
  { month: "Nov", value: 220 },
  { month: "Dec", value: 240 },
];

const stats = {
  itemsShared: 1248,
  co2Saved: 872.5,
  communityConnections: 342,
};

function formatNumber(n) {
  return n.toLocaleString();
}

const ViewImpact = () => {
  const navigate = useNavigate();

  const maxValue = Math.max(...monthlyData.map((d) => d.value));
  const chartHeight = 160; // px

  return (
    <div className="min-h-screen bg-emerald-50 text-emerald-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-emerald-700">View Impact</h1>
            <p className="text-sm text-emerald-600 mt-1">
              See how your community is reducing waste and saving emissions.
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow"
            aria-label="Back to Dashboard"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow border-l-4 border-emerald-400">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-md">
              <FiBox className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-emerald-600">Items Shared</div>
              <div className="text-2xl font-semibold text-emerald-800">
                {formatNumber(stats.itemsShared)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow border-l-4 border-emerald-400">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-md">
              <FiCloud className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-emerald-600">CO2 Saved (kg)</div>
              <div className="text-2xl font-semibold text-emerald-800">
                {formatNumber(stats.co2Saved)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow border-l-4 border-emerald-400">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-md">
              <FiUsers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-emerald-600">Community Connections</div>
              <div className="text-2xl font-semibold text-emerald-800">
                {formatNumber(stats.communityConnections)}
              </div>
            </div>
          </div>
        </div>

        {/* Chart Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-emerald-800">Monthly Impact Progress</h2>
            <div className="text-sm text-emerald-600">Last 12 months</div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${monthlyData.length * 48} ${chartHeight + 40}`}
              width="100%"
              height={chartHeight + 40}
              className="mx-auto"
              role="img"
              aria-label="Monthly impact bar chart"
            >
              {/* Y axis grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                const y = 10 + (1 - t) * chartHeight;
                const value = Math.round(maxValue * t);
                return (
                  <g key={i}>
                    <line
                      x1="0"
                      x2={monthlyData.length * 48}
                      y1={y}
                      y2={y}
                      stroke="#ecfdf5" /* emerald-50 */
                      strokeWidth="1"
                    />
                    <text
                      x={-6}
                      y={y + 4}
                      fontSize="10"
                      fill="#065f46"
                      textAnchor="end"
                      transform={`translate(24,0)`}
                    >
                      {value}
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {monthlyData.map((d, i) => {
                const barWidth = 28;
                const gap = 20;
                const x = i * (barWidth + gap) + 24;
                const height = (d.value / maxValue) * chartHeight;
                const y = 10 + (chartHeight - height);
                return (
                  <g key={d.month} transform={`translate(${x},0)`}>
                    <rect
                      x={0}
                      y={y}
                      width={barWidth}
                      height={height}
                      rx={6}
                      fill="#10b981" /* emerald-500 */
                      opacity="0.95"
                    />
                    <text
                      x={barWidth / 2}
                      y={chartHeight + 26}
                      fontSize="11"
                      fill="#065f46"
                      textAnchor="middle"
                    >
                      {d.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Small footer / tips */}
        <div className="mt-6 text-sm text-emerald-600">
          Tip: Update monthly values from your backend to show real-time community impact.
        </div>
      </div>
    </div>
  );
};

export default ViewImpact;
