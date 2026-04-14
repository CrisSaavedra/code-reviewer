import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

import {
  isGitRepo,
  getBranchName,
  getRawDiff,
  getRawFileDiff,
} from "../../git/git-service.js";

const { execa } = await import("execa");
const execaMock = execa as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isGitRepo", () => {
  it("returns true when git command succeeds", async () => {
    execaMock.mockResolvedValueOnce({ stdout: "true" } as never);
    expect(await isGitRepo()).toBe(true);
  });

  it("returns false when git command throws", async () => {
    execaMock.mockRejectedValueOnce(new Error("not a git repo"));
    expect(await isGitRepo()).toBe(false);
  });
});

describe("getBranchName", () => {
  it("returns branch name from stdout", async () => {
    execaMock.mockResolvedValueOnce({ stdout: "main\n" } as never);
    expect(await getBranchName()).toBe("main");
  });

  it("returns HEAD as fallback when stdout is empty", async () => {
    execaMock.mockResolvedValueOnce({ stdout: "" } as never);
    expect(await getBranchName()).toBe("HEAD");
  });

  it("returns HEAD when git command throws", async () => {
    execaMock.mockRejectedValueOnce(new Error("error"));
    expect(await getBranchName()).toBe("HEAD");
  });
});

describe("getRawDiff", () => {
  it("returns stdout from git diff", async () => {
    const fakeDiff = "diff --git a/foo.ts b/foo.ts\n";
    execaMock.mockResolvedValueOnce({ stdout: "" } as never);
    execaMock.mockResolvedValueOnce({ stdout: fakeDiff } as never);
    expect(await getRawDiff()).toBe(fakeDiff);
  });

  it("uses default context of 3", async () => {
    execaMock.mockResolvedValueOnce({ stdout: "" } as never);
    execaMock.mockResolvedValueOnce({ stdout: "" } as never);
    await getRawDiff();
    expect(execaMock).toHaveBeenCalledWith("git", [
      "add",
      "--intent-to-add",
      ".",
    ]);
    expect(execaMock).toHaveBeenCalledWith("git", ["diff", "--unified=3"]);
  });

  it("uses provided context lines", async () => {
    execaMock.mockResolvedValueOnce({ stdout: "" } as never);
    execaMock.mockResolvedValueOnce({ stdout: "" } as never);
    await getRawDiff(10);
    expect(execaMock).toHaveBeenCalledWith("git", ["diff", "--unified=10"]);
  });

  it("throws a descriptive error on failure", async () => {
    execaMock.mockRejectedValueOnce(new Error("git failed"));
    await expect(getRawDiff()).rejects.toThrow("Failed to get git diff");
  });
});

describe("getRawFileDiff", () => {
  it("calls git diff with file path and context", async () => {
    execaMock.mockResolvedValueOnce({ stdout: "" } as never);
    await getRawFileDiff("src/foo.ts", 13);
    expect(execaMock).toHaveBeenCalledWith("git", [
      "diff",
      "--unified=13",
      "--",
      "src/foo.ts",
    ]);
  });

  it("throws a descriptive error on failure", async () => {
    execaMock.mockRejectedValueOnce(new Error("git failed"));
    await expect(getRawFileDiff("src/foo.ts", 3)).rejects.toThrow(
      "Failed to get diff for src/foo.ts",
    );
  });
});
