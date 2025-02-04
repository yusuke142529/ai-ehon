"use client";

import { Spinner, Box } from "@chakra-ui/react";

/**
 * 単純なローディングスピナーを表示するコンポーネント
 * Named Export で定義
 */
export function LoadingIndicator() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="200px"
    >
      <Spinner size="xl" />
    </Box>
  );
}