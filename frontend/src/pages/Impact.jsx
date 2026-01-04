import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiBox, FiCloud, FiUsers } from "react-icons/fi";

const ViewImpact = () => {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    itemsShared: 0,
    co2Saved: "0.0",
    communityConnections: 0,
    monthlyProgress: [] 
  });

  useEffect(() => {
    const fetchImpactData = async () => {
      try {
        const token = localStorage.getItem('token'); 
        const response = await axios.get('https://recycleshare.onrender.com/api/waste/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setStats({
            itemsShared: response.data.data.itemsShared,
            co2Saved: response.data.data.co2Saved,
            communityConnections: response.data.data.connections || 0,
            monthlyProgress: response.data.data.monthlyImpact || [] 
          });
        }
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      }
    };
    fetchImpactData();
  }, []);

  const maxValue = stats.monthlyProgress.length > 0 
    ? Math.max(...stats.monthlyProgress.map((d) => d.value), 10) 
    : 10;
  const chartHeight = 160;

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
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow border-l-4 border-emerald-400">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-md">
              <FiBox className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-emerald-600">Items Shared</div>
              <div className="text-2xl font-semibold text-emerald-800">{stats.itemsShared}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow border-l-4 border-emerald-400">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-md">
              <FiCloud className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-emerald-600">CO2 Saved (kg)</div>
              <div className="text-2xl font-semibold text-emerald-800">{stats.co2Saved}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow border-l-4 border-emerald-400">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-md">
              <FiUsers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-emerald-600">Community Connections</div>
              <div className="text-2xl font-semibold text-emerald-800">{stats.communityConnections}</div>
            </div>
          </div>
        </div>

        {/* Grafik Kartı */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-emerald-800 mb-4">Monthly Impact Progress</h2>
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${Math.max(stats.monthlyProgress.length * 48, 100)} ${chartHeight + 40}`}
              width="100%"
              height={chartHeight + 40}
              className="mx-auto"
            >
              {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                const y = 10 + (1 - t) * chartHeight;
                return (
                  <g key={i}>
                    <line x1="0" x2="100%" y1={y} y2={y} stroke="#ecfdf5" strokeWidth="1" />
                    <text x={10} y={y + 4} fontSize="10" fill="#065f46">{Math.round(maxValue * t)}</text>
                  </g>
                );
              })}

              {/* Barlar artık stats.monthlyProgress'den geliyor */}
              {stats.monthlyProgress.map((d, i) => {
                const barWidth = 28;
                const gap = 20;
                const x = i * (barWidth + gap) + 40;
                const height = (d.value / maxValue) * chartHeight;
                const y = 10 + (chartHeight - height);
                return (
                  <g key={i} transform={`translate(${x},0)`}>
                    <rect x={0} y={y} width={barWidth} height={height} rx={6} fill="#10b981" />
                    <text x={barWidth / 2} y={chartHeight + 26} fontSize="11" fill="#065f46" textAnchor="middle">{d.month}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewImpact;
