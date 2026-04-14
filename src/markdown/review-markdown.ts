import type { ReviewNote, ReviewNoteType } from "../review-notes/types.js";

interface GenerateReviewMarkdownInput {
  branchName: string;
  generatedAt?: Date;
  notes: ReviewNote[];
}

function formatDate(value: Date): string {
  const day = value.getDate().toString().padStart(2, "0");
  const month = (value.getMonth() + 1).toString().padStart(2, "0");
  const hours = value.getHours().toString().padStart(2, "0");
  const minutes = value.getMinutes().toString().padStart(2, "0");
  return `${day}/${month} ${hours}:${minutes}`;
}

function groupNotesByFile(notes: ReviewNote[]): Map<string, ReviewNote[]> {
  const grouped = new Map<string, ReviewNote[]>();

  for (const note of notes) {
    const fileNotes = grouped.get(note.filePath) ?? [];
    fileNotes.push(note);
    grouped.set(note.filePath, fileNotes);
  }

  return grouped;
}

function buildSectionForType(
  notes: ReviewNote[],
  type: ReviewNoteType,
): string {
  const filteredNotes = notes.filter((note) => note.type === type);

  if (filteredNotes.length === 0) {
    return type === "proposed_change"
      ? "### Proposed Changes\n\n- None."
      : "### Comments\n\n- None.";
  }

  const grouped = groupNotesByFile(filteredNotes);
  const lines: string[] = [
    type === "proposed_change" ? "### Proposed Changes" : "### Comments",
    "",
  ];

  for (const [filePath, fileNotes] of grouped.entries()) {
    lines.push(`- \`${filePath}\``);

    for (const note of fileNotes) {
      const content = note.content
        .split("\n")
        .map((line, index) => (index === 0 ? line : `    ${line}`))
        .join("\n");
      lines.push(`  - L${note.lineNumber}: ${content}`);
    }

    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

export function generateReviewMarkdown({
  branchName,
  generatedAt = new Date(),
  notes,
}: GenerateReviewMarkdownInput): string {
  const header = `## [${branchName}] - Review - [${formatDate(generatedAt)}]`;
  const proposedChangesSection = buildSectionForType(notes, "proposed_change");
  const commentsSection = buildSectionForType(notes, "comment");

  return [header, "", proposedChangesSection, "", commentsSection, ""].join(
    "\n",
  );
}
