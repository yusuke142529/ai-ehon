// next-intl.config.js
import {SUPPORTED_LOCALES, DEFAULT_LOCALE} from './src/i18n/routing.js';

/** @type {import('next-intl').NextIntlConfig} */
export default {
  locales: Array.from(SUPPORTED_LOCALES), // ['ja','en']
  defaultLocale: DEFAULT_LOCALE,          // 'ja'
};
