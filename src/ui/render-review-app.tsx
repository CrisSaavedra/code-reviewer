import { render } from "ink";
import type { ChangedFile } from "../git/types.js";
import { ReviewApp } from "./review-app.js";

export function renderReviewApp(changedFiles: ChangedFile[]): void {
  render(<ReviewApp changedFiles={changedFiles} />);
}
