# 04 — Tool pages and visits

## Did
Tool detail pages with App Store-style screenshot rails, creator pages, and `/go/[slug]` 302 redirects to the stored website URL. Clicks are logged; no UTM or referral query is appended.

## Solved
Outbound traffic is first-party (`/go/...`) so analytics work without wrapping vendor URLs.

## Errors
None.

## Achieves
Each tool has its own page and a clean visit path to the product site.
