import type { ChangedFile, FileStatus } from "../git/types.js";
import { getVisibleWindow, truncateText } from "./panel-utils.js";

export type FileStatusColor = "green" | "red" | "yellow" | "blue";

export interface FileListRow {
  key: string;
  isSelected: boolean;
  statusLabel: string;
  statusColor: FileStatusColor;
  displayPath: string;
}

export interface BuildFileListRowsInput {
  files: ChangedFile[];
  selectedIndex: number;
  maxVisibleRows: number;
  width: number;
}

function getStatusLabel(status: FileStatus): string {
  switch (status) {
    case "added":
      return "A";
    case "deleted":
      return "D";
    case "renamed":
      return "R";
    default:
      return "M";
  }
}

function getStatusColor(status: FileStatus): FileStatusColor {
  switch (status) {
    case "added":
      return "green";
    case "deleted":
      return "red";
    case "renamed":
      return "blue";
    default:
      return "yellow";
  }
}

function getDisplayPath(file: ChangedFile): string {
  if (file.status === "renamed" && file.oldFilePath) {
    return `${file.oldFilePath} -> ${file.filePath}`;
  }

  return file.filePath;
}

export function buildFileListRows({
  files,
  selectedIndex,
  maxVisibleRows,
  width,
}: BuildFileListRowsInput): FileListRow[] {
  const { startIndex, endIndex } = getVisibleWindow(
    files.length,
    Math.max(selectedIndex, 0),
    maxVisibleRows,
  );
  const visibleFiles = files.slice(startIndex, endIndex);
  const contentWidth = Math.max(width - 8, 12);

  return visibleFiles.map((file, index) => {
    const fileIndex = startIndex + index;

    return {
      key: file.filePath,
      isSelected: fileIndex === selectedIndex,
      statusLabel: getStatusLabel(file.status),
      statusColor: getStatusColor(file.status),
      displayPath: truncateText(getDisplayPath(file), contentWidth),
    };
  });
}
