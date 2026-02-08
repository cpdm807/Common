// DynamoDB client and data access layer

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import type { Board, Contribution, Feedback, Poll, PollOption, PollVote, BoardTool, BoardColumn, BoardItem, BoardVote, MetricsAggregation, ToolType } from "./types";

// Configure DynamoDB client
// For local development, set DYNAMODB_ENDPOINT to http://localhost:8000
const clientConfig: any = {
  region: process.env.DYNAMODB_REGION || process.env.AWS_REGION || "us-east-1",
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
    const { PK, ...contribution } = item;
    // Keep SK for updates
    return contribution as Contribution & { SK?: string };
  });
}

export async function updateContribution(
  boardId: string,
  contributionId: string,
  name: string | undefined,
  payload: any
): Promise<void> {
  // First, find the contribution to get its SK
  const contributions = await getBoardContributions(boardId);
  const contribution = contributions.find((c) => c.contributionId === contributionId);
  
  if (!contribution || !(contribution as any).SK) {
    throw new Error("Contribution not found");
  }

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `BOARD#${boardId}`,
        SK: (contribution as any).SK,
      },
      UpdateExpression: "SET #name = :name, payload = :payload",
      ExpressionAttributeNames: {
        "#name": "name",
      },
      ExpressionAttributeValues: {
        ":name": name,
        ":payload": payload,
      },
    })
  );
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

// Poll operations

export async function createPoll(poll: Poll): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `POLL#${poll.pollId}`,
        SK: "META",
        ...poll,
        TTL: poll.expiresAt,
      },
    })
  );
}

export async function getPoll(pollId: string): Promise<Poll | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `POLL#${pollId}`,
        SK: "META",
      },
    })
  );

  if (!result.Item) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { PK, SK, TTL, ...poll } = result.Item;
  return poll as Poll;
}

export async function getPollBySlug(slug: string): Promise<Poll | null> {
  // First, get the pollId from the slug mapping
  const mappingResult = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `POLL#SLUG#${slug}`,
        SK: "META",
      },
    })
  );

  if (!mappingResult.Item || !mappingResult.Item.pollId) {
    return null;
  }

  const pollId = mappingResult.Item.pollId as string;
  return getPoll(pollId);
}

export async function createPollSlugMapping(slug: string, pollId: string, expiresAt: number): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `POLL#SLUG#${slug}`,
        SK: "META",
        pollId,
        TTL: expiresAt,
      },
    })
  );
}

export async function updatePoll(pollId: string, updates: Partial<Poll>): Promise<void> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  if (updates.question !== undefined) {
    updateExpressions.push("#question = :question");
    expressionAttributeNames["#question"] = "question";
    expressionAttributeValues[":question"] = updates.question;
  }

  if (updates.description !== undefined) {
    updateExpressions.push("description = :description");
    expressionAttributeValues[":description"] = updates.description;
  }

  if (updates.settings !== undefined) {
    updateExpressions.push("settings = :settings");
    expressionAttributeValues[":settings"] = updates.settings;
  }

  if (updates.closedAt !== undefined) {
    updateExpressions.push("closedAt = :closedAt");
    expressionAttributeValues[":closedAt"] = updates.closedAt;
  }

  if (updates.closeAt !== undefined) {
    updateExpressions.push("closeAt = :closeAt");
    expressionAttributeValues[":closeAt"] = updates.closeAt;
  }

  if (updates.expiresAt !== undefined) {
    updateExpressions.push("expiresAt = :expiresAt");
    expressionAttributeValues[":expiresAt"] = updates.expiresAt;
    // Also update TTL
    updateExpressions.push("TTL = :ttl");
    expressionAttributeValues[":ttl"] = updates.expiresAt;
  }

  if (updates.updatedAt !== undefined) {
    updateExpressions.push("updatedAt = :updatedAt");
    expressionAttributeValues[":updatedAt"] = updates.updatedAt;
  }

  if (updateExpressions.length === 0) {
    return; // Nothing to update
  }

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `POLL#${pollId}`,
        SK: "META",
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );
}

export async function deletePoll(pollId: string): Promise<void> {
  // Delete poll meta
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `POLL#${pollId}`,
        SK: "META",
      },
    })
  );

  // Delete all options and votes (they'll be cleaned up by TTL, but we can delete them explicitly)
  // For now, we'll rely on TTL cleanup
}

export async function incrementPollViews(pollId: string): Promise<void> {
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `POLL#${pollId}`,
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
    console.error("Error incrementing poll views:", error);
  }
}

export async function incrementPollVotes(pollId: string): Promise<void> {
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `POLL#${pollId}`,
          SK: "META",
        },
        UpdateExpression: "ADD stats.#votes :inc",
        ExpressionAttributeNames: {
          "#votes": "votes",
        },
        ExpressionAttributeValues: {
          ":inc": 1,
        },
      })
    );
  } catch (error) {
    console.error("Error incrementing poll votes:", error);
  }
}

// Poll option operations

export async function createPollOption(option: PollOption): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `POLL#${option.pollId}`,
        SK: `OPTION#${option.id}`,
        ...option,
      },
    })
  );
}

export async function getPollOptions(pollId: string): Promise<PollOption[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `POLL#${pollId}`,
        ":sk": "OPTION#",
      },
    })
  );

  if (!result.Items) {
    return [];
  }

  return result.Items.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PK, SK, ...option } = item;
    return option as PollOption;
  });
}

export async function updatePollOption(
  pollId: string,
  optionId: string,
  updates: Partial<PollOption>
): Promise<void> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  if (updates.text !== undefined) {
    updateExpressions.push("#text = :text");
    expressionAttributeNames["#text"] = "text";
    expressionAttributeValues[":text"] = updates.text;
  }

  if (updates.order !== undefined) {
    updateExpressions.push("#order = :order");
    expressionAttributeNames["#order"] = "order";
    expressionAttributeValues[":order"] = updates.order;
  }

  if (updates.isArchived !== undefined) {
    updateExpressions.push("isArchived = :isArchived");
    expressionAttributeValues[":isArchived"] = updates.isArchived;
  }

  if (updateExpressions.length === 0) {
    return;
  }

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `POLL#${pollId}`,
        SK: `OPTION#${optionId}`,
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );
}

// Poll vote operations

export async function createPollVote(vote: PollVote): Promise<void> {
  const createdAtEpochMs = new Date(vote.createdAt).getTime();
  const random = Math.random().toString(36).substring(2, 10);

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `POLL#${vote.pollId}`,
        SK: `VOTE#${createdAtEpochMs}#${random}`,
        ...vote,
      },
    })
  );
}

export async function getPollVotes(pollId: string): Promise<PollVote[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `POLL#${pollId}`,
        ":sk": "VOTE#",
      },
    })
  );

  if (!result.Items) {
    return [];
  }

  return result.Items.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PK, SK, ...vote } = item;
    return vote as PollVote;
  });
}

export async function getPollVotesByVoter(
  pollId: string,
  voterKeyHash: string
): Promise<PollVote[]> {
  const allVotes = await getPollVotes(pollId);
  return allVotes.filter((vote) => vote.voterKeyHash === voterKeyHash);
}

export async function deletePollVote(pollId: string, voteId: string): Promise<void> {
  // First find the vote to get its SK
  const votes = await getPollVotes(pollId);
  const vote = votes.find((v) => v.id === voteId);
  
  if (!vote) {
    throw new Error("Vote not found");
  }

  // We need to find the SK - votes are stored with timestamp-based SK
  // For now, we'll query and delete by matching voteId
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `POLL#${pollId}`,
        ":sk": "VOTE#",
      },
    })
  );

  if (result.Items) {
    for (const item of result.Items) {
      if ((item as PollVote).id === voteId) {
        await docClient.send(
          new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
              PK: `POLL#${pollId}`,
              SK: item.SK,
            },
          })
        );
        return;
      }
    }
  }

  throw new Error("Vote not found");
}

// Rate limiting for polls
export async function checkAndUpdatePollRateLimit(
  pollId: string,
  maxPerMinute: number
): Promise<boolean> {
  try {
    const poll = await getPoll(pollId);
    if (!poll) return true;

    const now = Math.floor(Date.now() / 1000);
    const windowStart = poll.rateLimit?.votes?.windowStart || 0;
    const count = poll.rateLimit?.votes?.count || 0;

    if (now - windowStart > 60) {
      // Reset window - need to set the entire rateLimit object
      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `POLL#${pollId}`,
            SK: "META",
          },
          UpdateExpression: "SET rateLimit = :rl",
          ExpressionAttributeValues: {
            ":rl": {
              votes: { count: 1, windowStart: now },
            },
          },
        })
      );
      return true;
    }

    if (count >= maxPerMinute) {
      return false;
    }

    // Increment count - need to ensure rateLimit exists first
    if (!poll.rateLimit) {
      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `POLL#${pollId}`,
            SK: "META",
          },
          UpdateExpression: "SET rateLimit = :rl",
          ExpressionAttributeValues: {
            ":rl": {
              votes: { count: count + 1, windowStart },
            },
          },
        })
      );
    } else {
      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `POLL#${pollId}`,
            SK: "META",
          },
          UpdateExpression: "SET rateLimit.votes.#count = :count",
          ExpressionAttributeNames: {
            "#count": "count",
          },
          ExpressionAttributeValues: {
            ":count": count + 1,
          },
        })
      );
    }

    return true;
  } catch (error) {
    console.error("Rate limit check error:", error);
    return true;
  }
}

// Board tool operations

export async function createBoardTool(board: BoardTool): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `BOARDTOOL#${board.boardId}`,
        SK: "META",
        ...board,
        TTL: board.expiresAt,
      },
    })
  );
}

export async function getBoardTool(boardId: string): Promise<BoardTool | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `BOARDTOOL#${boardId}`,
        SK: "META",
      },
    })
  );

  if (!result.Item) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { PK, SK, TTL, ...board } = result.Item;
  return board as BoardTool;
}

export async function getBoardToolBySlug(slug: string): Promise<BoardTool | null> {
  // First, get the boardId from the slug mapping
  const mappingResult = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `BOARDTOOL#SLUG#${slug}`,
        SK: "META",
      },
    })
  );

  if (!mappingResult.Item || !mappingResult.Item.boardId) {
    return null;
  }

  const boardId = mappingResult.Item.boardId as string;
  return getBoardTool(boardId);
}

export async function createBoardToolSlugMapping(slug: string, boardId: string, expiresAt: number): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `BOARDTOOL#SLUG#${slug}`,
        SK: "META",
        boardId,
        TTL: expiresAt,
      },
    })
  );
}

export async function updateBoardTool(boardId: string, updates: Partial<BoardTool>): Promise<void> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  if (updates.title !== undefined) {
    updateExpressions.push("#title = :title");
    expressionAttributeNames["#title"] = "title";
    expressionAttributeValues[":title"] = updates.title;
  }

  if (updates.votingEnabled !== undefined) {
    updateExpressions.push("votingEnabled = :votingEnabled");
    expressionAttributeValues[":votingEnabled"] = updates.votingEnabled;
  }

  if (updates.closedAt !== undefined) {
    updateExpressions.push("closedAt = :closedAt");
    expressionAttributeValues[":closedAt"] = updates.closedAt;
  }

  if (updates.closeAt !== undefined) {
    updateExpressions.push("closeAt = :closeAt");
    expressionAttributeValues[":closeAt"] = updates.closeAt;
  }

  if (updates.expiresAt !== undefined) {
    updateExpressions.push("expiresAt = :expiresAt");
    expressionAttributeValues[":expiresAt"] = updates.expiresAt;
    // Also update TTL
    updateExpressions.push("TTL = :ttl");
    expressionAttributeValues[":ttl"] = updates.expiresAt;
  }

  if (updates.updatedAt !== undefined) {
    updateExpressions.push("updatedAt = :updatedAt");
    expressionAttributeValues[":updatedAt"] = updates.updatedAt;
  }

  if (updateExpressions.length === 0) {
    return; // Nothing to update
  }

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `BOARDTOOL#${boardId}`,
        SK: "META",
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );
}

export async function incrementBoardToolViews(boardId: string): Promise<void> {
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `BOARDTOOL#${boardId}`,
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
    console.error("Error incrementing board views:", error);
  }
}

export async function incrementBoardToolItems(boardId: string): Promise<void> {
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `BOARDTOOL#${boardId}`,
          SK: "META",
        },
        UpdateExpression: "ADD stats.#items :inc",
        ExpressionAttributeNames: {
          "#items": "items",
        },
        ExpressionAttributeValues: {
          ":inc": 1,
        },
      })
    );
  } catch (error) {
    console.error("Error incrementing board items:", error);
  }
}

export async function decrementBoardToolItems(boardId: string): Promise<void> {
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `BOARDTOOL#${boardId}`,
          SK: "META",
        },
        UpdateExpression: "ADD stats.#items :dec",
        ExpressionAttributeNames: {
          "#items": "items",
        },
        ExpressionAttributeValues: {
          ":dec": -1,
        },
      })
    );
  } catch (error) {
    console.error("Error decrementing board items:", error);
  }
}

// Board column operations

export async function createBoardColumn(column: BoardColumn): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `BOARDTOOL#${column.boardId}`,
        SK: `COLUMN#${column.id}`,
        ...column,
      },
    })
  );
}

export async function getBoardColumns(boardId: string): Promise<BoardColumn[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `BOARDTOOL#${boardId}`,
        ":sk": "COLUMN#",
      },
    })
  );

  if (!result.Items) {
    return [];
  }

  return result.Items.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PK, SK, ...column } = item;
    return column as BoardColumn;
  });
}

// Board item operations

export async function createBoardItem(item: BoardItem): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `BOARDTOOL#${item.boardId}`,
        SK: `ITEM#${item.id}`,
        ...item,
      },
    })
  );
}

export async function getBoardItems(boardId: string): Promise<BoardItem[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `BOARDTOOL#${boardId}`,
        ":sk": "ITEM#",
      },
    })
  );

  if (!result.Items) {
    return [];
  }

  return result.Items.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PK, SK, ...boardItem } = item;
    return boardItem as BoardItem;
  });
}

export async function updateBoardItem(
  boardId: string,
  itemId: string,
  updates: Partial<BoardItem>
): Promise<void> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  if (updates.text !== undefined) {
    updateExpressions.push("#text = :text");
    expressionAttributeNames["#text"] = "text";
    expressionAttributeValues[":text"] = updates.text;
  }

  if (updates.details !== undefined) {
    updateExpressions.push("details = :details");
    expressionAttributeValues[":details"] = updates.details;
  }

  if (updates.tag !== undefined) {
    updateExpressions.push("tag = :tag");
    expressionAttributeValues[":tag"] = updates.tag;
  }

  if (updates.updatedAt !== undefined) {
    updateExpressions.push("updatedAt = :updatedAt");
    expressionAttributeValues[":updatedAt"] = updates.updatedAt;
  }

  if (updateExpressions.length === 0) {
    return;
  }

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `BOARDTOOL#${boardId}`,
        SK: `ITEM#${itemId}`,
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );
}

export async function deleteBoardItem(boardId: string, itemId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `BOARDTOOL#${boardId}`,
        SK: `ITEM#${itemId}`,
      },
    })
  );
}

// Board vote operations

export async function createBoardVote(vote: BoardVote): Promise<void> {
  const createdAtEpochMs = new Date(vote.createdAt).getTime();
  const random = Math.random().toString(36).substring(2, 10);

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `BOARDTOOL#${vote.boardId}`,
        SK: `VOTE#${createdAtEpochMs}#${random}`,
        ...vote,
      },
    })
  );
}

export async function getBoardVotes(boardId: string): Promise<BoardVote[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `BOARDTOOL#${boardId}`,
        ":sk": "VOTE#",
      },
    })
  );

  if (!result.Items) {
    return [];
  }

  return result.Items.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PK, SK, ...vote } = item;
    return vote as BoardVote;
  });
}

export async function getBoardVotesByItem(boardId: string, itemId: string): Promise<BoardVote[]> {
  const allVotes = await getBoardVotes(boardId);
  return allVotes.filter((vote) => vote.itemId === itemId);
}

export async function getBoardVotesByParticipant(boardId: string, participantToken: string): Promise<BoardVote[]> {
  const allVotes = await getBoardVotes(boardId);
  return allVotes.filter((vote) => vote.participantToken === participantToken);
}

export async function deleteBoardVote(boardId: string, voteId: string): Promise<void> {
  // Find the vote to get its SK
  const votes = await getBoardVotes(boardId);
  const vote = votes.find((v) => v.id === voteId);
  
  if (!vote) {
    throw new Error("Vote not found");
  }

  // Query to find the exact SK
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `BOARDTOOL#${boardId}`,
        ":sk": "VOTE#",
      },
    })
  );

  if (result.Items) {
    for (const item of result.Items) {
      if ((item as BoardVote).id === voteId) {
        await docClient.send(
          new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
              PK: `BOARDTOOL#${boardId}`,
              SK: item.SK,
            },
          })
        );
        return;
      }
    }
  }

  throw new Error("Vote not found");
}

// Rate limiting for board tools
export async function checkAndUpdateBoardToolRateLimit(
  boardId: string,
  type: "items" | "votes",
  maxPerMinute: number
): Promise<boolean> {
  try {
    const board = await getBoardTool(boardId);
    if (!board) return true;

    const now = Math.floor(Date.now() / 1000);
    const rateLimitKey = type === "items" ? "items" : "votes";
    const windowStart = board.rateLimit?.[rateLimitKey]?.windowStart || 0;
    const count = board.rateLimit?.[rateLimitKey]?.count || 0;

    if (now - windowStart > 60) {
      // Reset window
      const newRateLimit = { ...board.rateLimit };
      newRateLimit[rateLimitKey] = { count: 1, windowStart: now };
      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `BOARDTOOL#${boardId}`,
            SK: "META",
          },
          UpdateExpression: "SET rateLimit = :rl",
          ExpressionAttributeValues: {
            ":rl": newRateLimit,
          },
        })
      );
      return true;
    }

    if (count >= maxPerMinute) {
      return false;
    }

    // Increment count
    if (!board.rateLimit) {
      const newRateLimit: any = {};
      newRateLimit[rateLimitKey] = { count: count + 1, windowStart };
      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `BOARDTOOL#${boardId}`,
            SK: "META",
          },
          UpdateExpression: "SET rateLimit = :rl",
          ExpressionAttributeValues: {
            ":rl": newRateLimit,
          },
        })
      );
    } else {
      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `BOARDTOOL#${boardId}`,
            SK: "META",
          },
          UpdateExpression: `SET rateLimit.${rateLimitKey}.#count = :count`,
          ExpressionAttributeNames: {
            "#count": "count",
          },
          ExpressionAttributeValues: {
            ":count": count + 1,
          },
        })
      );
    }

    return true;
  } catch (error) {
    console.error("Rate limit check error:", error);
    return true;
  }
}

// Metrics aggregation operations

export async function getMetricsAggregation(): Promise<MetricsAggregation | null> {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: "METRICS#AGGREGATE",
          SK: "CURRENT",
        },
      })
    );

    if (!result.Item) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PK, SK, ...metrics } = result.Item;
    return metrics as MetricsAggregation;
  } catch (error) {
    console.error("Error getting metrics aggregation:", error);
    return null;
  }
}

export async function initializeMetricsAggregation(): Promise<void> {
  const now = new Date().toISOString();
  const initialMetrics: MetricsAggregation = {
    totals: {
      totalBoards: 0,
      totalContributions: 0,
      totalViews: 0,
      positiveFeedback: 0,
      negativeFeedback: 0,
    },
    byTool: {},
    lastUpdated: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: "METRICS#AGGREGATE",
        SK: "CURRENT",
        ...initialMetrics,
      },
    })
  );
}

export async function incrementMetricsOnCreate(
  toolType: ToolType,
  views: number = 0
): Promise<void> {
  try {
    let metrics = await getMetricsAggregation();
    if (!metrics) {
      await initializeMetricsAggregation();
      metrics = await getMetricsAggregation();
      if (!metrics) return;
    }

    metrics.totals.totalBoards += 1;
    metrics.totals.totalViews += views;
    metrics.lastUpdated = new Date().toISOString();

    if (!metrics.byTool[toolType]) {
      metrics.byTool[toolType] = {
        toolType,
        boardsCreated: 1,
        totalContributions: 0,
        totalViews: views,
      };
    } else {
      metrics.byTool[toolType].boardsCreated += 1;
      metrics.byTool[toolType].totalViews += views;
    }

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: "METRICS#AGGREGATE",
          SK: "CURRENT",
          ...metrics,
        },
      })
    );
  } catch (error) {
    console.error("Error incrementing metrics on create:", error);
  }
}

export async function incrementMetricsContributions(
  toolType: ToolType,
  count: number = 1
): Promise<void> {
  try {
    let metrics = await getMetricsAggregation();
    if (!metrics) {
      await initializeMetricsAggregation();
      metrics = await getMetricsAggregation();
      if (!metrics) return;
    }

    metrics.totals.totalContributions += count;
    metrics.lastUpdated = new Date().toISOString();

    if (metrics.byTool[toolType]) {
      metrics.byTool[toolType].totalContributions += count;
    }

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: "METRICS#AGGREGATE",
          SK: "CURRENT",
          ...metrics,
        },
      })
    );
  } catch (error) {
    console.error("Error incrementing metrics contributions:", error);
  }
}

export async function incrementMetricsViews(
  toolType: ToolType,
  count: number = 1
): Promise<void> {
  try {
    let metrics = await getMetricsAggregation();
    if (!metrics) {
      await initializeMetricsAggregation();
      metrics = await getMetricsAggregation();
      if (!metrics) return;
    }

    metrics.totals.totalViews += count;
    metrics.lastUpdated = new Date().toISOString();

    if (metrics.byTool[toolType]) {
      metrics.byTool[toolType].totalViews += count;
    }

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: "METRICS#AGGREGATE",
          SK: "CURRENT",
          ...metrics,
        },
      })
    );
  } catch (error) {
    console.error("Error incrementing metrics views:", error);
  }
}

export async function incrementMetricsFeedback(
  sentiment: "up" | "down"
): Promise<void> {
  try {
    let metrics = await getMetricsAggregation();
    if (!metrics) {
      await initializeMetricsAggregation();
      metrics = await getMetricsAggregation();
      if (!metrics) return;
    }

    if (sentiment === "up") {
      metrics.totals.positiveFeedback += 1;
    } else {
      metrics.totals.negativeFeedback += 1;
    }
    metrics.lastUpdated = new Date().toISOString();

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: "METRICS#AGGREGATE",
          SK: "CURRENT",
          ...metrics,
        },
      })
    );
  } catch (error) {
    console.error("Error incrementing metrics feedback:", error);
  }
}
