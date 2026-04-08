import type { DiffRow } from "../ui/diff-view-model.js";

export type ActivePanel = "files" | "diff";

export interface ReviewNavigationState {
  activePanel: ActivePanel;
  selectedFileIndex: number;
  selectedDiffRowIndices: number[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getInitialDiffRowIndex(diffRows: DiffRow[]): number {
  const firstSelectableIndex = diffRows.findIndex((row) => row.isSelectable);
  return firstSelectableIndex === -1 ? 0 : firstSelectableIndex;
}

export function createInitialNavigationState(
  diffRowsByFile: DiffRow[][]
): ReviewNavigationState {
  return {
    activePanel: "files",
    selectedFileIndex: diffRowsByFile.length === 0 ? -1 : 0,
    selectedDiffRowIndices: diffRowsByFile.map((diffRows) =>
      getInitialDiffRowIndex(diffRows)
    ),
  };
}

export function toggleActivePanel(activePanel: ActivePanel): ActivePanel {
  return activePanel === "files" ? "diff" : "files";
}

export function moveFileSelection(
  state: ReviewNavigationState,
  fileCount: number,
  delta: number
): ReviewNavigationState {
  if (fileCount === 0) {
    return state;
  }

  const nextFileIndex = clamp(state.selectedFileIndex + delta, 0, fileCount - 1);

  if (nextFileIndex === state.selectedFileIndex) {
    return state;
  }

  return {
    ...state,
    selectedFileIndex: nextFileIndex,
  };
}

export function moveDiffSelection(
  state: ReviewNavigationState,
  diffRows: DiffRow[],
  delta: number
): ReviewNavigationState {
  if (diffRows.length === 0 || state.selectedFileIndex < 0 || delta === 0) {
    return state;
  }

  const currentIndex =
    state.selectedDiffRowIndices[state.selectedFileIndex] ??
    getInitialDiffRowIndex(diffRows);

  let nextIndex = currentIndex;

  while (true) {
    const candidateIndex = clamp(nextIndex + delta, 0, diffRows.length - 1);

    if (candidateIndex === nextIndex) {
      return state;
    }

    nextIndex = candidateIndex;

    if (diffRows[nextIndex]?.isSelectable) {
      const selectedDiffRowIndices = [...state.selectedDiffRowIndices];
      selectedDiffRowIndices[state.selectedFileIndex] = nextIndex;
      return {
        ...state,
        selectedDiffRowIndices,
      };
    }
  }
}
