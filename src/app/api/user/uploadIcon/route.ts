// src/app/api/user/uploadIcon/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { ensureActiveUser } from "@/lib/serverCheck";
import { uploadImageBufferToS3 } from "@/services/s3Service";

/**
 * POST /api/user/uploadIcon
 * multipart/form-data: { file: File }
 * returns { image }
 */
export async function POST(req: Request) {
  try {
    // 1) ログイン & 退会チェック
    const check = await ensureActiveUser();
    if (check.error) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    // 2) multipart/form-data 解析
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 3) File -> Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4) S3 にアップロード
    const s3Key = `icons/${uuidv4()}.png`;
    const uploadedUrl = await uploadImageBufferToS3(buffer, s3Key, "image/png");

    return NextResponse.json({ image: uploadedUrl }, { status: 200 });
  } catch (error: unknown) {
    console.error("[uploadIcon] =>", error);

    let message = "Internal Server Error";
    if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
