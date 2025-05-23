import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    // Match all routes except for static and public files
    '/((?!_next/static|favicon.ico|robots.txt|.*\\..*).*)',
  ],
}; 