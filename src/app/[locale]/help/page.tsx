// src/app/[locale]/help/page.tsx
import { HelpPageClient } from "./HelpPageClient";

export function generateStaticParams() {
  return [
    { locale: "ja" },
    { locale: "en" },
  ];
}

export default function HelpPage() {
  return <HelpPageClient />;
}