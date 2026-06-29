import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, platform, scheduledAt, publerKey } = body as {
      content: string;
      platform: string;
      scheduledAt: string;
      publerKey: string;
    };

    if (!content || !platform || !publerKey) {
      return NextResponse.json(
        { error: "Missing required fields: content, platform, publerKey" },
        { status: 400 }
      );
    }

    const publerPayload: Record<string, unknown> = {
      text: content,
      profiles: [platform],
    };

    if (scheduledAt) {
      publerPayload.scheduled_at = scheduledAt;
    }

    const response = await fetch("https://app.publer.io/api/v1/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publerKey}`,
      },
      body: JSON.stringify(publerPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error: errorData.message || `Publer API error: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      postId: data.id?.toString() || data.post_id?.toString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
