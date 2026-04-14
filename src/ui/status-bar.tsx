import { Box, Text } from "ink";
import type { ActivePanel } from "../navigation/review-navigation.js";

interface StatusBarProps {
  activePanel: ActivePanel;
  selectedFilePath: string;
  commentCount: number;
  proposedChangeCount: number;
  contextLines: number;
  message: string | null;
  isLoadingDiff: boolean;
}

export function StatusBar({
  activePanel,
  selectedFilePath,
  commentCount,
  proposedChangeCount,
  contextLines,
  message,
  isLoadingDiff,
}: StatusBarProps): JSX.Element {
  return (
    <Box
      borderStyle="round"
      borderColor="gray"
      flexDirection="column"
      paddingX={1}
    >
      <Text>
        Active:{" "}
        <Text color="cyan">{activePanel === "files" ? "Files" : "Diff"}</Text>
        <Text> | Tab switch | Arrows navigate | Right expand context</Text>
      </Text>
      <Text>
        File: <Text color="white">{selectedFilePath}</Text>
      </Text>
      <Text>
        Notes: <Text color="green">{commentCount} comments</Text>
        <Text> / </Text>
        <Text color="blue">{proposedChangeCount} proposed changes</Text>
        <Text> | Context: ±{contextLines}</Text>
      </Text>
      <Text>
        Commands: Ctrl+C comment | Ctrl+V proposed change | Ctrl+M markdown |
        Ctrl+Q exit
      </Text>
      {isLoadingDiff ? (
        <Text color="yellow">Loading diff with expanded context...</Text>
      ) : null}
      {message ? (
        <Text
          color={message.toLowerCase().includes("failed") ? "red" : "yellow"}
        >
          {message}
        </Text>
      ) : null}
      {message === null ? (
        <Text color="gray">
          Tip: Use Right Arrow in diff panel to expand context.
        </Text>
      ) : null}
    </Box>
  );
}
