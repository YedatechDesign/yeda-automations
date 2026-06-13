import { put, list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { INITIAL_DATA } from "@/lib/data";

const BLOB_PATH = "tasks-data.json";
// Both roles may write to shared storage; the UI enforces what each may change.
const ALLOWED_TOKENS = ["alexey", "kateryna"];

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { blobs } = await list({ prefix: BLOB_PATH });
    if (blobs.length > 0) {
      const res = await fetch(blobs[0].url + `?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      return NextResponse.json(data, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      });
    }
  } catch {
    // blob doesn't exist yet
  }
  return NextResponse.json(INITIAL_DATA, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("x-auth") ?? "";
  if (!ALLOWED_TOKENS.includes(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    await put(BLOB_PATH, JSON.stringify(data), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
