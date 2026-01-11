import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiBox, FiCloud, FiUsers } from "react-icons/fi";
import { wasteAPI } from '../services/api';

const ViewImpact = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    itemsShared: 0,
    co2Saved: "0.0",
    communityConnections: 0,
    totalScore: 0,
    monthlyProgress: []
  });

  useEffect(() => {
    const fetchImpactData = async () => {
      try {
        const response = await wasteAPI.getImpactStats();

        if (response.success && response.data) {
          const apiData = response.data;
          setStats({
            itemsShared: apiData.itemsShared || 0,
            co2Saved: apiData.co2Saved || "0.0",
            communityConnections: apiData.connections || 0,
            totalScore: apiData.totalScore || 0,
            monthlyProgress: apiData.monthlyImpact || []
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

        {/* Grafik Kartı - Animasyonlu Barlar */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-emerald-800 mb-6">Monthly Impact Progress</h2>

          {stats.monthlyProgress.length > 0 ? (
            <div className="space-y-4">
              {stats.monthlyProgress.map((d, i) => {
                const percentage = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
                return (
                  <div key={i} className="group">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-slate-700">{d.month}</span>
                      <span className="text-sm font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.value} kg
                      </span>
                    </div>
                    <div className="h-8 bg-emerald-100 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                        style={{
                          width: `${percentage}%`,
                          animation: `growBar 1s ease-out ${i * 0.15}s both`
                        }}
                      >
                        <span className="text-white text-xs font-bold drop-shadow-sm">
                          {d.value} kg
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-slate-400">Henüz veri yok</p>
              <p className="text-sm text-slate-300 mt-1">Atıklar toplandığında burada görünecek</p>
            </div>
          )}

          <style>{`
            @keyframes growBar {
              from { width: 0%; opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
};

export default ViewImpact;
