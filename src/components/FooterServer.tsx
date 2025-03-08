// src/components/FooterServer.tsx  (サーバーコンポーネント)
import FooterClient from "./FooterClient";

/**
 * フッターを SSR で出力するためのサーバーコンポーネント。
 * 必要に応じて他の props を拡張してもOKです。
 */
type FooterServerProps = {
    locale: string;
    /** 没入モードなどでフッターを隠したい場合に使う */
    hide?: boolean;
};

export default async function FooterServer({ locale, hide = false }: FooterServerProps) {
    // サーバーで特別なデータ取得が必要ならここで行う
    // 例: const session = await getServerSession(authOptions);

    return (
        <footer>
            {/* SSR 時点で <footer> タグを生成し、クライアント側の中身は FooterClient に委ねる */}
            <FooterClient locale={locale} hide={hide} />
        </footer>
    );
}
