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

    // Separate items by type
    const boards = items.filter((item) => item.SK === "META");
    const contributions = items.filter((item) => item.SK?.startsWith("CONTRIB#"));
    const feedback = items.filter((item) => item.SK?.startsWith("FB#"));

    // Calculate totals
    const totalBoards = boards.length;
    const totalContributions = contributions.length;
    const totalViews = boards.reduce((sum, board) => sum + (board.stats?.views || 0), 0);

    // Count feedback by sentiment
    const positiveFeedback = feedback.filter((f) => f.sentiment === "up").length;
    const negativeFeedback = feedback.filter((f) => f.sentiment === "down").length;

    // Per-tool metrics
    const toolMetrics: Record<string, any> = {};
    
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

    // Get recent boards (last 10)
    const recentBoards = boards
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((board) => ({
        boardId: board.boardId,
        toolType: board.toolType,
        title: board.title,
        createdAt: board.createdAt,
        contributions: board.stats?.contributions || 0,
        views: board.stats?.views || 0,
      }));

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
