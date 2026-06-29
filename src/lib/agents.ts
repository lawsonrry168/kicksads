export interface SlideOutline {
  number: number;
  title: string;
  content: string;
  type: "title" | "content" | "demo" | "exercise" | "summary";
}

export interface PublishResult {
  success: boolean;
  postId?: string;
  error?: string;
}

export async function generatePost(
  topic: string,
  pillar: string,
  provider: string,
  apiKey: string
): Promise<string> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, pillar, provider, apiKey }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.content as string;
}

export async function generateSlides(
  topic: string,
  audience: string,
  provider: string,
  apiKey: string
): Promise<{ outline: SlideOutline[] }> {
  const response = await fetch("/api/slides", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, audience, provider, apiKey }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function publishToPubler(
  content: string,
  platform: string,
  scheduledAt: string,
  publerKey: string
): Promise<PublishResult> {
  const response = await fetch("/api/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, platform, scheduledAt, publerKey }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    return { success: false, error: error.error || `HTTP ${response.status}` };
  }

  return response.json();
}
