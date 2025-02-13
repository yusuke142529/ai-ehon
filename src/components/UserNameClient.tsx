// UserNameClient.tsx (修正例)
"use client";

import React from "react";
import { useUserSWR } from "@/hook/useUserSWR";

interface Props {
  defaultName: string;
  children?: React.ReactNode;
}

export function UserNameClient({ defaultName, children }: Props) {
  const { user } = useUserSWR();
  // SWR からの user.name が存在すればそれを優先し、なければ children（文字列かどうかは問いません）、さらになければ defaultName を使用する
  const displayName = user?.name || children || defaultName;
  return <span>{displayName}</span>;
}