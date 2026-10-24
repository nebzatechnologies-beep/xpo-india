import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = [
  "/",
  "/global",
  "/login",
  "/register",
  "/how-it-works",
  "/pricing",
  "/categories",
  "/about",
  "/contact",
  "/faq",
  "/unauthorized",
  "/not-found"
];
const PUBLIC_PREFIXES = [
  "/legal",
  "/api/auth",
  "/api/webhooks",
  "/api/categories",
  "/api/leads",
  "/api/subscriptions",
  "/api/payments",
  "/api/responses",
  "/api/connections",
  "/api/taxonomy",
  "/api/crm",
  "/api/whatsapp",
  "/api/integrations/n8n",
  "/_next",
  "/favicon"
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some(p => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req: request, secret });
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string;
  const roles = (token.roles as string[]) || [];
  const hasRole = (r: string) => role === r || roles.includes(r);

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!hasRole("superadmin") && !hasRole("staff")) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }
  if (pathname.startsWith("/creator")) {
    if (!hasRole("creator") && !hasRole("lead_creator") && !hasRole("superadmin")) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }
  if (pathname.startsWith("/absorber")) {
    if (!hasRole("absorber") && !hasRole("lead_absorber") && !hasRole("superadmin")) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
