// UserNameClient.tsx
"use client";

import React from "react";
import { useUserSWR } from "@/hook/useUserSWR";

interface Props {
  defaultName: string;
}

export function UserNameClient({ defaultName }: Props) {
  const { user } = useUserSWR();
  const displayName = user?.name || defaultName;

  return <>{displayName}</>;
}