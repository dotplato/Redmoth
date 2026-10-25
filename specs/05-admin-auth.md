# 05 — Admin host and auth

## Did
Host-based middleware: `admin.localhost:3000` rewrites into `/admin`. Public host cannot see admin routes. JWT httpOnly cookie via `jose`. Login API + sign-out.

## Solved
Keeps admin on a subdomain-style host so it can later be `admin.yourdomain.com` on the same Next.js app.

## Errors
Windows may need a hosts entry for `admin.localhost` if the browser does not map `*.localhost` to loopback.

## Achieves
A gated admin surface separate from the marketplace.
