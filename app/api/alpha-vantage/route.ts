import { NextResponse } from "next/server";

const BASE_URL = "https://www.alphavantage.co/query";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const symbol = searchParams.get("symbol");
  const interval = searchParams.get("interval"); // daily | weekly | monthly

  if (!symbol || !interval) {
    return NextResponse.json(
      { error: "Missing symbol or interval" },
      { status: 400 }
    );
  }

  const functionMap: Record<string, string> = {
    daily: "TIME_SERIES_DAILY",
    weekly: "TIME_SERIES_WEEKLY",
    monthly: "TIME_SERIES_MONTHLY",
  };

  const apiFunction = functionMap[interval];
  if (!apiFunction) {
    return NextResponse.json(
      { error: "Invalid interval" },
      { status: 400 }
    );
  }

  const url = `${BASE_URL}?function=${apiFunction}&symbol=${symbol}&apikey=${process.env.ALPHAVANTAGE_API_KEY}`;

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Alpha Vantage request failed" },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Alpha Vantage rate limit error
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
