// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

// 1) i18n ミドルウェアを用意
const i18nMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  // パスを抽出
  const path = request.nextUrl.pathname;
  
  // 共有絵本ルートへの公開アクセスを許可
  if (path.startsWith('/share/')) {
    return NextResponse.next();
  }

  // ルートパスの場合、next-intlがデフォルトロケールにリダイレクトするように動作する
  const response = i18nMiddleware(request) as NextResponse;

  // セキュリティヘッダの追加
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  response.headers.set('X-Content-Type-Options', 'nosniff');
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
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

// matcher を公式推奨のパターンに変更
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};