import { apiRequest } from "./client";

export type FeedbackCreatePayload =
  | {
      type: "vent";
      category: string;
      title?: string;
      content_markdown: string;
    }
  | {
      type: "proposal";
      category: string;
      title?: string;
      proposal_problem: string;
      proposal_impact: string;
      proposal_suggestion: string;
    };

export type FeedbackCreateResponse = {
  thread_code: string;
};

export type TimelineEvent = {
  actor_type: "system" | "admin" | "employee";
  event_type: string;
  content: string | null;
  meta_json: Record<string, unknown> | null;
  created_at: string;
};

export type FeedbackDetail = {
  thread_code: string;
  public_code: string;
  type: "vent" | "proposal";
  category: string;
  status: string;
  is_public: boolean;
  star_count: number;
  title: string | null;
  content_markdown: string | null;
  proposal_problem: string | null;
  proposal_impact: string | null;
  proposal_suggestion: string | null;
  created_at: string;
  updated_at: string;
  events: TimelineEvent[];
};

export type PublicFeedback = {
  public_code: string;
  type: "vent" | "proposal";
  category: string;
  status: string;
  title: string | null;
  content_markdown: string | null;
  proposal_problem: string | null;
  proposal_impact: string | null;
  proposal_suggestion: string | null;
  admin_replies: {
    content: string;
    created_at: string;
  }[];
  star_count: number;
  created_at: string;
};

export async function createFeedback(payload: FeedbackCreatePayload) {
  return apiRequest<FeedbackCreateResponse>("/feedbacks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getFeedback(threadCode: string) {
  return apiRequest<FeedbackDetail>(`/feedbacks/${threadCode}`);
}

export async function replyToFeedback(threadCode: string, content: string) {
  return apiRequest<{ created: boolean }>(`/feedbacks/${threadCode}/replies`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function listPublicFeedbacks() {
  return apiRequest<{ items: PublicFeedback[] }>("/public/feedbacks");
}

export async function starPublicFeedback(publicCode: string, token: string) {
  return apiRequest<{ star_count: number }>(`/public/feedbacks/${publicCode}/star`, {
    method: "POST",
    headers: {
      "x-star-token": token,
    },
  });
}
