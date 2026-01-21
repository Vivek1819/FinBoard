// app/api/indian-stock/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://stock.indianapi.in/NSE_most_active",
      {
        headers: {
          "X-Api-Key": process.env.INDIAN_API_KEY!,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch Indian market data" },
      { status: 500 }
    );
  }
}
