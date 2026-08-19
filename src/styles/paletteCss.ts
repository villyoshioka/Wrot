import { blendColor } from "../utils/color";

/** Colors resolved from the settings for the active theme mode. */
export interface WrPalette {
  bgColor: string;
  hoverColor: string;
  textColor: string;
  mutedColor: string;
  faintColor: string;
  unresolvedLinkColor: string;
}

/**
 * The base color stamp: card/input backgrounds, text, and every element that has to follow the
 * user's chosen palette. Sits at boost level 2 in the specificity ladder.
 */
export function buildPaletteCss(palette: WrPalette): string {
  const { bgColor, hoverColor, textColor, mutedColor, faintColor, unresolvedLinkColor } = palette;
  return `/* @css */
      body {
        --wr-bg-color: ${bgColor};
        --wr-bg-hover: ${hoverColor};
      }
      body .wr-input-area,
      body .wr-card,
      body div.block-language-wr,
      body .language-wr,
      body .wr-ogp-card,
      body .wr-codeblock-line {
        background: ${bgColor};
        background-color: ${bgColor};
      }
      body div.block-language-wr * {
        background: ${bgColor};
        background-color: ${bgColor};
      }
      body .wr-flair-bg {
        background: ${bgColor};
        background-color: ${bgColor};
      }
      body div.block-language-wr .wr-inline-code {
        background: rgba(0, 0, 0, 0.08);
      }
      body div.block-language-wr .wr-highlight {
        background: var(--text-highlight-bg);
      }
      /* LV: code-block-flair doubles as the copy button; its hit area covers the memo tail, so keep it transparent */
      body .wr-codeblock-line .code-block-flair {
        background: transparent;
        background-color: transparent;
      }
      body .wr-ogp-card:hover {
        background: ${hoverColor};
        background-color: ${hoverColor};
      }
      /* Mobile: neutralize the sticky post-tap :hover; show the PC hover color only while :active */
      body.is-mobile .wr-ogp-card:hover {
        background: ${bgColor};
        background-color: ${bgColor};
      }
      body.is-mobile .wr-ogp-card:active {
        background: ${hoverColor};
        background-color: ${hoverColor};
      }
      /* Body textColor stamp. wr-check-done is excluded so the later mutedColor rule wins:
         RV's pre structure never receives this rule, so LV must use the same color source */
      body .wr-content,
      body .wr-textarea,
      body .wr-date-label,
      body .wr-calendar-month-label,
      body .wr-calendar-day:not(.wr-calendar-day-selected):not(.wr-calendar-day-today):not(.wr-calendar-day-outside),
      body .wr-calendar-year:not(.wr-calendar-day-selected):not(.wr-calendar-day-today),
      body .wr-inline-code,
      body .wr-plain-text,
      body div.block-language-wr *:not(.wr-embed-missing):not(.wr-internal-link-unresolved):not(.wr-internal-link):not(.wr-tag):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url):not(.wr-check-done):not(.wr-quote-card-slot):not(.wr-quote-card-slot *):not(.wr-codeblock-display):not(.wr-codeblock-display *),
      body .wr-codeblock-line,
      body .wr-codeblock-line *:not(.wr-embed-missing):not(.wr-internal-link-unresolved):not(.wr-internal-link):not(.wr-tag):not(.wr-url):not(.wr-tag-highlight):not(.wr-internal-link-highlight):not(.wr-url-highlight):not(.wr-check-done):not(.wr-quote-card-slot):not(.wr-quote-card-slot *):not(.wr-codeblock-display):not(.wr-codeblock-display *),
      body .cm-line.wr-codeblock-line,
      body .cm-line.wr-codeblock-line *:not(.wr-embed-missing):not(.wr-internal-link-unresolved):not(.wr-internal-link):not(.wr-tag):not(.wr-url):not(.wr-tag-highlight):not(.wr-internal-link-highlight):not(.wr-url-highlight):not(.wr-check-done):not(.wr-quote-card-slot):not(.wr-quote-card-slot *):not(.wr-codeblock-display):not(.wr-codeblock-display *):not(.wr-lp-marker),
      body .wr-reading-list li,
      body .wr-bullet-list li,
      body .wr-ordered-list li {
        color: ${textColor};
      }
      body .wr-calendar-weekday,
      body .wr-calendar-nav-btn {
        color: ${mutedColor};
      }
      body .wr-calendar-day-outside {
        color: ${faintColor};
      }
      /* Restore Prism token colors inside nested code blocks */
      body .wr-codeblock-display code[class*="language-"],
      body .wr-codeblock-display pre[class*="language-"] {
        color: var(--code-normal);
      }
      body .wr-codeblock-display .token.comment,
      body .wr-codeblock-display .token.prolog,
      body .wr-codeblock-display .token.doctype,
      body .wr-codeblock-display .token.cdata { color: var(--code-comment); }
      body .wr-codeblock-display .token.punctuation { color: var(--code-punctuation); }
      body .wr-codeblock-display .token.property,
      body .wr-codeblock-display .token.tag,
      body .wr-codeblock-display .token.boolean,
      body .wr-codeblock-display .token.number,
      body .wr-codeblock-display .token.constant,
      body .wr-codeblock-display .token.symbol,
      body .wr-codeblock-display .token.deleted { color: var(--code-tag); }
      body .wr-codeblock-display .token.selector,
      body .wr-codeblock-display .token.attr-name,
      body .wr-codeblock-display .token.string,
      body .wr-codeblock-display .token.char,
      body .wr-codeblock-display .token.builtin,
      body .wr-codeblock-display .token.inserted { color: var(--code-string); }
      body .wr-codeblock-display .token.operator,
      body .wr-codeblock-display .token.entity,
      body .wr-codeblock-display .token.url,
      body .wr-codeblock-display .language-css .token.string,
      body .wr-codeblock-display .style .token.string { color: var(--code-operator); }
      body .wr-codeblock-display .token.atrule,
      body .wr-codeblock-display .token.attr-value,
      body .wr-codeblock-display .token.keyword { color: var(--code-keyword); }
      body .wr-codeblock-display .token.function,
      body .wr-codeblock-display .token.class-name { color: var(--code-function); }
      body .wr-codeblock-display .token.regex,
      body .wr-codeblock-display .token.important,
      body .wr-codeblock-display .token.variable { color: var(--code-value); }
      body .wr-nav-btn,
      body .wr-today-btn,
      body .wr-toolbar-btn,
      body .wr-copy-btn,
      body .wr-copy-btn .svg-icon,
      body .wr-menu-btn,
      body .wr-menu-btn .svg-icon,
      body .wr-pin-indicator,
      body .wr-pin-indicator .svg-icon,
      body .wr-timestamp,
      body .wr-submit-btn,
      body .wr-empty,
      body .wr-ogp-title,
      body .wr-ogp-desc,
      body .wr-ogp-site,
      body .wr-flair-bg,
      body .wr-codeblock-line .code-block-flair,
      body .cm-line.wr-codeblock-line .wr-lp-marker,
      body .cm-line.wr-codeblock-line .wr-list-highlight,
      body .cm-line.wr-codeblock-line .wr-check-unchecked,
      body .cm-line.wr-codeblock-line .wr-check-checked,
      body .cm-line.wr-codeblock-line .wr-ol-highlight,
      body .cm-line.wr-codeblock-line .wr-quote-highlight,
      body .wr-blockquote,
      body .wr-blockquote *,
      body .cm-line.wr-blockquote-line,
      body .cm-line.wr-blockquote-line *,
      body .wr-quote-card-slot .wr-quote-card .wr-quote-card-body,
      body .wr-quote-card-slot .wr-quote-card .wr-quote-card-body *:not(.wr-tag):not(.wr-url):not(.wr-internal-link):not(.wr-nested-quote-marker):not(.wr-quote-image-marker):not(.wr-quote-math-marker):not(.wr-quote-code-marker):not(.wr-quote-image-marker *):not(.wr-quote-math-marker *):not(.wr-quote-code-marker *):not(.wr-tag *):not(.wr-url *):not(.wr-internal-link *),
      body .wr-quote-card-slot .wr-quote-card .wr-quote-card-meta,
      body .wr-quote-card-slot .wr-quote-card .wr-quote-image-marker,
      body .wr-quote-card-slot .wr-quote-card .wr-quote-math-marker,
      body .wr-quote-card-slot .wr-quote-card .wr-quote-code-marker,
      body .wr-quote-card-slot .wr-quote-card .wr-nested-quote-marker {
        color: ${mutedColor};
      }
      body .wr-quote-card-slot .wr-quote-card {
        border-color: ${mutedColor};
      }
      body .wr-quote-card-slot .wr-quote-card .wr-quote-card-body .wr-blockquote {
        border-left-color: ${mutedColor};
      }
      body .wr-ogp-card {
        border-color: ${mutedColor};
      }
      /* Re-declared at higher specificity so marker colors also reach LV widget DOM */
      body .cm-line .wr-lp-marker:not(#x):not(#y):not(#z),
      body .cm-line .wr-list-highlight:not(#x):not(#y):not(#z),
      body .cm-line .wr-check-unchecked:not(#x):not(#y):not(#z),
      body .cm-line .wr-check-checked:not(#x):not(#y):not(#z),
      body .cm-line .wr-ol-highlight:not(#x):not(#y):not(#z),
      body .cm-line .wr-quote-highlight:not(#x):not(#y):not(#z),
      body .cm-line.wr-blockquote-line:not(#x):not(#y):not(#z),
      body .cm-line .wr-blockquote-wrap:not(#x):not(#y):not(#z),
      body .cm-line .wr-blockquote-wrap:not(#x):not(#y):not(#z) *:not(.wr-tag-highlight):not(.wr-internal-link-highlight):not(.wr-url-highlight):not(.wr-math-highlight):not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url),
      body .cm-line .wr-ogp-title:not(#x):not(#y):not(#z),
      body .cm-line .wr-ogp-desc:not(#x):not(#y):not(#z),
      body .cm-line .wr-ogp-site:not(#x):not(#y):not(#z),
      body .cm-line .wr-ogp-loading:not(#x):not(#y):not(#z) {
        color: ${mutedColor};
      }
      /* Checkbox border uses the sub color; checked fill uses the theme accent */
      body .wr-check-item input[type="checkbox"],
      body .wr-bullet-list .wr-check-item input[type="checkbox"],
      body .wr-reading-list .wr-check-item input[type="checkbox"],
      body .wr-lp-check input[type="checkbox"] {
        --checkbox-border-color: ${mutedColor};
        --checkbox-border-color-hover: ${mutedColor};
        --checkbox-color: var(--text-accent);
        --checkbox-color-hover: var(--text-accent);
        accent-color: var(--text-accent);
      }
      body .wr-textarea::placeholder {
        color: ${faintColor};
      }
      body .wr-toolbar-btn.wr-toolbar-active {
        color: var(--text-accent);
      }
      /* Menu-open 3-dot button: (0,3,1) beats the muted rule above (0,2,1);
         declared here rather than relying on the static CSS equivalent */
      body .wr-menu-btn.wr-toolbar-active .svg-icon {
        color: var(--text-accent);
        stroke: var(--text-accent);
      }
      body .cm-line.wr-codeblock-line .wr-tag-highlight,
      body .cm-line.wr-codeblock-line .wr-url-highlight,
      body .cm-line.wr-codeblock-line .wr-internal-link-highlight,
      body .cm-line.wr-codeblock-line .wr-math-highlight {
        color: var(--text-accent);
      }
      body .wr-blockquote-wrap,
      body .wr-check-done {
        color: ${mutedColor};
      }
      body .wr-blockquote,
      body .wr-blockquote-wrap {
        border-left-color: ${mutedColor};
      }
      /* LV quote bars (::before, nested via box-shadow) use the same mutedColor as RV's
         border-left so both views share one color source; tag-rule CSS (tier 4) still wins */
      body .cm-line.wr-blockquote-line::before {
        background-color: ${mutedColor};
      }
      body .cm-line.wr-blockquote-depth-2::before {
        box-shadow: 18px 0 0 0 ${mutedColor};
      }
      body .cm-line.wr-blockquote-depth-3::before {
        box-shadow:
          18px 0 0 0 ${mutedColor},
          36px 0 0 0 ${mutedColor};
      }
      body .cm-line.wr-blockquote-depth-4::before {
        box-shadow:
          18px 0 0 0 ${mutedColor},
          36px 0 0 0 ${mutedColor},
          54px 0 0 0 ${mutedColor};
      }
      body .cm-line.wr-blockquote-depth-5::before {
        box-shadow:
          18px 0 0 0 ${mutedColor},
          36px 0 0 0 ${mutedColor},
          54px 0 0 0 ${mutedColor},
          72px 0 0 0 ${mutedColor};
      }
      body .wr-bullet-list > li:not(.wr-check-item)::before,
      body .wr-ordered-list > li::before,
      body ul.wr-reading-list > li:not(.wr-check-item)::before,
      body ol.wr-reading-list > li::before {
        color: ${mutedColor};
      }
      body .wr-tag,
      body .wr-reading-tag,
      body .wr-internal-link,
      body .wr-url,
      body .wr-reading-url,
      body div.block-language-wr a.wr-internal-link,
      body div.block-language-wr .wr-reading-tag,
      body div.block-language-wr .wr-reading-url,
      body div.block-language-wr a,
      body .cm-line.wr-codeblock-line .wr-internal-link,
      body .cm-line.wr-codeblock-line .wr-url {
        color: var(--text-accent);
      }
      /* A missing embed points at something that is not there, same as an unresolved link,
         so both take the palette's faint colour. The tag-rule sheet groups them the same way;
         without the embed selectors here they would fall back to the theme's muted colour,
         which is unrelated to Wrot's own background. */
      body .cm-line.wr-codeblock-line .wr-internal-link.wr-internal-link-unresolved,
      body div.block-language-wr a.wr-internal-link.wr-internal-link-unresolved,
      body .wr-internal-link.wr-internal-link-unresolved,
      body .cm-line.wr-codeblock-line .wr-embed-missing,
      body div.block-language-wr .wr-embed-missing,
      body .wr-embed-missing {
        color: ${unresolvedLinkColor};
      }
      body .wr-submit-btn.wr-submit-active {
        color: var(--text-on-accent);
      }
      body .wr-copy-btn .svg-icon,
      body .wr-menu-btn .svg-icon,
      body .wr-pin-indicator .svg-icon {
        stroke: ${mutedColor};
      }
      body .wr-menu {
        background: ${bgColor};
        background-color: ${bgColor};
        border-color: ${hoverColor};
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
      body .wr-menu .menu-item {
        color: ${textColor};
        background-color: ${bgColor};
      }
      body .wr-menu .menu-item .menu-item-icon .svg-icon {
        color: ${mutedColor};
        stroke: ${mutedColor};
      }
      .is-mobile body .wr-menu .menu-item:not(.is-label):not(.is-disabled):hover,
      .is-mobile body .wr-menu .menu-item:not(.is-label):not(.is-disabled):active,
      body .wr-menu .menu-item:not(.is-disabled):hover,
      body .wr-menu .menu-item:not(.is-disabled).selected,
      body .wr-menu .menu-item:not(.is-disabled).is-selected,
      body .wr-menu .menu-item:not(.is-disabled):active {
        background-color: ${hoverColor};
      }
      body .wr-menu .menu-separator {
        border-color: ${hoverColor};
        background: transparent;
        background-color: transparent;
      }
      body .wr-menu .menu-item.is-disabled {
        color: ${faintColor};
      }
      body .wr-thumbnail-remove {
        background: ${blendColor(textColor, bgColor, 0.7)};
        background-color: ${blendColor(textColor, bgColor, 0.7)};
        color: ${bgColor};
      }
      body .wr-thumbnail-remove .svg-icon {
        color: ${bgColor};
        stroke: ${bgColor};
      }
      body .wr-thumbnail-remove:hover {
        background: ${blendColor(textColor, bgColor, 0.5)};
        background-color: ${blendColor(textColor, bgColor, 0.5)};
      }
`;
}
