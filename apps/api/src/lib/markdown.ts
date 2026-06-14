import { marked } from "marked";

marked.setOptions({ breaks: true, gfm: true });

/** Renders LLM-authored markdown (e.g. `**bold**`, lists, links) as email-safe HTML. */
export function markdownToHtml(markdown: string): string {
  const body = marked.parse(markdown, { async: false });
  return `<div style="font-family: sans-serif; font-size: 14px; line-height: 1.5;">${body}</div>`;
}
