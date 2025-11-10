// SwampAI/api/maintenance-config.js
export const config = { runtime: 'edge' };

export default async function handler() {
  // Baca dari Environment Variables (Vercel Dashboard)
  const isMaintenance = process.env.IS_MAINTENANCE === 'true';
  const text = process.env.MAINTENANCE_TEXT || 'Sedang dalam pemeliharaan...';
  const video = process.env.MAINTENANCE_VIDEO || '/src/video/thumbDark.mp4';

  return new Response(JSON.stringify({ isMaintenance, text, video }), {
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}
