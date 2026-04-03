import { execa } from "execa";

export async function isGitRepo(): Promise<boolean> {
  try {
    await execa("git", ["rev-parse", "--is-inside-work-tree"]);
    return true;
  } catch {
    return false;
  }
}

export async function getBranchName(): Promise<string> {
  try {
    const { stdout } = await execa("git", ["branch", "--show-current"]);
    return stdout.trim() || "HEAD";
  } catch {
    return "HEAD";
  }
}

export async function getRawDiff(contextLines = 3): Promise<string> {
  try {
    const { stdout } = await execa("git", [
      "diff",
      `--unified=${contextLines}`,
    ]);
    return stdout;
  } catch (error) {
    throw new Error(
      `Failed to get git diff: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function getRawFileDiff(
  filePath: string,
  contextLines: number
): Promise<string> {
  try {
    const { stdout } = await execa("git", [
      "diff",
      `--unified=${contextLines}`,
      "--",
      filePath,
    ]);
    return stdout;
  } catch (error) {
    throw new Error(
      `Failed to get diff for ${filePath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
