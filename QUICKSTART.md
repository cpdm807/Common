# Quick Start Guide

Get Common running locally in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Docker installed (for local database)
- Git

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

```bash
cp env.example .env.local
```

Edit `.env.local` and add:
```env
DYNAMODB_REGION=us-east-1
DYNAMODB_ENDPOINT=http://localhost:8000
COMMON_TABLE_NAME=Common
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Start DynamoDB Local

```bash
docker-compose up -d
```

This starts DynamoDB Local on port 8000.

### 4. Create Database Table

```bash
chmod +x scripts/setup-local-db.sh
./scripts/setup-local-db.sh
```

You should see:
```
✅ DynamoDB Local is running
✅ Table created successfully!
✅ Setup complete!
```

### 5. Start the Development Server

```bash
npm run dev
```

### 6. Open Your Browser

Go to [http://localhost:3000](http://localhost:3000)

You should see the Common homepage with tool selection!

## Testing the App

1. Click on "Availability Heatmap"
2. Fill in the form (timezone will auto-detect)
3. Click "Create board"
4. Add your availability by clicking time slots
5. Submit and view the heatmap!

## Stopping the Database

When you're done:

```bash
docker-compose down
```

## Troubleshooting

### "ResourceNotFoundException" Error

**Problem:** Can't create boards, getting DynamoDB error

**Solution:**
1. Make sure Docker is running: `docker ps`
2. Check if DynamoDB Local is running: `curl http://localhost:8000`
3. Recreate the table: `./scripts/setup-local-db.sh`
4. Verify `.env.local` has `DYNAMODB_ENDPOINT=http://localhost:8000`

### Port 8000 Already in Use

**Problem:** Can't start docker-compose

**Solution:**
```bash
# Find what's using port 8000
lsof -i :8000

# Kill the process or use a different port in docker-compose.yml
```

### Can't Connect to Database

**Problem:** App can't reach DynamoDB

**Solution:**
1. Check Docker: `docker-compose ps`
2. Should show dynamodb-local as "Up"
3. Test connection: `aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1`

## Next Steps

- **Customize:** Update Venmo links in `.env.local`
- **Add OG Image:** Place a 1200×630 image at `public/og.png`
- **Deploy:** See `DEPLOYMENT.md` for production deployment

## Common Commands

```bash
# Start everything
docker-compose up -d && npm run dev

# Stop database
docker-compose down

# Restart database (clears data since it's in-memory)
docker-compose restart

# View database tables
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1

# View items in table
aws dynamodb scan --table-name Common --endpoint-url http://localhost:8000 --region us-east-1
```

---

**You're all set!** 🎉 Start creating boards and finding common ground.
