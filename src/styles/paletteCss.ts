import { blendColor, diagramThemeFor, visibleDiagramColor, visibleHighlight, type CodeLightness, type DiagramTheme } from "../utils/color";

/** Colors resolved from the settings for the active theme mode. */
interface WrPalette {
  bgColor: string;
  hoverColor: string;
  textColor: string;
  mutedColor: string;
  faintColor: string;
  unresolvedLinkColor: string;
  codeLightness: CodeLightness;
  // The theme's highlight colours (--color-red and the rest) as hex.
  highlightTheme: Record<string, string>;
  diagramTheme: DiagramTheme | null;
}

/** Highlight colour variables (--wrot-hl-red …) kept visible on the given background. */
export function highlightVars(theme: Record<string, string>, bg: string): string {
  return Object.entries(theme)
    .map(([name, color]) => `--wrot-hl-${name}: ${visibleHighlight(color, bg)};`)
    .join("\n        ");
}

/** Diagram color variables, kept off the given background. */
export function diagramThemeVars(theme: DiagramTheme | null, bg: string): string {
  if (!theme) return "";
  const { series, accent, critical } = diagramThemeFor(theme, bg);
  return [
    `--mermaid-accent: ${accent};`,
    `--mermaid-critical: ${critical};`,
    ...series.map((color, i) => `--mermaid-color-${i + 1}: ${color};`),
  ].join("\n        ");
}

/**
 * The base color stamp: card/input backgrounds, text, and every element that has to follow the
 * user's chosen palette. Sits at boost level 2 in the specificity ladder.
 */
export function buildPaletteCss(palette: WrPalette): string {
  const { bgColor, hoverColor, textColor, mutedColor, faintColor, unresolvedLinkColor, codeLightness, highlightTheme, diagramTheme } = palette;
  // As far toward the background as faintColor (blendColor 0.6) takes the text.
  const quoteLink = `color-mix(in srgb, var(--text-accent) 40%, ${bgColor})`;
  return `/* @css */
      body {
        --wrot-bg-color: ${bgColor};
        ${highlightVars(highlightTheme, bgColor)}
        --wrot-bg-hover: ${hoverColor};
        --wrot-code-text: ${textColor};
        --wrot-code-bg: ${bgColor};
        --wrot-diagram-text: ${visibleDiagramColor(textColor, bgColor)};
        --wrot-code-l: ${codeLightness.base};
        --wrot-code-muted-l: ${codeLightness.muted};
        --wrot-code-faint-l: ${codeLightness.faint};
      }
      body .wrot-codeblock-display {
        ${diagramThemeVars(diagramTheme, bgColor)}
      }
      body .wrot-input-area,
      body .wrot-card,
      body div.block-language-wr,
      body .language-wr,
      body .wrot-ogp-card,
      body .wrot-codeblock-line {
        background: ${bgColor};
        background-color: ${bgColor};
      }
      body div.block-language-wr * {
        background: ${bgColor};
        background-color: ${bgColor};
      }
      body .wrot-flair-bg {
        background: ${bgColor};
        background-color: ${bgColor};
      }
      body div.block-language-wr .wrot-inline-code {
        background: rgba(0, 0, 0, 0.08);
      }
      body div.block-language-wr .wrot-highlight {
        background: var(--text-highlight-bg, var(--wrot-hl-yellow, color-mix(in oklch, var(--color-yellow) 30%, transparent)));
      }
      /* LV: code-block-flair doubles as the copy button; its hit area covers the memo tail, so keep it transparent */
      body .wrot-codeblock-line .code-block-flair {
        background: transparent;
        background-color: transparent;
      }
      body .wrot-ogp-card:hover {
        background: ${hoverColor};
        background-color: ${hoverColor};
      }
      /* Mobile: neutralize the sticky post-tap :hover; show the PC hover color only while :active */
      body.is-mobile .wrot-ogp-card:hover {
        background: ${bgColor};
        background-color: ${bgColor};
      }
      body.is-mobile .wrot-ogp-card:active {
        background: ${hoverColor};
        background-color: ${hoverColor};
      }
      /* Body textColor stamp. wrot-check-done is excluded so the later mutedColor rule wins:
         RV's pre structure never receives this rule, so LV must use the same color source */
      body .wrot-content,
      body .wrot-textarea,
      body .wrot-date-label,
      body .wrot-calendar-month-label,
      body .wrot-calendar-day:not(.wrot-calendar-day-selected):not(.wrot-calendar-day-today):not(.wrot-calendar-day-outside):not(.wrot-calendar-day-disabled),
      body .wrot-calendar-year:not(.wrot-calendar-day-selected):not(.wrot-calendar-day-today):not(.wrot-calendar-day-disabled),
      body .wrot-inline-code,
      body .wrot-plain-text,
      body div.block-language-wr *:not(.wrot-embed-missing):not(.wrot-internal-link-unresolved):not(.wrot-internal-link):not(.wrot-tag):not(.wrot-url):not(.wrot-reading-tag):not(.wrot-reading-url):not(.wrot-check-done):not(.wrot-quote-card-slot):not(.wrot-quote-card-slot *):not(.wrot-codeblock-display):not(.wrot-codeblock-display *),
      body .wrot-codeblock-line,
      body .wrot-codeblock-line *:not(.wrot-embed-missing):not(.wrot-internal-link-unresolved):not(.wrot-internal-link):not(.wrot-tag):not(.wrot-url):not(.wrot-tag-highlight):not(.wrot-internal-link-highlight):not(.wrot-url-highlight):not(.wrot-check-done):not(.wrot-quote-card-slot):not(.wrot-quote-card-slot *):not(.wrot-codeblock-display):not(.wrot-codeblock-display *):not(.token),
      body .cm-line.wrot-codeblock-line,
      body .cm-line.wrot-codeblock-line *:not(.wrot-embed-missing):not(.wrot-internal-link-unresolved):not(.wrot-internal-link):not(.wrot-tag):not(.wrot-url):not(.wrot-tag-highlight):not(.wrot-internal-link-highlight):not(.wrot-url-highlight):not(.wrot-check-done):not(.wrot-quote-card-slot):not(.wrot-quote-card-slot *):not(.wrot-codeblock-display):not(.wrot-codeblock-display *):not(.wrot-lp-marker):not(.token),
      body .wrot-reading-list li,
      body .wrot-bullet-list li,
      body .wrot-ordered-list li {
        color: ${textColor};
      }
      body .wrot-calendar-weekday,
      body .wrot-calendar-nav-btn {
        color: ${mutedColor};
      }
      body .wrot-calendar-day-outside {
        color: ${faintColor};
      }
      /* Out of range for this picker. Declared after the today rule so a day that is
         both today and out of reach reads as out of reach. */
      body .wrot-calendar-day-disabled,
      body .wrot-calendar-day-disabled.wrot-calendar-day-today,
      body .wrot-calendar-day-disabled.wrot-calendar-day-selected {
        color: ${faintColor};
        font-weight: inherit;
      }
      /* Restore Prism token colors inside nested code blocks */
      body .wrot-codeblock-display code[class*="language-"],
      body .wrot-codeblock-display pre[class*="language-"] {
        color: var(--code-normal);
      }
      body .wrot-codeblock-display .token.comment,
      body .wrot-codeblock-display .token.prolog,
      body .wrot-codeblock-display .token.doctype,
      body .wrot-codeblock-display .token.cdata { color: var(--code-comment); }
      body .wrot-codeblock-display .token.punctuation { color: var(--code-punctuation); }
      body .wrot-codeblock-display .token.property,
      body .wrot-codeblock-display .token.tag,
      body .wrot-codeblock-display .token.boolean,
      body .wrot-codeblock-display .token.number,
      body .wrot-codeblock-display .token.constant,
      body .wrot-codeblock-display .token.symbol,
      body .wrot-codeblock-display .token.deleted { color: var(--code-tag); }
      body .wrot-codeblock-display .token.selector,
      body .wrot-codeblock-display .token.attr-name,
      body .wrot-codeblock-display .token.string,
      body .wrot-codeblock-display .token.char,
      body .wrot-codeblock-display .token.builtin,
      body .wrot-codeblock-display .token.inserted { color: var(--code-string); }
      body .wrot-codeblock-display .token.operator,
      body .wrot-codeblock-display .token.entity,
      body .wrot-codeblock-display .token.url,
      body .wrot-codeblock-display .language-css .token.string,
      body .wrot-codeblock-display .style .token.string { color: var(--code-operator); }
      body .wrot-codeblock-display .token.atrule,
      body .wrot-codeblock-display .token.attr-value,
      body .wrot-codeblock-display .token.keyword { color: var(--code-keyword); }
      body .wrot-codeblock-display .token.function,
      body .wrot-codeblock-display .token.class-name { color: var(--code-function); }
      body .wrot-codeblock-display .token.regex,
      body .wrot-codeblock-display .token.important,
      body .wrot-codeblock-display .token.variable { color: var(--code-value); }
      body .wrot-nav-btn,
      body .wrot-today-btn,
      body .wrot-toolbar-btn,
      body .wrot-copy-btn,
      body .wrot-copy-btn .svg-icon,
      body .wrot-menu-btn,
      body .wrot-menu-btn .svg-icon,
      body .wrot-pin-indicator,
      body .wrot-pin-indicator .svg-icon,
      body .wrot-timestamp,
      body .wrot-submit-btn,
      body .wrot-empty,
      body .wrot-ogp-title,
      body .wrot-ogp-desc,
      body .wrot-ogp-site,
      body .wrot-flair-bg,
      body .wrot-codeblock-line .code-block-flair,
      body .cm-line.wrot-codeblock-line .wrot-lp-marker,
      body .cm-line.wrot-codeblock-line .wrot-list-highlight,
      body .cm-line.wrot-codeblock-line .wrot-check-unchecked,
      body .cm-line.wrot-codeblock-line .wrot-check-checked,
      body .cm-line.wrot-codeblock-line .wrot-ol-highlight,
      body .wrot-quote-card-slot .wrot-quote-card .wrot-quote-card-body,
      body .wrot-quote-card-slot .wrot-quote-card .wrot-quote-card-body *:not(.wrot-tag):not(.wrot-url):not(.wrot-internal-link):not(.wrot-nested-quote-marker):not(.wrot-quote-image-marker):not(.wrot-quote-math-marker):not(.wrot-quote-code-marker):not(.wrot-quote-image-marker *):not(.wrot-quote-math-marker *):not(.wrot-quote-code-marker *):not(.wrot-tag *):not(.wrot-url *):not(.wrot-internal-link *),
      body .wrot-quote-card-slot .wrot-quote-card .wrot-quote-card-meta,
      body .wrot-quote-card-slot .wrot-quote-card .wrot-quote-image-marker,
      body .wrot-quote-card-slot .wrot-quote-card .wrot-quote-math-marker,
      body .wrot-quote-card-slot .wrot-quote-card .wrot-quote-code-marker,
      body .wrot-quote-card-slot .wrot-quote-card .wrot-nested-quote-marker {
        color: ${mutedColor};
      }
      /* Block quotes (> lines) one step fainter than the other sub-colour text */
      body .cm-line.wrot-codeblock-line .wrot-quote-highlight,
      body .wrot-blockquote,
      body .wrot-blockquote *,
      body .cm-line.wrot-blockquote-line,
      body .cm-line.wrot-blockquote-line *,
      body .wrot-textarea .cm-line.wrot-cv-quote,
      body .wrot-textarea .cm-line.wrot-cv-quote * {
        color: ${faintColor};
      }
      body .wrot-quote-card-slot .wrot-quote-card {
        border-color: ${mutedColor};
      }
      body .wrot-quote-card-slot .wrot-quote-card .wrot-quote-card-body .wrot-blockquote {
        border-left-color: ${mutedColor};
      }
      body .wrot-ogp-card {
        border-color: ${mutedColor};
      }
      /* Re-declared at higher specificity so marker colors also reach LV widget DOM */
      body .cm-line .wrot-lp-marker:not(#x#y#z),
      body .cm-line .wrot-list-highlight:not(#x#y#z),
      body .cm-line .wrot-check-unchecked:not(#x#y#z),
      body .cm-line .wrot-check-checked:not(#x#y#z),
      body .cm-line .wrot-ol-highlight:not(#x#y#z),
      body .cm-line .wrot-ogp-title:not(#x#y#z),
      body .cm-line .wrot-ogp-desc:not(#x#y#z),
      body .cm-line .wrot-ogp-site:not(#x#y#z),
      body .cm-line .wrot-ogp-loading:not(#x#y#z) {
        color: ${mutedColor};
      }
      body .cm-line .wrot-quote-highlight:not(#x#y#z),
      body .cm-line.wrot-blockquote-line:not(#x#y#z),
      body .cm-line .wrot-blockquote-wrap:not(#x#y#z),
      body .cm-line .wrot-blockquote-wrap:not(#x#y#z) *:not(.wrot-tag-highlight):not(.wrot-internal-link-highlight):not(.wrot-url-highlight):not(.wrot-math-highlight):not(.wrot-tag):not(.wrot-internal-link):not(.wrot-url):not(.wrot-reading-tag):not(.wrot-reading-url) {
        color: ${faintColor};
      }
      /* Checkbox border uses the sub color; checked fill uses the theme accent */
      body .wrot-check-item input[type="checkbox"],
      body .wrot-bullet-list .wrot-check-item input[type="checkbox"],
      body .wrot-reading-list .wrot-check-item input[type="checkbox"],
      body .wrot-lp-check input[type="checkbox"] {
        --checkbox-border-color: ${mutedColor};
        --checkbox-border-color-hover: ${mutedColor};
        --checkbox-color: var(--text-accent);
        --checkbox-color-hover: var(--text-accent);
        accent-color: var(--text-accent);
      }
      body .wrot-textarea.wrot-composer-empty .cm-content::before {
        color: ${faintColor};
      }
      body .wrot-toolbar-btn.wrot-toolbar-active {
        color: var(--text-accent);
      }
      /* Menu-open 3-dot button: (0,3,1) beats the muted rule above (0,2,1);
         declared here rather than relying on the static CSS equivalent */
      body .wrot-menu-btn.wrot-toolbar-active .svg-icon {
        color: var(--text-accent);
        stroke: var(--text-accent);
      }
      body .cm-line.wrot-codeblock-line .wrot-tag-highlight,
      body .cm-line.wrot-codeblock-line .wrot-url-highlight,
      body .cm-line.wrot-codeblock-line .wrot-internal-link-highlight,
      body .cm-line.wrot-codeblock-line .wrot-math-highlight {
        color: var(--text-accent);
      }
      body .wrot-check-done {
        color: ${mutedColor};
      }
      body .wrot-blockquote-wrap {
        color: ${faintColor};
      }
      body .wrot-blockquote,
      body .wrot-blockquote-wrap {
        border-left-color: ${faintColor};
      }
      /* LV quote bars (::before, nested via box-shadow) use the same colour as RV's
         border-left so both views share one color source; tag-rule CSS (tier 4) still wins */
      body .cm-line.wrot-blockquote-line::before,
      body .wrot-textarea .cm-line.wrot-cv-quote::before {
        background-color: ${faintColor};
      }
      body .cm-line.wrot-blockquote-depth-2::before,
      body .wrot-textarea .cm-line.wrot-cv-quote-2::before {
        box-shadow: 18px 0 0 0 ${faintColor};
      }
      body .cm-line.wrot-blockquote-depth-3::before,
      body .wrot-textarea .cm-line.wrot-cv-quote-3::before {
        box-shadow:
          18px 0 0 0 ${faintColor},
          36px 0 0 0 ${faintColor};
      }
      body .cm-line.wrot-blockquote-depth-4::before,
      body .wrot-textarea .cm-line.wrot-cv-quote-4::before {
        box-shadow:
          18px 0 0 0 ${faintColor},
          36px 0 0 0 ${faintColor},
          54px 0 0 0 ${faintColor};
      }
      body .cm-line.wrot-blockquote-depth-5::before,
      body .wrot-textarea .cm-line.wrot-cv-quote-5::before {
        box-shadow:
          18px 0 0 0 ${faintColor},
          36px 0 0 0 ${faintColor},
          54px 0 0 0 ${faintColor},
          72px 0 0 0 ${faintColor};
      }
      body .wrot-bullet-list > li:not(.wrot-check-item)::before,
      body .wrot-ordered-list > li::before,
      body ul.wrot-reading-list > li:not(.wrot-check-item)::before,
      body ol.wrot-reading-list > li::before {
        color: ${mutedColor};
      }
      /* Lists inside block quotes take the quote's colour throughout: text, markers and
         checkbox borders (links and tags keep their own) */
      body .wrot-blockquote li,
      body .wrot-blockquote .wrot-check-done,
      body .wrot-blockquote .wrot-bullet-list > li:not(.wrot-check-item)::before,
      body .wrot-blockquote .wrot-ordered-list > li::before,
      body .wrot-blockquote ul.wrot-reading-list > li:not(.wrot-check-item)::before,
      body .wrot-blockquote ol.wrot-reading-list > li::before,
      body .cm-line.wrot-blockquote-line .wrot-lp-marker:not(#x#y#z) {
        color: ${faintColor};
      }
      body .wrot-textarea .cm-line.wrot-cv-quote .wrot-cv-bullet {
        background-color: ${faintColor};
      }
      body .wrot-blockquote .wrot-check-item input[type="checkbox"],
      body .cm-line.wrot-blockquote-line .wrot-lp-check input[type="checkbox"],
      body .wrot-textarea .cm-line.wrot-cv-quote .wrot-cv-check {
        --checkbox-border-color: ${faintColor};
        --checkbox-border-color-hover: ${faintColor};
      }
      body .wrot-tag,
      body .wrot-reading-tag,
      body .wrot-internal-link,
      body .wrot-url,
      body .wrot-reading-url,
      body div.block-language-wr a.wrot-internal-link,
      body div.block-language-wr .wrot-reading-tag,
      body div.block-language-wr .wrot-reading-url,
      body div.block-language-wr a,
      body .cm-line.wrot-codeblock-line .wrot-internal-link,
      body .cm-line.wrot-codeblock-line .wrot-url {
        color: var(--text-accent);
      }
      /* Links inside block quotes: the accent faded toward the background as far as quote text
         is (faintColor), so they still read as links without standing out of the quote */
      body .wrot-blockquote .wrot-internal-link:not(.wrot-internal-link-unresolved),
      body .wrot-blockquote .wrot-url,
      body .wrot-blockquote .wrot-reading-url,
      body div.block-language-wr .wrot-blockquote a.wrot-internal-link:not(.wrot-internal-link-unresolved),
      body .wrot-textarea .cm-line.wrot-cv-quote .wrot-cv-link {
        color: ${quoteLink};
      }
      /* LV: either nesting of link and quote marks, over the ID-level quote colour */
      body .cm-line.wrot-blockquote-line .wrot-internal-link-highlight:not(.wrot-internal-link-unresolved):not(#x#y#z),
      body .cm-line.wrot-blockquote-line .wrot-internal-link-highlight:not(.wrot-internal-link-unresolved) *:not(#x#y#z),
      body .cm-line.wrot-blockquote-line .wrot-internal-link:not(.wrot-internal-link-unresolved):not(#x#y#z),
      body .cm-line.wrot-blockquote-line .wrot-url-highlight:not(#x#y#z),
      body .cm-line.wrot-blockquote-line .wrot-url-highlight *:not(#x#y#z),
      body .cm-line.wrot-blockquote-line .wrot-url:not(#x#y#z) {
        color: ${quoteLink};
        -webkit-text-fill-color: ${quoteLink};
      }
      /* A missing embed points at something that is not there, same as an unresolved link,
         so both take the palette's faint colour. The tag-rule sheet groups them the same way;
         without the embed selectors here they would fall back to the theme's muted colour,
         which is unrelated to Wrot's own background. */
      body .cm-line.wrot-codeblock-line .wrot-internal-link.wrot-internal-link-unresolved,
      body div.block-language-wr a.wrot-internal-link.wrot-internal-link-unresolved,
      body .wrot-internal-link.wrot-internal-link-unresolved,
      body .cm-line.wrot-codeblock-line .wrot-embed-missing,
      body div.block-language-wr .wrot-embed-missing,
      body .wrot-embed-missing {
        color: ${unresolvedLinkColor};
      }
      body .wrot-submit-btn.wrot-submit-active {
        color: var(--text-on-accent);
      }
      body .wrot-copy-btn .svg-icon,
      body .wrot-menu-btn .svg-icon,
      body .wrot-pin-indicator .svg-icon {
        stroke: ${mutedColor};
      }
      body .wrot-menu {
        background: ${bgColor};
        background-color: ${bgColor};
        border-color: ${hoverColor};
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
      body .wrot-menu .menu-item {
        color: ${textColor};
        background-color: ${bgColor};
      }
      body .wrot-menu .menu-item .menu-item-icon .svg-icon {
        color: ${mutedColor};
        stroke: ${mutedColor};
      }
      /* The tick on a checked item says a state is live, so it keeps the accent instead
         of the muted colour every other icon in the menu carries. */
      body .wrot-menu .menu-item .menu-item-icon.mod-checked .svg-icon {
        color: var(--text-accent);
        stroke: var(--text-accent);
      }
      .is-mobile body .wrot-menu .menu-item:not(.is-label):not(.is-disabled):hover,
      .is-mobile body .wrot-menu .menu-item:not(.is-label):not(.is-disabled):active,
      body .wrot-menu .menu-item:not(.is-disabled):hover,
      body .wrot-menu .menu-item:not(.is-disabled).selected,
      body .wrot-menu .menu-item:not(.is-disabled).is-selected,
      body .wrot-menu .menu-item:not(.is-disabled):active {
        background-color: ${hoverColor};
      }
      /* The chosen day below the drums: it reads as a label, so it takes no hover
         fill like the rows above it — only the text answers the pointer. Declared
         here to land after the shared hover rule. */
      .is-mobile body .wrot-menu .menu-item.wrot-menu-schedule-confirm:hover,
      .is-mobile body .wrot-menu .menu-item.wrot-menu-schedule-confirm:active,
      body .wrot-menu .menu-item.wrot-menu-schedule-confirm:hover,
      body .wrot-menu .menu-item.wrot-menu-schedule-confirm.selected,
      body .wrot-menu .menu-item.wrot-menu-schedule-confirm.is-selected,
      body .wrot-menu .menu-item.wrot-menu-schedule-confirm:active {
        background-color: ${bgColor};
        color: ${mutedColor};
      }
      body .wrot-menu .menu-item.wrot-menu-schedule-confirm:hover .menu-item-icon .svg-icon {
        color: ${mutedColor};
        stroke: ${mutedColor};
      }
      body .wrot-menu .menu-separator {
        border-color: ${hoverColor};
        background: transparent;
        background-color: transparent;
      }
      body .wrot-menu .menu-item.is-disabled {
        color: ${faintColor};
      }
      body .wrot-thumbnail-remove {
        background: ${blendColor(textColor, bgColor, 0.7)};
        background-color: ${blendColor(textColor, bgColor, 0.7)};
        color: ${bgColor};
      }
      body .wrot-thumbnail-remove .svg-icon {
        color: ${bgColor};
        stroke: ${bgColor};
      }
      body .wrot-thumbnail-remove:hover {
        background: ${blendColor(textColor, bgColor, 0.5)};
        background-color: ${blendColor(textColor, bgColor, 0.5)};
      }
`;
}
