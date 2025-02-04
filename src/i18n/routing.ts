// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // サポートするロケール
  locales: ['ja', 'en'],
  // ロケールが不明な場合に使う
  defaultLocale: 'ja'
});

export const {
  Link,
  redirect,
  usePathname,
  useRouter,
  getPathname
} = createNavigation(routing);