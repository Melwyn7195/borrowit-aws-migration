// Where the API lives, relative to the page.
//
// Empty by default, which means "same origin", and that is the correct answer
// in both environments:
//
//   dev  - vite.config.js proxies /api to http://localhost:3456
//   prod - CloudFront routes /api/* to the load balancer
//
// Same-origin is not a convenience here, it is a requirement. The session
// cookie is set with sameSite: 'strict', so a cross-site API host would have
// the browser drop it and every request after login would be anonymous. The
// page is also served over HTTPS while the load balancer is HTTP only, so a
// direct call to it would be blocked as mixed content.
//
// Set VITE_API_URL only to point a local build at some other host, and expect
// to be logged out on every request when you do.
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
