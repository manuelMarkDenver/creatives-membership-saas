import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  
  // Extract subdomain
  const hostParts = hostname.split('.')
  
  // For development (localhost) and production
  const isLocalhost = hostname.includes('localhost')
  const isProduction = hostname.includes('creativeapproach.tech')
  
  // Skip middleware for certain paths
  const skipPaths = ['/api/', '/_next/', '/favicon.ico', '/auth/login', '/auth/callback', '/auth/logout']
  if (skipPaths.some(path => url.pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  let subdomain: string | null = null
  
  if (isLocalhost && hostParts.length >= 2) {
    // For localhost:3000 or subdomain.localhost:3000
    const potentialSubdomain = hostParts[0]
    if (potentialSubdomain !== 'localhost' && potentialSubdomain !== 'www') {
      subdomain = potentialSubdomain
    }
  } else if (isProduction && hostParts.length >= 3) {
    // For subdomain.creativeapproach.tech
    const potentialSubdomain = hostParts[0]
    if (potentialSubdomain !== 'www' && potentialSubdomain !== 'api') {
      subdomain = potentialSubdomain
    }
  }
  
  // If we have a subdomain, add it to the request headers
  if (subdomain) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-tenant-slug', subdomain)
    
    // Rewrite the request to include the tenant slug in the URL for internal routing
    // This allows pages to access the tenant slug via params
    if (!url.pathname.startsWith(`/tenant/${subdomain}`)) {
      url.pathname = `/tenant/${subdomain}${url.pathname}`
    }
    
    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  // For main domain (no subdomain), continue as normal
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
