import { Box, Text } from "ink";
import type { ReviewNoteType } from "../review-notes/types.js";

interface NoteModalProps {
  type: ReviewNoteType;
  filePath: string;
  lineNumber: number;
  content: string;
}

function getModalTitle(type: ReviewNoteType): string {
  return type === "comment" ? "Add Comment" : "Add Proposed Change";
}

export function NoteModal({
  type,
  filePath,
  lineNumber,
  content,
}: NoteModalProps): JSX.Element {
  const titleColor = type === "comment" ? "green" : "blue";
  const displayContent = content.length === 0 ? "" : content;

  return (
    <Box
      borderStyle="double"
      borderColor={titleColor}
      flexDirection="column"
      paddingX={1}
      paddingY={0}
      marginY={1}
    >
      <Text color={titleColor}>{getModalTitle(type)}</Text>
      <Text>
        Target: <Text color="cyan">{filePath}</Text>
        <Text> : </Text>
        <Text color="cyan">L{lineNumber}</Text>
      </Text>
      <Text color="gray">Write your note below:</Text>
      <Box
        borderStyle="round"
        borderColor="gray"
        flexDirection="column"
        paddingX={1}
      >
        {displayContent.split("\n").map((line, index) => (
          <Text key={`${index}-${line}`}>{line.length > 0 ? line : " "}</Text>
        ))}
      </Box>
      <Text color="gray">Ctrl+R save | Esc cancel | Ctrl+Enter new line</Text>
    </Box>
  );
}
