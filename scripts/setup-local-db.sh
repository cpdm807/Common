#!/bin/bash

# Script to set up DynamoDB Local for development
# Usage: ./scripts/setup-local-db.sh

TABLE_NAME=${1:-Common}
ENDPOINT="http://localhost:8000"
REGION="us-east-1"

echo "Setting up DynamoDB Local..."
echo "Table name: $TABLE_NAME"
echo "Endpoint: $ENDPOINT"
echo ""

# Check if DynamoDB Local is running
if ! curl -s $ENDPOINT > /dev/null 2>&1; then
    echo "❌ DynamoDB Local is not running!"
    echo ""
    echo "Start it with Docker:"
    echo "  docker-compose up -d"
    echo ""
    echo "Or download and run manually:"
    echo "  https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html"
    exit 1
fi

echo "✅ DynamoDB Local is running"
echo ""

# Create table
echo "Creating table: $TABLE_NAME"
aws dynamodb create-table \
  --table-name "$TABLE_NAME" \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Table created successfully!"
else
    echo "⚠️  Table may already exist (this is okay)"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Add this to your .env.local:"
echo "DYNAMODB_ENDPOINT=http://localhost:8000"
echo "COMMON_TABLE_NAME=$TABLE_NAME"
echo "AWS_REGION=$REGION"
