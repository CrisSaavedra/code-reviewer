import type {
  CreateReviewNoteInput,
  ReviewNote,
  ReviewNoteType,
} from "./types.js";

export interface ReviewNoteCounts {
  comments: number;
  proposedChanges: number;
}

function createReviewNoteId(input: {
  filePath: string;
  lineNumber: number;
  createdAt: Date;
}): string {
  return `${input.createdAt.getTime()}-${input.filePath}:${input.lineNumber}`;
}

export function createReviewNote(input: CreateReviewNoteInput): ReviewNote {
  const createdAtDate = input.createdAt ?? new Date();

  return {
    id: createReviewNoteId({
      filePath: input.filePath,
      lineNumber: input.lineNumber,
      createdAt: createdAtDate,
    }),
    type: input.type,
    filePath: input.filePath,
    lineNumber: input.lineNumber,
    content: input.content,
    createdAt: createdAtDate.toISOString(),
    diffSnippet: input.diffSnippet,
  };
}

export function addReviewNote(
  notes: ReviewNote[],
  input: CreateReviewNoteInput,
): ReviewNote[] {
  const note = createReviewNote(input);
  return [...notes, note];
}

function countByType(notes: ReviewNote[], type: ReviewNoteType): number {
  return notes.filter((note) => note.type === type).length;
}

export function countReviewNotes(notes: ReviewNote[]): ReviewNoteCounts {
  return {
    comments: countByType(notes, "comment"),
    proposedChanges: countByType(notes, "proposed_change"),
  };
}
