import { NextResponse } from 'next/server';

// Paste Link Webhook Discord kamu di sini
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "https://discord.com/api/webhooks/1550452707943260221/2gIfmXvOYObGsAk72MkOekwyHiZilVzJxplLfr0F1NxqWM25_vnaGknR6rBKQ_lYY7v5";

export async function POST(request) {
  try {
    const body = await request.json();
    const { pH, temp } = body;

    console.log(`[Telemetri Masuk] pH: ${pH} | Suhu: ${temp}°C`);

    const isTempCritical = temp >= 30.0;
    const isPhCritical = pH < 3.8 || pH > 4.1;

    if (isTempCritical || isPhCritical) {
      let alertDetails = [];
      if (isTempCritical) alertDetails.push(`🔥 **Suhu Terlalu Tinggi:** ${temp}°C (Maks: 30°C)`);
      if (isPhCritical) alertDetails.push(`🧪 **pH Di Luar Batas Aman:** ${pH} (Ideal: 3.8 - 4.1)`);

      const discordPayload = {
        username: "FermSense Alert Bot",
        embeds: [
          {
            title: "⚠️ PERINGATAN FERMENTASI SOURDOUGH!",
            description: "Kondisi adonan sourdough terdeteksi tidak ideal:\n\n" + alertDetails.join("\n"),
            color: 15158332,
            timestamp: new Date().toISOString(),
            footer: { text: "FermSense System Monitoring • BIFEST Showcase" }
          }
        ]
      };

      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload)
      });
    }

    return NextResponse.json({
      status: "success",
      message: "Data telemetri berhasil diterima",
      data: { pH, temp }
    });

  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}