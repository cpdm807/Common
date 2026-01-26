// GET /api/metrics - Get aggregated metrics

import { NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

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

export async function GET() {
  try {
    // Scan all items (note: in production, consider using secondary indexes or aggregation tables)
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
      })
    );

    const items = result.Items || [];

    // Separate items by type based on PK prefix
    const boards = items.filter(
      (item) => item.PK?.startsWith("BOARD#") && item.SK === "META" && !item.PK.startsWith("BOARD#SLUG#")
    );
    const polls = items.filter(
      (item) => item.PK?.startsWith("POLL#") && item.SK === "META" && !item.PK.startsWith("POLL#SLUG#")
    );
    const boardTools = items.filter(
      (item) => item.PK?.startsWith("BOARDTOOL#") && item.SK === "META" && !item.PK.startsWith("BOARDTOOL#SLUG#")
    );
    const contributions = items.filter((item) => item.SK?.startsWith("CONTRIB#"));
    const pollVotes = items.filter((item) => item.SK?.startsWith("VOTE#"));
    const feedback = items.filter((item) => item.SK?.startsWith("FB#"));

    // Calculate totals - include all tools
    const totalBoards = boards.length + polls.length + boardTools.length;
    const totalContributions = contributions.length + pollVotes.length;
    const totalViews = 
      boards.reduce((sum, board) => sum + (board.stats?.views || 0), 0) +
      polls.reduce((sum, poll) => sum + (poll.stats?.views || 0), 0) +
      boardTools.reduce((sum, tool) => sum + (tool.stats?.views || 0), 0);

    // Count feedback by sentiment
    const positiveFeedback = feedback.filter((f) => f.sentiment === "up").length;
    const negativeFeedback = feedback.filter((f) => f.sentiment === "down").length;

    // Per-tool metrics
    const toolMetrics: Record<string, any> = {};
    
    // Process boards (availability, readiness)
    boards.forEach((board) => {
      const toolType = board.toolType || "unknown";
      
      if (!toolMetrics[toolType]) {
        toolMetrics[toolType] = {
          toolType,
          boardsCreated: 0,
          totalContributions: 0,
          totalViews: 0,
        };
      }
      
      toolMetrics[toolType].boardsCreated++;
      toolMetrics[toolType].totalContributions += board.stats?.contributions || 0;
      toolMetrics[toolType].totalViews += board.stats?.views || 0;
    });

    // Process polls
    polls.forEach((poll) => {
      const toolType = "poll";
      
      if (!toolMetrics[toolType]) {
        toolMetrics[toolType] = {
          toolType,
          boardsCreated: 0,
          totalContributions: 0,
          totalViews: 0,
        };
      }
      
      toolMetrics[toolType].boardsCreated++;
      toolMetrics[toolType].totalContributions += poll.stats?.votes || 0;
      toolMetrics[toolType].totalViews += poll.stats?.views || 0;
    });

    // Process board tools
    boardTools.forEach((tool) => {
      const toolType = "board";
      
      if (!toolMetrics[toolType]) {
        toolMetrics[toolType] = {
          toolType,
          boardsCreated: 0,
          totalContributions: 0,
          totalViews: 0,
        };
      }
      
      toolMetrics[toolType].boardsCreated++;
      toolMetrics[toolType].totalContributions += tool.stats?.items || 0;
      toolMetrics[toolType].totalViews += tool.stats?.views || 0;
    });

    // Get recent boards (last 10) - include all tool types
    const allTools = [
      ...boards.map((board) => ({
        boardId: board.boardId,
        slug: undefined,
        toolType: board.toolType,
        title: board.title,
        createdAt: board.createdAt,
        contributions: board.stats?.contributions || 0,
        views: board.stats?.views || 0,
      })),
      ...polls.map((poll) => ({
        boardId: poll.pollId,
        slug: poll.slug,
        toolType: "poll" as const,
        title: poll.question,
        createdAt: poll.createdAt,
        contributions: poll.stats?.votes || 0,
        views: poll.stats?.views || 0,
      })),
      ...boardTools.map((tool) => ({
        boardId: tool.boardId,
        slug: tool.slug,
        toolType: "board" as const,
        title: tool.title,
        createdAt: tool.createdAt,
        contributions: tool.stats?.items || 0,
        views: tool.stats?.views || 0,
      })),
    ];

    const recentBoards = allTools
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // Get recent feedback (last 20)
    const recentFeedback = feedback
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)
      .map((fb) => ({
        sentiment: fb.sentiment,
        comment: fb.comment,
        createdAt: fb.createdAt,
        boardId: fb.boardId,
        toolType: fb.toolType,
        context: fb.context,
      }));

    return NextResponse.json({
      totals: {
        totalBoards,
        totalContributions,
        totalViews,
        positiveFeedback,
        negativeFeedback,
      },
      byTool: Object.values(toolMetrics),
      recentBoards,
      recentFeedback,
    });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
