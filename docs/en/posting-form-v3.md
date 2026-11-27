# Changes to the Post Form in v3.0.0 and Later

Starting with v3.0.0, the post form hides Markdown syntax, so bold text, lists, checkboxes, and the like look finished as you type. Writing feels like posting to social media.

For the toolbar buttons, see the [Formatting Guide](./formatting-guide.md).

> **What gets saved to your notes hasn't changed**
>
> Syntax is hidden only in the form. Notes are still saved as Markdown, so past posts, the timeline, and how your notes look in Obsidian are not affected.

---

## 1. What Gets Formatted and What Shows as Typed

| Element                                      | How it looks in the form                                        |
| :------------------------------------------- | :-------------------------------------------------------------- |
| **Bold, italic, strikethrough, highlight**   | The markers are hidden and the text is shown styled             |
| **Inline code**                              | The backticks are hidden and the text is shown in code style    |
| **Inline math** (`$…$`)                      | The dollar signs are hidden and the formula is shown rendered   |
| **Links**                                    | The brackets and URL are hidden; only the text is shown, in the accent color |
| **Tags**                                     | Shown in the accent color once you finish typing them           |
| **Lists, checklists, numbered lists**        | The markers are hidden and bullets, checkboxes, or numbers are shown |
| **Quotes**                                   | Shown with a quote line on the left instead of `>`              |
| **Code blocks and math blocks**              | Shown exactly as typed, markers included                        |
| **Manually typed image embeds** (`![[Image.png]]`) | Shown exactly as typed, markers included                  |
| **Bare URLs**                                | Shown as typed, in the accent color                             |

Note: You can click (or tap) a checkbox in the form to check or uncheck it.

---

## 2. Typing Markdown Syntax by Hand

When you type syntax like `**bold**` by hand, the markers stay visible until you press `Enter` on that line.

- **Press `Enter` once**: The text is styled and the markers are hidden, without a line break.
- **Press `Enter` twice**: Starts a new line.
- **`Shift + Enter`**: Starts a new line and leaves the markers visible.

Note: When you restore a draft or open a past post for editing, the markers are already hidden when it opens.

### Auto-closing Brackets and Quotes

When you type `(`, `[`, `{`, `"`, or `'`, the closing half is added for you and the cursor is placed between them.

- If you type the closing half yourself, it isn't doubled; the cursor moves past the one that's already there.
- If you type one with text selected, the selected text is wrapped in it.
- Pressing `Backspace` between an empty pair deletes both halves.
- When you type `'` or `"` right before or after a letter or number, as in don't, the closing half isn't added.
- Nothing is added if Obsidian's "Auto-pair brackets" setting is turned off.

---

## 3. Deleting Text

### Bold, Italic, Strikethrough, Highlight, and Links

You delete one character at a time, the same as plain text. You never end up with leftover markers, or with only the hidden markers deleted. When you delete all the styled text, the markers go with it.

### Inline Code and Inline Math

Pressing `Backspace` right after or inside inline code or math shows the hidden markers for the moment and moves the cursor past the closing marker. From there you can edit it as plain text, and pressing `Enter` on that line hides the markers again.

### Lists, Checklists, Numbered Lists, and Quotes

Pressing `Backspace` at the start of an item or quote line (before or after the marker) works in this order:

1. An indented item moves up one level.
2. At the top level, the marker is shown again. From there you can delete it as plain text.

---

## 4. Typing at the Edge of Formatting

If you put the cursor at the start or end of styled text and type, the new text goes outside the formatting. To add text inside it, put the cursor somewhere in the middle of the styled text.

- **IME input (Japanese, etc.)**: Text goes outside the formatting once you commit it. While it's uncommitted it may look styled, but links stay in the normal text color.
- **Changing link text**: If you delete all of a link's text and type it again, it's treated as plain text outside the link. To change the wording of a link, edit it while leaving at least one character.

Note: The arrow keys skip over hidden markers and move the cursor one visible character at a time.

---

## 5. Toolbar Formatting Rules

### Automatic Spaces Before and After

When you apply formatting from the toolbar (bold, italic, strikethrough, highlight, inline code, math, or link), a half-width space is added before and after it. This keeps markers from running together and breaking the display.

- No space is added where there's already a space or line break, or at the start of a line. The same goes for right after a list marker or a quote's `>`.
- No space is added when you layer formatting inside existing formatting, either.

### Layering Formatting

If you select styled text and press another formatting button, the new formatting is added inside it, as in "bold + highlight" or "strikethrough + color highlight".

- Pressing the button for formatting that's already applied removes only that formatting and keeps the rest.
- If you select text first, you can apply bold and italic together. If you press the buttons without selecting text, you get only one of the two.
- If you select link text and apply formatting, it goes outside the link.

### Limits on Layering with Code and Math

- When the cursor or selection touches inline code or math, the other formatting buttons (bold, italic, strikethrough, highlight, link) turn gray and can't be pressed.
- When the selection touches other formatting or a link, the code and math buttons can't be pressed.
- Selecting text inside code or math and pressing the same button removes that formatting.

### Pressing Bold or Italic Without Selecting Text

If you press bold or italic without selecting text, that formatting is applied to what you type next. Press it again to turn it off.

- Press `Backspace` before typing anything to cancel it.
- If you post while it's still on, the formatting is closed at the end of the line before the post is saved.

---

## 6. Working with Lists and Quotes

### Lists

| Key                                 | What it does                                                          |
| :---------------------------------- | :-------------------------------------------------------------------- |
| `Enter`                             | Continues the list on the next line (numbered lists are numbered automatically) |
| `Enter` on an empty item            | Moves up one level; at the top level, ends the list                   |
| `Tab` / `Shift + Tab` (desktop)     | Moves the item down / up one level, along with its child items        |
| `Backspace` at the start of an item | Moves up one level; at the top level, shows the marker again          |
| `Shift + Enter`                     | Starts a new line without continuing the list                         |

Note: Numbered lists are renumbered automatically when you change levels or add or remove items.

### Quotes

| Key                            | What it does                                                  |
| :----------------------------- | :------------------------------------------------------------ |
| `Enter`                        | Continues the quote on the next line at the same depth        |
| `Enter` on an empty quote line | Moves up one level; at the top level, ends the quote          |
| `Shift + Enter`                | Starts a new line without continuing the quote                |

### Lists Inside Quotes

Pressing a list button on a quote line puts the list marker right after the `>`, so you can build a list inside the quote. Continuing with `Enter`, indenting, and automatic numbering work the same as in a regular list.

---

## 7. Adding and Editing Links

Links are handled with **Link** in the toolbar's "⋯" menu.

- **To add a link**: Select the text you want to link and press the button.
- **To edit a link**: Select the link text, or put the cursor inside the link, and press the button.

An input field opens below the form. Type a **note name** or a **URL** and press `Enter` to confirm.

- When you type a note name, a list of suggestions appears. Pick one with the arrow keys or a tap. Pressing `Enter` confirms what you've typed.
- Input that starts with `https://`, `http://`, or `obsidian://` becomes an external link. Anything else becomes a link to a note in your vault.
- While you're editing a link, the **Remove link** button on the right side of the field removes the link.

#### How Links Are Saved

| Link target      | Saved as                                                                                   |
| :--------------- | :----------------------------------------------------------------------------------------- |
| A note in your vault | `![[Note Name\|Display Text]]` (or `![[Note Name]]` if the display text matches the note name) |
| An external URL  | `[Display Text](URL)`                                                                      |

Note: For how internal links work, see [Working with Images, Links, and Embeds](./links-and-embeds.md).

---

## 8. Quoting Past Posts (Quote Cards)

Choose **Quote post** from a post's menu and the post appears as a card below the form. Type your text in the form and it's posted together with the card.

- Press the **×** button at the top right of the card to remove the quote.
- The quote markers are added when you post, so they don't appear in the text in the form.
- Drafts save the quote card too.

---

## Troubleshooting

### The markers stay visible

- Markdown syntax you type by hand isn't hidden until you press `Enter` on that line.
- Code blocks, math blocks, manually typed image embeds, bare URLs, and the like are shown as typed.

### Text typed next to formatting ends up outside it

- Text typed at the start or end of formatting goes outside it. To add text inside, put the cursor somewhere in the middle and type.

### A button is grayed out

- Check whether the cursor or selection touches inline code, math, or other formatting or a link (see "5. Toolbar Formatting Rules").
- Strikethrough and highlight work only when text is selected. Link works only when text is selected or the cursor is inside a link.
- While bold or italic is turned on without selected text, you can't press the other one.
