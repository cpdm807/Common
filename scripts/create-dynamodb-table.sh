#!/bin/bash

# Script to create the DynamoDB table for Common
# Usage: ./scripts/create-dynamodb-table.sh [table-name] [region]

TABLE_NAME=${1:-Common}
REGION=${2:-us-east-1}

echo "Creating DynamoDB table: $TABLE_NAME in region: $REGION"

# Create table
aws dynamodb create-table \
  --table-name "$TABLE_NAME" \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION"

echo "Waiting for table to be active..."
aws dynamodb wait table-exists --table-name "$TABLE_NAME" --region "$REGION"

# Enable TTL
echo "Enabling TTL on attribute: TTL"
aws dynamodb update-time-to-live \
  --table-name "$TABLE_NAME" \
  --time-to-live-specification Enabled=true,AttributeName=TTL \
  --region "$REGION"

echo "✅ Table created successfully!"
echo "Table name: $TABLE_NAME"
echo "Region: $REGION"
echo ""
echo "Don't forget to update your .env.local:"
echo "COMMON_TABLE_NAME=$TABLE_NAME"
echo "AWS_REGION=$REGION"
