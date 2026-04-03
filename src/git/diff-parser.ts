import type { ChangedFile, DiffHunk, DiffLine, FileStatus } from "./types.js";

const DIFF_HEADER_RE = /^diff --git a\/.+ b\/.+$/;
const HUNK_HEADER_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)/;
const NEW_FILE_RE = /^new file mode/;
const DELETED_FILE_RE = /^deleted file mode/;
const RENAME_FROM_RE = /^rename from (.+)$/;
const RENAME_TO_RE = /^rename to (.+)$/;
const FILE_A_RE = /^--- a\/(.+)$/;
const FILE_B_RE = /^\+\+\+ b\/(.+)$/;

interface FileBlock {
  headerLines: string[];
  hunkLines: string[];
}

function splitIntoFileBlocks(lines: string[]): FileBlock[] {
  const blocks: FileBlock[] = [];
  let current: FileBlock | null = null;

  for (const line of lines) {
    if (DIFF_HEADER_RE.test(line)) {
      if (current) blocks.push(current);
      current = { headerLines: [line], hunkLines: [] };
    } else if (current) {
      if (line.startsWith("@@")) {
        current.hunkLines.push(line);
      } else if (current.hunkLines.length === 0) {
        current.headerLines.push(line);
      } else {
        current.hunkLines.push(line);
      }
    }
  }

  if (current) blocks.push(current);
  return blocks;
}

function parseFileStatus(headerLines: string[]): {
  filePath: string;
  oldFilePath: string | null;
  status: FileStatus;
} {
  let status: FileStatus = "modified";
  let filePath = "";
  let oldFilePath: string | null = null;

  for (const line of headerLines) {
    if (NEW_FILE_RE.test(line)) {
      status = "added";
    } else if (DELETED_FILE_RE.test(line)) {
      status = "deleted";
    } else {
      const renameFromMatch = RENAME_FROM_RE.exec(line);
      if (renameFromMatch) {
        status = "renamed";
        oldFilePath = renameFromMatch[1];
        continue;
      }
      const renameToMatch = RENAME_TO_RE.exec(line);
      if (renameToMatch) {
        filePath = renameToMatch[1];
        continue;
      }
    }

    const fileBMatch = FILE_B_RE.exec(line);
    if (fileBMatch && !filePath) {
      filePath = fileBMatch[1];
    }

    const fileAMatch = FILE_A_RE.exec(line);
    if (fileAMatch && status === "deleted") {
      filePath = fileAMatch[1];
    }
  }

  // Fallback: extract from diff --git line
  if (!filePath && headerLines[0]) {
    const match = /^diff --git a\/.+ b\/(.+)$/.exec(headerLines[0]);
    if (match) filePath = match[1];
  }

  return { filePath, oldFilePath, status };
}

function parseHunks(hunkLines: string[]): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  let current: DiffHunk | null = null;
  let oldLine = 0;
  let newLine = 0;

  for (const line of hunkLines) {
    const hunkMatch = HUNK_HEADER_RE.exec(line);
    if (hunkMatch) {
      if (current) hunks.push(current);
      oldLine = parseInt(hunkMatch[1], 10);
      const oldCount = hunkMatch[2] !== undefined ? parseInt(hunkMatch[2], 10) : 1;
      newLine = parseInt(hunkMatch[3], 10);
      const newCount = hunkMatch[4] !== undefined ? parseInt(hunkMatch[4], 10) : 1;
      current = {
        header: line,
        oldStart: oldLine,
        oldCount,
        newStart: newLine,
        newCount,
        lines: [],
      };
      continue;
    }

    if (!current) continue;

    // Skip "\ No newline at end of file" and empty lines
    if (line.startsWith("\\") || line === "") continue;

    const prefix = line[0];

    // Only process valid diff line prefixes
    if (prefix !== "+" && prefix !== "-" && prefix !== " ") continue;

    const content = line.slice(1);

    let diffLine: DiffLine;

    if (prefix === "+") {
      diffLine = { type: "added", content, oldLineNumber: null, newLineNumber: newLine };
      newLine++;
    } else if (prefix === "-") {
      diffLine = { type: "removed", content, oldLineNumber: oldLine, newLineNumber: null };
      oldLine++;
    } else {
      // context line (space prefix)
      diffLine = { type: "context", content, oldLineNumber: oldLine, newLineNumber: newLine };
      oldLine++;
      newLine++;
    }

    current.lines.push(diffLine);
  }

  if (current) hunks.push(current);
  return hunks;
}

export function parseDiff(rawDiff: string): ChangedFile[] {
  if (!rawDiff.trim()) return [];

  const lines = rawDiff.split("\n");
  const blocks = splitIntoFileBlocks(lines);

  return blocks
    .map((block): ChangedFile | null => {
      const { filePath, oldFilePath, status } = parseFileStatus(block.headerLines);
      if (!filePath) return null;

      const hunks = parseHunks(block.hunkLines);
      return { filePath, oldFilePath, status, hunks };
    })
    .filter((f): f is ChangedFile => f !== null);
}
