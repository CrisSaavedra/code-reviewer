## Overview

**Code Reviewer CLI** is a terminal-based review tool for local git changes.

It allows the user to:

- inspect changed files from the current git diff
- navigate changed lines directly from the terminal
- add two kinds of review notes:
  - **Comment**
  - **Proposed change**
- generate a final **markdown review summary**
- copy that summary and use it in a PR, issue, or external review process

This MVP is focused on **manual review writing**, not automatic code fixing.

A proposed change is only a **textual suggestion written by the user**. It is not a patch, not an inline replacement, and not auto-applied. Later, another agent or workflow may use those notes to implement changes.

---

## Main goal

Help the user review local git changes quickly from the terminal, without needing to open GitHub, an editor, or another review UI.

---

## Scope of the MVP

The MVP must:

- work only inside a valid git repository
- read local git changes
- show changed files in a left panel
- show diff code in a right panel
- allow line-based note creation
- support keyboard-first interaction
- support expandable diff context
- generate markdown output grouped by file
- keep the implementation modular so new features can be added later

The MVP does **not** need:

- real patch generation
- AI review
- automatic code edits
- GitHub integration
- multi-user collaboration
- inline code application
- full file editing

---

## Stack

Bun + TypeScript + Commander + Zod + Ink (React for terminal) + Chalk + Execa + Vitest

### Stack details

- **Commander** — CLI entry point, parses the `cr` command
- **Zod** — schema validation for review notes and git output parsing
- **Ink** — React-based terminal UI framework for rendering panels, modals, status bar, and handling keyboard input
- **Chalk** — terminal color formatting (used alongside Ink)
- **Execa** — executing git commands
- **Vitest** — unit and integration testing

> Ink replaces Inquirer from the original stack. Inquirer is designed for sequential prompts and cannot render a persistent panel-based layout with side-by-side views, modals, and real-time keyboard navigation.

# Startup flow

## Command to start

- `cr`

This command launches the CLI.

## Initialization rules

When `cr` runs, the system must validate the environment in this order:

### 1. Check if current folder is inside a git repository

- If `.git` is not detected, show an error message
- Do not allow the user to continue
- Exit safely

Example behavior:

- message: “No git repository detected in the current directory.”

### 2. Check for git changes

Once git is detected, the tool must search for local diff changes.

If no changes are found:

- show a message to the user
- do not open the review UI
- exit safely

Example behavior:

- message: “No changes found to review.”

### 3. Open review UI

If git exists and changes are found:

- open the review interface
- load changed files into the left panel
- load the selected file diff into the right panel

---

# UI Layout

The interface has **three main areas**.

## Left panel

Width: approximately **1/3** of the terminal.

Purpose:

- display changed files
- allow navigation through files
- optionally show folder/file hierarchy if supported by implementation

The left panel is the **file navigation panel**.

## Right panel

Width: approximately **2/3** of the terminal.

Purpose:

- display the diff content of the selected file
- show changed lines first
- allow line selection
- allow expanding the current diff hunk for more context

The right panel is the **code review panel**.

## Bottom status area

Position: under both panels.

Purpose:

- show available commands
- show current active panel
- show messages and warnings
- show total number of comments
- show total number of proposed changes

This area must remain flexible because more status information may be added later.

---

# UI behavior

## Active panel

At any moment, the user must clearly know which panel is active.

The active panel must be visually distinct, for example with:

- highlighted border
- different title color
- focus indicator

## Panel roles

- Left panel = file selection
- Right panel = code line selection

## Diff view behavior

The right panel must initially show:

- changed code
- added and removed lines
- minimal surrounding context

It must **not** show the full file by default.

The user must be able to **expand** a diff hunk to see more surrounding code.

---

# Review note types

The MVP supports exactly **two note types**:

## 1. Comment

Used for:

- observations
- feedback
- questions
- warnings
- general review notes

## 2. Proposed change

Used for:

- textual suggestions that imply a modification
- ideas the agent or developer should implement later

Important:

A proposed change is **not** a real patch.

It is only a categorized text note.

---

# Data model for MVP

Each review note must store at least:

- `type` → `comment` or `proposed_change`
- `filePath`
- `lineNumber`
- `content`

Optional but recommended for modularity:

- `createdAt`
- `diffSnippet`
- `id`

Because both note types are almost identical in behavior, they should share the same base structure and differ only by `type`.

---

# Navigation rules

## Panel switching

- `Tab`
  - Switch active panel between left and right

## Left panel navigation

When the left panel is active:

- `↑`
  - Move selection up through files
- `↓`
  - Move selection down through files

If hierarchy is implemented:

- `→`
  - Expand folder / open child level
- `←`
  - Collapse folder / go back in hierarchy

When a file is selected:

- the right panel must update to show that file’s diff

## Right panel navigation

When the right panel is active:

- `↑`
  - Move selection up through visible diff lines
- `↓`
  - Move selection down through visible diff lines

Selection is line-based.

The selected line is the target for comments and proposed changes.

---

# Commands

Below is the command set that must exist in the MVP.

## Global commands

### `cr`

Starts the CLI.

### `Ctrl + Q`

Back / exit.

Behavior:

- if user is in the main review screen, exit the CLI
- if user is in markdown preview, return to review screen
- if user is in another secondary view, go back one level

### `Ctrl + C`

Open **Add Comment** modal for the currently selected file and line.

### `Ctrl + V`

Open **Add Proposed Change** modal for the currently selected file and line.

### `Ctrl + M`

Open markdown output preview.

Behavior:

- if there are review notes, open markdown preview
- if there are no notes, show warning and do not open preview

### `Tab`

Switch active panel.

---

## Commands inside modal

When the add-comment or add-proposed-change modal is open:

### `Ctrl + R`

Save the current note.

### `Esc`

Cancel modal without saving.

### `Ctrl + Enter`

Insert line break inside the modal text input.

Important:

- Enter alone should not save unless explicitly chosen in the implementation
- multiline writing must be supported

---

## Commands inside markdown preview

When markdown preview is open:

### `Ctrl + M`

Copy markdown text.

### `Ctrl + Q`

Return to the main review interface.

If clipboard copy fails:

- show a visible error message
- do not lose the generated markdown

---

# Expected behaviors

## 1. Git required

If there is no git repository:

- show error
- block usage

## 2. Diff required

If there are no git changes:

- show warning
- block review UI

## 3. Keyboard-first usage

The full MVP must be operable only with keyboard.

## 4. Modal blocks the rest of the UI

When a modal is open:

- background interaction is blocked
- user cannot navigate panels until modal is closed

## 5. Multiline notes supported

The user must be able to write multiline comments and multiline proposed changes.

## 6. Notes are line-based

Every saved note must reference:

- file
- line

## 7. Diff-first review

The code panel must show changed lines first, not the full file.

## 8. Expandable context

The user must be able to expand the visible diff hunk to get more context.

## 9. Visual diff clarity

The system must make added and removed lines visually understandable.

For example:

- `+` for added lines
- for removed lines
- context lines clearly differentiated

## 10. Empty markdown generation warning

If the user tries to open markdown output without notes:

- show warning
- do not enter markdown preview

Example:

- “No comments or proposed changes were added.”

## 11. Error handling

The MVP must handle at least:

- no git repository
- no diff found
- git command failure
- file read failure
- clipboard copy failure
- terminal too small

## 12. Counters visible

The bottom area must display:

- number of comments
- number of proposed changes

---

# Markdown output rules

The final markdown output must:

- include branch name
- include date
- group notes by file
- within each file, separate:
  - proposed changes
  - comments

It should avoid overly heavy file sections, but still keep grouping clear.

---

# Example output structure

```
## [branch-name] - Review - [DD/MM HH:mm]

### Proposed Changes

- `src/components/Button.tsx`
  - L24: This logic could be moved to a helper to reduce duplication.
  - L41: Consider renaming this variable to make its purpose clearer.

### Comments

- `src/components/Button.tsx`
  - L18: Is this null case covered?
  - L55: This branch feels hard to read. Could it be simplified?

- `src/services/api.ts`
  - L12: Should this error be logged before returning?

---

### Rules
- If a comment contains a question, it should always be answered.
- Proposed changes should always be logically validated before implementation.
```

---

# Functional requirements

## FR-01

The system must start with the command `cr`.

## FR-02

The system must verify that the current directory belongs to a git repository.

## FR-03

The system must detect whether local git changes exist before opening the UI.

## FR-04

The system must display changed files in the left panel.

## FR-05

The system must display diff content for the selected file in the right panel.

## FR-06

The system must allow switching active panel with `Tab`.

## FR-07

The system must allow keyboard navigation with arrow keys.

## FR-08

The system must allow creating comments with `Ctrl + C`.

## FR-09

The system must allow creating proposed changes with `Ctrl + V`.

## FR-10

The system must open note input in a blocking modal.

## FR-11

The system must allow saving a note with `Ctrl + R`.

## FR-12

The system must allow canceling a modal with `Esc`.

## FR-13

The system must support multiline input using `Ctrl + Enter`.

## FR-14

The system must allow opening markdown preview with `Ctrl + M`.

## FR-15

The system must allow copying markdown from preview with `Ctrl + M`.

## FR-16

The system must allow returning or exiting with `Ctrl + Q`.

## FR-17

The system must group output by file.

## FR-18

The system must track note totals and display counters.

---

# Non-functional requirements

## NFR-01 Modularity

The architecture should keep these responsibilities separate:

- git diff retrieval
- UI rendering
- navigation state
- note storage
- markdown generation
- clipboard handling

This is important so the MVP can evolve later.

## NFR-02 Responsiveness

Navigation should feel immediate and lightweight.

## NFR-03 Reliability

Common user errors must not crash the application.

## NFR-04 Readability

The interface must make it easy to distinguish:

- active panel
- selected line
- added lines
- removed lines
- status messages

## NFR-05 Extensibility

The note model and command system should make it easy to add later:

- edit note
- delete note
- AI-assisted suggestions
- staged vs unstaged modes
- full file view
- GitHub/PR export

---

# Recommended MVP modules

To keep the code modular, the MVP should be split into responsibilities like:

- **CLI entry module**
  - bootstraps command `cr`
- **Git module**
  - detects repo
  - gets branch
  - gets diff
  - parses changed files and hunks
- **UI module**
  - renders panels
  - handles status bar
  - handles modal rendering
- **Navigation module**
  - active panel
  - selected file
  - selected line
  - expand state
- **Review notes module**
  - create/store/list notes
  - comment and proposed change handling
- **Markdown module**
  - convert saved notes into final markdown output
- **Clipboard module**
  - copy markdown text

This is enough modularization for a solid MVP without overengineering.

---

# Final MVP definition in one paragraph

**Code Reviewer CLI** is a keyboard-driven terminal tool started with `cr` that reviews local git diff changes. It shows changed files in a left panel and the selected file’s diff in a right panel, where the user can navigate changed lines, expand context, and attach either comments or proposed changes to a specific file and line. Notes are written through blocking modals, stored as structured review items, and finally exported as a markdown review summary grouped by file, with copy support from a preview screen.
