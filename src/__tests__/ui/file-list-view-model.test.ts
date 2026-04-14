import { describe, expect, it } from "vitest";
import type { ChangedFile } from "../../git/types.js";
import { buildFileListRows } from "../../ui/file-list-view-model.js";

const BASE_HUNKS: ChangedFile["hunks"] = [];

describe("buildFileListRows", () => {
  it("builds rows with status metadata and selected file", () => {
    const files: ChangedFile[] = [
      {
        filePath: "src/new-file.ts",
        oldFilePath: null,
        status: "added",
        hunks: BASE_HUNKS,
      },
      {
        filePath: "src/updated-file.ts",
        oldFilePath: null,
        status: "modified",
        hunks: BASE_HUNKS,
      },
      {
        filePath: "src/deleted-file.ts",
        oldFilePath: null,
        status: "deleted",
        hunks: BASE_HUNKS,
      },
    ];

    const rows = buildFileListRows({
      files,
      selectedIndex: 1,
      maxVisibleRows: 10,
      width: 60,
    });

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      statusLabel: "A",
      statusColor: "green",
      isSelected: false,
      displayPath: "src/new-file.ts",
    });
    expect(rows[1]).toMatchObject({
      statusLabel: "M",
      statusColor: "yellow",
      isSelected: true,
      displayPath: "src/updated-file.ts",
    });
    expect(rows[2]).toMatchObject({
      statusLabel: "D",
      statusColor: "red",
      isSelected: false,
      displayPath: "src/deleted-file.ts",
    });
  });

  it("shows old and new paths for renamed files", () => {
    const rows = buildFileListRows({
      files: [
        {
          filePath: "src/new-name.ts",
          oldFilePath: "src/old-name.ts",
          status: "renamed",
          hunks: BASE_HUNKS,
        },
      ],
      selectedIndex: 0,
      maxVisibleRows: 5,
      width: 80,
    });

    expect(rows[0]).toMatchObject({
      statusLabel: "R",
      statusColor: "blue",
      displayPath: "src/old-name.ts -> src/new-name.ts",
    });
  });

  it("returns only the visible window around selection", () => {
    const files: ChangedFile[] = Array.from({ length: 8 }, (_, index) => ({
      filePath: `src/file-${index}.ts`,
      oldFilePath: null,
      status: "modified",
      hunks: BASE_HUNKS,
    }));

    const rows = buildFileListRows({
      files,
      selectedIndex: 4,
      maxVisibleRows: 3,
      width: 60,
    });

    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.displayPath)).toEqual([
      "src/file-3.ts",
      "src/file-4.ts",
      "src/file-5.ts",
    ]);
    expect(rows.map((row) => row.isSelected)).toEqual([false, true, false]);
  });

  it("truncates long file paths based on available width", () => {
    const rows = buildFileListRows({
      files: [
        {
          filePath: "src/components/very/long/path/to/button-component.tsx",
          oldFilePath: null,
          status: "modified",
          hunks: BASE_HUNKS,
        },
      ],
      selectedIndex: 0,
      maxVisibleRows: 5,
      width: 16,
    });

    expect(rows[0]?.displayPath).toBe("src/compo...");
  });
});
