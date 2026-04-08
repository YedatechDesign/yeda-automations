import { put, head } from "@vercel/blob";
import { NextResponse } from "next/server";
import { INITIAL_DATA } from "@/lib/data";

const BLOB_PATH = "automations-data.json";
const PASSWORD = "067270";

export async function GET() {
  try {
    const blob = await head(BLOB_PATH);
    if (blob) {
      const res = await fetch(blob.url);
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // blob doesn't exist yet — return initial data
  }
  return NextResponse.json(INITIAL_DATA);
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("x-auth");
  if (authHeader !== PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    await put(BLOB_PATH, JSON.stringify(data), {
      access: "public",
      addRandomSuffix: false,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
