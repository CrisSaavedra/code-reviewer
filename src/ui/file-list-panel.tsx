import { Box, Text } from "ink";
import type { ChangedFile } from "../git/types.js";
import { buildFileListRows } from "./file-list-view-model.js";

interface FileListPanelProps {
  files: ChangedFile[];
  selectedIndex: number;
  isActive: boolean;
  maxVisibleRows: number;
  width: number;
}

export function FileListPanel({
  files,
  selectedIndex,
  isActive,
  maxVisibleRows,
  width,
}: FileListPanelProps): JSX.Element {
  const rows = buildFileListRows({
    files,
    selectedIndex,
    maxVisibleRows,
    width,
  });

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
        {rows.map((row) => {
          const statusColor = row.isSelected ? "black" : row.statusColor;

          return (
            <Text
              key={row.key}
              backgroundColor={row.isSelected ? "cyan" : undefined}
              color={row.isSelected ? "black" : "white"}
            >
              <Text color={statusColor}>{row.statusLabel}</Text>
              <Text>{row.isSelected ? " > " : "   "}</Text>
              <Text>{row.displayPath}</Text>
            </Text>
          );
        })}
      </Box>
    </Box>
  );
}
