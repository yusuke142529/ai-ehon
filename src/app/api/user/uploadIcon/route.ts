// src/app/api/user/uploadIcon/route.ts
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { ensureActiveUser } from "@/lib/serverCheck"; // ★追加
import { uploadImageBufferToS3 } from "@/services/s3Service";

/**
 * POST /api/user/uploadIcon
 * multipart/form-data: { file: File }
 * returns { iconUrl }
 */
export async function POST(req: Request) {
  try {
    // 1) ログイン & 退会チェック
    const check = await ensureActiveUser();
    if (check.error) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }
    // もし userId を使ってownershipを判断するなら const userId = check.user.id;

    // 2) multipart/form-data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 3) File -> Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4) S3にアップロード
    const s3Key = `icons/${uuidv4()}.png`;
    const iconUrl = await uploadImageBufferToS3(buffer, s3Key, "image/png");

    return NextResponse.json({ iconUrl }, { status: 200 });
  } catch (error: any) {
    console.error("[uploadIcon] =>", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}