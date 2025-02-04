'use client'

import React from 'react'
import useSWR from 'swr'
import { fetcher } from '@/utils/helpers' // 何かしらの fetch ライブラリなど

export default function PointsBalance() {
  // ログインユーザー情報を取得
  // 例: /api/user/me で { id, email, points, ... } を返す実装
  const { data: user, error, isLoading } = useSWR('/api/user/me', fetcher)

  if (isLoading) {
    return <div>読み込み中...</div>
  }
  if (error) {
    return <div>エラーが発生しました: {error.message}</div>
  }

  return (
    <div>
      現在のポイント: <strong>{user?.points ?? 0}</strong>
    </div>
  )
}