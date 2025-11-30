import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // List of root routes that should redirect to / (QR message page)
  const rootRoutes = [
    '/about',
    '/products',
    '/categories',
    '/cart',
    '/checkout',
    '/account',
    '/orders',
    '/wishlist',
    '/contact',
    '/faq',
    '/shipping',
    '/returns',
    '/privacy',
    '/terms',
  ];
  
  // Check if the pathname matches any root route exactly
  if (rootRoutes.includes(pathname) || 
      pathname.startsWith('/products/') || 
      pathname.startsWith('/orders/') || 
      pathname.startsWith('/account/')) {
    // Redirect to home (QR message page)
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)',
  ],
};

