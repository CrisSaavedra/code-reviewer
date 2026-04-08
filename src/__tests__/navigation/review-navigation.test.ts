import { describe, expect, it } from "vitest";
import {
  createInitialNavigationState,
  moveDiffSelection,
  moveFileSelection,
  toggleActivePanel,
} from "../../navigation/review-navigation.js";
import { buildDiffRows } from "../../ui/diff-view-model.js";
import type { ChangedFile } from "../../git/types.js";

const CHANGED_FILE: ChangedFile = {
  filePath: "src/example.ts",
  oldFilePath: null,
  status: "modified",
  hunks: [
    {
      header: "@@ -1,3 +1,3 @@",
      oldStart: 1,
      oldCount: 3,
      newStart: 1,
      newCount: 3,
      lines: [
        {
          type: "context",
          content: "const a = 1;",
          oldLineNumber: 1,
          newLineNumber: 1,
        },
        {
          type: "removed",
          content: "const b = 2;",
          oldLineNumber: 2,
          newLineNumber: null,
        },
        {
          type: "added",
          content: "const b = 3;",
          oldLineNumber: null,
          newLineNumber: 2,
        },
      ],
    },
  ],
};

describe("buildDiffRows", () => {
  it("adds non-selectable hunk headers before visible diff lines", () => {
    const rows = buildDiffRows(CHANGED_FILE);

    expect(rows[0]).toMatchObject({
      type: "hunk-header",
      isSelectable: false,
      text: "@@ -1,3 +1,3 @@",
    });
    expect(rows[1]).toMatchObject({
      type: "context",
      isSelectable: true,
      targetLineNumber: 1,
    });
    expect(rows[2]).toMatchObject({
      type: "removed",
      targetLineNumber: 2,
    });
    expect(rows[3]).toMatchObject({
      type: "added",
      targetLineNumber: 2,
    });
  });
});

describe("review navigation", () => {
  it("starts with the first file selected and the files panel active", () => {
    const rows = [buildDiffRows(CHANGED_FILE), buildDiffRows(CHANGED_FILE)];
    const state = createInitialNavigationState(rows);

    expect(state.activePanel).toBe("files");
    expect(state.selectedFileIndex).toBe(0);
    expect(state.selectedDiffRowIndices).toEqual([1, 1]);
  });

  it("switches panels and clamps file movement", () => {
    const rows = [buildDiffRows(CHANGED_FILE), buildDiffRows(CHANGED_FILE)];
    const state = createInitialNavigationState(rows);
    const movedForward = moveFileSelection(state, rows.length, 1);
    const movedBackward = moveFileSelection(movedForward, rows.length, -10);

    expect(toggleActivePanel(state.activePanel)).toBe("diff");
    expect(movedForward.selectedFileIndex).toBe(1);
    expect(movedBackward.selectedFileIndex).toBe(0);
  });

  it("moves diff selection while skipping the hunk header row", () => {
    const rows = buildDiffRows(CHANGED_FILE);
    const state = {
      activePanel: "diff" as const,
      selectedFileIndex: 0,
      selectedDiffRowIndices: [1],
    };

    const movedDown = moveDiffSelection(state, rows, 1);
    const movedUp = moveDiffSelection(movedDown, rows, -1);

    expect(movedDown.selectedDiffRowIndices[0]).toBe(2);
    expect(movedUp.selectedDiffRowIndices[0]).toBe(1);
  });
});
