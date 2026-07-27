import type { SubColorScope, TagColorRule } from "../settings";
import { blendColor, darkenColor } from "../utils/color";
import { HEX_COLOR_RE } from "../utils/patterns";

/**
 * Per-rule color overrides for memos carrying a configured tag.
 *
 * One block of rules per configured tag, keyed by the wr-tag-rule-<n> class the renderers apply.
 * Sits at boost level 4 so it wins over the base palette stamp.
 */
export function buildTagRuleCss(rules: TagColorRule[]): string {
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
      const mList = pickMuted("list");
      const mOgp = pickMuted("ogp");
      // Unresolved link/embed color: same blend logic as the base palette, from this rule's fg/bg.
      const mUnresolved = blendColor(fg, bg, 0.3);
      const cls = `wr-tag-rule-${i}`;

      parts.push(`/* @css */
      body .wr-card.${cls},
      body div.block-language-wr.${cls},
      body pre.${cls},
      body .cm-line.wr-codeblock-line.${cls},
      body .wr-lp-codeblock.${cls},
      body .wr-lp-mathblock.${cls},
      body .wr-flair-bg.${cls} {
        background: ${bg};
        background-color: ${bg};
      }
      /* Quote cards block the quoting memo's bg; the quoted memo's own rule paints them */
      body .wr-card.${cls} .wr-quote-card:not([class*="wr-tag-rule-"]),
      body div.block-language-wr.${cls} .wr-quote-card:not([class*="wr-tag-rule-"]),
      body pre.${cls} .wr-quote-card:not([class*="wr-tag-rule-"]),
      body .cm-line.wr-codeblock-line.${cls} .wr-quote-card:not([class*="wr-tag-rule-"]) {
        background: var(--wr-bg-color, #f8f8f8);
        background-color: var(--wr-bg-color, #f8f8f8);
      }
      body div.block-language-wr.${cls} *:not(.wr-inline-code):not(.wr-highlight):not(.wr-quote-card-slot):not(.wr-quote-card-slot *):not(input[type="checkbox"]),
      body pre.${cls} *:not(.wr-inline-code):not(.wr-highlight):not(.wr-quote-card-slot):not(.wr-quote-card-slot *):not(input[type="checkbox"]) {
        background: ${bg};
        background-color: ${bg};
      }

      body .wr-card.${cls} .wr-content,
      body .wr-card.${cls} .wr-content *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-blockquote):not(.wr-quote-card-slot):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-blockquote *):not(.wr-quote-card-slot *) {
        color: ${fg};
      }
      body div.block-language-wr.${cls},
      body div.block-language-wr.${cls} *:not(.wr-reading-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-url):not(.wr-blockquote):not(.wr-quote-card-slot):not(input[type="checkbox"]):not(.copy-code-button):not(.copy-code-button *):not(.wr-reading-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-url *):not(.wr-blockquote *):not(.wr-quote-card-slot *),
      body pre.${cls},
      body pre.${cls} *:not(.wr-reading-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-url):not(.wr-blockquote):not(.wr-quote-card-slot):not(input[type="checkbox"]):not(.copy-code-button):not(.copy-code-button *):not(.wr-reading-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-url *):not(.wr-blockquote *):not(.wr-quote-card-slot *) {
        color: ${fg};
      }
      body .cm-line.wr-codeblock-line.${cls},
      body .cm-line.wr-codeblock-line.${cls} *:not(.wr-tag-highlight):not(.wr-internal-link-highlight):not(.wr-internal-link):not(.wr-url-highlight):not(.wr-lp-marker):not(.wr-list-highlight):not(.wr-ol-highlight):not(.wr-quote-highlight):not(.wr-blockquote-wrap):not(.wr-check-unchecked):not(.wr-check-checked):not(.wr-check-done):not(.wr-quote-card-slot):not(.wr-embed-missing):not(input[type="checkbox"]):not(.wr-tag-highlight *):not(.wr-internal-link-highlight *):not(.wr-url-highlight *):not(.wr-blockquote-wrap *):not(.wr-quote-card-slot *) {
        color: ${fg};
      }

      body .wr-card.${cls} .wr-timestamp,
      body .wr-card.${cls} .wr-copy-btn,
      body .wr-card.${cls} .wr-copy-btn .svg-icon,
      body .wr-card.${cls} .wr-menu-btn,
      body .wr-card.${cls} .wr-menu-btn .svg-icon,
      body .wr-card.${cls} .wr-pin-indicator,
      body .wr-card.${cls} .wr-pin-indicator .svg-icon,
      body pre.${cls} .copy-code-button,
      body pre.${cls} .copy-code-button .svg-icon,
      body div.block-language-wr.${cls} .copy-code-button,
      body div.block-language-wr.${cls} .copy-code-button .svg-icon {
        color: ${mButtons};
      }
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote),
      body .wr-card.${cls} .wr-blockquote-wrap:not(.wr-quote-card-slot .wr-blockquote-wrap),
      body .wr-card.${cls} .wr-quote-highlight,
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote),
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote),
      body .cm-line.wr-codeblock-line.${cls}.wr-blockquote-line,
      body .cm-line.wr-codeblock-line.${cls} .wr-blockquote-wrap {
        color: ${mQuote};
      }
      body .wr-card.${cls} .wr-bullet-list > li:not(.wr-check-item)::before,
      body .wr-card.${cls} .wr-ordered-list > li::before,
      body .wr-card.${cls} .wr-check-done,
      body .wr-card.${cls} .wr-check-unchecked,
      body .wr-card.${cls} .wr-check-checked,
      body .wr-card.${cls} .wr-list-highlight,
      body .wr-card.${cls} .wr-ol-highlight,
      body div.block-language-wr.${cls} ul.wr-reading-list > li:not(.wr-check-item)::before,
      body div.block-language-wr.${cls} ol.wr-reading-list > li::before,
      body pre.${cls} ul.wr-reading-list > li:not(.wr-check-item)::before,
      body pre.${cls} ol.wr-reading-list > li::before,
      body .cm-line.wr-codeblock-line.${cls} .wr-list-highlight,
      body .cm-line.wr-codeblock-line.${cls} .wr-check-unchecked,
      body .cm-line.wr-codeblock-line.${cls} .wr-check-checked,
      body .cm-line.wr-codeblock-line.${cls} .wr-ol-highlight,
      body .cm-line.wr-codeblock-line.${cls} .wr-lp-marker {
        color: ${mList};
      }
      /* Re-declared at ID-equivalent specificity so tag-rule sub colors win in LV widget DOM.
         wr-check-done excluded: static CSS muted wins in RV, so LV defers to static CSS too */
      body .cm-line.${cls} .wr-lp-marker:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-list-highlight:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-check-unchecked:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-check-checked:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-ol-highlight:not(#x):not(#y):not(#z) {
        color: ${mList};
      }
      /* ID-equivalent specificity so quote text and bars take the rule's quote color in LV widget DOM */
      body .cm-line.${cls}.wr-blockquote-line:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-blockquote-wrap:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-blockquote-wrap:not(#x):not(#y):not(#z) *,
      body .cm-line.${cls} .wr-quote-highlight:not(#x):not(#y):not(#z) {
        color: ${mQuote};
      }
      /* Checkbox border uses the sub color; checked fill uses the rule accent */
      body .wr-card.${cls} .wr-check-item input[type="checkbox"],
      body div.block-language-wr.${cls} .wr-check-item input[type="checkbox"],
      body pre.${cls} .wr-check-item input[type="checkbox"],
      body .cm-line.wr-codeblock-line.${cls} .wr-lp-check input[type="checkbox"] {
        --checkbox-border-color: ${mList};
        --checkbox-border-color-hover: ${mList};
        --checkbox-color: ${accent ?? "var(--text-accent)"};
        --checkbox-color-hover: ${accent ?? "var(--text-accent)"};
        accent-color: ${accent ?? "var(--text-accent)"};
      }
      /* Blockquotes inside quote cards belong to the quoted memo, so they are
         excluded from the ancestor (quoting) rule's mQuote */
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-tag *):not(.wr-reading-url *),
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-tag *):not(.wr-reading-url *),
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-tag *):not(.wr-reading-url *) {
        color: ${mQuote};
      }
      /* ID-equivalent re-declaration in case the text-color stamp wins on specificity (quote-card content excluded) */
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote):not(#x):not(#y):not(#z),
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote):not(#x):not(#y):not(#z) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url),
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote):not(#x):not(#y):not(#z),
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote):not(#x):not(#y):not(#z) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url),
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote):not(#x):not(#y):not(#z),
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote):not(#x):not(#y):not(#z) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url) {
        color: ${mQuote};
      }
      body .cm-line.wr-codeblock-line.${cls} .wr-tag-highlight .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-internal-link-highlight .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-url-highlight .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-math-highlight .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-internal-link .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-url .wr-blockquote-wrap {
        color: ${accent ?? "var(--text-accent)"};
      }
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-tag,
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-internal-link,
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-url,
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-reading-tag,
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-reading-url,
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-tag,
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-internal-link,
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-url,
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-reading-tag,
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-reading-url,
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-tag,
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-internal-link,
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-url,
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-reading-tag,
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-reading-url {
        color: ${accent ?? "var(--text-accent)"};
      }
      /* Border color likewise; blockquotes inside quote cards excluded (card content = quoted memo) */
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote),
      body .wr-card.${cls} .wr-blockquote-wrap:not(.wr-quote-card-slot .wr-blockquote-wrap),
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote),
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) {
        border-left-color: ${mQuote};
      }
      /* Border color follows the quoting side's look, so it is not overridden here */
      body .wr-quote-card-slot .wr-quote-card.${cls} {
        background: ${bg};
        background-color: ${bg};
      }
      body .wr-quote-card-slot .wr-quote-card.${cls}:hover {
        background: ${hoverBg};
        background-color: ${hoverBg};
      }
      /* When this rule class sits on the ancestor card, nested quote-card borders follow its sub color */
      body .wr-card.${cls} .wr-quote-card-slot .wr-quote-card,
      body div.block-language-wr.${cls} .wr-quote-card-slot .wr-quote-card,
      body pre.${cls} .wr-quote-card-slot .wr-quote-card,
      body .cm-line.wr-codeblock-line.${cls} .wr-quote-card-slot .wr-quote-card {
        border-color: ${mQuote};
      }
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body,
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-nested-quote-marker):not(.wr-blockquote):not(.wr-quote-image-marker):not(.wr-quote-math-marker):not(.wr-quote-code-marker):not(input[type="checkbox"]):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-quote-image-marker *):not(.wr-quote-math-marker *):not(.wr-quote-code-marker *),
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-meta,
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-blockquote,
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-blockquote * {
        color: ${mQuote};
      }
      /* ID-equivalent re-declaration against the base quote-card mutedColor rule */
      body .wr-quote-card-slot .wr-quote-card.${cls}:not(#x):not(#y):not(#z) .wr-quote-card-body .wr-blockquote,
      body .wr-quote-card-slot .wr-quote-card.${cls}:not(#x):not(#y):not(#z) .wr-quote-card-body .wr-blockquote * {
        color: ${mQuote};
      }
      /* Markers mirror the base muted rule's :not() chain to avoid losing on specificity */
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-quote-image-marker:not(.wr-tag):not(.wr-url):not(.wr-internal-link):not(.wr-nested-quote-marker):not(.wr-tag *):not(.wr-url *):not(.wr-internal-link *),
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-quote-math-marker:not(.wr-tag):not(.wr-url):not(.wr-internal-link):not(.wr-nested-quote-marker):not(.wr-tag *):not(.wr-url *):not(.wr-internal-link *),
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-quote-code-marker:not(.wr-tag):not(.wr-url):not(.wr-internal-link):not(.wr-nested-quote-marker):not(.wr-tag *):not(.wr-url *):not(.wr-internal-link *),
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-nested-quote-marker:not(.wr-tag):not(.wr-url):not(.wr-internal-link):not(.wr-quote-image-marker):not(.wr-tag *):not(.wr-url *):not(.wr-internal-link *) {
        color: ${mQuote};
      }
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-blockquote {
        border-left-color: ${mQuote};
      }
      /* Quote-card checkboxes (custom spans) match the card body color */
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-check {
        border-color: ${mQuote};
      }
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-check-done {
        background-color: ${mQuote};
        border-color: ${mQuote};
      }
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-tag,
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-internal-link,
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-url {
        color: ${accent ?? "var(--text-accent)"};
      }
      body .cm-line.wr-codeblock-line.wr-blockquote-line.${cls}::before {
        background-color: ${mQuote};
      }
      body .cm-line.wr-codeblock-line.wr-blockquote-depth-2.${cls}::before {
        box-shadow: 18px 0 0 0 ${mQuote};
      }
      body .cm-line.wr-codeblock-line.wr-blockquote-depth-3.${cls}::before {
        box-shadow:
          18px 0 0 0 ${mQuote},
          36px 0 0 0 ${mQuote};
      }
      body .cm-line.wr-codeblock-line.wr-blockquote-depth-4.${cls}::before {
        box-shadow:
          18px 0 0 0 ${mQuote},
          36px 0 0 0 ${mQuote},
          54px 0 0 0 ${mQuote};
      }
      body .cm-line.wr-codeblock-line.wr-blockquote-depth-5.${cls}::before {
        box-shadow:
          18px 0 0 0 ${mQuote},
          36px 0 0 0 ${mQuote},
          54px 0 0 0 ${mQuote},
          72px 0 0 0 ${mQuote};
      }
      body .wr-card.${cls} .wr-copy-btn .svg-icon,
      body .wr-card.${cls} .wr-menu-btn .svg-icon,
      body .wr-card.${cls} .wr-pin-indicator .svg-icon {
        stroke: ${mButtons};
      }
      body .wr-card.${cls} .wr-copy-btn.wr-copy-done .svg-icon {
        color: ${accent ?? "var(--text-accent)"};
        stroke: ${accent ?? "var(--text-accent)"};
      }
      /* Menu-open 3-dot button: the static CSS active rule (0,3,1) loses to the mButtons
         rule above (0,4,1), so override here even when no custom accent is set */
      body .wr-card.${cls} .wr-menu-btn.wr-toolbar-active .svg-icon {
        color: ${accent ?? "var(--text-accent)"};
        stroke: ${accent ?? "var(--text-accent)"};
      }
      ${accent ? `
      body .wr-card.${cls} .wr-tag:not(.wr-quote-card-slot *),
      body .wr-card.${cls} .wr-internal-link:not(.wr-quote-card-slot *),
      body .wr-card.${cls} .wr-url:not(.wr-quote-card-slot *),
      body div.block-language-wr.${cls} .wr-reading-tag:not(.wr-quote-card-slot *),
      body div.block-language-wr.${cls} .wr-internal-link:not(.wr-quote-card-slot *),
      body div.block-language-wr.${cls} .wr-reading-url:not(.wr-quote-card-slot *),
      body div.block-language-wr.${cls} a:not(.wr-quote-card-slot):not(.wr-quote-card-slot *),
      body pre.${cls} .wr-reading-tag:not(.wr-quote-card-slot *),
      body pre.${cls} .wr-internal-link:not(.wr-quote-card-slot *),
      body pre.${cls} .wr-reading-url:not(.wr-quote-card-slot *),
      body .cm-line.wr-codeblock-line.${cls} .wr-tag-highlight:not(.wr-quote-card-slot *),
      body .cm-line.wr-codeblock-line.${cls} .wr-internal-link-highlight:not(.wr-quote-card-slot *),
      body .cm-line.wr-codeblock-line.${cls} .wr-url-highlight:not(.wr-quote-card-slot *),
      body .cm-line.wr-codeblock-line.${cls} .wr-math-highlight:not(.wr-quote-card-slot *),
      body .cm-line.wr-codeblock-line.${cls} .wr-internal-link:not(.wr-quote-card-slot *),
      body .cm-line.wr-codeblock-line.${cls} .wr-url:not(.wr-quote-card-slot *) {
        color: ${accent};
      }
      ` : ""}

      body .wr-card.${cls} .wr-internal-link.wr-internal-link-unresolved:not(.wr-quote-card-slot *),
      body .wr-card.${cls} .wr-embed-missing:not(.wr-quote-card-slot *),
      body div.block-language-wr.${cls} .wr-internal-link.wr-internal-link-unresolved:not(.wr-quote-card-slot *),
      body div.block-language-wr.${cls} a.wr-internal-link.wr-internal-link-unresolved:not(.wr-quote-card-slot *),
      body div.block-language-wr.${cls} .wr-embed-missing:not(.wr-quote-card-slot *),
      body pre.${cls} .wr-internal-link.wr-internal-link-unresolved:not(.wr-quote-card-slot *),
      body pre.${cls} .wr-embed-missing:not(.wr-quote-card-slot *),
      body .cm-line.wr-codeblock-line.${cls} .wr-internal-link.wr-internal-link-unresolved:not(.wr-quote-card-slot *),
      body .cm-line.wr-codeblock-line.${cls} .wr-internal-link-highlight.wr-internal-link-unresolved:not(.wr-quote-card-slot *),
      body .cm-line.wr-codeblock-line.${cls} .wr-embed-missing:not(.wr-quote-card-slot *) {
        color: ${mUnresolved};
      }

      body .wr-card.${cls} .wr-ogp-card,
      body div.block-language-wr.${cls} .wr-ogp-card,
      body pre.${cls} .wr-ogp-card,
      body .wr-lp-media.${cls} .wr-ogp-card {
        background: ${bg};
        background-color: ${bg};
        border-color: ${mOgp};
      }
      body .wr-card.${cls} .wr-ogp-card:hover,
      body div.block-language-wr.${cls} .wr-ogp-card:hover,
      body pre.${cls} .wr-ogp-card:hover,
      body .wr-lp-media.${cls} .wr-ogp-card:hover {
        background: ${hoverBg};
        background-color: ${hoverBg};
      }
      /* Mobile: neutralize the sticky post-tap :hover; hover color only while :active */
      body.is-mobile .wr-card.${cls} .wr-ogp-card:hover,
      body.is-mobile div.block-language-wr.${cls} .wr-ogp-card:hover,
      body.is-mobile pre.${cls} .wr-ogp-card:hover,
      body.is-mobile .wr-lp-media.${cls} .wr-ogp-card:hover {
        background: ${bg};
        background-color: ${bg};
      }
      body.is-mobile .wr-card.${cls} .wr-ogp-card:active,
      body.is-mobile div.block-language-wr.${cls} .wr-ogp-card:active,
      body.is-mobile pre.${cls} .wr-ogp-card:active,
      body.is-mobile .wr-lp-media.${cls} .wr-ogp-card:active {
        background: ${hoverBg};
        background-color: ${hoverBg};
      }
      body .wr-card.${cls} .wr-ogp-title,
      body .wr-card.${cls} .wr-ogp-desc,
      body .wr-card.${cls} .wr-ogp-site,
      body .wr-card.${cls} .wr-ogp-loading,
      body div.block-language-wr.${cls} .wr-ogp-title,
      body div.block-language-wr.${cls} .wr-ogp-desc,
      body div.block-language-wr.${cls} .wr-ogp-site,
      body div.block-language-wr.${cls} .wr-ogp-loading,
      body pre.${cls} .wr-ogp-title,
      body pre.${cls} .wr-ogp-desc,
      body pre.${cls} .wr-ogp-site,
      body pre.${cls} .wr-ogp-loading,
      body .wr-lp-media.${cls} .wr-ogp-title,
      body .wr-lp-media.${cls} .wr-ogp-desc,
      body .wr-lp-media.${cls} .wr-ogp-site,
      body .wr-lp-media.${cls} .wr-ogp-loading {
        color: ${mOgp};
      }
      /* ID-equivalent re-declaration in case the parent text-color stamp wins on specificity */
      body .wr-card.${cls} .wr-ogp-title:not(#x):not(#y):not(#z),
      body .wr-card.${cls} .wr-ogp-desc:not(#x):not(#y):not(#z),
      body .wr-card.${cls} .wr-ogp-site:not(#x):not(#y):not(#z),
      body .wr-card.${cls} .wr-ogp-loading:not(#x):not(#y):not(#z),
      body div.block-language-wr.${cls} .wr-ogp-title:not(#x):not(#y):not(#z),
      body div.block-language-wr.${cls} .wr-ogp-desc:not(#x):not(#y):not(#z),
      body div.block-language-wr.${cls} .wr-ogp-site:not(#x):not(#y):not(#z),
      body div.block-language-wr.${cls} .wr-ogp-loading:not(#x):not(#y):not(#z),
      body pre.${cls} .wr-ogp-title:not(#x):not(#y):not(#z),
      body pre.${cls} .wr-ogp-desc:not(#x):not(#y):not(#z),
      body pre.${cls} .wr-ogp-site:not(#x):not(#y):not(#z),
      body pre.${cls} .wr-ogp-loading:not(#x):not(#y):not(#z),
      body .wr-lp-media.${cls} .wr-ogp-title:not(#x):not(#y):not(#z),
      body .wr-lp-media.${cls} .wr-ogp-desc:not(#x):not(#y):not(#z),
      body .wr-lp-media.${cls} .wr-ogp-site:not(#x):not(#y):not(#z),
      body .wr-lp-media.${cls} .wr-ogp-loading:not(#x):not(#y):not(#z) {
        color: ${mOgp};
      }
      `);
    });

  return parts.join("");
}
