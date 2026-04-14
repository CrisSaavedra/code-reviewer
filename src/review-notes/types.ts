export type ReviewNoteType = "comment" | "proposed_change";

export interface ReviewNote {
  id: string;
  type: ReviewNoteType;
  filePath: string;
  lineNumber: number;
  content: string;
  createdAt: string;
  diffSnippet?: string;
}

export interface CreateReviewNoteInput {
  type: ReviewNoteType;
  filePath: string;
  lineNumber: number;
  content: string;
  diffSnippet?: string;
  createdAt?: Date;
}
