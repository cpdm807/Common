# Deployment Checklist

This document provides a step-by-step checklist for deploying Common to production.

## Pre-Deployment

### 1. Environment Setup

- [ ] Create production DynamoDB table
  ```bash
  ./scripts/create-dynamodb-table.sh Common us-east-1
  ```
- [ ] Verify TTL is enabled on the `TTL` attribute
- [ ] Note your AWS region and table name

### 2. Domain Setup (Optional)

- [ ] Register domain (e.g., common.bz)
- [ ] Set up SSL certificate in AWS Certificate Manager
- [ ] Configure custom domain in Amplify

### 3. Asset Preparation

- [ ] Create Open Graph image (`public/og.png`)
  - Dimensions: 1200×630 pixels
  - Keep it simple and on-brand
- [ ] Update meta tags if needed

### 4. Environment Variables

Reference `env.example` for the complete list. Prepare these values:

- [ ] `AWS_REGION` - Your DynamoDB region
- [ ] `COMMON_TABLE_NAME` - Your table name
- [ ] `NEXT_PUBLIC_BASE_URL` - Your production URL
- [ ] `NEXT_PUBLIC_VENMO_URL` - Your Venmo profile (optional)
- [ ] `NEXT_PUBLIC_VENMO_HANDLE` - Your Venmo handle (optional)

## Deployment via AWS Amplify Console

### 1. Connect Repository

- [ ] Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
- [ ] Click "New app" → "Host web app"
- [ ] Connect GitHub/GitLab repository
- [ ] Select branch (e.g., `main`)

### 2. Configure Build

- [ ] Review build settings (should auto-detect Next.js)
- [ ] Confirm `amplify.yml` is recognized
- [ ] Set Node.js version to 18+ if needed

### 3. Set Environment Variables

In Amplify Console → App Settings → Environment variables:

- [ ] Add `AWS_REGION`
- [ ] Add `COMMON_TABLE_NAME`
- [ ] Add `NEXT_PUBLIC_BASE_URL`
- [ ] Add `NEXT_PUBLIC_VENMO_URL` (optional)
- [ ] Add `NEXT_PUBLIC_VENMO_HANDLE` (optional)

### 4. Configure IAM Role

- [ ] Go to Amplify → App Settings → General → App details
- [ ] Edit service role or create new one
- [ ] Attach DynamoDB permissions:

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

### 5. Deploy

- [ ] Click "Save and deploy"
- [ ] Wait for build to complete (~5-10 minutes)
- [ ] Verify deployment succeeded

## Post-Deployment

### 1. Verification

- [ ] Visit your production URL
- [ ] Create a test board
- [ ] Add test availability
- [ ] Verify heatmap displays correctly
- [ ] Test on mobile device
- [ ] Check link preview on Slack/Discord/iMessage
- [ ] Submit test feedback

### 2. Monitoring

- [ ] Check Amplify logs for errors
- [ ] Monitor DynamoDB for proper writes
- [ ] Verify TTL is auto-deleting expired items (takes 48hrs to start)

### 3. DNS & Custom Domain (if applicable)

- [ ] Add custom domain in Amplify Console
- [ ] Update `NEXT_PUBLIC_BASE_URL` environment variable
- [ ] Wait for SSL certificate provisioning
- [ ] Verify HTTPS works

### 4. Final Touches

- [ ] Update support page with actual donation info
- [ ] Share with initial users
- [ ] Monitor feedback

## Troubleshooting

### Build Fails

- Check Node.js version (18+ required)
- Verify all dependencies are in `package.json`
- Review build logs in Amplify Console

### DynamoDB Errors

- Verify IAM role has correct permissions
- Check table name matches environment variable
- Confirm region is correct

### Environment Variables Not Working

- `NEXT_PUBLIC_*` variables must be set before build
- Redeploy after changing environment variables
- Clear build cache if needed

### Link Previews Not Showing

- Verify `og.png` exists in `public/`
- Check metadata endpoint: `/m/board/[boardId]`
- Test with [Open Graph Debugger](https://www.opengraph.xyz/)

## Rollback Plan

If something goes wrong:

1. Go to Amplify Console → App → Deployments
2. Find the last working deployment
3. Click "Redeploy this version"

## Security Notes

- Never commit `.env.local` or `.env`
- Rotate AWS credentials periodically
- Review DynamoDB access patterns
- Monitor for abuse via CloudWatch (optional)

## Cost Estimation

Rough monthly costs for moderate usage:

- **Amplify Hosting**: $0-5 (free tier: 1000 build minutes/month)
- **DynamoDB**: $0-10 (free tier: 25GB storage, 25 RCU/WCU)
- **Data Transfer**: $0-5

Total: ~$0-20/month for small-to-medium traffic

---

✅ Once deployed, Common should be live and ready to help groups find common ground!
