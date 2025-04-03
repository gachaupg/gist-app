import { NextRequest, NextResponse } from "next/server";

declare module "next/server" {
  export interface ResponseCookies extends Headers {
    getAll: () => ResponseCookie[];
  }

  export type NextMiddleware = (
    request: NextRequest,
    event: NextFetchEvent
  ) => Response | Promise<Response>;

  export type RouteHandlerContext<
    TParams extends Record<string, string | string[]> = {}
  > = {
    params: TParams;
  };

  // Augment the route handler functions to fix type issues
  export function GET<TParams extends Record<string, string | string[]> = {}>(
    req: NextRequest,
    context: RouteHandlerContext<TParams>
  ): Promise<NextResponse> | NextResponse;

  export function POST<TParams extends Record<string, string | string[]> = {}>(
    req: NextRequest,
    context: RouteHandlerContext<TParams>
  ): Promise<NextResponse> | NextResponse;

  export function PUT<TParams extends Record<string, string | string[]> = {}>(
    req: NextRequest,
    context: RouteHandlerContext<TParams>
  ): Promise<NextResponse> | NextResponse;

  export function PATCH<TParams extends Record<string, string | string[]> = {}>(
    req: NextRequest,
    context: RouteHandlerContext<TParams>
  ): Promise<NextResponse> | NextResponse;

  export function DELETE<
    TParams extends Record<string, string | string[]> = {}
  >(
    req: NextRequest,
    context: RouteHandlerContext<TParams>
  ): Promise<NextResponse> | NextResponse;
}
