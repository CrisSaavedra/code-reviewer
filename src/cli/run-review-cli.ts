import { parseDiff } from "../git/diff-parser.js";
import { getRawDiff, isGitRepo } from "../git/git-service.js";
import type { ChangedFile } from "../git/types.js";
import { renderReviewApp } from "../ui/render-review-app.js";

export interface OutputWriter {
  write(chunk: string): unknown;
}

export interface ReviewCliDependencies {
  isGitRepo: () => Promise<boolean>;
  getRawDiff: () => Promise<string>;
  getNewDiff: () => void;
  parseDiff: (rawDiff: string) => ChangedFile[];
  renderReviewApp: (changedFiles: ChangedFile[]) => void;
  stdout: OutputWriter;
  stderr: OutputWriter;
}

function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function runReviewCli(
  dependencies: Partial<ReviewCliDependencies> = {},
): Promise<number> {
  const resolvedDependencies: ReviewCliDependencies = {
    isGitRepo,
    getRawDiff: async () => getRawDiff(),
    getNewDiff: async () => {},
    parseDiff,
    renderReviewApp,
    stdout: process.stdout,
    stderr: process.stderr,
    ...dependencies,
  };

  try {
    const insideGitRepo = await resolvedDependencies.isGitRepo();

    if (!insideGitRepo) {
      resolvedDependencies.stderr.write(
        "No git repository detected in the current directory.\n",
      );
      return 1;
    }

    const rawDiff = await resolvedDependencies.getRawDiff();
    const changedFiles = resolvedDependencies.parseDiff(rawDiff);

    if (changedFiles.length === 0) {
      resolvedDependencies.stdout.write("No changes found to review.\n");
      return 0;
    }

    resolvedDependencies.renderReviewApp(changedFiles);
    return 0;
  } catch (error) {
    resolvedDependencies.stderr.write(
      `Failed to start review UI: ${formatErrorMessage(error)}\n`,
    );
    return 1;
  }
}
