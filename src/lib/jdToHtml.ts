/**
 * Renders the lightly-structured text Gemini returns for a simulated job
 * posting as real HTML — ported from legacy/app.html.
 *
 * A safety net, not a parser: the model is told not to use markdown, but it
 * sometimes does anyway. Without this the review panel shows raw `**bold**`
 * syntax or an undifferentiated wall of text instead of something that reads
 * like an actual posting.
 *
 * Everything is escaped before any tag is added, so model output cannot inject
 * markup.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineFormat(value: string): string {
  return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export function jdToHtml(text: string): string {
  if (!text) return "";

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let listOpen = false;
  let paragraphOpen = false;

  const closeList = () => {
    if (listOpen) {
      html += "</ul>";
      listOpen = false;
    }
  };
  const closeParagraph = () => {
    if (paragraphOpen) {
      html += "</p>";
      paragraphOpen = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      closeList();
      closeParagraph();
      continue;
    }

    // A whole line wrapped in ** is a section header, not emphasis.
    const header = line.match(/^\*\*(.+?)\*\*:?$/);
    if (header) {
      closeList();
      closeParagraph();
      html += `<h4>${escapeHtml(header[1])}</h4>`;
      continue;
    }

    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (bullet) {
      closeParagraph();
      if (!listOpen) {
        html += "<ul>";
        listOpen = true;
      }
      html += `<li>${inlineFormat(bullet[1])}</li>`;
      continue;
    }

    closeList();
    if (!paragraphOpen) {
      html += "<p>";
      paragraphOpen = true;
    } else {
      html += " ";
    }
    html += inlineFormat(line);
  }

  closeList();
  closeParagraph();
  return html;
}
