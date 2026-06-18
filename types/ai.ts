export interface ProofEvaluation {
  score: number;
  comment: string;
}

export interface CoachReport {
  summary: string;
  strengths: string;
  gaps: string;
  recommendation: string;
}

export interface BedrockResponse {
  output?: {
    message?: {
      content?: Array<{ text?: string }>;
    };
  };
}
