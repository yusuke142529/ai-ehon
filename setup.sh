#!/bin/bash

# Next.js プロジェクト最適化ツール
echo "Next.js プロジェクト最適化を実行中..."

# キャッシュをクリア
echo "キャッシュをクリア中..."
rm -rf .next
rm -rf node_modules/.cache

# 依存関係の再インストール
echo "node_modules を再構築中..."
npm ci

# 開発環境変数ファイルの確認
if [ ! -f .env.development ]; then
  echo "開発環境設定ファイルを作成中..."
  echo "NEXT_INTL_DISABLE_VALIDATION=true" > .env.development
  echo "NODE_ENV=development" >> .env.development
  echo "NODE_OPTIONS=--max-old-space-size=4096" >> .env.development
fi

# Prisma キャッシュをリフレッシュ
echo "Prisma キャッシュをリフレッシュ中..."
npx prisma generate

echo "最適化完了！開発サーバーを起動します..."
npm run dev:clean