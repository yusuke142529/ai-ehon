import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  // サポートするロケール
  // as const を付けることで、"ja" | "en" の文字列リテラル型になる
  locales: ['ja', 'en'] as const,

  // ロケールが不明な場合に使う
  defaultLocale: 'ja',
});

export const {
  Link,
  redirect,
  usePathname,
  useRouter,
  getPathname,
} = createNavigation(routing);