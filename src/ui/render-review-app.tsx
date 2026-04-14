import { render } from "ink";
import type { ChangedFile } from "../git/types.js";
import { copyToClipboard } from "../clipboard/clipboard-service.js";
import { ReviewApp } from "./review-app.js";

export interface RenderReviewAppInput {
  changedFiles: ChangedFile[];
  branchName: string;
  loadChangedFiles: (contextLines: number) => Promise<ChangedFile[]>;
}

export function renderReviewApp({
  changedFiles,
  branchName,
  loadChangedFiles,
}: RenderReviewAppInput): void {
  render(
    <ReviewApp
      changedFiles={changedFiles}
      branchName={branchName}
      loadChangedFiles={loadChangedFiles}
      copyToClipboard={copyToClipboard}
    />,
  );
}
