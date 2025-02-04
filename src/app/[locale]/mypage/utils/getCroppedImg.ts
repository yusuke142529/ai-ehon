// src/app/mypage/utils/getCroppedImg.ts
"use client";

interface CroppedAreaPixels {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * 画像URL と croppedAreaPixels を受け取り、
 * Canvas上でトリミングしたBlobを返すユーティリティ関数
 */
export default async function getCroppedImg(
    imageSrc: string,
    croppedAreaPixels: CroppedAreaPixels
): Promise<{ file: Blob; url: string }> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas Context not found");

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((file) => {
            if (!file) {
                reject(new Error("Failed to convert canvas to Blob"));
                return;
            }
            const url = URL.createObjectURL(file);
            resolve({ file, url });
        }, "image/png");
    });
}

/**
 * 画像URLをHTMLImageElementに変換
 */
function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        // CORS対応
        img.crossOrigin = "anonymous";
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
    });
}