# Formatting Guide

The Wrot post editor comes with a toolbar that makes formatting your text a breeze.
With a single click, you can quickly add Markdown styling like bold text, lists, and blockquotes.

Here is a breakdown of the formatting tools on the toolbar and how they work.

---

## Toolbar Layout

By default, the bottom of the editor features the following tools, from left to right:

| Icon  | Feature           | What It Does / Inserts                                        |
| :---: | :---------------- | :------------------------------------------------------------ |
|  🖼️   | **Image**     | Opens a window to choose and attach images                    |
|  📎   | **Embed**         | Embeds notes or files using `![[ ]]`                          |
| **B** | **Bold**          | `**Bold**`                                                    |
|  _I_  | **Italic**        | `*Italic*`                                                    |
|  ☰   | **List**          | `- Bullet point`                                              |
|   ☑   | **Checklist**     | `- [ ] Task`                                                  |
|  1.   | **Numbered List** | `1. Numbered`                                                 |
|   ⋯   | **More**  | Code, Math, Blockquotes, Links, Strikethrough, and Highlights |

- You can customize which buttons show up on the toolbar and rearrange them. To learn how, check out [How to Use the Toolbar](./toolbar.md).

---

## Bold and Italic

How these work depends on whether you have highlighted any text.

### When Text Is Selected

Clicking a style wraps your highlighted text in Markdown tags. Click it again to strip the formatting.

- **Bold**: Wraps text with `**…**`.
- **Italic**: Wraps text with `*…*`.

### When No Text Is Selected (Type-Ahead Mode)

This mode drops an **opening tag** right where your cursor is and closes it once you finish typing.

1. Click the button to drop an opening tag (like `**`) at your cursor. The toolbar button will light up.
2. Type out your text.
3. Click the button again to add the closing tag (like `**`) and finish formatting.

> **Tips and Things to Know**
>
> - **Auto-spacing**: Whenever you close a tag, a space gets added right after it so your formatting does not bleed into the next word.
> - **Posting mid-way**: If you publish a post without closing a tag, starting symbols like `**` will just show up as plain text.
> - **Combining bold and italic**: You cannot turn on both modes at once. Wrap your text in one style first before applying the other.
> - **IME protection**: To prevent accidental formatting changes while typing in Japanese, toolbar buttons briefly pause while converting text.

---

## Lists (Bullets, Checklists, Numbered)

Clicking a list button inserts a list symbol at the **very start of your current line**, even if your cursor is in the middle of a sentence.

| Button            | Inserted Symbol |
| :---------------- | :-------------- |
| **Bulleted List** | `- `            |
| **Checklist**     | `- [ ] `        |
| **Numbered List** | `1. `           |

### Auto-Continuing Lists

Hitting `Enter` on a list line automatically starts a new list item on the next line.
To break out of a list, just hit `Enter` on an empty list item.

---

## More Formatting Options (⋯)

### Code

The editor automatically toggles between inline code and a full code block based on your text selection.

| Selection Status  | What Gets Inserted                                |
| :---------------- | :------------------------------------------------ |
| **Text selected** | <code>\`Selected Text\`</code> (Inline code)      |
| **No selection**  | <code>~~~</code> to <code>~~~</code> (Code block) |

- When you insert a code block, your cursor drops right inside it so you can start typing right away.

### Math (LaTeX)

Just like the code tool, this switches between inline and block math depending on what you have selected.

| Selection Status  | What Gets Inserted              |
| :---------------- | :------------------------------ |
| **Text selected** | `$Selected Text$` (Inline math) |
| **No selection**  | `$$ 〜 $$` (Block math)         |

### Blockquotes

This button turns quotes on and off at the start of your current line or selected lines.

- Selecting multiple lines adds `> ` to every single line.
- If every selected line is already a quote, clicking the button removes the `> ` from all of them at once.

### Links

**This option only works when text is selected.** (It stays grayed out otherwise.)

- It turns your selected text into `[Selected Text](URL)` and drops your cursor right inside the parentheses `()`.

### Strikethrough and Highlight

**These options only work when text is selected.** (They stay grayed out otherwise.) You can remove the effect by selecting the text and clicking the button again.

| Feature           | Inserted Format |
| :---------------- | :-------------- |
| **Strikethrough** | `~~Text~~`      |
| **Highlight**     | `==Text==`      |

---

## Attaching and Embedding Images

For a detailed walkthrough on attaching images (🖼️) or embedding notes and files (📎), check out the guide below.

👉 [How to Use Images, Links, and Embeds](./links-and-embeds.md)

---

## Keyboard Shortcuts

- **Post**: `Ctrl + Enter` / `Cmd + Enter` (or click the post button)
