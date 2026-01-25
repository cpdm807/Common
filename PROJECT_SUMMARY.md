# Common - Project Summary

## Overview

**Common** is a complete, working v1 web application built for common.bz. It's a privacy-first "shared reality" utility that helps groups align without meetings, accounts, or noise.

## What Was Built

### ✅ Complete Feature Set

#### Core Features
- **Availability Heatmap Tool** - "When can we meet?" (fully functional)
- **Tool Selection Page** - With placeholders for future tools (Readiness, Blockers)
- **Landing Page** - Clean hero with messaging and CTAs
- **Board Creation Flow** - Configurable timezone, date range, time slots
- **Board View** - Heatmap visualization with best windows summary
- **Add Availability** - Interactive grid for selecting available time slots
- **Rich Link Previews** - Server-rendered metadata endpoint for Open Graph/Twitter cards
- **Support Page** - Venmo donation integration
- **Feedback System** - Global and per-board feedback with thumbs up/down
- **Auto-Expiration** - Soft delete at 7 days, hard delete at 14 days via DynamoDB TTL

#### Technical Implementation
- **Next.js 15** with TypeScript and App Router
- **DynamoDB** single-table design with proper TTL support
- **Tailwind CSS** for responsive, mobile-first styling
- **AWS SDK v3** for DynamoDB operations
- **Rate Limiting** - Best-effort protection against abuse
- **Validation** - Comprehensive input validation and error handling

### 📁 Project Structure

```
Common/
├── app/                              # Next.js App Router
│   ├── api/                          # API Routes
│   │   ├── boards/                   # Board CRUD
│   │   │   ├── route.ts             # POST - Create board
│   │   │   └── [boardId]/
│   │   │       ├── route.ts         # GET - Fetch board data
│   │   │       └── contributions/
│   │   │           └── route.ts     # POST - Submit contribution
│   │   └── feedback/
│   │       └── route.ts             # POST - Submit feedback
│   ├── b/[boardId]/                 # Board pages
│   │   ├── page.tsx                 # View board with heatmap
│   │   └── add/
│   │       └── page.tsx             # Add availability
│   ├── m/board/[boardId]/           # Metadata preview endpoint
│   │   └── page.tsx                 # Server-rendered OG tags
│   ├── tools/                       # Tool pages
│   │   ├── page.tsx                 # Tool selection
│   │   └── availability/create/
│   │       └── page.tsx             # Create availability board
│   ├── support/
│   │   └── page.tsx                 # Support/donation page
│   ├── feedback/
│   │   └── page.tsx                 # Global feedback page
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Landing page
│   └── globals.css                  # Global styles
├── lib/
│   ├── dynamodb.ts                  # DynamoDB client & operations
│   ├── types.ts                     # TypeScript type definitions
│   └── utils.ts                     # Helper functions & validation
├── public/
│   └── OG_IMAGE_README.md          # Instructions for og.png
├── scripts/
│   └── create-dynamodb-table.sh    # DynamoDB setup script
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── amplify.yml                      # AWS Amplify build config
├── README.md                        # Full documentation
├── DEPLOYMENT.md                    # Deployment checklist
├── CONTRIBUTING.md                  # Contribution guidelines
└── LICENSE                          # MIT License
```

### 🗄️ Data Model

**Single-table DynamoDB design:**

| Entity Type | PK | SK | Attributes |
|------------|----|----|------------|
| Board | `BOARD#{boardId}` | `META` | boardId, toolType, title, status, createdAt, expiresAtUserVisible, expiresAtHard (TTL), settings, stats |
| Contribution | `BOARD#{boardId}` | `CONTRIB#{timestamp}#{random}` | contributionId, createdAt, name, payloadVersion, payload |
| Feedback (Global) | `FEEDBACK#GLOBAL` | `FB#{timestamp}#{random}` | createdAt, context, sentiment, comment, expiresAtHard (TTL) |
| Feedback (Board) | `FEEDBACK#BOARD#{boardId}` | `FB#{timestamp}#{random}` | createdAt, context, boardId, toolType, sentiment, comment, expiresAtHard (TTL) |

### 🔌 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/boards` | Create new board |
| GET | `/api/boards/[boardId]` | Get board data with aggregated availability |
| POST | `/api/boards/[boardId]/contributions` | Submit availability contribution |
| POST | `/api/feedback` | Submit feedback |

### 🎨 UI Pages & Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page with hero and CTAs |
| `/tools` | Tool selection (availability active, others "coming soon") |
| `/tools/availability/create` | Create availability board form |
| `/b/[boardId]` | View board with heatmap and best windows |
| `/b/[boardId]/add` | Add your availability (interactive grid) |
| `/m/board/[boardId]` | Metadata preview endpoint for rich link previews |
| `/support` | Support page with Venmo donation options |
| `/feedback` | Global feedback form |

## Privacy & Security Features

✅ **No user accounts** - Share via unlisted links only  
✅ **No email collection** - Names are optional and cosmetic  
✅ **No cookies required** - Stateless by default  
✅ **No tracking** - No analytics, no IP logging, no user agents  
✅ **Auto-expiration** - Data soft-deleted at 7 days, hard-deleted at 14 days  
✅ **Rate limiting** - Best-effort protection without user identity  
✅ **Minimal data storage** - Only what's needed for the tool to work  

## Mobile-First Design

✅ **Responsive layouts** - All pages adapt to mobile screens  
✅ **Touch-friendly** - Large hit targets for tap interactions  
✅ **Horizontal scroll** - Heatmap gracefully scrolls on small screens  
✅ **Single-column forms** - Mobile forms are clean and simple  
✅ **No zoom required** - Proper viewport and tap target sizing  

## Extensibility

The architecture supports future tools:

- **Tool registry** - Easy to add new tools to the selection page
- **Generic data model** - `toolType`, `settings`, and `payload` fields are extensible
- **Consistent patterns** - Board creation, contribution, and view flows can be reused

**Future tools ready to implement:**
- Readiness tracker
- Blockers identification
- Opinion gathering

## Environment Variables

Required:
- `DYNAMODB_REGION` - DynamoDB region (use this instead of AWS_REGION for Amplify)
- `COMMON_TABLE_NAME` - DynamoDB table name
- `NEXT_PUBLIC_BASE_URL` - Production URL

Optional:
- `NEXT_PUBLIC_VENMO_URL` - Venmo profile link
- `NEXT_PUBLIC_VENMO_HANDLE` - Venmo handle for copying
- `DYNAMODB_ENDPOINT` - For local development only (http://localhost:8000)

**Note:** AWS Amplify reserves environment variables starting with `AWS_`, so we use `DYNAMODB_REGION` instead of `AWS_REGION`.

## Deployment Ready

✅ **AWS Amplify config** - `amplify.yml` included  
✅ **DynamoDB setup script** - `scripts/create-dynamodb-table.sh`  
✅ **Deployment checklist** - Step-by-step guide in `DEPLOYMENT.md`  
✅ **IAM permissions** - Template included in README  
✅ **Environment setup** - `.env.example` provided  

## Documentation

- **README.md** - Complete setup and deployment guide
- **DEPLOYMENT.md** - Production deployment checklist
- **CONTRIBUTING.md** - Contribution guidelines
- **PROJECT_SUMMARY.md** - This file
- **OG_IMAGE_README.md** - Open Graph image instructions

## What's NOT Included (By Design)

❌ Third-party analytics  
❌ User authentication  
❌ Email/notification system  
❌ Payment processing  
❌ Admin dashboard  
❌ User profiles  
❌ AI features  

These are intentionally omitted to keep Common simple, calm, and privacy-focused.

## Next Steps

1. **Install dependencies**: `npm install`
2. **Create DynamoDB table**: `./scripts/create-dynamodb-table.sh`
3. **Configure environment**: Copy `env.example` to `.env.local` and fill in values
4. **Run locally**: `npm run dev`
5. **Deploy to Amplify**: Follow `DEPLOYMENT.md`

## Tech Stack Summary

- **Framework**: Next.js 15 (TypeScript, App Router)
- **Database**: AWS DynamoDB (single-table design)
- **Styling**: Tailwind CSS
- **Hosting**: AWS Amplify Hosting
- **SDK**: AWS SDK v3 (@aws-sdk/client-dynamodb, @aws-sdk/lib-dynamodb)

## Key Features Implemented

✅ Availability heatmap with smart window detection  
✅ Mobile-responsive grid interfaces  
✅ Server-rendered metadata for rich previews  
✅ Best-effort rate limiting  
✅ Automatic data expiration with TTL  
✅ Feedback collection system  
✅ Support/donation page  
✅ Tool extensibility architecture  
✅ Comprehensive validation  
✅ Error handling throughout  

## Metrics Tracked (Aggregate Only)

- Board view count (per board)
- Contribution count (per board)
- No per-user tracking
- No IP addresses stored
- No user agents collected

## Testing Checklist

Before going live:

- [ ] Create a test board
- [ ] Add multiple contributions
- [ ] Verify heatmap displays correctly
- [ ] Test on mobile device
- [ ] Submit feedback
- [ ] Check link preview on messaging apps
- [ ] Verify expiration logic (use short TTL for testing)

## Support & Maintenance

- Monitor DynamoDB for proper TTL cleanup (48hr delay is normal)
- Check Amplify logs for errors
- Review feedback submissions
- Keep dependencies updated

---

**Status**: ✅ **Complete and ready for deployment**

Built with ❤️ for calm collaboration.
