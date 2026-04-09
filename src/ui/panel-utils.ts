export interface VisibleWindow {
  startIndex: number;
  endIndex: number;
}

export function getVisibleWindow(
  itemCount: number,
  selectedIndex: number,
  maxVisibleRows: number,
): VisibleWindow {
  if (itemCount <= 0 || maxVisibleRows <= 0) {
    return { startIndex: 0, endIndex: 0 };
  }

  if (itemCount <= maxVisibleRows) {
    return { startIndex: 0, endIndex: itemCount };
  }

  const halfWindow = Math.floor(maxVisibleRows / 2);
  let startIndex = Math.max(selectedIndex - halfWindow, 0);
  let endIndex = startIndex + maxVisibleRows;

  if (endIndex > itemCount) {
    endIndex = itemCount;
    startIndex = Math.max(endIndex - maxVisibleRows, 0);
  }

  return { startIndex, endIndex };
}

export function truncateText(value: string, maxLength: number): string {
  if (maxLength <= 0) {
    return "";
  }

  if (value.length <= maxLength) {
    return value;
  }

  if (maxLength <= 3) {
    return value.slice(0, maxLength);
  }

  return `${value.slice(0, maxLength - 3)}...`;
}
