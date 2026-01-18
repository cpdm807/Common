# Common

A calm, privacy-first "shared reality" utility for groups to align without meetings, accounts, or noise.

## What is Common?

Common is a minimal web app that helps groups find common ground through simple, unlisted collaborative tools. The first tool is an **Availability Heatmap** that answers "When can we meet?" without collecting emails or requiring accounts.

### Core Principles

- **Privacy-first**: No emails, no tracking, no accounts
- **Share via links**: Anyone with the link can view and contribute
- **Calm and minimal**: No noise, no notifications, just simple tools
- **Extensible**: Built to support future tools (readiness, blockers, opinions)

## Features

### v1 (Current)

- ✅ **Availability Heatmap**: Find the best time for groups to meet
- ✅ Responsive mobile-first design
- ✅ Rich link previews (Open Graph / Twitter)
- ✅ Automatic expiration (7 days visible, 14 days hard delete)
- ✅ Best-effort rate limiting
- ✅ Feedback collection
- ✅ Support/donation page

### Coming Soon

- 🔜 Readiness tracker
- 🔜 Blockers identification
- 🔜 Opinion gathering

## Tech Stack

- **Framework**: Next.js 15 with TypeScript, App Router
- **Database**: DynamoDB (single-table design)
- **Styling**: Tailwind CSS
- **Hosting**: AWS Amplify Hosting
- **SDK**: AWS SDK v3

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- AWS account with DynamoDB access
- AWS credentials configured locally

### Local Development

1. **Clone the repository**

```bash
git clone <repository-url>
cd Common
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `env.example` to `.env.local` and update the values:

```bash
cp env.example .env.local
```

Required variables:
```env
DYNAMODB_REGION=us-east-1
COMMON_TABLE_NAME=Common
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_VENMO_URL=https://venmo.com/u/yourhandle
NEXT_PUBLIC_VENMO_HANDLE=@yourhandle
```

**Note:** Use `DYNAMODB_REGION` instead of `AWS_REGION` to avoid conflicts with AWS Amplify's reserved prefixes.

4. **Set up database**

**Option A: DynamoDB Local (Recommended for development)**

Start DynamoDB Local with Docker:

```bash
docker-compose up -d
```

Then create the table:

```bash
chmod +x scripts/setup-local-db.sh
./scripts/setup-local-db.sh
```

Add to your `.env.local`:
```env
DYNAMODB_REGION=us-east-1
DYNAMODB_ENDPOINT=http://localhost:8000
```

**Option B: AWS DynamoDB (Production)**

Create a table in AWS with:

- **Partition key (PK)**: String
- **Sort key (SK)**: String
- **TTL attribute**: `TTL` (Number, epoch seconds)

```bash
chmod +x scripts/create-dynamodb-table.sh
./scripts/create-dynamodb-table.sh Common us-east-1
```

Make sure your AWS credentials are configured.

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Troubleshooting

**"ResourceNotFoundException" error:**
- Make sure DynamoDB Local is running: `docker-compose up -d`
- Or ensure your AWS table exists and credentials are configured
- Check that `COMMON_TABLE_NAME` in `.env.local` matches your table name

### Building for Production

```bash
npm run build
npm start
```

## Deployment to AWS Amplify

### Option 1: Amplify Console (Recommended)

1. **Connect your Git repository**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click "New app" → "Host web app"
   - Connect your Git provider (GitHub, GitLab, etc.)
   - Select your repository and branch

2. **Configure build settings**

The default build settings should work. Amplify will detect Next.js automatically.

Build specification:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

3. **Set environment variables**

In Amplify Console, go to App Settings → Environment variables and add:

- `AWS_REGION`
- `COMMON_TABLE_NAME`
- `NEXT_PUBLIC_BASE_URL` (your Amplify domain)
- `NEXT_PUBLIC_VENMO_URL`
- `NEXT_PUBLIC_VENMO_HANDLE`

4. **Set up IAM permissions**

Ensure the Amplify service role has DynamoDB permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/Common"
    }
  ]
}
```

5. **Deploy**

Push to your connected branch and Amplify will automatically build and deploy.

### Option 2: Amplify CLI

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Publish
amplify publish
```

## Project Structure

```
Common/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── boards/              # Board CRUD
│   │   └── feedback/            # Feedback submission
│   ├── b/[boardId]/             # Board view and add pages
│   ├── m/board/[boardId]/       # Metadata preview endpoint
│   ├── tools/                   # Tool selection and creation
│   ├── support/                 # Support page
│   ├── feedback/                # Feedback page
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Global styles
├── lib/                         # Utility libraries
│   ├── dynamodb.ts              # DynamoDB client and operations
│   ├── types.ts                 # TypeScript types
│   └── utils.ts                 # Helper functions
├── public/                      # Static assets
│   └── og.png                   # Open Graph image
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## Data Model

Single-table DynamoDB design:

### Board Item
- **PK**: `BOARD#{boardId}`
- **SK**: `META`
- Attributes: boardId, toolType, title, status, createdAt, expiresAtUserVisible, expiresAtHard (TTL), settings, stats

### Contribution Item
- **PK**: `BOARD#{boardId}`
- **SK**: `CONTRIB#{timestamp}#{random}`
- Attributes: contributionId, createdAt, name, payloadVersion, payload

### Feedback Item
- **PK**: `FEEDBACK#GLOBAL` or `FEEDBACK#BOARD#{boardId}`
- **SK**: `FB#{timestamp}#{random}`
- Attributes: createdAt, context, boardId, toolType, sentiment, comment, expiresAtHard (TTL)

## API Routes

### `POST /api/boards`
Create a new board

**Body:**
```json
{
  "toolType": "availability",
  "title": "Team sync",
  "settings": {
    "tz": "America/New_York",
    "startDate": "2026-01-20",
    "days": 7,
    "dayStart": 8,
    "dayEnd": 20,
    "slotMinutes": 30
  }
}
```

**Response:**
```json
{
  "boardId": "abc123",
  "url": "https://common.bz/b/abc123",
  "previewUrl": "https://common.bz/m/board/abc123"
}
```

### `GET /api/boards/[boardId]`
Get board data with aggregated availability

### `POST /api/boards/[boardId]/contributions`
Submit contribution to a board

**Body:**
```json
{
  "name": "Alice",
  "payload": {
    "selectedSlotIndexes": [0, 1, 2, 5, 6]
  }
}
```

### `POST /api/feedback`
Submit feedback

**Body:**
```json
{
  "context": "global",
  "sentiment": "up",
  "comment": "Great tool!"
}
```

## Privacy & Security

- **No user accounts**: No signup, no login
- **No email collection**: Share via links only
- **No tracking**: No cookies, no analytics, no third-party scripts
- **Auto-expiration**: Boards expire after 7 days (soft), hard-deleted after 14 days
- **Rate limiting**: Best-effort protection against abuse
- **No PII storage**: Only optional display names

## Contributing

This is a personal project, but feedback and suggestions are welcome! Please use the Feedback page or open an issue.

## License

MIT License - feel free to use, modify, and deploy your own instance.

## Support

If Common helped you, consider supporting hosting costs:

- [Support on Venmo](https://venmo.com/u/yourhandle)

---

Made with ❤️ for calm collaboration
