/**
 * Helper to parse a git patch and extract only the added lines with their line numbers
 * @param {string} patch The git patch string for a file
 * @returns {Array<{line: number, content: string}>} Added lines with line numbers in the new file
 */
export const parsePatch = (patch) => {
  if (!patch) return [];

  const lines = patch.split('\n');
  const addedLines = [];
  let currentLineNum = 0;

  for (const line of lines) {
    if (line.startsWith('@@')) {
      // Parse hunk header, e.g., @@ -1,8 +1,9 @@
      // We want the part after the + which represents the new file range
      const match = line.match(/\+(\d+)(?:,\d+)?/);
      if (match) {
        currentLineNum = parseInt(match[1], 10);
      }
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      // Line was added
      addedLines.push({
        line: currentLineNum,
        content: line.substring(1) // Strip the '+' sign
      });
      currentLineNum++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      // Line was deleted, skip (does not exist in new version)
    } else {
      // Context line, exists in new version, increment line number
      currentLineNum++;
    }
  }

  return addedLines;
};
