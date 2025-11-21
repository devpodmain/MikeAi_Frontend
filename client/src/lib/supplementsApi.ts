const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/fastapi";

class SupplementsApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "SupplementsApiError";
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

    throw new SupplementsApiError(errorMessage, response.status);
  }

  return response.json();
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SupplementRequest {
  user_message: string;
  user_profile?: any;
  history?: ConversationMessage[];
  attachments?: any[];
}

export interface BrandExample {
  brand: string;
  product_line: string;
  why: string;
  link: string;
}

export interface Supplement {
  category: string;
  evidence_summary: string;
  suggested_use_notes: string;
  brand_examples: BrandExample[];
}

export interface SupplementsResponse {
  plan_summary?: string;
  suggestions: Supplement[];
  disclaimer?: string;
  safetyNotes?: string;
}

export async function getSupplementSuggestions(
  message: string,
  userProfile?: any,
  conversationHistory?: Array<{content: string; isUser: boolean}>,
  attachments?: File[],
): Promise<SupplementsResponse> {
  // Convert conversation history to API format
  const history: ConversationMessage[] = conversationHistory?.map(msg => ({
    role: msg.isUser ? 'user' : 'assistant',
    content: msg.content,
  })) || [];

  const requestBody: SupplementRequest = {
    user_message: message,
    user_profile: userProfile,
    history: history.length > 0 ? history : undefined,
    attachments: attachments?.map(f => f.name) || undefined,
  };

  console.log("=== CALLING SUPPLEMENTS API ===");
  console.log("API_BASE:", API_BASE);
  console.log("Full URL:", `${API_BASE}/ai/supplements/suggest`);
  console.log("Request Body:", JSON.stringify(requestBody, null, 2));

  try {
    const data = await fetchWithErrorHandling(
      `${API_BASE}/ai/supplements/suggest`,
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      },
    );

    console.log("=== SUPPLEMENTS API RESPONSE ===");
    console.log("Full response data:", JSON.stringify(data, null, 2));
    console.log("Response type:", typeof data);
    console.log("Has plan_summary?", 'plan_summary' in data);
    console.log("Has suggestions?", 'suggestions' in data);

    // Backend returns { plan_summary: "...", suggestions: [...] }
    return {
      plan_summary: data.plan_summary || "",
      suggestions: data.suggestions || [],
      disclaimer: data.disclaimer,
      safetyNotes: data.safetyNotes || data.safety_notes,
    };
  } catch (error) {
    console.error("=== SUPPLEMENTS API ERROR ===", error);
    if (error instanceof SupplementsApiError) {
      throw error;
    }
    throw new SupplementsApiError("Network error while fetching supplement suggestions");
  }
}
