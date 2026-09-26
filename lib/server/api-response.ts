import { NextResponse } from "next/server";
import { AppError } from "@/lib/server/errors";

export const apiData = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json({ data }, init);

export const apiProblem = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

export function apiError(error: unknown, fallback: string) {
  if (error instanceof SyntaxError) {
    return apiProblem("Nội dung JSON không hợp lệ.", 400);
  }

  if (error instanceof AppError) {
    if (error.details) console.error(error.details);
    return apiProblem(error.message, error.status);
  }

  console.error(error);
  return apiProblem(fallback, 500);
}
