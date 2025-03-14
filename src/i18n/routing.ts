// routing.ts
import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

// locales 配列の定義を1箇所にまとめる
export const SUPPORTED_LOCALES = ['ja', 'en'] as const;
export const DEFAULT_LOCALE = 'ja';

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
});

export const {
  Link,
  redirect,
  usePathname,
  useRouter,
  getPathname,
} = createNavigation(routing);
