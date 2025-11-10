// SwampAI/middleware.js
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const path = req.nextUrl.pathname;

  // JANGAN blokir API, file statis, atau maintenance page
  if (path.startsWith('/api') || path.includes('.') || path === '/maintenance.html') {
    return NextResponse.next();
  }

  // Baca dari env (Vercel)
  const isMaintenance = process.env.IS_MAINTENANCE === 'true';

  if (isMaintenance) {
    const url = req.nextUrl.clone();
    url.pathname = '/maintenance.html';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = { matcher: '/:path*' };
