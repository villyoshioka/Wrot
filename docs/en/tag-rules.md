# Using Tag Rules

In Wrot, you can automatically change the colors of memos based on their tags.
By styling your tags—like a calm color for `#diary` or a vibrant color for `#work`—you can sort your timeline at a glance.
This page explains how to create tag rules and where each color is applied.

---

## Turn the Feature On

Turn on **"Change Color by Tag"** in Settings to start using rules. You'll find it under the **Appearance** section.

- Once enabled, one rule is prepared and opened ready to edit.
- When disabled, memos return to your standard theme colors (your rule settings are kept).

---

## Creating a Rule

Each rule pairs **which tag** with **which colors**.

### Tag

Enter the name of the tag you want to color. You can include the `#` or leave it out.

- Example: Entering `diary` targets memos tagged with `#diary`.

### Background & Text Color

Choose the **Background color** for the whole memo card and the **Text color** for the body.
These two are the core colors of a rule and are always set.

---

## Fine-Tuning the Colors (Optional)

You can color-code with just the background and text colors, but two more colors are available when you want finer control.
Both can be left unset—in that case a suitable color is chosen automatically.

### Accent Color

The color used for tags, links, URLs, and similar elements.

- When unset, it uses Obsidian's default theme accent color.
- When set, tags and links appear in that color.
- Use the **Reset to Defaults** button to return to the unset state.

### Sub Color

The color used for smaller parts around the body, such as timestamps, lists, and quotes.

- When unset, an intermediate color is generated automatically from the background and text colors.
- When set, it applies to the parts chosen in the "Scope" described below.
- Use the **Reset to Defaults** button to return to the unset state.

### Sub Color Scope

When you set a Sub Color, options appear for choosing **which parts** it applies to.
Parts you uncheck return to the automatic color instead of the Sub Color.

| Toggle                                          | Affected Parts                      |
| ----------------------------------------------- | ----------------------------------- |
| Apply Sub Color to Timestamp, Menu, and Pins    | Timestamps, menus, and pins         |
| Apply Sub Color to Blockquotes                  | Blockquotes                         |
| Apply Sub Color to Lists and Checkboxes         | Lists and checkboxes                |
| Apply Sub Color to OGP Cards                    | OGP / Twitter cards in URL previews |

---

## Lock to Prevent Accidental Edits

Each rule heading has a **lock icon**.

- Rules are normally **locked**, so the color and tag fields can't be touched.
- Click the lock icon to **unlock** a rule for editing.
- This prevents you from accidentally overwriting settings you've already arranged.

### The Lock State Is Not Saved

- The locked / unlocked state only affects the current view.
- **When you close and reopen Settings, all rules return to locked.**
- Your color and tag values themselves are always saved, so you can close Settings without worry.

---

## Using Multiple Rules

Click **"Add Rule"** to add more rules.

- When you add a new rule, the existing rules are automatically locked, and only the new rule is left ready to edit.
- Rules are listed from top to bottom.

### Which Rule Is Applied

A single memo may carry tags that match more than one rule.
In that case, the rule for **the tag that appears first in the memo body** takes priority.

- Example: If the body has `#work #urgent` in that order and both have rules, the `#work` rule is used.
- Only one rule is applied. The first match wins, and the rest are ignored.

---

## Where Do the Colors Appear?

Tag rule colors appear everywhere a memo is shown.

- **Timeline** — Wrot's list view.
- **Live Preview** — While editing a note directly.
- **Reading View** — When viewing a note in reading mode.

A given memo shows the same colors in every view.

---

## Troubleshooting

### The colors don't change

- Check that "Change Color by Tag" is turned on.
- Check that the rule's tag name matches the tag on your memo.
- Check whether the memo also carries another rule's tag (the tag that appears first takes priority).

### I can't edit a rule

- Click the rule's lock icon to unlock it.
- Right after reopening Settings, all rules are locked.

### The Sub Color I set isn't applied

- Make sure the Sub Color is set, and that the part you want is checked under "Scope."
- Unchecked parts use the automatic color instead of the Sub Color.
