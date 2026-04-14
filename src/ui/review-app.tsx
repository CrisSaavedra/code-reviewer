import { Box, Text, useApp, useInput, useStdout } from "ink";
import { useMemo, useState } from "react";
import type { ChangedFile } from "../git/types.js";
import {
  createInitialNavigationState,
  getInitialDiffRowIndex,
  moveDiffSelection,
  moveFileSelection,
  toggleActivePanel,
} from "../navigation/review-navigation.js";
import { generateReviewMarkdown } from "../markdown/review-markdown.js";
import {
  addReviewNote,
  countReviewNotes,
} from "../review-notes/review-notes.js";
import type { ReviewNote, ReviewNoteType } from "../review-notes/types.js";
import { DiffPanel } from "./diff-panel.js";
import { buildDiffRows } from "./diff-view-model.js";
import { FileListPanel } from "./file-list-panel.js";
import { MarkdownPreview } from "./markdown-preview.js";
import { NoteModal } from "./note-modal.js";
import { StatusBar } from "./status-bar.js";

const MIN_COLUMNS = 80;
const MIN_ROWS = 16;
const DEFAULT_CONTEXT_LINES = 3;
const CONTEXT_STEP = 3;

type AppView = "review" | "note-modal" | "markdown-preview";

interface ReviewAppProps {
  changedFiles: ChangedFile[];
  branchName: string;
  loadChangedFiles?: (contextLines: number) => Promise<ChangedFile[]>;
  copyToClipboard?: (content: string) => Promise<void>;
}

function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getSelectedRowIndex(
  rows: ReturnType<typeof buildDiffRows>,
  targetLineNumber: number | null,
): number {
  if (targetLineNumber === null) {
    return getInitialDiffRowIndex(rows);
  }

  const matchedIndex = rows.findIndex(
    (row) => row.isSelectable && row.targetLineNumber === targetLineNumber,
  );

  return matchedIndex >= 0 ? matchedIndex : getInitialDiffRowIndex(rows);
}

export function ReviewApp({
  changedFiles,
  branchName,
  loadChangedFiles,
  copyToClipboard,
}: ReviewAppProps): JSX.Element {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [files, setFiles] = useState(changedFiles);
  const diffRowsByFile = useMemo(
    () => files.map((file) => buildDiffRows(file)),
    [files],
  );
  const [navigation, setNavigation] = useState(() =>
    createInitialNavigationState(diffRowsByFile),
  );
  const [notes, setNotes] = useState<ReviewNote[]>([]);
  const [view, setView] = useState<AppView>("review");
  const [noteType, setNoteType] = useState<ReviewNoteType>("comment");
  const [noteDraft, setNoteDraft] = useState("");
  const [contextLines, setContextLines] = useState(DEFAULT_CONTEXT_LINES);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);

  const columns = stdout.columns ?? MIN_COLUMNS;
  const rows = stdout.rows ?? MIN_ROWS;

  const selectedFileIndex =
    navigation.selectedFileIndex >= 0 ? navigation.selectedFileIndex : 0;
  const selectedFile = files[selectedFileIndex] ?? files[0];
  const selectedDiffRows = diffRowsByFile[selectedFileIndex] ?? [];
  const selectedDiffRowIndex =
    navigation.selectedDiffRowIndices[selectedFileIndex] ??
    getInitialDiffRowIndex(selectedDiffRows);
  const selectedRow = selectedDiffRows[selectedDiffRowIndex];
  const selectedLineNumber = selectedRow?.targetLineNumber ?? null;

  const noteCounts = countReviewNotes(notes);
  const markdownOutput = generateReviewMarkdown({
    branchName,
    notes,
  });

  async function reloadDiffWithContext(
    nextContextLines: number,
  ): Promise<void> {
    if (!loadChangedFiles || !selectedFile) {
      setStatusMessage("Context expansion is unavailable in this mode.");
      return;
    }

    setIsLoadingDiff(true);
    setStatusMessage(null);

    const currentFilePath = selectedFile.filePath;
    const currentTargetLine = selectedLineNumber;

    try {
      const nextFiles = await loadChangedFiles(nextContextLines);

      if (nextFiles.length === 0) {
        setStatusMessage("No changes found to review.");
        return;
      }

      const nextDiffRowsByFile = nextFiles.map((file) => buildDiffRows(file));
      const selectedIndexByPath = nextFiles.findIndex(
        (file) => file.filePath === currentFilePath,
      );
      const nextSelectedFileIndex =
        selectedIndexByPath >= 0 ? selectedIndexByPath : 0;
      const nextSelectedRows = nextDiffRowsByFile[nextSelectedFileIndex] ?? [];

      const nextSelectedDiffRowIndices = nextDiffRowsByFile.map((diffRows) =>
        getInitialDiffRowIndex(diffRows),
      );
      nextSelectedDiffRowIndices[nextSelectedFileIndex] = getSelectedRowIndex(
        nextSelectedRows,
        currentTargetLine,
      );

      setFiles(nextFiles);
      setContextLines(nextContextLines);
      setNavigation((current) => ({
        ...current,
        selectedFileIndex: nextSelectedFileIndex,
        selectedDiffRowIndices: nextSelectedDiffRowIndices,
      }));
      setStatusMessage(`Expanded context to +/-${nextContextLines} lines.`);
    } catch (error) {
      setStatusMessage(
        `Failed to expand context: ${formatErrorMessage(error)}`,
      );
    } finally {
      setIsLoadingDiff(false);
    }
  }

  function openNoteModal(nextType: ReviewNoteType): void {
    if (
      !selectedFile ||
      !selectedRow ||
      !selectedRow.isSelectable ||
      selectedLineNumber === null
    ) {
      setStatusMessage("Select a diff line before adding a note.");
      return;
    }

    setNoteType(nextType);
    setNoteDraft("");
    setView("note-modal");
    setStatusMessage(null);
  }

  function saveCurrentNote(): void {
    if (!selectedFile || !selectedRow || selectedLineNumber === null) {
      setStatusMessage(
        "Unable to save note because line selection is invalid.",
      );
      setView("review");
      return;
    }

    const content = noteDraft.trim();

    if (content.length === 0) {
      setStatusMessage("Cannot save an empty note.");
      return;
    }

    setNotes((current) =>
      addReviewNote(current, {
        type: noteType,
        filePath: selectedFile.filePath,
        lineNumber: selectedLineNumber,
        content,
        diffSnippet: `${selectedRow.prefix} ${selectedRow.text}`,
      }),
    );

    setNoteDraft("");
    setView("review");
    setStatusMessage(
      noteType === "comment" ? "Comment saved." : "Proposed change saved.",
    );
  }

  async function copyMarkdownPreview(): Promise<void> {
    if (!copyToClipboard) {
      setPreviewMessage("Failed to copy markdown: clipboard is unavailable.");
      return;
    }

    try {
      await copyToClipboard(markdownOutput);
      setPreviewMessage("Markdown copied to clipboard.");
    } catch (error) {
      setPreviewMessage(
        `Failed to copy markdown: ${formatErrorMessage(error)}`,
      );
    }
  }

  useInput((input, key) => {
    const normalizedInput = input.toLowerCase();
    const isCtrlM =
      (normalizedInput === "m" && key.ctrl) || (key.return && key.ctrl);

    if (view === "note-modal") {
      if (key.escape || (normalizedInput === "q" && key.ctrl)) {
        setNoteDraft("");
        setView("review");
        setStatusMessage("Note discarded.");
        return;
      }

      if (normalizedInput === "r" && key.ctrl) {
        saveCurrentNote();
        return;
      }

      if (key.return && key.ctrl) {
        setNoteDraft((current) => `${current}\n`);
        return;
      }

      if (key.backspace || key.delete) {
        setNoteDraft((current) => current.slice(0, -1));
        return;
      }

      if (!key.ctrl && !key.meta && input.length > 0) {
        setNoteDraft((current) => `${current}${input}`);
      }

      return;
    }

    if (view === "markdown-preview") {
      if (normalizedInput === "q" && key.ctrl) {
        setView("review");
        setPreviewMessage(null);
        return;
      }

      if (isCtrlM) {
        void copyMarkdownPreview();
      }

      return;
    }

    if (normalizedInput === "q" && key.ctrl) {
      exit();
      return;
    }

    if (normalizedInput === "c" && key.ctrl) {
      openNoteModal("comment");
      return;
    }

    if (normalizedInput === "v" && key.ctrl) {
      openNoteModal("proposed_change");
      return;
    }

    if (isCtrlM) {
      if (notes.length === 0) {
        setStatusMessage("No comments or proposed changes were added.");
        return;
      }

      setPreviewMessage(null);
      setView("markdown-preview");
      return;
    }

    if (key.tab) {
      setNavigation((current) => ({
        ...current,
        activePanel: toggleActivePanel(current.activePanel),
      }));
      return;
    }

    if (key.rightArrow && navigation.activePanel === "diff" && !isLoadingDiff) {
      void reloadDiffWithContext(contextLines + CONTEXT_STEP);
      return;
    }

    if (key.upArrow) {
      setNavigation((current) => {
        if (current.activePanel === "files") {
          return moveFileSelection(current, files.length, -1);
        }

        const diffRows = diffRowsByFile[current.selectedFileIndex] ?? [];
        return moveDiffSelection(current, diffRows, -1);
      });
      return;
    }

    if (key.downArrow) {
      setNavigation((current) => {
        if (current.activePanel === "files") {
          return moveFileSelection(current, files.length, 1);
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

  if (!selectedFile) {
    return (
      <Box>
        <Text>No files available to review.</Text>
      </Box>
    );
  }

  if (view === "markdown-preview") {
    return (
      <MarkdownPreview markdown={markdownOutput} message={previewMessage} />
    );
  }

  if (view === "note-modal") {
    return (
      <NoteModal
        type={noteType}
        filePath={selectedFile.filePath}
        lineNumber={selectedLineNumber ?? 0}
        content={noteDraft}
      />
    );
  }

  const contentHeight = Math.max(rows - 8, 10);
  const bodyRowCount = Math.max(contentHeight - 4, 3);
  const filePanelWidth = Math.min(Math.max(Math.floor(columns / 3), 24), 40);
  const diffPanelWidth = Math.max(columns - filePanelWidth, 40);

  return (
    <Box flexDirection="column">
      <Box height={contentHeight}>
        <Box width={filePanelWidth} flexShrink={0}>
          <FileListPanel
            files={files}
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
          commentCount={noteCounts.comments}
          proposedChangeCount={noteCounts.proposedChanges}
          contextLines={contextLines}
          message={statusMessage}
          isLoadingDiff={isLoadingDiff}
        />
      </Box>
    </Box>
  );
}
