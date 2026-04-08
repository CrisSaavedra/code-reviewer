#!/usr/bin/env node

import { Command } from "commander";
import { runReviewCli } from "./cli/run-review-cli.js";

const program = new Command();

program
  .name("cr")
  .description("Review local git changes from the terminal")
  .action(async () => {
    const exitCode = await runReviewCli();
    if (exitCode !== 0) {
      process.exitCode = exitCode;
    }
  });

await program.parseAsync(process.argv);
