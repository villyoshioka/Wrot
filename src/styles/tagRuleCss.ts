import type { SubColorScope, TagColorRule } from "../settings";
import type { DiagramTheme } from "../utils/color";
import { blendColor, codeLightness, darkenColor, visibleDiagramColor } from "../utils/color";
import { diagramThemeVars, highlightVars } from "./paletteCss";
import { HEX_COLOR_RE } from "../utils/patterns";

/**
 * Per-rule color overrides for memos carrying a configured tag.
 *
 * One block of rules per configured tag, keyed by the wrot-tag-rule-<n> class the renderers apply.
 * Sits at boost level 4 so it wins over the base palette stamp.
 */
export function buildTagRuleCss(rules: TagColorRule[], highlightTheme: Record<string, string>, diagramTheme: DiagramTheme | null): string {
    const hexRe = HEX_COLOR_RE;
    const parts: string[] = [];
    rules.forEach((rule, i) => {
      if (!hexRe.test(rule.bgColor) || !hexRe.test(rule.textColor)) return;
      const bg = rule.bgColor;
      const fg = rule.textColor;
      const accent = rule.accentColor && hexRe.test(rule.accentColor) ? rule.accentColor : null;
      const hoverBg = darkenColor(bg, 10);
      const autoMuted = blendColor(fg, bg, 0.45);
      const subSet = !!(rule.subColor && hexRe.test(rule.subColor));
      const userMuted = subSet ? (rule.subColor as string) : autoMuted;
      const scope = rule.subColorScope;
      const pickMuted = (key: keyof SubColorScope): string => {
        if (!subSet) return autoMuted;
        if (!scope) return userMuted;
        return scope[key] === false ? autoMuted : userMuted;
      };
      const mButtons = pickMuted("buttons");
      const mQuote = pickMuted("quote");
      // Block quotes: the rule's own sub colour where it covers quotes, else one step fainter.
      const mBlockquote = subSet && scope?.quote !== false ? userMuted : blendColor(fg, bg, 0.6);
      const mList = pickMuted("list");
      const mOgp = pickMuted("ogp");
      // Unresolved link/embed color: same blend logic as the base palette, from this rule's fg/bg.
      const mUnresolved = blendColor(fg, bg, 0.3);
      const quoteLink = `color-mix(in srgb, ${accent ?? "var(--text-accent)"} 40%, ${bg})`;
      const cls = `wrot-tag-rule-${i}`;
      const codeL = codeLightness(fg, bg);

      parts.push(`/* @css */
      body .wrot-card.${cls},
      body div.block-language-wr.${cls},
      body pre.${cls},
      body .cm-line.wrot-codeblock-line.${cls},
      body .wrot-lp-codeblock.${cls},
      body .wrot-lp-mathblock.${cls},
      body .wrot-flair-bg.${cls} {
        background: ${bg};
        background-color: ${bg};
      }
      /* Quote cards block the quoting memo's bg; the quoted memo's own rule paints them */
      body .wrot-card.${cls} .wrot-quote-card:not([class*="wrot-tag-rule-"]),
      body div.block-language-wr.${cls} .wrot-quote-card:not([class*="wrot-tag-rule-"]),
      body pre.${cls} .wrot-quote-card:not([class*="wrot-tag-rule-"]),
      body .cm-line.wrot-codeblock-line.${cls} .wrot-quote-card:not([class*="wrot-tag-rule-"]) {
        background: var(--wrot-bg-color, #f8f8f8);
        background-color: var(--wrot-bg-color, #f8f8f8);
      }
      body div.block-language-wr.${cls} *:not(.wrot-inline-code):not(.wrot-highlight):not(.wrot-quote-card-slot):not(.wrot-quote-card-slot *):not(input[type="checkbox"]),
      body pre.${cls} *:not(.wrot-inline-code):not(.wrot-highlight):not(.wrot-quote-card-slot):not(.wrot-quote-card-slot *):not(input[type="checkbox"]) {
        background: ${bg};
        background-color: ${bg};
      }

      body .wrot-card.${cls} .wrot-content,
      body .wrot-card.${cls} .wrot-content *:not(.wrot-tag):not(.wrot-internal-link):not(.wrot-url):not(.wrot-blockquote):not(.wrot-quote-card-slot):not(.wrot-tag *):not(.wrot-internal-link *):not(.wrot-url *):not(.wrot-blockquote *):not(.wrot-quote-card-slot *):not(.token) {
        color: ${fg};
      }
      body div.block-language-wr.${cls},
      body div.block-language-wr.${cls} *:not(.wrot-reading-tag):not(.wrot-internal-link):not(.wrot-url):not(.wrot-reading-url):not(.wrot-blockquote):not(.wrot-quote-card-slot):not(input[type="checkbox"]):not(.copy-code-button):not(.copy-code-button *):not(.wrot-reading-tag *):not(.wrot-internal-link *):not(.wrot-url *):not(.wrot-reading-url *):not(.wrot-blockquote *):not(.wrot-quote-card-slot *):not(.token),
      body pre.${cls},
      body pre.${cls} *:not(.wrot-reading-tag):not(.wrot-internal-link):not(.wrot-url):not(.wrot-reading-url):not(.wrot-blockquote):not(.wrot-quote-card-slot):not(input[type="checkbox"]):not(.copy-code-button):not(.copy-code-button *):not(.wrot-reading-tag *):not(.wrot-internal-link *):not(.wrot-url *):not(.wrot-reading-url *):not(.wrot-blockquote *):not(.wrot-quote-card-slot *):not(.token) {
        color: ${fg};
      }
      /* Code colors are worked out again from this rule's own text and background */
      body .wrot-card.${cls},
      body div.block-language-wr.${cls},
      body pre.${cls},
      body .wrot-lp-codeblock.${cls},
      body .cm-line.wrot-codeblock-line.${cls} {
        --wrot-code-text: ${fg};
        --wrot-code-bg: ${bg};
        --wrot-diagram-text: ${visibleDiagramColor(fg, bg)};
        --wrot-code-l: ${codeL.base};
        --wrot-code-muted-l: ${codeL.muted};
        --wrot-code-faint-l: ${codeL.faint};
        ${highlightVars(highlightTheme, bg)}
      }
      body .wrot-card.${cls} .wrot-codeblock-display,
      body div.block-language-wr.${cls} .wrot-codeblock-display,
      body pre.${cls} .wrot-codeblock-display,
      body .wrot-lp-codeblock.wrot-codeblock-display.${cls} {
        ${diagramThemeVars(diagramTheme, bg)}
      }
      body .cm-line.wrot-codeblock-line.${cls},
      body .cm-line.wrot-codeblock-line.${cls} *:not(.wrot-tag-highlight):not(.wrot-internal-link-highlight):not(.wrot-internal-link):not(.wrot-url-highlight):not(.wrot-lp-marker):not(.wrot-list-highlight):not(.wrot-ol-highlight):not(.wrot-quote-highlight):not(.wrot-blockquote-wrap):not(.wrot-check-unchecked):not(.wrot-check-checked):not(.wrot-check-done):not(.wrot-quote-card-slot):not(.wrot-embed-missing):not(input[type="checkbox"]):not(.wrot-tag-highlight *):not(.wrot-internal-link-highlight *):not(.wrot-url-highlight *):not(.wrot-blockquote-wrap *):not(.wrot-quote-card-slot *):not(.token) {
        color: ${fg};
      }

      body .wrot-card.${cls} .wrot-timestamp,
      body .wrot-card.${cls} .wrot-copy-btn,
      body .wrot-card.${cls} .wrot-copy-btn .svg-icon,
      body .wrot-card.${cls} .wrot-menu-btn,
      body .wrot-card.${cls} .wrot-menu-btn .svg-icon,
      body .wrot-card.${cls} .wrot-pin-indicator,
      body .wrot-card.${cls} .wrot-pin-indicator .svg-icon,
      body pre.${cls} .copy-code-button,
      body pre.${cls} .copy-code-button .svg-icon,
      body div.block-language-wr.${cls} .copy-code-button,
      body div.block-language-wr.${cls} .copy-code-button .svg-icon {
        color: ${mButtons};
      }
      body .wrot-card.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote),
      body .wrot-card.${cls} .wrot-blockquote-wrap:not(.wrot-quote-card-slot .wrot-blockquote-wrap),
      body .wrot-card.${cls} .wrot-quote-highlight,
      body div.block-language-wr.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote),
      body pre.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote),
      body .cm-line.wrot-codeblock-line.${cls}.wrot-blockquote-line,
      body .cm-line.wrot-codeblock-line.${cls} .wrot-blockquote-wrap {
        color: ${mBlockquote};
      }
      body .wrot-card.${cls} .wrot-bullet-list > li:not(.wrot-check-item)::before,
      body .wrot-card.${cls} .wrot-ordered-list > li::before,
      body .wrot-card.${cls} .wrot-check-done,
      body .wrot-card.${cls} .wrot-check-unchecked,
      body .wrot-card.${cls} .wrot-check-checked,
      body .wrot-card.${cls} .wrot-list-highlight,
      body .wrot-card.${cls} .wrot-ol-highlight,
      body div.block-language-wr.${cls} ul.wrot-reading-list > li:not(.wrot-check-item)::before,
      body div.block-language-wr.${cls} ol.wrot-reading-list > li::before,
      body pre.${cls} ul.wrot-reading-list > li:not(.wrot-check-item)::before,
      body pre.${cls} ol.wrot-reading-list > li::before,
      body .cm-line.wrot-codeblock-line.${cls} .wrot-list-highlight,
      body .cm-line.wrot-codeblock-line.${cls} .wrot-check-unchecked,
      body .cm-line.wrot-codeblock-line.${cls} .wrot-check-checked,
      body .cm-line.wrot-codeblock-line.${cls} .wrot-ol-highlight,
      body .cm-line.wrot-codeblock-line.${cls} .wrot-lp-marker {
        color: ${mList};
      }
      /* Re-declared at ID-equivalent specificity so tag-rule sub colors win in LV widget DOM.
         wrot-check-done excluded: static CSS muted wins in RV, so LV defers to static CSS too */
      body .cm-line.${cls} .wrot-lp-marker:not(#x#y#z),
      body .cm-line.${cls} .wrot-list-highlight:not(#x#y#z),
      body .cm-line.${cls} .wrot-check-unchecked:not(#x#y#z),
      body .cm-line.${cls} .wrot-check-checked:not(#x#y#z),
      body .cm-line.${cls} .wrot-ol-highlight:not(#x#y#z) {
        color: ${mList};
      }
      /* ID-equivalent specificity so quote text and bars take the rule's quote color in LV widget DOM */
      body .cm-line.${cls}.wrot-blockquote-line:not(#x#y#z),
      body .cm-line.${cls} .wrot-blockquote-wrap:not(#x#y#z),
      body .cm-line.${cls} .wrot-blockquote-wrap:not(#x#y#z) *,
      body .cm-line.${cls} .wrot-quote-highlight:not(#x#y#z) {
        color: ${mBlockquote};
      }
      /* Lists inside quotes take the rule's quote colour, markers and checkbox borders included
         (quotes inside quote cards belong to the quoted memo) */
      body .cm-line.${cls}.wrot-blockquote-line .wrot-lp-marker:not(#x#y#z),
      body .wrot-card.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) .wrot-bullet-list > li:not(.wrot-check-item)::before,
      body .wrot-card.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) .wrot-ordered-list > li::before,
      body div.block-language-wr.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) ul.wrot-reading-list > li:not(.wrot-check-item)::before,
      body div.block-language-wr.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) ol.wrot-reading-list > li::before,
      body pre.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) ul.wrot-reading-list > li:not(.wrot-check-item)::before,
      body pre.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) ol.wrot-reading-list > li::before {
        color: ${mBlockquote};
      }
      body .wrot-card.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) .wrot-check-item input[type="checkbox"],
      body div.block-language-wr.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) .wrot-check-item input[type="checkbox"],
      body pre.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) .wrot-check-item input[type="checkbox"],
      body .cm-line.wrot-codeblock-line.${cls}.wrot-blockquote-line .wrot-lp-check input[type="checkbox"] {
        --checkbox-border-color: ${mBlockquote};
        --checkbox-border-color-hover: ${mBlockquote};
      }
      /* Checkbox border uses the sub color; checked fill uses the rule accent */
      body .wrot-card.${cls} .wrot-check-item input[type="checkbox"],
      body div.block-language-wr.${cls} .wrot-check-item input[type="checkbox"],
      body pre.${cls} .wrot-check-item input[type="checkbox"],
      body .cm-line.wrot-codeblock-line.${cls} .wrot-lp-check input[type="checkbox"] {
        --checkbox-border-color: ${mList};
        --checkbox-border-color-hover: ${mList};
        --checkbox-color: ${accent ?? "var(--text-accent)"};
        --checkbox-color-hover: ${accent ?? "var(--text-accent)"};
        accent-color: ${accent ?? "var(--text-accent)"};
      }
      /* Blockquotes inside quote cards belong to the quoted memo, so they are
         excluded from the ancestor (quoting) rule's mBlockquote */
      body .wrot-card.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) *:not(.wrot-tag):not(.wrot-internal-link):not(.wrot-url):not(.wrot-reading-tag):not(.wrot-reading-url):not(.wrot-tag *):not(.wrot-internal-link *):not(.wrot-url *):not(.wrot-reading-tag *):not(.wrot-reading-url *),
      body div.block-language-wr.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) *:not(.wrot-tag):not(.wrot-internal-link):not(.wrot-url):not(.wrot-reading-tag):not(.wrot-reading-url):not(.wrot-tag *):not(.wrot-internal-link *):not(.wrot-url *):not(.wrot-reading-tag *):not(.wrot-reading-url *),
      body pre.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) *:not(.wrot-tag):not(.wrot-internal-link):not(.wrot-url):not(.wrot-reading-tag):not(.wrot-reading-url):not(.wrot-tag *):not(.wrot-internal-link *):not(.wrot-url *):not(.wrot-reading-tag *):not(.wrot-reading-url *) {
        color: ${mBlockquote};
      }
      /* ID-equivalent re-declaration in case the text-color stamp wins on specificity (quote-card content excluded) */
      body .wrot-card.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote):not(#x#y#z),
      body .wrot-card.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote):not(#x#y#z) *:not(.wrot-tag):not(.wrot-internal-link):not(.wrot-url):not(.wrot-reading-tag):not(.wrot-reading-url),
      body div.block-language-wr.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote):not(#x#y#z),
      body div.block-language-wr.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote):not(#x#y#z) *:not(.wrot-tag):not(.wrot-internal-link):not(.wrot-url):not(.wrot-reading-tag):not(.wrot-reading-url),
      body pre.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote):not(#x#y#z),
      body pre.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote):not(#x#y#z) *:not(.wrot-tag):not(.wrot-internal-link):not(.wrot-url):not(.wrot-reading-tag):not(.wrot-reading-url) {
        color: ${mBlockquote};
      }
      body .cm-line.wrot-codeblock-line.${cls} .wrot-tag-highlight .wrot-blockquote-wrap,
      body .cm-line.wrot-codeblock-line.${cls} .wrot-internal-link-highlight .wrot-blockquote-wrap,
      body .cm-line.wrot-codeblock-line.${cls} .wrot-url-highlight .wrot-blockquote-wrap,
      body .cm-line.wrot-codeblock-line.${cls} .wrot-math-highlight .wrot-blockquote-wrap,
      body .cm-line.wrot-codeblock-line.${cls} .wrot-internal-link .wrot-blockquote-wrap,
      body .cm-line.wrot-codeblock-line.${cls} .wrot-url .wrot-blockquote-wrap {
        color: ${accent ?? "var(--text-accent)"};
      }
      body .wrot-card.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) .wrot-tag,
      body .wrot-card.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) .wrot-reading-tag,
      body div.block-language-wr.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) .wrot-tag,
      body div.block-language-wr.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) .wrot-reading-tag,
      body pre.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) .wrot-tag,
      body pre.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) .wrot-reading-tag {
        color: ${accent ?? "var(--text-accent)"};
      }
      /* Links in quotes: the rule's accent faded toward its background, as in the base palette */
      body .wrot-card.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) .wrot-internal-link:not(.wrot-internal-link-unresolved),
      body .wrot-card.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) .wrot-url,
      body .wrot-card.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) .wrot-reading-url,
      body div.block-language-wr.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) .wrot-internal-link:not(.wrot-internal-link-unresolved),
      body div.block-language-wr.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) .wrot-url,
      body div.block-language-wr.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) .wrot-reading-url,
      body pre.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) .wrot-internal-link:not(.wrot-internal-link-unresolved),
      body pre.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) .wrot-url,
      body pre.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) .wrot-reading-url {
        color: ${quoteLink};
      }
      body .cm-line.${cls}.wrot-blockquote-line .wrot-internal-link-highlight:not(.wrot-internal-link-unresolved):not(#x#y#z),
      body .cm-line.${cls}.wrot-blockquote-line .wrot-internal-link-highlight:not(.wrot-internal-link-unresolved) *:not(#x#y#z),
      body .cm-line.${cls}.wrot-blockquote-line .wrot-internal-link:not(.wrot-internal-link-unresolved):not(#x#y#z),
      body .cm-line.${cls}.wrot-blockquote-line .wrot-url-highlight:not(#x#y#z),
      body .cm-line.${cls}.wrot-blockquote-line .wrot-url-highlight *:not(#x#y#z),
      body .cm-line.${cls}.wrot-blockquote-line .wrot-url:not(#x#y#z) {
        color: ${quoteLink};
        -webkit-text-fill-color: ${quoteLink};
      }
      /* Border color likewise; blockquotes inside quote cards excluded (card content = quoted memo) */
      body .wrot-card.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote),
      body .wrot-card.${cls} .wrot-blockquote-wrap:not(.wrot-quote-card-slot .wrot-blockquote-wrap),
      body div.block-language-wr.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote),
      body pre.${cls} .wrot-blockquote:not(.wrot-quote-card-slot .wrot-blockquote) {
        border-left-color: ${mBlockquote};
      }
      /* Border color follows the quoting side's look, so it is not overridden here */
      body .wrot-quote-card-slot .wrot-quote-card.${cls} {
        background: ${bg};
        background-color: ${bg};
      }
      body .wrot-quote-card-slot .wrot-quote-card.${cls}:hover {
        background: ${hoverBg};
        background-color: ${hoverBg};
      }
      /* When this rule class sits on the ancestor card, nested quote-card borders follow its sub color */
      body .wrot-card.${cls} .wrot-quote-card-slot .wrot-quote-card,
      body div.block-language-wr.${cls} .wrot-quote-card-slot .wrot-quote-card,
      body pre.${cls} .wrot-quote-card-slot .wrot-quote-card,
      body .cm-line.wrot-codeblock-line.${cls} .wrot-quote-card-slot .wrot-quote-card {
        border-color: ${mQuote};
      }
      body .wrot-quote-card-slot .wrot-quote-card.${cls} .wrot-quote-card-body,
      body .wrot-quote-card-slot .wrot-quote-card.${cls} .wrot-quote-card-body *:not(.wrot-tag):not(.wrot-internal-link):not(.wrot-url):not(.wrot-nested-quote-marker):not(.wrot-blockquote):not(.wrot-quote-image-marker):not(.wrot-quote-math-marker):not(.wrot-quote-code-marker):not(input[type="checkbox"]):not(.wrot-tag *):not(.wrot-internal-link *):not(.wrot-url *):not(.wrot-quote-image-marker *):not(.wrot-quote-math-marker *):not(.wrot-quote-code-marker *),
      body .wrot-quote-card-slot .wrot-quote-card.${cls} .wrot-quote-card-meta,
      body .wrot-quote-card-slot .wrot-quote-card.${cls} .wrot-quote-card-body .wrot-blockquote,
      body .wrot-quote-card-slot .wrot-quote-card.${cls} .wrot-quote-card-body .wrot-blockquote * {
        color: ${mQuote};
      }
      /* ID-equivalent re-declaration against the base quote-card mutedColor rule */
      body .wrot-quote-card-slot .wrot-quote-card.${cls}:not(#x#y#z) .wrot-quote-card-body .wrot-blockquote,
      body .wrot-quote-card-slot .wrot-quote-card.${cls}:not(#x#y#z) .wrot-quote-card-body .wrot-blockquote * {
        color: ${mQuote};
      }
      /* Markers mirror the base muted rule's :not() chain to avoid losing on specificity */
      body .wrot-quote-card-slot .wrot-quote-card.${cls} .wrot-quote-card-body .wrot-quote-image-marker:not(.wrot-tag):not(.wrot-url):not(.wrot-internal-link):not(.wrot-nested-quote-marker):not(.wrot-tag *):not(.wrot-url *):not(.wrot-internal-link *),
      body .wrot-quote-card-slot .wrot-quote-card.${cls} .wrot-quote-card-body .wrot-quote-math-marker:not(.wrot-tag):not(.wrot-url):not(.wrot-internal-link):not(.wrot-nested-quote-marker):not(.wrot-tag *):not(.wrot-url *):not(.wrot-internal-link *),
      body .wrot-quote-card-slot .wrot-quote-card.${cls} .wrot-quote-card-body .wrot-quote-code-marker:not(.wrot-tag):not(.wrot-url):not(.wrot-internal-link):not(.wrot-nested-quote-marker):not(.wrot-tag *):not(.wrot-url *):not(.wrot-internal-link *),
      body .wrot-quote-card-slot .wrot-quote-card.${cls} .wrot-quote-card-body .wrot-nested-quote-marker:not(.wrot-tag):not(.wrot-url):not(.wrot-internal-link):not(.wrot-quote-image-marker):not(.wrot-tag *):not(.wrot-url *):not(.wrot-internal-link *) {
        color: ${mQuote};
      }
      body .wrot-quote-card-slot .wrot-quote-card.${cls} .wrot-quote-card-body .wrot-blockquote {
        border-left-color: ${mQuote};
      }
      /* Quote-card checkboxes (custom spans) match the card body color */
      body .wrot-quote-card-slot .wrot-quote-card.${cls} .wrot-quote-card-check {
        border-color: ${mQuote};
      }
      body .wrot-quote-card-slot .wrot-quote-card.${cls} .wrot-quote-card-check-done {
        background-color: ${mQuote};
        border-color: ${mQuote};
      }
      body .wrot-quote-card-slot .wrot-quote-card.${cls} .wrot-quote-card-body .wrot-tag,
      body .wrot-quote-card-slot .wrot-quote-card.${cls} .wrot-quote-card-body .wrot-internal-link,
      body .wrot-quote-card-slot .wrot-quote-card.${cls} .wrot-quote-card-body .wrot-url {
        color: ${accent ?? "var(--text-accent)"};
      }
      body .cm-line.wrot-codeblock-line.wrot-blockquote-line.${cls}::before {
        background-color: ${mBlockquote};
      }
      body .cm-line.wrot-codeblock-line.wrot-blockquote-depth-2.${cls}::before {
        box-shadow: 18px 0 0 0 ${mBlockquote};
      }
      body .cm-line.wrot-codeblock-line.wrot-blockquote-depth-3.${cls}::before {
        box-shadow:
          18px 0 0 0 ${mBlockquote},
          36px 0 0 0 ${mBlockquote};
      }
      body .cm-line.wrot-codeblock-line.wrot-blockquote-depth-4.${cls}::before {
        box-shadow:
          18px 0 0 0 ${mBlockquote},
          36px 0 0 0 ${mBlockquote},
          54px 0 0 0 ${mBlockquote};
      }
      body .cm-line.wrot-codeblock-line.wrot-blockquote-depth-5.${cls}::before {
        box-shadow:
          18px 0 0 0 ${mBlockquote},
          36px 0 0 0 ${mBlockquote},
          54px 0 0 0 ${mBlockquote},
          72px 0 0 0 ${mBlockquote};
      }
      body .wrot-card.${cls} .wrot-copy-btn .svg-icon,
      body .wrot-card.${cls} .wrot-menu-btn .svg-icon,
      body .wrot-card.${cls} .wrot-pin-indicator .svg-icon {
        stroke: ${mButtons};
      }
      body .wrot-card.${cls} .wrot-copy-btn.wrot-copy-done .svg-icon {
        color: ${accent ?? "var(--text-accent)"};
        stroke: ${accent ?? "var(--text-accent)"};
      }
      /* Menu-open 3-dot button: the static CSS active rule (0,3,1) loses to the mButtons
         rule above (0,4,1), so override here even when no custom accent is set */
      body .wrot-card.${cls} .wrot-menu-btn.wrot-toolbar-active .svg-icon {
        color: ${accent ?? "var(--text-accent)"};
        stroke: ${accent ?? "var(--text-accent)"};
      }
      ${accent ? `
      body .wrot-card.${cls} .wrot-tag:not(.wrot-quote-card-slot *),
      body .wrot-card.${cls} .wrot-internal-link:not(.wrot-quote-card-slot *),
      body .wrot-card.${cls} .wrot-url:not(.wrot-quote-card-slot *),
      body div.block-language-wr.${cls} .wrot-reading-tag:not(.wrot-quote-card-slot *),
      body div.block-language-wr.${cls} .wrot-internal-link:not(.wrot-quote-card-slot *),
      body div.block-language-wr.${cls} .wrot-reading-url:not(.wrot-quote-card-slot *),
      body div.block-language-wr.${cls} a:not(.wrot-quote-card-slot):not(.wrot-quote-card-slot *),
      body pre.${cls} .wrot-reading-tag:not(.wrot-quote-card-slot *),
      body pre.${cls} .wrot-internal-link:not(.wrot-quote-card-slot *),
      body pre.${cls} .wrot-reading-url:not(.wrot-quote-card-slot *),
      body .cm-line.wrot-codeblock-line.${cls} .wrot-tag-highlight:not(.wrot-quote-card-slot *),
      body .cm-line.wrot-codeblock-line.${cls} .wrot-internal-link-highlight:not(.wrot-quote-card-slot *),
      body .cm-line.wrot-codeblock-line.${cls} .wrot-url-highlight:not(.wrot-quote-card-slot *),
      body .cm-line.wrot-codeblock-line.${cls} .wrot-math-highlight:not(.wrot-quote-card-slot *),
      body .cm-line.wrot-codeblock-line.${cls} .wrot-internal-link:not(.wrot-quote-card-slot *),
      body .cm-line.wrot-codeblock-line.${cls} .wrot-url:not(.wrot-quote-card-slot *) {
        color: ${accent};
      }
      ` : ""}

      body .wrot-card.${cls} .wrot-internal-link.wrot-internal-link-unresolved:not(.wrot-quote-card-slot *),
      body .wrot-card.${cls} .wrot-embed-missing:not(.wrot-quote-card-slot *),
      body div.block-language-wr.${cls} .wrot-internal-link.wrot-internal-link-unresolved:not(.wrot-quote-card-slot *),
      body div.block-language-wr.${cls} a.wrot-internal-link.wrot-internal-link-unresolved:not(.wrot-quote-card-slot *),
      body div.block-language-wr.${cls} .wrot-embed-missing:not(.wrot-quote-card-slot *),
      body pre.${cls} .wrot-internal-link.wrot-internal-link-unresolved:not(.wrot-quote-card-slot *),
      body pre.${cls} .wrot-embed-missing:not(.wrot-quote-card-slot *),
      body .cm-line.wrot-codeblock-line.${cls} .wrot-internal-link.wrot-internal-link-unresolved:not(.wrot-quote-card-slot *),
      body .cm-line.wrot-codeblock-line.${cls} .wrot-internal-link-highlight.wrot-internal-link-unresolved:not(.wrot-quote-card-slot *),
      body .cm-line.wrot-codeblock-line.${cls} .wrot-embed-missing:not(.wrot-quote-card-slot *) {
        color: ${mUnresolved};
      }

      body .wrot-card.${cls} .wrot-ogp-card,
      body div.block-language-wr.${cls} .wrot-ogp-card,
      body pre.${cls} .wrot-ogp-card,
      body .wrot-lp-media.${cls} .wrot-ogp-card {
        background: ${bg};
        background-color: ${bg};
        border-color: ${mOgp};
      }
      body .wrot-card.${cls} .wrot-ogp-card:hover,
      body div.block-language-wr.${cls} .wrot-ogp-card:hover,
      body pre.${cls} .wrot-ogp-card:hover,
      body .wrot-lp-media.${cls} .wrot-ogp-card:hover {
        background: ${hoverBg};
        background-color: ${hoverBg};
      }
      /* Mobile: neutralize the sticky post-tap :hover; hover color only while :active */
      body.is-mobile .wrot-card.${cls} .wrot-ogp-card:hover,
      body.is-mobile div.block-language-wr.${cls} .wrot-ogp-card:hover,
      body.is-mobile pre.${cls} .wrot-ogp-card:hover,
      body.is-mobile .wrot-lp-media.${cls} .wrot-ogp-card:hover {
        background: ${bg};
        background-color: ${bg};
      }
      body.is-mobile .wrot-card.${cls} .wrot-ogp-card:active,
      body.is-mobile div.block-language-wr.${cls} .wrot-ogp-card:active,
      body.is-mobile pre.${cls} .wrot-ogp-card:active,
      body.is-mobile .wrot-lp-media.${cls} .wrot-ogp-card:active {
        background: ${hoverBg};
        background-color: ${hoverBg};
      }
      body .wrot-card.${cls} .wrot-ogp-title,
      body .wrot-card.${cls} .wrot-ogp-desc,
      body .wrot-card.${cls} .wrot-ogp-site,
      body .wrot-card.${cls} .wrot-ogp-loading,
      body div.block-language-wr.${cls} .wrot-ogp-title,
      body div.block-language-wr.${cls} .wrot-ogp-desc,
      body div.block-language-wr.${cls} .wrot-ogp-site,
      body div.block-language-wr.${cls} .wrot-ogp-loading,
      body pre.${cls} .wrot-ogp-title,
      body pre.${cls} .wrot-ogp-desc,
      body pre.${cls} .wrot-ogp-site,
      body pre.${cls} .wrot-ogp-loading,
      body .wrot-lp-media.${cls} .wrot-ogp-title,
      body .wrot-lp-media.${cls} .wrot-ogp-desc,
      body .wrot-lp-media.${cls} .wrot-ogp-site,
      body .wrot-lp-media.${cls} .wrot-ogp-loading {
        color: ${mOgp};
      }
      /* ID-equivalent re-declaration in case the parent text-color stamp wins on specificity */
      body .wrot-card.${cls} .wrot-ogp-title:not(#x#y#z),
      body .wrot-card.${cls} .wrot-ogp-desc:not(#x#y#z),
      body .wrot-card.${cls} .wrot-ogp-site:not(#x#y#z),
      body .wrot-card.${cls} .wrot-ogp-loading:not(#x#y#z),
      body div.block-language-wr.${cls} .wrot-ogp-title:not(#x#y#z),
      body div.block-language-wr.${cls} .wrot-ogp-desc:not(#x#y#z),
      body div.block-language-wr.${cls} .wrot-ogp-site:not(#x#y#z),
      body div.block-language-wr.${cls} .wrot-ogp-loading:not(#x#y#z),
      body pre.${cls} .wrot-ogp-title:not(#x#y#z),
      body pre.${cls} .wrot-ogp-desc:not(#x#y#z),
      body pre.${cls} .wrot-ogp-site:not(#x#y#z),
      body pre.${cls} .wrot-ogp-loading:not(#x#y#z),
      body .wrot-lp-media.${cls} .wrot-ogp-title:not(#x#y#z),
      body .wrot-lp-media.${cls} .wrot-ogp-desc:not(#x#y#z),
      body .wrot-lp-media.${cls} .wrot-ogp-site:not(#x#y#z),
      body .wrot-lp-media.${cls} .wrot-ogp-loading:not(#x#y#z) {
        color: ${mOgp};
      }
      `);
    });

  return parts.join("");
}
