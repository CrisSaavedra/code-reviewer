import { Box, Text } from "ink";
import type { ChangedFile } from "../git/types.js";
import { getVisibleWindow, truncateText } from "./panel-utils.js";

interface FileListPanelProps {
  files: ChangedFile[];
  selectedIndex: number;
  isActive: boolean;
  maxVisibleRows: number;
  width: number;
}

function getStatusLabel(status: ChangedFile["status"]): string {
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

function getStatusColor(
  status: ChangedFile["status"],
): "green" | "red" | "yellow" | "blue" {
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

export function FileListPanel({
  files,
  selectedIndex,
  isActive,
  maxVisibleRows,
  width,
}: FileListPanelProps): JSX.Element {
  const { startIndex, endIndex } = getVisibleWindow(
    files.length,
    Math.max(selectedIndex, 0),
    maxVisibleRows,
  );
  const visibleFiles = files.slice(startIndex, endIndex);
  const contentWidth = Math.max(width - 8, 12);

  return (
    <Box
      borderStyle="round"
      borderColor={isActive ? "cyan" : "gray"}
      flexDirection="column"
      paddingX={1}
      paddingY={0}
      height="100%"
    >
      <Text color={isActive ? "cyan" : "white"}>Files ({files.length})</Text>
      <Box flexDirection="column" marginTop={1}>
        {visibleFiles.map((file, index) => {
          const fileIndex = startIndex + index;
          const isSelected = fileIndex === selectedIndex;

          return (
            <Text
              key={file.filePath}
              backgroundColor={isSelected ? "cyan" : undefined}
              color={isSelected ? "black" : "white"}
            >
              <Text color={isSelected ? "black" : getStatusColor(file.status)}>
                {getStatusLabel(file.status)}
              </Text>
              <Text>{isSelected ? " > " : "   "}</Text>
              <Text>{truncateText(file.filePath, contentWidth)}</Text>
            </Text>
          );
        })}
      </Box>
    </Box>
  );
}
