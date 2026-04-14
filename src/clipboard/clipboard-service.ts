import clipboard from "clipboardy";

export async function copyToClipboard(content: string): Promise<void> {
  await clipboard.write(content);
}
