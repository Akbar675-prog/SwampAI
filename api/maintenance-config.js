// SwampAI/api/maintenance-config.js
import { get } from '@vercel/edge-config';

export const config = { runtime: 'edge' };

export default async function handler() {
  try {
    const isMaintenance = await get('isMaintenance') ?? false;
    const text = await get('maintenanceText') ?? 'Sedang dalam pemeliharaan...';
    const video = await get('maintenanceVideo') ?? '/src/video/update.mp4';

    return new Response(JSON.stringify({ isMaintenance, text, video }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=10' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ isMaintenance: false }), { status: 500 });
  }
}
