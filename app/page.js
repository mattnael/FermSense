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
import {
  FlaskConical,
  Thermometer,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Send,
  Table as TableIcon,
  Sliders,
  RefreshCw,
} from 'lucide-react';
import { finalizeLayoutVaryPath } from 'next/dist/client/components/segment-cache/vary-path';

export default function Home() {
  const [ph, setPh] = useState(3.9);
  const [temp, setTemp] = useState(27.5);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Riwayat data telemetri dari Supabase
  const [logs, setLogs] = useState([]);

  // Fungsi untuk mengambil data dari API / Supabase
  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/telemetry');

      // Cek jika response HTTP tidak OK
      if (!res.ok) {
        console.error(`Telemetry API Error: Status ${res.status}`);
        return;
      }

      // Ambil sebagai teks terlebih dahulu untuk memastikan tidak kosong
      const text = await res.text();
      const result = text ? JSON.parse(text) : { status: 'error', data: [] };

      if (result.status === 'success' && Array.isArray(result.data)) {
        // Format data agar sesuai dengan komponen grafik
        const formattedLogs = result.data.map((item, index) => {
          const dateObj = new Date(item.created_at || item.timestamp || Date.now());
          return {
            id: item.id || index,
            time: dateObj.toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            ph: item.ph,
            temp: item.temp,
            isCritical:
              item.status === 'Kritis' ||
              item.ph < 3.8 ||
              item.ph > 4.1 ||
              item.temp >= 30.0,
          };
        });
        setLogs(formattedLogs);
      }
    } catch (err) {
      console.error('Gagal memuat telemetri:', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    fetchTelemetry();

    // Polling setiap 10 detik
    const interval = setInterval(fetchTelemetry, 10000);
    return () => clearInterval(interval);
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
        setStatusMessage({
          type: 'success',
          text: `Data terkirim. ${
            isCritical ? 'Alert Discord dipicu.' : 'Kondisi fermentasi aman.'
          }`,
        });

        await fetchTelemetry();
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
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 md:p-10 font-sans selection:bg-amber-500/30">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/80 pb-5 gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <FlaskConical className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
                FermSense <span className="text-amber-500">Dashboard</span>
              </h1>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1.5 ml-0.5">
              Monitoring Fermentasi Sourdough Real-time & Notifikasi Alert Discord
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchTelemetry}
              title="Refresh Data"
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg border border-zinc-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-800/50 text-emerald-400 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Sistem Online</span>
            </div>
          </div>
        </header>

        {/* Global Status Banner */}
        <div
          className={`p-5 sm:p-6 rounded-2xl border transition-all ${
            isCritical
              ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
              : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
          }`}
        >
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`p-3 rounded-xl shrink-0 ${
                isCritical
                  ? 'bg-rose-900/50 text-rose-400 border border-rose-700/40'
                  : 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/40'
              }`}
            >
              {isCritical ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
                {isCritical
                  ? 'Peringatan: Parameter Fermentasi Di Luar Batas'
                  : 'Kondisi Fermentasi Optimal'}
              </h2>
              <p className="text-xs sm:text-sm opacity-80 mt-1 leading-relaxed">
                {isCritical
                  ? 'Sistem mendeteksi suhu atau pH melebihi ambang batas ideal. Alert otomatis telah dikirim ke channel Discord.'
                  : 'Keasaman (pH) dan suhu adonan berada dalam rentang ideal untuk pengembangan yeast sourdough.'}
              </p>
            </div>
          </div>
        </div>

        {/* Sensor Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Card pH */}
          <div
            className={`p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border transition-all ${
              isPhCritical
                ? 'border-rose-500/50 bg-rose-950/10'
                : 'border-zinc-800'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs sm:text-sm font-medium">
                <FlaskConical className="w-4 h-4 text-amber-500" />
                <span>Keasaman Adonan (pH)</span>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  isPhCritical
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {isPhCritical ? 'Di Luar Batas' : 'Ideal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-zinc-100">
                {ph}
              </span>
              <span className="text-zinc-500 text-sm font-medium">pH</span>
            </div>
            <div className="mt-5 pt-4 border-t border-zinc-800/80 flex justify-between text-xs text-zinc-400">
              <span>Batas Ideal Sourdough:</span>
              <span className="font-semibold text-zinc-200 font-mono">3.8 - 4.1</span>
            </div>
          </div>

          {/* Card Suhu */}
          <div
            className={`p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border transition-all ${
              isTempCritical
                ? 'border-rose-500/50 bg-rose-950/10'
                : 'border-zinc-800'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs sm:text-sm font-medium">
                <Thermometer className="w-4 h-4 text-sky-400" />
                <span>Suhu Ruang Fermentasi</span>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  isTempCritical
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {isTempCritical ? 'Terlalu Panas' : 'Normal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-zinc-100">
                {temp}
              </span>
              <span className="text-zinc-500 text-sm font-medium">°C</span>
            </div>
            <div className="mt-5 pt-4 border-t border-zinc-800/80 flex justify-between text-xs text-zinc-400">
              <span>Batas Maksimum Suhu:</span>
              <span className="font-semibold text-zinc-200 font-mono">&lt; 30.0 °C</span>
            </div>
          </div>
        </div>

        {/* Real-time Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Grafik pH */}
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span>Tren Keasaman (pH)</span>
              </h3>
              <span className="text-[11px] text-zinc-500">Rentang ideal: 3.8-4.1</span>
            </div>
            <div className="h-60 w-full pt-2">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={logs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="time"
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[3.0, 5.0]}
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '0.75rem',
                        color: '#f4f4f5',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ph"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#f59e0b' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Grafik Suhu */}
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                <span>Tren Suhu (°C)</span>
              </h3>
              <span className="text-[11px] text-zinc-500">Maksimal: 30.0°C</span>
            </div>
            <div className="h-60 w-full pt-2">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={logs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="time"
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[20.0, 40.0]}
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '0.75rem',
                        color: '#f4f4f5',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#38bdf8' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Simulator & Telemetry Control */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              <h3 className="text-base font-semibold text-zinc-200">
                Pengujian Telemetri & Kontrol Simulator
              </h3>
            </div>
            <span className="text-xs text-zinc-500 hidden sm:inline">
              Kirim payload pengujian ke API
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <label className="text-zinc-400 font-medium">Atur Nilai pH:</label>
                <span className="font-bold text-amber-400 font-mono">{ph}</span>
              </div>
              <input
                type="range"
                min="3.0"
                max="5.0"
                step="0.1"
                value={ph}
                onChange={(e) => setPh(e.target.value)}
                className="w-full accent-amber-500 cursor-pointer bg-zinc-800 h-2 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <label className="text-zinc-400 font-medium">Atur Suhu (°C):</label>
                <span className="font-bold text-sky-400 font-mono">{temp} °C</span>
              </div>
              <input
                type="range"
                min="20.0"
                max="40.0"
                step="0.5"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                className="w-full accent-sky-400 cursor-pointer bg-zinc-800 h-2 rounded-lg"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <button
              onClick={handleSendTelemetry}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-zinc-950 font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Mengirim Data...' : 'Kirim Telemetri Data'}</span>
            </button>

            {statusMessage && (
              <span
                className={`text-xs sm:text-sm px-4 py-2 rounded-xl border flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{statusMessage.text}</span>
              </span>
            )}
          </div>
        </div>

        {/* Telemetry Log Table */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-amber-500" />
              <span>Riwayat Telemetri Terakhir</span>
            </h3>
            <span className="text-xs text-zinc-500">{logs.length} Data terekam</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
            <table className="w-full text-left text-xs sm:text-sm text-zinc-400">
              <thead className="bg-zinc-950/80 text-zinc-300 text-[11px] uppercase tracking-wider border-b border-zinc-800/80">
                <tr>
                  <th className="p-3.5 font-semibold">Waktu</th>
                  <th className="p-3.5 font-semibold">pH</th>
                  <th className="p-3.5 font-semibold">Suhu (°C)</th>
                  <th className="p-3.5 font-semibold">Status Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-zinc-500">
                      Belum ada data telemetri.
                    </td>
                  </tr>
                ) : (
                  [...logs].reverse().map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="p-3.5 text-zinc-300 font-mono text-xs">
                        {log.time}
                      </td>
                      <td className="p-3.5 font-semibold font-mono text-zinc-200">
                        {log.ph}
                      </td>
                      <td className="p-3.5 font-semibold font-mono text-zinc-200">
                        {log.temp} °C
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                            log.isCritical
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {log.isCritical ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                              <span>Alert Discord</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>Normal</span>
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}