# Formatting Guide

Wrot's post form has a toolbar with buttons for adding formatting such as bold, lists, and quotes.

Starting with v3.0.0, the post form hides Markdown syntax and shows your text styled. For how typing works in the form, such as deleting markers and the rules for layering formatting, see [Changes to the Post Form in v3.0.0 and Later](./posting-form-v3.md).

---

## Toolbar Layout

By default, these buttons sit below the input area of the post form, from left to right:

| Icon  | Button            | What gets saved / what it does                                         |
| :---: | :---------------- | :--------------------------------------------------------------------- |
|  🖼️   | **Image**         | Opens a file picker to attach an image                                 |
| **B** | **Bold**          | `**Bold**`                                                             |
|  _I_  | **Italic**        | `*Italic*`                                                             |
|  ☰   | **Bulleted list** | `- Bullet point`                                                       |
|   ☑   | **Checklist**     | `- [ ] Task`                                                           |
|  1.   | **Numbered list** | `1. Numbered`                                                          |
|   ⋯   | **More**          | Pin later, Code, Math, Quote, Link, Strikethrough, Highlight, and more |

Note: You can change which buttons are shown and their order. See [Using the Toolbar](./toolbar.md).

---

## Bold and Italic

### With Text Selected

Makes the selected text bold (italic). Press it again to remove it.

- You can apply it on top of other formatting, and bold and italic can be combined.

### Without Selecting Text

Pressing the button lights it up, and what you type next is shown in bold (italic). Press it again to close the formatting.

- Press `Backspace` before typing anything to cancel it.
- If you post without closing it, it's closed at the end of that line before the post is saved.
- While one is lit, the other button (italic for bold, and vice versa) can't be pressed.
- While IME input (Japanese, etc.) has uncommitted text, the lit button can't be pressed for the moment, so you don't close the formatting by mistake.

---

## Lists (Bulleted, Checklist, Numbered)

Pressing a list button turns **the line the cursor is on** into a list item. The marker goes at the start of the line even if the cursor is in the middle of it. Press it again to turn the line back, or press a different list button to switch the type.

| Button            | Saved marker |
| :---------------- | :----------- |
| **Bulleted list** | `- `         |
| **Checklist**     | `- [ ] `     |
| **Numbered list** | `1. `        |

- Pressing one on a quote line creates a list inside the quote.
- For continuing a list with `Enter` and changing levels with `Tab` or `Backspace`, see "6. Working with Lists and Quotes" in [Changes to the Post Form in v3.0.0 and Later](./posting-form-v3.md).

---

## More Menu (⋯)

### Code

Whether text is selected decides between inline code and a code block.

| Situation         | What gets saved                                   |
| :---------------- | :------------------------------------------------ |
| **Text selected** | <code>\`Selected Text\`</code> (inline code)      |
| **No selection**  | <code>~~~</code> to <code>~~~</code> (code block) |

- When you insert a code block, the cursor is placed inside it so you can type the code.
- The button can't be pressed while the selection includes formatted text or a link.
- Inside a code block, `Tab` adds an indent. Whether it uses a tab or spaces, and how many spaces, follows Obsidian's "Indent using tabs" and "Indent visual width" settings. A new line starts at the same indent as the line before.
- In code blocks labeled `html`, `xml`, `svg`, `vue`, `svelte`, and similar, typing the `>` that ends an opening tag adds its closing tag. Typing `</` fills in the closing tag of the innermost tag that's still open.
- **Copy code** in the post menu copies only the contents of a code block. If a post has more than one, the first line of each is listed so you can pick the one to copy.

### Math (LaTeX)

As with code, whether text is selected decides between inline math and a math block.

| Situation         | What gets saved                 |
| :---------------- | :------------------------------ |
| **Text selected** | `$Selected Text$` (inline math) |
| **No selection**  | `$$ … $$` (math block)          |

- The button can't be pressed while the selection includes formatted text or a link.
- **Copy math** in the post menu copies only the formula in a math block. If a post has more than one, the first line of each is listed so you can pick the one to copy.

### Quote

Adds or removes the quote marker `>` at the start of the selected lines, or the line the cursor is on.

- With several lines selected, it's added to all of them.
- If every selected line already has it, it's removed from all of them.

### Link

Available when text is selected or the cursor is on a link.

An input field opens below the form. Type a note name or a URL and press `Enter` to confirm. For details, see "7. Adding and Editing Links" in [Changes to the Post Form in v3.0.0 and Later](./posting-form-v3.md).

### Strikethrough

**Available only when text is selected.** Otherwise it's grayed out. Press it again to remove it.

| Button            | Saved format |
| :---------------- | :----------- |
| **Strikethrough** | `~~Text~~`   |

### Highlight

**Available only when text is selected.** Otherwise it's grayed out.

- Pressing it opens a color menu with **Default, Red, Orange, Yellow, Green, Blue, and Purple**. Default is your theme's highlight color.
- When highlighted text is selected, the menu item changes to **Remove highlight**, which removes the highlight.

| Color                     | Saved format                                         |
| :------------------------ | :--------------------------------------------------- |
| **Default**               | `==Text==`                                           |
| **The six colors, Red to Purple** | `==🔴Text==` and so on (the same syntax as Obsidian) |

---

## Rules for All Formatting

- Applying formatting adds a half-width space before and after it. It's skipped when there's already a space, among other cases.
- Applying formatting to text that already has some layers the two. Pressing the same button removes only that formatting.
- Code and math can't be layered with other formatting.

For the exact conditions, see "5. Toolbar Formatting Rules" in [Changes to the Post Form in v3.0.0 and Later](./posting-form-v3.md).

---

## Images and Links

For attaching images (🖼️) and linking to notes and web pages, see [Working with Images, Links, and Embeds](./links-and-embeds.md).

---

## Keyboard Shortcuts

- **Post**: `Ctrl + Enter` / `Cmd + Enter` (or click the post button)
