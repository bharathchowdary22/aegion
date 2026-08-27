import { createClient } from "@/lib/supabase/client";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleStreamResponse(
  response: Response, 
  onMessage: (chunk: string) => void, 
  onError: (error: string) => void, 
  onDone: () => void
) {
  if (!response.ok) {
    let errorMsg = "Failed to connect to the server.";
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail?.[0]?.msg || errorData.detail || errorMsg;
    } catch {
      // ignore
    }
    throw new ApiError(errorMsg);
  }

  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || ""; // Keep the incomplete part

    for (const block of lines) {
      if (!block.trim()) continue;
      
      let event = "message";
      let dataStr = "";
      
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) {
          event = line.replace("event:", "").trim();
        } else if (line.startsWith("data:")) {
          dataStr = line.replace("data:", "").trim();
        }
      }

      if (!dataStr) continue;

      try {
        const parsed = JSON.parse(dataStr);
        
        if (event === "error" || parsed.type === "error") {
          onError(parsed.message || "An error occurred");
          return;
        }

        if (event === "done" || parsed.type === "done") {
          onDone();
          return;
        }

        if ((event === "message" || parsed.type === "message") && parsed.content) {
          onMessage(parsed.content);
        }
      } catch {
        console.error("Failed to parse SSE data", dataStr);
      }
    }
  }
  
  onDone();
}

export async function streamChat(
  messages: Message[],
  conversationId: string | undefined,
  onMessage: (chunk: string) => void,
  onError: (error: string) => void,
  onDone: () => void,
  signal?: AbortSignal
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  try {
    const payload: Record<string, unknown> = { messages };
    if (conversationId) {
      payload.conversation_id = conversationId;
    }

    const response = await fetch(`${apiUrl}/api/v1/chat`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": session ? `Bearer ${session.access_token}` : ""
      },
      body: JSON.stringify(payload),
      signal,
    });

    await handleStreamResponse(response, onMessage, onError, onDone);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log("Stream aborted");
      onDone(); // Finalize stream on client disconnect gracefully
    } else {
      const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
      onError(msg);
    }
  }
}

export async function streamScan(
  content: string,
  onMessage: (chunk: string) => void,
  onError: (error: string) => void,
  onDone: () => void,
  signal?: AbortSignal
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  try {
    const response = await fetch(`${apiUrl}/api/v1/scan`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": session ? `Bearer ${session.access_token}` : ""
      },
      body: JSON.stringify({ content }),
      signal,
    });

    await handleStreamResponse(response, onMessage, onError, onDone);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log("Stream aborted");
      onDone(); // Finalize stream on client disconnect gracefully
    } else {
      const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
      onError(msg);
    }
  }
}
