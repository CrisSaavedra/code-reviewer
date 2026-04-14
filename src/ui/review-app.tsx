import { Box, Text, useApp, useInput, useStdout } from "ink";
import { useState } from "react";
import type { ChangedFile } from "../git/types.js";
import {
  createInitialNavigationState,
  moveDiffSelection,
  moveFileSelection,
  toggleActivePanel,
} from "../navigation/review-navigation.js";
import { DiffPanel } from "./diff-panel.js";
import { buildDiffRows } from "./diff-view-model.js";
import { FileListPanel } from "./file-list-panel.js";
import { StatusBar } from "./status-bar.js";

const MIN_COLUMNS = 80;
const MIN_ROWS = 16;

interface ReviewAppProps {
  changedFiles: ChangedFile[];
}

export function ReviewApp({ changedFiles }: ReviewAppProps): JSX.Element {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const diffRowsByFile = changedFiles.map((file) => buildDiffRows(file));
  const [navigation, setNavigation] = useState(() =>
    createInitialNavigationState(diffRowsByFile),
  );

  const columns = stdout.columns ?? MIN_COLUMNS;
  const rows = stdout.rows ?? MIN_ROWS;

  useInput((input, key) => {
    if (input.toLowerCase() === "q" && key.ctrl) {
      exit();
      return;
    }

    if (key.tab) {
      setNavigation((current) => ({
        ...current,
        activePanel: toggleActivePanel(current.activePanel),
      }));
      return;
    }

    if (key.upArrow) {
      setNavigation((current) => {
        if (current.activePanel === "files") {
          return moveFileSelection(current, changedFiles.length, -1);
        }

        const diffRows = diffRowsByFile[current.selectedFileIndex] ?? [];
        return moveDiffSelection(current, diffRows, -1);
      });
      return;
    }

    if (key.downArrow) {
      setNavigation((current) => {
        if (current.activePanel === "files") {
          return moveFileSelection(current, changedFiles.length, 1);
        }

        const diffRows = diffRowsByFile[current.selectedFileIndex] ?? [];
        return moveDiffSelection(current, diffRows, 1);
      });
    }
  });

  if (columns < MIN_COLUMNS || rows < MIN_ROWS) {
    return (
      <Box
        borderStyle="round"
        borderColor="yellow"
        flexDirection="column"
        paddingX={1}
      >
        <Text color="yellow">Terminal too small for the review UI.</Text>
        <Text>
          Resize to at least {MIN_COLUMNS}x{MIN_ROWS} and run `cr` again.
        </Text>
        <Text>Press Ctrl+Q to exit.</Text>
      </Box>
    );
  }

  const selectedFileIndex =
    navigation.selectedFileIndex >= 0 ? navigation.selectedFileIndex : 0;
  const selectedFile = changedFiles[selectedFileIndex] ?? changedFiles[0];

  if (!selectedFile) {
    return (
      <Box>
        <Text>No files available to review.</Text>
      </Box>
    );
  }

  const selectedDiffRows = diffRowsByFile[selectedFileIndex] ?? [];
  const selectedDiffRowIndex =
    navigation.selectedDiffRowIndices[selectedFileIndex] ?? 0;
  const contentHeight = Math.max(rows - 5, 10);
  const bodyRowCount = Math.max(contentHeight - 4, 3);
  const filePanelWidth = Math.min(Math.max(Math.floor(columns / 3), 24), 40);
  const diffPanelWidth = Math.max(columns - filePanelWidth, 40);

  return (
    <Box flexDirection="column">
      <Box height={contentHeight}>
        <Box width={filePanelWidth} flexShrink={0}>
          <FileListPanel
            files={changedFiles}
            selectedIndex={selectedFileIndex}
            isActive={navigation.activePanel === "files"}
            maxVisibleRows={bodyRowCount}
            width={filePanelWidth}
          />
        </Box>
        <Box flexGrow={1}>
          <DiffPanel
            file={selectedFile}
            rows={selectedDiffRows}
            selectedRowIndex={selectedDiffRowIndex}
            isActive={navigation.activePanel === "diff"}
            maxVisibleRows={bodyRowCount}
            width={diffPanelWidth}
          />
        </Box>
      </Box>
      <Box marginTop={1}>
        <StatusBar
          activePanel={navigation.activePanel}
          selectedFilePath={selectedFile.filePath}
        />
      </Box>
    </Box>
  );
}
