# Troubleshooting Guide

## Deployment Issues

### Internal Server Error on Board Creation (AWS Amplify)

**Symptoms:**
- Local development works fine
- Production deployment shows "Internal Server Error" when creating boards
- Error in Amplify logs: "ResourceNotFoundException", "CredentialsProviderError", or similar DynamoDB errors

**Most Common Cause:** IAM service role not properly configured

See [AMPLIFY_IAM_TROUBLESHOOTING.md](AMPLIFY_IAM_TROUBLESHOOTING.md) for a detailed step-by-step fix.

**Checklist:**

#### 1. ✅ Verify DynamoDB Table Exists

```bash
aws dynamodb describe-table --table-name Common --region YOUR_REGION
```

Should return table details. If not, create it:
```bash
./scripts/create-dynamodb-table.sh Common YOUR_REGION
```

#### 2. ✅ Verify IAM Permissions

Go to **Amplify Console → Your App → App Settings → General → Service Role**

The role needs these permissions:

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

Replace `REGION` and `ACCOUNT_ID` with your values.

#### 3. ✅ Verify Environment Variables

Go to **Amplify Console → Your App → App Settings → Environment variables**

Required variables:
- `DYNAMODB_REGION` - Must match your DynamoDB table region (e.g., "us-east-1")
- `COMMON_TABLE_NAME` - Must match your table name (e.g., "Common")
- `NEXT_PUBLIC_BASE_URL` - Your production URL

**Important Notes:**
- Use `DYNAMODB_REGION` NOT `AWS_REGION` (AWS Amplify reserves the `AWS_` prefix)
- If you ADDED or CHANGED environment variables, you MUST redeploy

#### 4. ✅ Redeploy (If Needed)

**You need to redeploy if:**
- ✅ You added new environment variables
- ✅ You changed existing environment variables
- ✅ You want to pick up the latest code changes

**You DON'T need to redeploy if:**
- ❌ You only changed IAM permissions (these apply immediately)
- ❌ You only created the DynamoDB table (no code/config change)

**How to redeploy:**

Go to **Amplify Console → Your App → Deployments** and click **Redeploy this version**

Or push a new commit:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

#### 5. ✅ Check Amplify Logs

After redeploying, go to **Amplify Console → Your App → Monitoring → Logs**

Look for errors like:
- `ResourceNotFoundException` - Table doesn't exist or wrong region
- `AccessDeniedException` - IAM permissions issue
- `ValidationException` - Incorrect table structure

### Common Issues

#### Wrong Table Name

**Problem:** Environment variable doesn't match actual table name

**Check:**
```bash
# List your tables
aws dynamodb list-tables --region YOUR_REGION

# Check environment variable
# In Amplify Console → Environment variables → COMMON_TABLE_NAME
```

They must match exactly (case-sensitive).

#### Wrong Region

**Problem:** Table exists but in different region than environment variable

**Check:**
```bash
# Check where your table is
aws dynamodb describe-table --table-name Common --region us-east-1
aws dynamodb describe-table --table-name Common --region us-west-2
# etc.

# Update DYNAMODB_REGION environment variable to match
```

#### IAM Role Not Attached

**Problem:** Amplify app isn't using a service role with DynamoDB permissions

**Solution:**
1. Go to **Amplify Console → Your App → App Settings → General**
2. Under **Service role**, click **Edit**
3. Select an existing role with DynamoDB permissions or create a new one
4. Save and redeploy

#### Missing Environment Variables

**Problem:** Required variables not set in production

**Solution:**
1. Go to **Amplify Console → Your App → App Settings → Environment variables**
2. Add all required variables from `env.example`
3. Click **Save**
4. **Redeploy your app** (environment changes require redeploy)

### Testing After Deployment

1. **Visit your production URL**
2. **Open browser DevTools (F12) → Network tab**
3. **Try to create a board**
4. **Check the Network request** to `/api/boards`
   - 200 = Success ✅
   - 500 = Server error (check Amplify logs)
   - 403 = IAM permission issue

### Quick Deployment Checklist

Before deploying:
- [ ] DynamoDB table created in correct region
- [ ] IAM role has DynamoDB permissions
- [ ] Environment variables set in Amplify Console
- [ ] `NEXT_PUBLIC_BASE_URL` matches your actual domain
- [ ] Redeployed after setting environment variables

### Still Not Working?

Check Amplify build logs:
1. Go to **Amplify Console → Your App → Build history**
2. Click on latest build
3. Look for errors in:
   - **Provision** phase (setup)
   - **Build** phase (npm install, npm build)
   - **Deploy** phase (deployment)
   - **Live logs** (runtime errors)

Common runtime errors:
```
"Cannot read properties of undefined" → Missing environment variable
"ResourceNotFoundException" → Table doesn't exist or wrong region
"AccessDeniedException" → IAM permissions issue
"NetworkError" → Region mismatch or endpoint issue
```

### Development vs Production Differences

| Aspect | Local Development | Production (Amplify) |
|--------|------------------|---------------------|
| Database | DynamoDB Local | AWS DynamoDB |
| Endpoint | `http://localhost:8000` | AWS regional endpoint |
| Credentials | Mock/local | IAM service role |
| Environment | `.env.local` | Amplify env vars |

Make sure you:
- **DON'T** set `DYNAMODB_ENDPOINT` in production
- **DO** set `DYNAMODB_REGION` in production (NOT `AWS_REGION` - that's reserved)
- **DO** use IAM role (not access keys) in production

---

## Need More Help?

1. Check Amplify logs for specific error messages
2. Verify DynamoDB table exists: `aws dynamodb describe-table --table-name Common --region YOUR_REGION`
3. Test IAM permissions with AWS CLI
4. Review the deployment checklist in `DEPLOYMENT.md`
