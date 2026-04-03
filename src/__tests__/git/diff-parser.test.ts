import { describe, it, expect } from "vitest";
import { parseDiff } from "../../git/diff-parser.js";

const SIMPLE_MODIFY = `diff --git a/src/foo.ts b/src/foo.ts
index abc1234..def5678 100644
--- a/src/foo.ts
+++ b/src/foo.ts
@@ -1,5 +1,6 @@
 const a = 1;
 const b = 2;
-const c = 3;
+const c = 30;
+const d = 4;
 const e = 5;
`;

const NEW_FILE = `diff --git a/src/new.ts b/src/new.ts
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/src/new.ts
@@ -0,0 +1,3 @@
+export function hello() {
+  return "hello";
+}
`;

const DELETED_FILE = `diff --git a/src/old.ts b/src/old.ts
deleted file mode 100644
index abc1234..0000000
--- a/src/old.ts
+++ /dev/null
@@ -1,3 +0,0 @@
-export function bye() {
-  return "bye";
-}
`;

const RENAMED_FILE = `diff --git a/src/old-name.ts b/src/new-name.ts
similarity index 100%
rename from src/old-name.ts
rename to src/new-name.ts
`;

const MULTIPLE_HUNKS = `diff --git a/src/multi.ts b/src/multi.ts
index abc1234..def5678 100644
--- a/src/multi.ts
+++ b/src/multi.ts
@@ -1,4 +1,4 @@
 line1
-line2
+line2-modified
 line3
 line4
@@ -10,4 +10,4 @@
 line10
-line11
+line11-modified
 line12
 line13
`;

const MULTIPLE_FILES = `diff --git a/src/a.ts b/src/a.ts
index abc1234..def5678 100644
--- a/src/a.ts
+++ b/src/a.ts
@@ -1,3 +1,3 @@
 keep
-remove
+add
 keep2
diff --git a/src/b.ts b/src/b.ts
index abc1234..def5678 100644
--- a/src/b.ts
+++ b/src/b.ts
@@ -1,3 +1,3 @@
 keepB
-removeB
+addB
 keep2B
`;

describe("parseDiff", () => {
  it("returns empty array for empty input", () => {
    expect(parseDiff("")).toEqual([]);
    expect(parseDiff("   \n  ")).toEqual([]);
  });

  it("parses a simple modified file", () => {
    const files = parseDiff(SIMPLE_MODIFY);
    expect(files).toHaveLength(1);

    const file = files[0];
    expect(file.filePath).toBe("src/foo.ts");
    expect(file.status).toBe("modified");
    expect(file.oldFilePath).toBeNull();
    expect(file.hunks).toHaveLength(1);

    const hunk = file.hunks[0];
    expect(hunk.oldStart).toBe(1);
    expect(hunk.newStart).toBe(1);
    expect(hunk.lines).toHaveLength(6);

    const [ctx1, ctx2, removed, added1, added2, ctx3] = hunk.lines;
    expect(ctx1.type).toBe("context");
    expect(ctx1.content).toBe("const a = 1;");
    expect(ctx2.type).toBe("context");
    expect(removed.type).toBe("removed");
    expect(removed.content).toBe("const c = 3;");
    expect(removed.oldLineNumber).toBe(3);
    expect(removed.newLineNumber).toBeNull();
    expect(added1.type).toBe("added");
    expect(added1.content).toBe("const c = 30;");
    expect(added1.oldLineNumber).toBeNull();
    expect(added1.newLineNumber).toBe(3);
    expect(added2.type).toBe("added");
    expect(added2.content).toBe("const d = 4;");
    expect(added2.newLineNumber).toBe(4);
    expect(ctx3.type).toBe("context");
  });

  it("parses a new file", () => {
    const files = parseDiff(NEW_FILE);
    expect(files).toHaveLength(1);

    const file = files[0];
    expect(file.filePath).toBe("src/new.ts");
    expect(file.status).toBe("added");
    expect(file.hunks).toHaveLength(1);

    const lines = file.hunks[0].lines;
    expect(lines).toHaveLength(3);
    lines.forEach((l) => expect(l.type).toBe("added"));
  });

  it("parses a deleted file", () => {
    const files = parseDiff(DELETED_FILE);
    expect(files).toHaveLength(1);

    const file = files[0];
    expect(file.filePath).toBe("src/old.ts");
    expect(file.status).toBe("deleted");

    const lines = file.hunks[0].lines;
    expect(lines).toHaveLength(3);
    lines.forEach((l) => expect(l.type).toBe("removed"));
  });

  it("parses a renamed file with no content change", () => {
    const files = parseDiff(RENAMED_FILE);
    expect(files).toHaveLength(1);

    const file = files[0];
    expect(file.filePath).toBe("src/new-name.ts");
    expect(file.oldFilePath).toBe("src/old-name.ts");
    expect(file.status).toBe("renamed");
    expect(file.hunks).toHaveLength(0);
  });

  it("parses multiple hunks in one file", () => {
    const files = parseDiff(MULTIPLE_HUNKS);
    expect(files).toHaveLength(1);
    expect(files[0].hunks).toHaveLength(2);

    const [hunk1, hunk2] = files[0].hunks;
    expect(hunk1.oldStart).toBe(1);
    expect(hunk2.oldStart).toBe(10);
  });

  it("parses multiple files", () => {
    const files = parseDiff(MULTIPLE_FILES);
    expect(files).toHaveLength(2);
    expect(files[0].filePath).toBe("src/a.ts");
    expect(files[1].filePath).toBe("src/b.ts");
  });

  it("tracks line numbers correctly across context and changed lines", () => {
    const files = parseDiff(SIMPLE_MODIFY);
    const lines = files[0].hunks[0].lines;

    // context: oldLine=1, newLine=1
    expect(lines[0].oldLineNumber).toBe(1);
    expect(lines[0].newLineNumber).toBe(1);
    // context: oldLine=2, newLine=2
    expect(lines[1].oldLineNumber).toBe(2);
    expect(lines[1].newLineNumber).toBe(2);
    // removed: oldLine=3
    expect(lines[2].oldLineNumber).toBe(3);
    expect(lines[2].newLineNumber).toBeNull();
    // added: newLine=3
    expect(lines[3].oldLineNumber).toBeNull();
    expect(lines[3].newLineNumber).toBe(3);
    // added: newLine=4
    expect(lines[4].oldLineNumber).toBeNull();
    expect(lines[4].newLineNumber).toBe(4);
    // context: oldLine=4, newLine=5
    expect(lines[5].oldLineNumber).toBe(4);
    expect(lines[5].newLineNumber).toBe(5);
  });
});
