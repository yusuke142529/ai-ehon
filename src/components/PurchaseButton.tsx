"use client";

import React from "react";

type PurchaseButtonProps = {
  currency: "usd" | "jpy";
  price: number;
  credits: number;
};

export default function PurchaseButton({
  currency,
  price,
  credits
}: PurchaseButtonProps) {
  const handlePurchase = async () => {
    try {
      const currentUrl = window.location.href;

      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency,
          price,
          credits,
          callbackUrl: currentUrl
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "購入手続きに失敗しました。");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("エラーが発生しました。");
    }
  };

  return (
    <button onClick={handlePurchase}>
      {currency === "usd" ? `$${price}` : `¥${price}`} で {credits} クレジット購入
    </button>
  );
}