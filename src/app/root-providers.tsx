"use client";

import React from "react";
import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider } from "@chakra-ui/react";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

import theme from "@/lib/theme";

type RootProvidersProps = {
  children: React.ReactNode;
  session?: Session | null;
};

/**
 * SSRセッションをSessionProviderに注入
 * カラーモード等はChakraProviderのthemeで管理
 */
export default function RootProviders({ children, session }: RootProvidersProps) {
  return (
    <CacheProvider>
      <SessionProvider session={session}>
        <ChakraProvider theme={theme}>
          {children}
        </ChakraProvider>
      </SessionProvider>
    </CacheProvider>
  );
}
