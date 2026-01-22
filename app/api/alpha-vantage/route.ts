import { NextResponse } from "next/server";

const BASE_URL = "https://www.alphavantage.co/query";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const symbol = searchParams.get("symbol");
  const func = searchParams.get("function"); // TIME_SERIES_DAILY etc.

  if (!symbol || !func) {
    return NextResponse.json(
      { error: "Missing symbol or function" },
      { status: 400 }
    );
  }

  const url = `${BASE_URL}?function=${func}&symbol=${symbol}&apikey=${process.env.ALPHAVANTAGE_API_KEY}`;

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Alpha Vantage request failed" },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Alpha Vantage rate limit
    if (data.Note) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Server error fetching Alpha Vantage" },
      { status: 500 }
    );
  }
}
