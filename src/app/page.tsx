// src/app/page.tsx
import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

// このページはルート URL ("/") にアクセスがあった場合に
// 自動的に defaultLocale（routing.defaultLocale）にリダイレクトします。
export default function RootPage() {
    // 例: routing.defaultLocale が "en" なら "/en" にリダイレクトされます
    redirect(`/${routing.defaultLocale}`);
}
