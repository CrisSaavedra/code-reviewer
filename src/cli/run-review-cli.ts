import { parseDiff } from "../git/diff-parser.js";
import { getBranchName, getRawDiff, isGitRepo } from "../git/git-service.js";
import type { ChangedFile } from "../git/types.js";
import {
  renderReviewApp,
  type RenderReviewAppInput,
} from "../ui/render-review-app.js";

export interface OutputWriter {
  write(chunk: string): unknown;
}

export interface ReviewCliDependencies {
  isGitRepo: () => Promise<boolean>;
  getRawDiff: (contextLines?: number) => Promise<string>;
  getBranchName: () => Promise<string>;
  parseDiff: (rawDiff: string) => ChangedFile[];
  renderReviewApp: (input: RenderReviewAppInput) => void;
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
    getRawDiff: async (contextLines?: number) => getRawDiff(contextLines),
    getBranchName,
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

    const branchName = await resolvedDependencies.getBranchName();
    resolvedDependencies.renderReviewApp({
      changedFiles,
      branchName,
      loadChangedFiles: async (contextLines: number) => {
        const nextRawDiff = await resolvedDependencies.getRawDiff(contextLines);
        return resolvedDependencies.parseDiff(nextRawDiff);
      },
    });
    return 0;
  } catch (error) {
    resolvedDependencies.stderr.write(
      `Failed to start review UI: ${formatErrorMessage(error)}\n`,
    );
    return 1;
  }
}
