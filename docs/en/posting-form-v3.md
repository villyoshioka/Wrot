# New Posting Form in Ver3.0.0 and Up

With Ver3.0.0, the post editor now hides raw Markdown syntax so you can write in something much closer to your final layout. Things like bold styling, lists, and checkboxes render in real time, making the writing experience feel a lot like drafting a post on social media.

Below is an overview of how typing, formatting, and deleting work in the updated editor, plus a few subtle behaviors worth knowing about. If you want a quick reference for the toolbar buttons, check out the [Formatting Guide](./formatting-guide.md).

> **Your underlying notes are untouched**
>
> Hiding syntax is purely visual within the editor. Everything still saves as standard Markdown under the hood, meaning older posts, your timeline, and your actual note files behave just as they always have.

---

## 1. What Gets Formatted vs. What Stays as Plain Text

| Element                                      | Appearance in the Editor                                    |
| :------------------------------------------- | :---------------------------------------------------------- |
| **Bold, italics, strikethrough, highlights** | Hides the markers and shows the styled text                 |
| **Inline code**                              | Hides the backticks and applies monospaced code styling     |
| **Inline math** (`$…$`)                      | Hides the dollar signs and renders the formula              |
| **Links**                                    | Hides the brackets and shows the label in your accent color |
| **Tags**                                     | Shown in your accent color once you finish typing them      |
| **Lists, task lists, numbered lists**        | Replaces markers with real bullets, checkboxes, or numbers  |
| **Blockquotes**                              | Swaps out `>` for a left quote bar                          |
| **Code blocks and math blocks**              | Kept as raw text, including fences and delimiters           |
| **Manual image embeds** (`![[Image.png]]`)   | Kept as raw text, exactly as typed                          |
| **Raw URLs**                                 | Kept as typed, shown in your accent color                   |

- You can check or uncheck tasks right in the editor simply by clicking or tapping them.

---

## 2. Typing Markdown Syntax by Hand

Whenever you type out syntax like `**bold**` manually, the markers stay visible until you press `Enter` on that line. The editor does not jump ahead and convert things halfway through a word.

- Pressing **`Enter` once** hides the syntax and renders the styled text without breaking into a new line.
- Pressing **`Enter` again** takes you down to the next line.
- Pressing **`Shift + Enter`** starts a new line right away without converting the syntax.

- When you restore a draft or edit a previous post, all formatting opens up already rendered.

### Brackets and Quotes

Typing `(`, `[`, `{`, `"` or `'` adds the closing half automatically and puts the cursor between them.

- Typing the closing half moves the cursor past the one already there instead of adding another.
- Typing one with text selected wraps the selection in it.
- Pressing `Backspace` between an empty pair deletes both halves.
- The closing half is not added when you type `'` or `"` right after a letter (as in "don't"), or when you type any of them right before a letter.
- Nothing is added automatically when Obsidian's "Auto-pair brackets" setting is turned off.

---

## 3. Deleting Text

### Bold, Italics, Strikethrough, Highlights, and Links

Text deletes normally, without leaving behind invisible or broken syntax. If you clear out all the words inside a formatted section, the markers go away with them.

### Inline Code and Inline Math

Pressing `Backspace` inside or right after code or math first reveals the original raw markers and puts your cursor right after the closing marker. You can then edit everything as regular text, and pressing `Enter` on that line hides the markers again.

### Lists, Task Lists, Numbered Lists, and Blockquotes

Pressing `Backspace` at the start of an item, whether just before or just after the marker, works like this:

1. Indented items step back one level.
2. Items already at the top level revert to their raw Markdown marker, which you can then delete like any other text.

---

## 4. Typing Along Formatting Boundaries

Typing right at the beginning or very end of formatted text (bold, highlights, links, and so on) keeps your new characters outside the formatting. If you want your new words to inherit the styling, place your cursor somewhere inside the formatted phrase instead.

- **Japanese input (IME)**: Characters move outside the formatting once you confirm your input. While still unconfirmed, they may temporarily look styled as bold, italic, strikethrough, or highlighted, though links stay in the regular text color even during conversion.
- **Retyping link text**: Clearing out an entire link label and typing again treats the new text as unlinked. If you just need to fix a link label, edit it while leaving some of the characters in place.

- Arrow keys hop over hidden syntax, moving naturally from one visible character to the next.

---

## 5. Toolbar Formatting Rules

### Automatic Spacing Around Formatted Words

Applying bold, italics, strikethrough, highlights, inline code, math, or links through the toolbar automatically adds a half-width space before and after your selection. This keeps adjacent Markdown markers from running into each other and breaking the formatting.

- Spaces are skipped if there is already a space or a line break there, or if you are at the start of a line. They are also skipped right after list markers or a quote's `>`.
- Nesting a style inside an existing formatted phrase does not add spaces either.

### Stacking Styles

Selecting formatted text and clicking another style button applies the new formatting inside the existing one. This lets you combine things like bold with a highlight, or strikethrough with a colored highlight.

- Clicking the button of a style that is already applied removes only that style, leaving any other layers alone.
- Bold and italics can be combined on selected text. When pressed without selecting text, only one can be used at a time.
- Applying a style to the text of a link wraps the formatting around the whole link.

### Code and Math Limitations

- If your cursor or selection touches inline code or math, the other style buttons (bold, italics, strikethrough, highlight, link) are greyed out.
- If your selection touches formatting or a link, the code and math buttons are greyed out.
- Selecting the inside of a code snippet (or formula) and clicking its button removes the code (or math) formatting.

### Pressing Bold or Italics Without Selecting Text

Clicking bold or italics without selecting any text styles whatever you type next. Clicking the button again closes the formatting.

- Pressing `Backspace` before typing anything cancels it.
- If you submit your post without closing it, the formatting is closed automatically at the end of that line.

---

## 6. Managing Lists and Quotes

### Lists

| Shortcut                             | What Happens                                                              |
| :----------------------------------- | :------------------------------------------------------------------------ |
| `Enter`                              | Continues with a new item of the same kind (numbered lists count up)      |
| `Enter` on an empty item             | Outdents the item by one level, or ends the list if already at the top    |
| `Tab` / `Shift + Tab` (desktop)      | Indents / outdents the item by one level, along with its nested items     |
| `Backspace` at the start of an item  | Outdents the item, revealing the raw marker once at the top level         |
| `Shift + Enter`                      | Starts a new line without adding another bullet or number                 |

- Numbered lists renumber automatically as you change indentation or add and remove items.

### Blockquotes

| Shortcut                        | What Happens                                                          |
| :------------------------------ | :-------------------------------------------------------------------- |
| `Enter`                         | Continues the quote on the next line at the same depth                |
| `Enter` on an empty quote line  | Outdents the quote by one level, or ends it if already at the top     |
| `Shift + Enter`                 | Starts a regular new line without continuing the quote               |

### Lists inside Quotes

Clicking a list button on a quote line puts the list marker right after the `>`, creating a list inside the quote. Continuing with `Enter`, indenting, and renumbering all work just like a regular list.

---

## 7. Inserting and Editing Links

Links live under **Link** in the "⋯" menu on your toolbar.

- **Creating a new link**: Select the words you want to link and click the button.
- **Editing an existing link**: Select the link text, or place your cursor on the link, and click the button.

A small pop-up field opens below the editor. Type a note name or a web address, then press `Enter` to confirm.

- Typing a note name brings up suggestions you can pick with the arrow keys or a tap. Pressing `Enter` confirms exactly what you typed.
- Anything starting with `https://`, `http://`, or `obsidian://` becomes an external link. Anything else links to a note in your Vault.
- While editing an existing link, click **Remove link** on the right side of the field to unlink the text.

#### How Links Are Stored

| Link Type       | Output Format                                                                            |
| :-------------- | :--------------------------------------------------------------------------------------- |
| Note in Vault   | `![[Note Name\|Label Text]]` (or simply `![[Note Name]]` if the label matches the name) |
| Web address     | `[Label Text](URL)`                                                                      |

- For more on link syntax, head over to [Working with Images, Links, and Embeds](./links-and-embeds.md).

---

## 8. Quoting Posts with Cards

Selecting **Quote post** from a post's menu attaches that post as a card below the editor. You can write your thoughts above the card and post as usual.

- Click the **×** in the top-right corner of the card to detach it.
- The quote syntax is added only when you send the post, so it never shows up in the text you are writing.
- Drafts keep the attached quote card if you step away and come back later.

---

## Common Questions and Troubleshooting

### Why are my Markdown markers still showing?

- Hand-typed syntax only converts after you press `Enter` on that line.
- Code blocks, math blocks, manual image embeds, and raw URLs are intentionally left as plain text.

### Why is my text appearing outside the formatting instead of continuing inside it?

- Typing at the very beginning or end of styled text puts new characters outside the styling by design. To keep typing within that style, place your cursor between existing characters rather than at the edge.

### Why are certain toolbar buttons greyed out?

- Check whether your cursor or selection touches inline code, math, or existing formatting or links. Section 5 covers these rules in detail.
- Strikethrough and highlights need selected text. Link needs selected text, or your cursor resting on a link.
- You cannot turn on bold while italics is lit up from being pressed without selecting text, and vice versa.
