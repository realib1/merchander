import { NextResponse } from "next/server";

// 1. Standard Error Envelope
export function sendApiError(
  message: string,
  code: string,
  status: number = 400
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        status,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

// 2. Cursor-Based Pagination Format
export function sendPaginated<T>(
  items: T[],
  totalCount: number,
  limit: number,
  nextCursor: string | null
) {
  return NextResponse.json(
    {
      items,
      pagination: {
        total_count: totalCount,
        limit,
        next_cursor: nextCursor,
      },
    },
    { status: 200 }
  );
}

// 3. Standard Success Response
export function sendSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}
