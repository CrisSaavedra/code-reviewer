import { describe, expect, it } from "vitest";
import { generateReviewMarkdown } from "../../markdown/review-markdown.js";
import type { ReviewNote } from "../../review-notes/types.js";

describe("generateReviewMarkdown", () => {
  it("groups proposed changes and comments by file", () => {
    const notes: ReviewNote[] = [
      {
        id: "1",
        type: "proposed_change",
        filePath: "src/button.ts",
        lineNumber: 24,
        content: "Extract this logic.",
        createdAt: "2026-01-01T10:00:00.000Z",
      },
      {
        id: "2",
        type: "comment",
        filePath: "src/button.ts",
        lineNumber: 41,
        content: "Could this be renamed?",
        createdAt: "2026-01-01T10:01:00.000Z",
      },
      {
        id: "3",
        type: "comment",
        filePath: "src/api.ts",
        lineNumber: 9,
        content: "Should this error be logged?",
        createdAt: "2026-01-01T10:02:00.000Z",
      },
    ];

    const output = generateReviewMarkdown({
      branchName: "feature/review",
      generatedAt: new Date(2026, 0, 2, 3, 4),
      notes,
    });

    expect(output).toContain("## [feature/review] - Review - [02/01 03:04]");
    expect(output).toContain("### Proposed Changes");
    expect(output).toContain("- `src/button.ts`");
    expect(output).toContain("L24: Extract this logic.");
    expect(output).toContain("### Comments");
    expect(output).toContain("L41: Could this be renamed?");
    expect(output).toContain("- `src/api.ts`");
    expect(output).toContain("L9: Should this error be logged?");
  });

  it("renders empty sections when there are no notes", () => {
    const output = generateReviewMarkdown({
      branchName: "main",
      generatedAt: new Date(2026, 0, 2, 3, 4),
      notes: [],
    });

    expect(output).toContain("### Proposed Changes");
    expect(output).toContain("### Comments");
    expect(output).toContain("- None.");
  });
});
