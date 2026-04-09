import { Box, Text } from "ink";
import type { ActivePanel } from "../navigation/review-navigation.js";

interface StatusBarProps {
  activePanel: ActivePanel;
  selectedFilePath: string;
}

export function StatusBar({
  activePanel,
  selectedFilePath,
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
        <Text> | Tab switch | Arrows navigate | Ctrl+Q exit</Text>
      </Text>
      <Text>
        File: <Text color="white">{selectedFilePath}</Text>
        <Text> | Notes: 0 comments / 0 proposed changes</Text>
      </Text>
    </Box>
  );
}
