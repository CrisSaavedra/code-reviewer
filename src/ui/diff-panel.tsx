import { Box, Text } from "ink";
import type { ChangedFile } from "../git/types.js";
import type { DiffRow } from "./diff-view-model.js";
import { getVisibleWindow, truncateText } from "./panel-utils.js";

interface DiffPanelProps {
  file: ChangedFile;
  rows: DiffRow[];
  selectedRowIndex: number;
  isActive: boolean;
  maxVisibleRows: number;
  width: number;
}

function formatLineNumber(value: number | null): string {
  return value === null ? "   -" : value.toString().padStart(4, " ");
}

function getRowColor(row: DiffRow): "green" | "red" | "gray" | "yellow" | "white" {
  switch (row.type) {
    case "added":
      return "green";
    case "removed":
      return "red";
    case "context":
      return "gray";
    case "hunk-header":
      return "yellow";
    default:
      return "white";
  }
}

export function DiffPanel({
  file,
  rows,
  selectedRowIndex,
  isActive,
  maxVisibleRows,
  width,
}: DiffPanelProps): JSX.Element {
  const safeSelectedIndex = rows.length === 0 ? 0 : Math.max(selectedRowIndex, 0);
  const { startIndex, endIndex } = getVisibleWindow(
    rows.length,
    safeSelectedIndex,
    maxVisibleRows
  );
  const visibleRows = rows.slice(startIndex, endIndex);
  const contentWidth = Math.max(width - 22, 20);

  return (
    <Box
      borderStyle="round"
      borderColor={isActive ? "cyan" : "gray"}
      flexDirection="column"
      paddingX={1}
      paddingY={0}
      height="100%"
    >
      <Text color={isActive ? "cyan" : "white"}>{truncateText(file.filePath, width - 4)}</Text>
      <Box flexDirection="column" marginTop={1}>
        {visibleRows.map((row, index) => {
          const rowIndex = startIndex + index;
          const isSelected = row.isSelectable && rowIndex === selectedRowIndex;

          return (
            <Text
              key={row.key}
              backgroundColor={isSelected ? "cyan" : undefined}
              color={isSelected ? "black" : getRowColor(row)}
            >
              <Text>{formatLineNumber(row.oldLineNumber)}</Text>
              <Text> </Text>
              <Text>{formatLineNumber(row.newLineNumber)}</Text>
              <Text> </Text>
              <Text>{row.prefix} </Text>
              <Text>{truncateText(row.text, contentWidth)}</Text>
            </Text>
          );
        })}
      </Box>
    </Box>
  );
}
