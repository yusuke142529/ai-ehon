import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { getToken } from 'next-auth/jwt';
import { routing } from '@/i18n/routing';


// 1) next-intl ミドルウェアを作成
const i18nMiddleware = createMiddleware(routing);

/**
 * 公開アクセスが許可されるパス（例: /share/）を判定するヘルパー
 */
function isPublicPath(pathname: string): boolean {
  // 例: /share/ は認証不要
  if (pathname.startsWith('/share')) {
    return true;
  }
  // ここで他にも「認証不要なパス」があれば判定
  return false;
}

export async function middleware(request: NextRequest) {
  /**
   * 1) まず next-intl ミドルウェアを適用
   *    - /api, /_next, 静的ファイル は config.matcher で除外されている前提
   */
  let response = i18nMiddleware(request) as NextResponse;

  // 2) 認証が必要なパス（例: /community）ならトークン検証
  const path = request.nextUrl.pathname;

  if (!isPublicPath(path)) {
    // 今回は「/community/ も含め、全パス保護したい」などと定義してもよい

    // 例: 「/community」を含むパスは要認証
    if (path.includes('/community')) {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });
      if (!token) {
        // ここでロケールを next-intl から取得
        const locale = request.nextUrl.locale || routing.defaultLocale;
        // コールバックURLを付与してログインページへ
        const callbackUrl = encodeURIComponent(request.nextUrl.href);
        return NextResponse.redirect(
          new URL(`/${locale}/auth/login?callbackUrl=${callbackUrl}`, request.url)
        );
      }
    }
  }

  // 3) セキュリティヘッダの付与（i18nMiddleware で生成したレスポンスにヘッダ追加）
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
      "object-src 'none'",
    ].join('; ')
  );
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  // next-intl 推奨の matcher
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
