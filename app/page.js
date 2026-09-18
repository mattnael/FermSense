'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function Home() {
  const [ph, setPh] = useState(3.9);
  const [temp, setTemp] = useState(27.5);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Riwayat data telemetri untuk grafik & tabel
  const [logs, setLogs] = useState([
    { id: 1, time: '17:25:00', ph: 4.0, temp: 26.5, isCritical: false },
    { id: 2, time: '17:27:00', ph: 3.9, temp: 27.0, isCritical: false },
    { id: 3, time: '17:30:00', ph: 3.9, temp: 27.5, isCritical: false },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPhCritical = ph < 3.8 || ph > 4.1;
  const isTempCritical = temp >= 30.0;
  const isCritical = isPhCritical || isTempCritical;

  const handleSendTelemetry = async () => {
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pH: parseFloat(ph), temp: parseFloat(temp) }),
      });

      const data = await res.json();

      if (res.ok) {
        const now = new Date().toLocaleTimeString('id-ID');
        setStatusMessage({
          type: 'success',
          text: `Data terkirim! ${isCritical ? '⚠️ Alert Discord Dipicu!' : '🟢 Kondisi Aman.'}`,
        });

        // Tambah data baru ke grafik & log
        const newEntry = {
          id: Date.now(),
          time: now,
          ph: parseFloat(ph),
          temp: parseFloat(temp),
          isCritical,
        };

        setLogs((prev) => [...prev, newEntry]);
      } else {
        throw new Error(data.message || 'Gagal mengirim data');
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-amber-500">
              🧪 FermSense Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Sourdough Fermentation Monitoring & Real-time Discord Alerts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-3 py-1 rounded-full">
              System Online
            </span>
          </div>
        </header>

        {/* Global Status Banner */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isCritical
              ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
              : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl text-2xl ${isCritical ? 'bg-rose-900/60' : 'bg-emerald-900/60'}`}>
              {isCritical ? '⚠️' : '✅'}
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {isCritical ? 'PERINGATAN: Kondisi Adonan Tidak Ideal!' : 'Status Fermentasi Optimal'}
              </h2>
              <p className="text-sm opacity-80 mt-0.5">
                {isCritical
                  ? 'Sistem mendeteksi nilai di luar batas aman. Pesan peringatan dikirim ke Discord.'
                  : 'Keasaman (pH) dan suhu adonan berada dalam rentang fermentasi ideal.'}
              </p>
            </div>
          </div>
        </div>

        {/* Sensor Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-6 rounded-2xl bg-slate-900 border transition-all ${isPhCritical ? 'border-rose-500/50 shadow-lg shadow-rose-950/30' : 'border-slate-800'}`}>
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-400 font-medium text-sm">Keasaman Adonan (pH)</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${isPhCritical ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                {isPhCritical ? 'Di Luar Batas' : 'Ideal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight">{ph}</span>
              <span className="text-slate-500 text-sm">pH</span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-between text-xs text-slate-400">
              <span>Batas Ideal Sourdough:</span>
              <span className="font-semibold text-slate-200">3.8 - 4.1</span>
            </div>
          </div>

          <div className={`p-6 rounded-2xl bg-slate-900 border transition-all ${isTempCritical ? 'border-rose-500/50 shadow-lg shadow-rose-950/30' : 'border-slate-800'}`}>
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-400 font-medium text-sm">Suhu Ruang Fermentasi</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${isTempCritical ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                {isTempCritical ? 'Terlalu Panas' : 'Normal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight">{temp}</span>
              <span className="text-slate-500 text-sm">°C</span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-between text-xs text-slate-400">
              <span>Batas Maksimum Suhu:</span>
              <span className="font-semibold text-slate-200">&lt; 30.0 °C</span>
            </div>
          </div>
        </div>

        {/* GRAFIK REAL-TIME SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Grafik pH */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-md font-semibold text-slate-200 flex items-center gap-2">
              📈 Grafik Tren pH Adonan
            </h3>
            <div className="h-64 w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={logs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                    <YAxis domain={[3.0, 5.0]} stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    />
                    <Line type="monotone" dataKey="ph" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Grafik Suhu */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-md font-semibold text-slate-200 flex items-center gap-2">
              🌡️ Grafik Tren Suhu (°C)
            </h3>
            <div className="h-64 w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={logs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                    <YAxis domain={[20.0, 40.0]} stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    />
                    <Line type="monotone" dataKey="temp" stroke="#38bdf8" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>

        {/* Interactive Simulator Controller */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              🎛️ Control & Telemetry Testing
            </h3>
            <span className="text-xs text-slate-500">Uji coba kirim payload ke Next.js API</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <label className="text-slate-400">Atur Nilai pH:</label>
                <span className="font-bold text-amber-400">{ph}</span>
              </div>
              <input
                type="range"
                min="3.0"
                max="5.0"
                step="0.1"
                value={ph}
                onChange={(e) => setPh(e.target.value)}
                className="w-full accent-amber-500 cursor-pointer bg-slate-800 h-2 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <label className="text-slate-400">Atur Suhu (°C):</label>
                <span className="font-bold text-amber-400">{temp} °C</span>
              </div>
              <input
                type="range"
                min="20.0"
                max="40.0"
                step="0.5"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                className="w-full accent-amber-500 cursor-pointer bg-slate-800 h-2 rounded-lg"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <button
              onClick={handleSendTelemetry}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold transition-all disabled:opacity-50"
            >
              {loading ? 'Mengirim Data...' : '🚀 Kirim Telemetri Data'}
            </button>

            {statusMessage && (
              <span
                className={`text-sm px-4 py-2 rounded-lg border ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/80 border-rose-800 text-rose-300'
                }`}
              >
                {statusMessage.text}
              </span>
            )}
          </div>
        </div>

        {/* Telemetry Log Table */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-lg font-semibold text-slate-200">📊 Riwayat Telemetri Terakhir</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-950/60 text-slate-300 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-lg">Waktu</th>
                  <th className="p-3">pH</th>
                  <th className="p-3">Suhu (°C)</th>
                  <th className="p-3 rounded-r-lg">Status alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {[...logs].reverse().map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 text-slate-300">{log.time}</td>
                    <td className="p-3 font-medium text-slate-200">{log.ph}</td>
                    <td className="p-3 font-medium text-slate-200">{log.temp} °C</td>
                    <td className="p-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          log.isCritical
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {log.isCritical ? '⚠️ Alert Discord' : '🟢 Normal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}