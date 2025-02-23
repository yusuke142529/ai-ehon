/**
 * scripts/getGmailRefreshToken.ts
 *
 * 1. ターミナルで `npx ts-node scripts/getGmailRefreshToken.ts` (または `npx tsx scripts/getGmailRefreshToken.ts`) を実行。
 * 2. 表示されるURLをブラウザで開き、OAuth同意 → コードが付与されたredirect先に飛ばされる。
 * 3. そのURLに含まれる `code=` の後ろの文字列をコンソールに入力 → リフレッシュトークンが返ってくる。
 */

import 'dotenv/config'; // .env を読み込む
import { google } from 'googleapis';
import readline from 'readline';

// 1) .env から読み込み (要: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET を設定済)
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
// OAuthで承認後、遷移させるURL (Cloud ConsoleのOAuthクライアントID作成時に登録したリダイレクトURIと一致させる)
const REDIRECT_URI = 'https://ai-ehonmaker.com/api/auth/callback/google';

// Gmail送信に必要なスコープ
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

async function main() {
    // 2) OAuth2クライアントの作成
    const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    // 3) 認可URLを生成 (offline_access を得るため access_type=offline)
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline', // リフレッシュトークンを取得
        prompt: 'consent',      // 毎回同意画面を表示
        scope: SCOPES,
    });

    console.log(`\n[Step 1] 下記URLをブラウザで開いて、Googleアカウントでログイン＆同意してください:\n`);
    console.log(authUrl);

    // 4) 同意後、リダイレクト先に code=xxxxx が付与されるので、それをコンソールから読み取る
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('\n[Step 2] 上記URLから取得した "code" を貼り付けてEnter: ', async (code: string) => {
        rl.close();
        try {
            // 5) コードからトークンを取得
            const { tokens } = await oAuth2Client.getToken(code.trim());
            console.log('\nAccess Token:', tokens.access_token);
            console.log('Refresh Token:', tokens.refresh_token);
            console.log('Token Response Object:', tokens);

            console.log('\n===== IMPORTANT =====');
            console.log('以下のリフレッシュトークンを .env に GOOGLE_OAUTH_REFRESH_TOKEN として設定してください:');
            console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
            console.log('====================\n');
        } catch (err) {
            console.error('トークン取得中にエラーが発生しました:', err);
        }
    });
}

main().catch((err) => console.error(err));