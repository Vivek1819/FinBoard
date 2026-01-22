import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.FINNHUB_API_KEY;

  const res = await fetch(
    `https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${token}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch symbols" },
      { status: 500 }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
