//middleware.ts

import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';
import createMiddleware from 'next-intl/middleware';
import {routing} from '@/i18n/routing';

// 1) i18nミドルウェアを先に用意
const i18nMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  // 2) i18nミドルウェアを実行し、レスポンスを受け取る
  const response = i18nMiddleware(request) as NextResponse;

  // 3) セキュリティヘッダを付与
  // (A) ClickJacking 対策
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // (B) HSTS (常時HTTPS前提のVercelなら有効)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // (C) MIMEスニッフィング防止
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // (D) Content-Security-Policy (CSP)
  //  - reCAPTCHA / Google Fonts 等を利用する例
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.gstatic.com/recaptcha/ https://www.google.com/recaptcha/",
      "frame-src 'self' https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/",
      "font-src 'self' https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data:",
      "object-src 'none'"
    ].join('; ')
  );

  // (E) X-XSS-Protection (古いブラウザ向け)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

// 4) i18nルーティング対象の設定
export const config = {
  matcher: [
    '/',
    '/(ja|en)/:path*'
  ]
};