// DynamoDB client and data access layer

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type { Board, Contribution, Feedback } from "./types";

// Configure DynamoDB client
// For local development, set DYNAMODB_ENDPOINT to http://localhost:8000
const clientConfig: any = {
  region: process.env.AWS_REGION || "us-east-1",
};

if (process.env.DYNAMODB_ENDPOINT) {
  clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
  clientConfig.credentials = {
    accessKeyId: "local",
    secretAccessKey: "local",
  };
}

const client = new DynamoDBClient(clientConfig);

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.COMMON_TABLE_NAME || "Common";

// Board operations

export async function createBoard(board: Board): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `BOARD#${board.boardId}`,
        SK: "META",
        ...board,
        TTL: board.expiresAtHard,
      },
    })
  );
}

export async function getBoard(boardId: string): Promise<Board | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `BOARD#${boardId}`,
        SK: "META",
      },
    })
  );

  if (!result.Item) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { PK, SK, TTL, ...board } = result.Item;
  return board as Board;
}

export async function incrementBoardViews(boardId: string): Promise<void> {
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `BOARD#${boardId}`,
          SK: "META",
        },
        UpdateExpression: "ADD stats.#views :inc",
        ExpressionAttributeNames: {
          "#views": "views",
        },
        ExpressionAttributeValues: {
          ":inc": 1,
        },
      })
    );
  } catch (error) {
    // Best-effort, don't fail if update fails
    console.error("Error incrementing views:", error);
  }
}

export async function incrementBoardContributions(boardId: string): Promise<void> {
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `BOARD#${boardId}`,
          SK: "META",
        },
        UpdateExpression: "ADD stats.#contributions :inc",
        ExpressionAttributeNames: {
          "#contributions": "contributions",
        },
        ExpressionAttributeValues: {
          ":inc": 1,
        },
      })
    );
  } catch (error) {
    console.error("Error incrementing contributions:", error);
  }
}

// Contribution operations

export async function createContribution(
  boardId: string,
  contribution: Contribution
): Promise<void> {
  const createdAtEpochMs = new Date(contribution.createdAt).getTime();
  const random = Math.random().toString(36).substring(2, 10);

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `BOARD#${boardId}`,
        SK: `CONTRIB#${createdAtEpochMs}#${random}`,
        ...contribution,
      },
    })
  );
}

export async function getBoardContributions(
  boardId: string
): Promise<Contribution[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `BOARD#${boardId}`,
        ":sk": "CONTRIB#",
      },
    })
  );

  if (!result.Items) {
    return [];
  }

  return result.Items.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PK, SK, ...contribution } = item;
    return contribution as Contribution;
  });
}

// Feedback operations

export async function createFeedback(feedback: Feedback): Promise<void> {
  const createdAtEpochMs = new Date(feedback.createdAt).getTime();
  const random = Math.random().toString(36).substring(2, 10);

  const pk =
    feedback.context === "global"
      ? "FEEDBACK#GLOBAL"
      : `FEEDBACK#BOARD#${feedback.boardId}`;

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: pk,
        SK: `FB#${createdAtEpochMs}#${random}`,
        ...feedback,
        TTL: feedback.expiresAtHard,
      },
    })
  );
}

// Rate limiting helpers (best-effort)

export async function checkAndUpdateRateLimit(
  boardId: string,
  maxPerMinute: number
): Promise<boolean> {
  try {
    const board = await getBoard(boardId);
    if (!board) return true; // Allow if board not found

    const now = Math.floor(Date.now() / 1000);
    const windowStart = board.rateLimit?.contributions?.windowStart || 0;
    const count = board.rateLimit?.contributions?.count || 0;

    // Reset if more than 60 seconds passed
    if (now - windowStart > 60) {
      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `BOARD#${boardId}`,
            SK: "META",
          },
          UpdateExpression: "SET rateLimit.contributions = :rl",
          ExpressionAttributeValues: {
            ":rl": { count: 1, windowStart: now },
          },
        })
      );
      return true;
    }

    // Check if exceeded
    if (count >= maxPerMinute) {
      return false;
    }

    // Increment count
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `BOARD#${boardId}`,
          SK: "META",
        },
        UpdateExpression: "SET rateLimit.contributions.#count = :count",
        ExpressionAttributeNames: {
          "#count": "count",
        },
        ExpressionAttributeValues: {
          ":count": count + 1,
        },
      })
    );

    return true;
  } catch (error) {
    console.error("Rate limit check error:", error);
    return true; // Allow on error (best-effort)
  }
}
