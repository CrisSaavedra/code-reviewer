import { describe, it, expect, vi } from "vitest";
import type { ChangedFile } from "../../git/types.js";
import { runReviewCli } from "../../cli/run-review-cli.js";

function createWriter() {
  let output = "";

  return {
    writer: {
      write(chunk: string) {
        output += chunk;
        return true;
      },
    },
    getOutput() {
      return output;
    },
  };
}

const CHANGED_FILES: ChangedFile[] = [
  {
    filePath: "src/example.ts",
    oldFilePath: null,
    status: "modified",
    hunks: [
      {
        header: "@@ -1,1 +1,1 @@",
        oldStart: 1,
        oldCount: 1,
        newStart: 1,
        newCount: 1,
        lines: [
          {
            type: "removed",
            content: "const value = 1;",
            oldLineNumber: 1,
            newLineNumber: null,
          },
          {
            type: "added",
            content: "const value = 2;",
            oldLineNumber: null,
            newLineNumber: 1,
          },
        ],
      },
    ],
  },
];

describe("runReviewCli", () => {
  it("shows an error and exits when not inside a git repository", async () => {
    const stdout = createWriter();
    const stderr = createWriter();
    const renderReviewApp = vi.fn();

    const exitCode = await runReviewCli({
      isGitRepo: async () => false,
      getRawDiff: async () => "",
      getBranchName: async () => "main",
      parseDiff: () => [],
      renderReviewApp,
      stdout: stdout.writer,
      stderr: stderr.writer,
    });

    expect(exitCode).toBe(1);
    expect(stderr.getOutput()).toContain("No git repository detected");
    expect(stdout.getOutput()).toBe("");
    expect(renderReviewApp).not.toHaveBeenCalled();
  });

  it("shows a message and skips the UI when there are no changes", async () => {
    const stdout = createWriter();
    const stderr = createWriter();
    const renderReviewApp = vi.fn();

    const exitCode = await runReviewCli({
      isGitRepo: async () => true,
      getRawDiff: async () => "",
      getBranchName: async () => "main",
      parseDiff: () => [],
      renderReviewApp,
      stdout: stdout.writer,
      stderr: stderr.writer,
    });

    expect(exitCode).toBe(0);
    expect(stdout.getOutput()).toContain("No changes found to review.");
    expect(stderr.getOutput()).toBe("");
    expect(renderReviewApp).not.toHaveBeenCalled();
  });

  it("renders the review app when changed files are present", async () => {
    const stdout = createWriter();
    const stderr = createWriter();
    const renderReviewApp = vi.fn();

    const exitCode = await runReviewCli({
      isGitRepo: async () => true,
      getRawDiff: async () => "diff --git a/src/example.ts b/src/example.ts",
      getBranchName: async () => "feature/review",
      parseDiff: () => CHANGED_FILES,
      renderReviewApp,
      stdout: stdout.writer,
      stderr: stderr.writer,
    });

    expect(exitCode).toBe(0);
    expect(renderReviewApp).toHaveBeenCalledTimes(1);
    const renderInput = renderReviewApp.mock.calls[0]?.[0];
    expect(renderInput).toBeDefined();
    expect(renderInput?.changedFiles).toEqual(CHANGED_FILES);
    expect(renderInput?.branchName).toBe("feature/review");
    expect(renderInput?.loadChangedFiles).toBeTypeOf("function");
    expect(stdout.getOutput()).toBe("");
    expect(stderr.getOutput()).toBe("");
  });

  it("reports startup failures", async () => {
    const stdout = createWriter();
    const stderr = createWriter();
    const renderReviewApp = vi.fn();

    const exitCode = await runReviewCli({
      isGitRepo: async () => true,
      getRawDiff: async () => {
        throw new Error("git failed");
      },
      getBranchName: async () => "main",
      parseDiff: () => [],
      renderReviewApp,
      stdout: stdout.writer,
      stderr: stderr.writer,
    });

    expect(exitCode).toBe(1);
    expect(stderr.getOutput()).toContain(
      "Failed to start review UI: git failed",
    );
    expect(renderReviewApp).not.toHaveBeenCalled();
  });
});
