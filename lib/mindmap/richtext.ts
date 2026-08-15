export interface TopicSegment {
  text: string;
  bold: boolean;
}

// Inline **bold** run, non-greedy and never spanning another marker pair.
const INLINE_BOLD_PATTERN = /\*\*(?!\s)((?:(?!\*\*)[\s\S])+?)\*\*/g;

export function parseInlineBold(topic: string): TopicSegment[] {
  const segments: TopicSegment[] = [];
  const pattern = new RegExp(INLINE_BOLD_PATTERN.source, "g");
  let lastIndex = 0;
  let match = pattern.exec(topic);

  while (match) {
    if (match.index > lastIndex) {
      segments.push({ text: topic.slice(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    lastIndex = match.index + match[0].length;
    match = pattern.exec(topic);
  }

  if (lastIndex < topic.length) {
    segments.push({ text: topic.slice(lastIndex), bold: false });
  }

  return segments.length ? segments : [{ text: topic, bold: false }];
}

export function stripBoldMarkers(topic: string): string {
  return parseInlineBold(topic)
    .map((segment) => segment.text)
    .join("");
}
