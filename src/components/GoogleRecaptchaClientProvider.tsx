"use client";

import React, { useState, useEffect } from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

type Props = {
  children: React.ReactNode;
};

function GoogleRecaptchaClientProvider({ children }: Props) {
  // クライアントサイドレンダリングを確認するための状態
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // SSRでエラーが出るのを防ぐためのチェック
  const reCaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

  // クライアントサイドでのみレンダリング
  if (!isClient) {
    return <>{children}</>; // reCAPTCHAなしで最初にレンダリング
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={reCaptchaKey}
      scriptProps={{
        async: true,
        defer: false,
        appendTo: "head",
        nonce: undefined // 必要に応じてCSP nonceを追加
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}

export default GoogleRecaptchaClientProvider;