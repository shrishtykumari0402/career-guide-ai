export function entriesToMarkdown(entries, type) {
  if (!entries?.length) return "";

  return (
    `## ${type}\n\n` +
    entries
      .map((entry) => {
        const dateRange = entry.current
          ? `${entry.startDate} - Present`
          : `${entry.startDate} - ${entry.endDate}`;

        const bulletPoints = entry.description
          .split(/\n+/)
          .filter(Boolean)
          .map((point) => `- ${point.trim()}`)
          .join("\n");

        return `### ${entry.title}${entry.organization ? ` | ${entry.organization}` : ""}\n*${dateRange}*\n\n${bulletPoints}`;
      })
      .join("\n\n")
  );
}