import { Box, Text } from "ink";

interface MarkdownPreviewProps {
  markdown: string;
  message: string | null;
}

export function MarkdownPreview({
  markdown,
  message,
}: MarkdownPreviewProps): JSX.Element {
  const color =
    message && message.toLowerCase().includes("failed") ? "red" : "yellow";

  return (
    <Box
      borderStyle="round"
      borderColor="cyan"
      flexDirection="column"
      paddingX={1}
    >
      <Text color="cyan">Markdown Preview</Text>
      <Text color="gray">Ctrl+M copy markdown | Ctrl+Q back</Text>
      {message ? <Text color={color}>{message}</Text> : null}
      <Box
        borderStyle="round"
        borderColor="gray"
        flexDirection="column"
        marginTop={1}
        paddingX={1}
      >
        {markdown.split("\n").map((line, index) => (
          <Text key={`${index}-${line}`}>{line}</Text>
        ))}
      </Box>
    </Box>
  );
}
