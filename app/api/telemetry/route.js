import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "https://discord.com/api/webhooks/1550452707943260221/2gIfmXvOYObGsAk72MkOekwyHiZilVzJxplLfr0F1NxqWM25_vnaGknR6rBKQ_lYY7v5";

// GET: Ambil 10 data telemetri terbaru
export async function GET() {
  try {
    if (!supabase) {
      console.warn("Supabase credentials tidak ditemukan di .env, mengembalikan array kosong.");
      return NextResponse.json({ status: "success", data: [] });
    }

    const { data, error } = await supabase
      .from('telemetry')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error("Supabase Error:", error.message);
      throw error;
    }

    return NextResponse.json({ 
      status: "success", 
      data: data ? data.reverse() : [] 
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error.message || "Gagal mengambil data telemetri" }, 
      { status: 500 }
    );
  }
}

// POST: Terima data baru dari Simulator / Hardware ESP32
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Toleransi nama variabel (pH vs ph)
    const pH = body.pH ?? body.ph;
    const temp = body.temp;

    if (pH === undefined || temp === undefined) {
      return NextResponse.json(
        { status: "error", message: "Payload harus menyertakan nilai 'pH' dan 'temp'" },
        { status: 400 }
      );
    }

    const isTempCritical = temp >= 30.0;
    const isPhCritical = pH < 3.8 || pH > 4.1;
    const statusText = (isTempCritical || isPhCritical) ? "Kritis" : "Optimal";

    // 1. Simpan ke Supabase jika terhubung
    if (supabase) {
      const { error: dbError } = await supabase
        .from('telemetry')
        .insert([
          { 
            ph: pH, 
            temp: temp, 
            status: statusText,
            timestamp: new Date().toISOString()
          }
        ]);

      if (dbError) {
        console.error("Gagal menyimpan ke Supabase:", dbError.message);
      }
    }

    // 2. Kirim Peringatan ke Discord jika kondisi Kritis
    if (isTempCritical || isPhCritical) {
      let alertDetails = [];
      if (isTempCritical) alertDetails.push(`🔥 **Suhu Terlalu Tinggi:** ${temp}°C (Maks: 30°C)`);
      if (isPhCritical) alertDetails.push(`🧪 **pH Di Luar Batas Aman:** ${pH} (Ideal: 3.8 - 4.1)`);

      const discordPayload = {
        username: "FermSense Alert Bot",
        embeds: [{
          title: "⚠️ PERINGATAN FERMENTASI SOURDOUGH!",
          description: "Kondisi adonan sourdough terdeteksi tidak ideal:\n\n" + alertDetails.join("\n"),
          color: 15158332,
          timestamp: new Date().toISOString(),
          footer: { text: "FermSense System Monitoring • BIFEST Showcase" }
        }]
      };

      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload)
      }).catch(err => console.error("Gagal mengirim webhook Discord:", err));
    }

    return NextResponse.json({
      status: "success",
      message: "Data telemetri berhasil disimpan",
      data: { pH, temp, status: statusText }
    });

  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error.message || "Invalid payload" },
      { status: 500 }
    );
  }
}