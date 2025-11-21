const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/fastapi";

class FitnessChatApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "FitnessChatApiError";
  }
}

async function fetchWithErrorHandling(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      // Use default error message if JSON parsing fails
    }

    throw new FitnessChatApiError(errorMessage, response.status);
  }

  return response.json();
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface FitnessChatRequest {
  user_message: string;
  user_profile?: any;
  history?: ConversationMessage[];
  attachments?: any[];
}

export interface FitnessChatResponse {
  reply: string;
  disclaimer?: string;
}

export async function sendFitnessChat(
  message: string,
  userProfile?: any,
  conversationHistory?: Array<{content: string; isUser: boolean}>,
  attachments?: File[],
): Promise<FitnessChatResponse> {
  // Convert conversation history to API format
  const history: ConversationMessage[] = conversationHistory?.map(msg => ({
    role: msg.isUser ? 'user' : 'assistant',
    content: msg.content,
  })) || [];

  const requestBody: FitnessChatRequest = {
    user_message: message,
    user_profile: userProfile,
    history: history.length > 0 ? history : undefined,
    attachments: attachments?.map(f => f.name) || undefined,
  };

  console.log("=== CALLING FITNESS CHAT API ===");
  console.log("API_BASE:", API_BASE);
  console.log("Full URL:", `${API_BASE}/ai/fitness/chat`);
  console.log("Request Body:", JSON.stringify(requestBody, null, 2));

  try {
    const data = await fetchWithErrorHandling(`${API_BASE}/ai/fitness/chat`, {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    console.log("=== FITNESS CHAT API RESPONSE ===");
    console.log("Response:", data);

    return {
      reply:
        data.reply ||
        data.message ||
        "I'm sorry, I couldn't process your request.",
      disclaimer: data.disclaimer,
    };
  } catch (error) {
    console.error("=== FITNESS CHAT API ERROR ===", error);
    if (error instanceof FitnessChatApiError) {
      throw error;
    }
    throw new FitnessChatApiError("Network error while sending fitness chat");
  }
}
