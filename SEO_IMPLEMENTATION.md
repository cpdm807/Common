# SEO Implementation Summary

## Overview
Comprehensive SEO optimization for common.bz without changing the product's minimal/no-account ethos. All changes focus on technical correctness, clear intent pages, and avoiding spammy SEO tactics.

## File Changes

### 1. Enhanced Metadata & Layout
- **app/layout.tsx**: Added comprehensive root metadata with Open Graph, Twitter cards, robots, and icons
- **app/page.tsx**: Enhanced home page metadata with structured data (Organization, WebSite schemas)

### 2. Artifact Pages (Noindex by Default)
- **app/polls/[slug]/page.tsx**: Added noindex robots meta, enhanced OG images
- **app/board/[slug]/page.tsx**: Added noindex robots meta
- **app/b/[boardId]/page.tsx**: Added noindex robots meta, enhanced OG images

### 3. Tool Create Pages (Metadata via Layouts)
- **app/tools/poll/create/layout.tsx**: Metadata for poll creation page
- **app/tools/board/create/layout.tsx**: Metadata for board creation page
- **app/tools/availability/create/layout.tsx**: Metadata for availability creation page
- **app/tools/readiness/layout.tsx**: Metadata for readiness/pulse creation page

### 4. New SEO Pages
- **app/tools/page.tsx**: Tools hub page with metadata and structured data
- **app/tools/poll/page.tsx**: Poll tool landing page
- **app/tools/availability/page.tsx**: Availability tool landing page
- **app/tools/board/page.tsx**: Board tool landing page
- **app/tools/readiness/page.tsx**: Readiness/Pulse tool landing page
- **app/examples/page.tsx**: Examples hub page
- **app/examples/poll/page.tsx**: Poll examples page
- **app/examples/availability/page.tsx**: Availability examples page
- **app/examples/board/page.tsx**: Board examples page
- **app/examples/readiness/page.tsx**: Readiness examples page
- **app/use-cases/team-poll/page.tsx**: Team poll use case
- **app/use-cases/schedule-without-meeting/page.tsx**: Schedule without meeting use case
- **app/use-cases/availability-link/page.tsx**: Availability link use case
- **app/use-cases/decide-in-group-text/page.tsx**: Decide in group text use case
- **app/use-cases/team-retro/page.tsx**: Team retro use case
- **app/use-cases/quick-team-check-in/page.tsx**: Quick team check-in use case

### 5. Technical SEO
- **app/robots/route.ts**: Dynamic robots.txt with sitemap reference
- **app/sitemap/route.ts**: Dynamic sitemap.xml with all indexable pages
- **next.config.ts**: Rewrites for /robots.txt and /sitemap.xml

### 6. OG Images
- **app/og/poll/[slug]/route.tsx**: Dynamic OG image generation for polls
- Enhanced existing OG images with absolute URLs in metadata

## Page Titles & Meta Descriptions

### Home Page
- **Title**: "Common – When things get messy, find what's common"
- **Description**: "Lightweight tools to help groups align without meetings, accounts, or noise. Create polls without accounts, find the best time to meet with an availability link, run team retros, and check readiness—all with simple shareable links."

### Tools Hub (/tools)
- **Title**: "Tools – Poll, Availability, Board, Pulse"
- **Description**: "Four lightweight tools to help groups align: create polls without accounts, find the best meeting time with availability links, run team retros with boards, and check team readiness with pulse checks. All free, no sign-up required."

### Tool Landing Pages

#### Poll (/tools/poll)
- **Title**: "Poll Tool – Create Shareable Polls Without Accounts"
- **Description**: "Create a poll without accounts. Add your question, options, and share a single link. Perfect for team decisions, quick votes, and group choices. No sign-up, no email, no tracking."

#### Availability (/tools/availability)
- **Title**: "Availability Link – Find Best Meeting Time Without Accounts"
- **Description**: "Create an availability link to find the best time to meet. No accounts required. Share a link, collect availability, and see when everyone is free. Perfect for scheduling without back-and-forth emails."

#### Board (/tools/board)
- **Title**: "Board Tool – Team Retro & Agenda Without Accounts"
- **Description**: "Create a shared board for team retros, agendas, and item voting. No accounts required. Perfect for sprint retros, meeting agendas, and collaborative lists. Share a link and start collecting items."

#### Readiness/Pulse (/tools/readiness)
- **Title**: "Pulse Tool – Team Readiness Check Without Accounts"
- **Description**: "Create a pulse check for team readiness, sentiment, or any scale-based question. No accounts required. Quick group check-ins on a shared scale. Perfect for team health checks and readiness assessments."

### Create Pages

#### Create Poll (/tools/poll/create)
- **Title**: "Create Poll – No Account Required"
- **Description**: "Create a shareable poll without accounts. Add your question, options, and share a single link. Perfect for team decisions, quick votes, and group choices."

#### Create Board (/tools/board/create)
- **Title**: "Create Board – Team Retro & Agenda Tool"
- **Description**: "Create a shared board for team retros, agendas, and item voting. No accounts required. Perfect for sprint retros, meeting agendas, and collaborative lists."

#### Create Availability (/tools/availability/create)
- **Title**: "Create Availability Link – Find Best Meeting Time"
- **Description**: "Create an availability link to find the best time to meet. No accounts required. Share a link, collect availability, and see when everyone is free."

#### Create Pulse (/tools/readiness)
- **Title**: "Create Pulse Check – Team Readiness Tool"
- **Description**: "Create a pulse check for team readiness, sentiment, or any scale-based question. No accounts required. Quick group check-ins on a shared scale."

### Examples Pages

#### Examples Hub (/examples)
- **Title**: "Examples – See Common Tools in Action"
- **Description**: "See examples of polls, availability links, boards, and pulse checks. Learn how others use Common tools for team decisions, scheduling, retros, and check-ins."

#### Poll Examples (/examples/poll)
- **Title**: "Poll Examples – Team Decisions Without Accounts"
- **Description**: "See examples of polls used for team decisions, quick votes, and gathering opinions. Learn how to use polls effectively for group choices."

#### Availability Examples (/examples/availability)
- **Title**: "Availability Examples – Find Meeting Times"
- **Description**: "See examples of availability links used for scheduling team meetings, interviews, and group calls. Learn how to find the best meeting time without back-and-forth emails."

#### Board Examples (/examples/board)
- **Title**: "Board Examples – Team Retros & Agendas"
- **Description**: "See examples of boards used for team retros, meeting agendas, and collaborative lists. Learn how to use boards effectively for team feedback."

#### Readiness Examples (/examples/readiness)
- **Title**: "Pulse Examples – Team Readiness Checks"
- **Description**: "See examples of pulse checks used for team readiness, sentiment, and health assessments. Learn how to use pulse checks effectively."

### Use Case Pages

#### Team Poll (/use-cases/team-poll)
- **Title**: "Team Poll – Make Decisions Without Accounts"
- **Description**: "Create team polls without accounts. Perfect for quick decisions, gathering opinions, and group choices. No sign-up, no email, just create and share a link."

#### Schedule Without Meeting (/use-cases/schedule-without-meeting)
- **Title**: "Schedule Without Meeting – Find Best Time to Meet"
- **Description**: "Schedule meetings without the back-and-forth. Create an availability link, share it, and see when everyone is free. No accounts, no email chains, just find the best time."

#### Availability Link (/use-cases/availability-link)
- **Title**: "Availability Link – Doodle & When2Meet Alternative"
- **Description**: "Create an availability link to find the best meeting time. No accounts required. Free alternative to Doodle and When2Meet. Share a link and see when everyone is free."

#### Decide in Group Text (/use-cases/decide-in-group-text)
- **Title**: "Decide in Group Text – Poll Without Account"
- **Description**: "Make group decisions in text messages, Slack, or any chat. Create a poll without accounts, share the link, and collect votes. Perfect for quick team decisions."

#### Team Retro (/use-cases/team-retro)
- **Title**: "Team Retro – Sprint Retrospective Without Accounts"
- **Description**: "Run team retros without accounts. Create a board with Start/Stop/Continue columns, share a link, and collect feedback. Perfect for sprint retrospectives and team improvements."

#### Quick Team Check-In (/use-cases/quick-team-check-in)
- **Title**: "Quick Team Check-In – Pulse Check Without Accounts"
- **Description**: "Run quick team check-ins with pulse checks. Assess readiness, sentiment, or health on a shared scale. No accounts required. Perfect for regular team health checks."

## SEO QA Checklist

### 1. View Source Checks
- [ ] **Home page**: View source, verify:
  - `<title>` tag matches expected title
  - `<meta name="description">` present and matches
  - Open Graph tags present (`og:title`, `og:description`, `og:image`, `og:url`)
  - Twitter card tags present
  - Canonical URL present
  - Structured data (JSON-LD) present for Organization and WebSite
  - No duplicate meta tags

- [ ] **Tool landing pages** (`/tools/poll`, `/tools/availability`, etc.):
  - Title, description, OG tags, Twitter tags, canonical URL
  - Structured data (SoftwareApplication schema)
  - Breadcrumb schema
  - No duplicate meta tags

- [ ] **Create pages** (`/tools/poll/create`, etc.):
  - Title, description, OG tags, Twitter tags, canonical URL
  - Robots meta allows indexing

- [ ] **Artifact pages** (`/polls/[slug]`, `/b/[boardId]`, etc.):
  - Robots meta: `noindex, nofollow`
  - OG tags present (for sharing)
  - Canonical URL present

### 2. Lighthouse Checks
Run Lighthouse (Chrome DevTools → Lighthouse) on:
- [ ] Home page: Target 90+ Performance, 90+ SEO, 90+ Best Practices
- [ ] `/tools` page: Verify SEO score 90+
- [ ] `/tools/poll` page: Verify SEO score 90+
- [ ] One artifact page: Verify noindex is working (should not affect SEO score negatively)

**Key checks:**
- [ ] No render-blocking resources
- [ ] Images have alt text
- [ ] Links have descriptive text
- [ ] Meta description present
- [ ] Document has a valid `lang` attribute
- [ ] Viewport meta tag present

### 3. Validate Sitemap
- [ ] Visit `https://common.bz/sitemap.xml` (or your domain)
- [ ] Verify XML is well-formed
- [ ] Check that all indexable pages are included:
  - Home page
  - `/tools` and all tool pages
  - All create pages
  - All example pages
  - All use-case pages
- [ ] Verify artifact pages (`/polls/*`, `/b/*`) are NOT in sitemap
- [ ] Validate using [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)

### 4. Validate Robots.txt
- [ ] Visit `https://common.bz/robots.txt` (or your domain)
- [ ] Verify content:
  - Allows crawling of public pages
  - Disallows `/api`, `/polls/`, `/board/`, `/b/`, `/m/`
  - References sitemap location
- [ ] Test with [Google Search Console Robots.txt Tester](https://search.google.com/search-console)

### 5. OG Preview Checks
Test Open Graph tags using:
- [ ] [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [ ] [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [ ] [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

**For each page type:**
- [ ] Home page: OG image loads, title/description correct
- [ ] Tool landing pages: OG image loads, title/description correct
- [ ] Poll artifact page: Dynamic OG image loads with poll question
- [ ] Board artifact page: Dynamic OG image loads with board title

### 6. Structured Data Validation
- [ ] Use [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Test home page: Should show Organization and WebSite schemas
- [ ] Test tool landing pages: Should show SoftwareApplication schema
- [ ] Test tool landing pages: Should show BreadcrumbList schema

### 7. Canonical URLs
- [ ] Verify all pages have canonical URLs
- [ ] Verify canonical URLs are absolute (include domain)
- [ ] Verify canonical URLs match the actual page URL (no trailing slashes mismatch)

### 8. Mobile-Friendliness
- [ ] Use [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [ ] Test home page and a few key pages
- [ ] Verify no mobile usability issues

### 9. Page Speed
- [ ] Use [PageSpeed Insights](https://pagespeed.web.dev/)
- [ ] Target: 90+ Performance score on mobile and desktop
- [ ] Verify Core Web Vitals are in "Good" range:
  - LCP (Largest Contentful Paint) < 2.5s
  - FID (First Input Delay) < 100ms
  - CLS (Cumulative Layout Shift) < 0.1

### 10. Indexation Strategy Verification
- [ ] Use Google Search Console to verify:
  - Home page is indexed
  - Tool pages are indexed
  - Artifact pages are NOT indexed (check coverage report)
- [ ] Search `site:common.bz` (or your domain) to verify only indexable pages appear

### 11. Content Quality Checks
- [ ] Verify first 100 words of each tool landing page contain target keywords naturally
- [ ] Verify FAQ sections are present and helpful
- [ ] Verify internal linking between related pages
- [ ] Check for broken links (use a tool like [W3C Link Checker](https://validator.w3.org/checklink))

## Additional Notes

### Performance Optimizations
- All images use Next.js Image component (already in place)
- OG images are cached with appropriate headers
- Sitemap and robots.txt are cached
- Server components used where possible (minimal client JS)

### Privacy Compliance
- No tracking scripts added
- No analytics added (as per requirements)
- Artifact pages are noindex by default
- No personal data in indexable pages

### Future Enhancements (Optional)
- Add more use-case pages based on search analytics
- Create more example pages with real (anonymized) examples
- Add blog/content section for SEO if needed
- Monitor search console for new keyword opportunities

## Testing Commands

```bash
# Build and test locally
npm run build
npm start

# Test sitemap
curl http://localhost:3000/sitemap.xml

# Test robots.txt
curl http://localhost:3000/robots.txt

# Test OG image generation
curl http://localhost:3000/og/poll/test-slug
curl http://localhost:3000/og/board/test-id
```

## Deployment Checklist

Before deploying:
- [ ] Set `NEXT_PUBLIC_BASE_URL` environment variable to production URL
- [ ] Verify `public/og.png` exists (1200x630px) for fallback OG images
- [ ] Test all routes locally
- [ ] Verify sitemap.xml and robots.txt are accessible
- [ ] Submit sitemap to Google Search Console after deployment
- [ ] Monitor Google Search Console for indexing status
