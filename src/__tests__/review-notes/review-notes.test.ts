import { describe, expect, it } from "vitest";
import {
  addReviewNote,
  countReviewNotes,
  createReviewNote,
} from "../../review-notes/review-notes.js";

describe("review-notes", () => {
  it("creates a note with stable required fields", () => {
    const createdAt = new Date("2026-01-02T03:04:05.000Z");

    const note = createReviewNote({
      type: "comment",
      filePath: "src/app.ts",
      lineNumber: 12,
      content: "Please simplify this branch.",
      createdAt,
    });

    expect(note.type).toBe("comment");
    expect(note.filePath).toBe("src/app.ts");
    expect(note.lineNumber).toBe(12);
    expect(note.content).toBe("Please simplify this branch.");
    expect(note.createdAt).toBe("2026-01-02T03:04:05.000Z");
    expect(note.id).toContain("src/app.ts:12");
  });

  it("adds notes and counts each note type", () => {
    const withComment = addReviewNote([], {
      type: "comment",
      filePath: "src/a.ts",
      lineNumber: 1,
      content: "Question?",
    });

    const withProposedChange = addReviewNote(withComment, {
      type: "proposed_change",
      filePath: "src/a.ts",
      lineNumber: 2,
      content: "Move this to a helper.",
    });

    expect(withProposedChange).toHaveLength(2);
    expect(countReviewNotes(withProposedChange)).toEqual({
      comments: 1,
      proposedChanges: 1,
    });
  });
});
