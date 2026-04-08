import type { ChangedFile, DiffLineType } from "../git/types.js";

export type DiffRowType = DiffLineType | "hunk-header" | "message";

export interface DiffRow {
  key: string;
  type: DiffRowType;
  prefix: string;
  text: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
  targetLineNumber: number | null;
  isSelectable: boolean;
}

function getMessageForFile(file: ChangedFile): string {
  if (file.status === "renamed") {
    return "No content changes in this renamed file.";
  }

  if (file.status === "deleted") {
    return "File was deleted without visible diff lines.";
  }

  return "No visible diff lines for this file.";
}

export function buildDiffRows(file: ChangedFile): DiffRow[] {
  if (file.hunks.length === 0) {
    return [
      {
        key: `${file.filePath}:message`,
        type: "message",
        prefix: "!",
        text: getMessageForFile(file),
        oldLineNumber: null,
        newLineNumber: null,
        targetLineNumber: null,
        isSelectable: false,
      },
    ];
  }

  const rows: DiffRow[] = [];

  file.hunks.forEach((hunk, hunkIndex) => {
    rows.push({
      key: `${file.filePath}:hunk:${hunkIndex}`,
      type: "hunk-header",
      prefix: "@@",
      text: hunk.header,
      oldLineNumber: null,
      newLineNumber: null,
      targetLineNumber: null,
      isSelectable: false,
    });

    hunk.lines.forEach((line, lineIndex) => {
      const prefix = line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
      rows.push({
        key: `${file.filePath}:hunk:${hunkIndex}:line:${lineIndex}`,
        type: line.type,
        prefix,
        text: line.content,
        oldLineNumber: line.oldLineNumber,
        newLineNumber: line.newLineNumber,
        targetLineNumber: line.newLineNumber ?? line.oldLineNumber,
        isSelectable: true,
      });
    });
  });

  return rows;
}
