# How to Use Decorations

The Wrot posting form includes a toolbar for formatting your text.
With just a click of a button, you can insert Markdown for bold text, quotes, lists, and more.
This page summarizes the available decorations in the toolbar and how they behave.

---

## Toolbar Overview

Below the text area of the posting form, the following buttons are arranged from left to right:

| Icon | Name | Description |
| --- | --- | --- |
| 🖼️ | Add Image | Opens the device's file selection dialog to attach an image |
| 📎 | Embed | Embeds notes or files using `![[ ]]` |
| B | Bold | `**Bold**` |
| I | Italic | `*Italic*` |
| ☰ | List | `- Item` |
| ☑ | Checklist | `- [ ] Task` |
| 1. | Numbered List | `1. Item` |
| ⋯ | More Formatting | Code, Math, Quotes, Links, Strikethrough, Highlight |

---

## Bold and Italic

The behavior changes depending on whether you have a selection or not.

### With a selection

The decoration is applied directly to the selected part. Pressing the button again removes the decoration.

- Bold: Wraps the selected text in `**...**`
- Italic: Wraps the selected text in `*...*`

### Without a selection (Preview Mode)

This system allows you to insert only the marker at the cursor position first and complete the decoration while you type.

1. When you press the Bold button, `**` is inserted at the cursor position (the button will light up).
2. Type the text you want to format.
3. Press the Bold button again to insert the closing `**` and complete the decoration.

Italic works the same way.

### Bold and Italic cannot be used simultaneously

If you press the Italic button while "Bold is in preview mode," it will not respond. The reverse is also true.
Please finish and close one decoration before using the other.

### Behavior while using Japanese IME

While converting characters in an IME, buttons in preview mode cannot be pressed.
This is a safeguard to prevent accidentally closing the decoration.

---

## List, Checklist, and Numbered List

Pressing these buttons inserts a marker at the beginning of the current line.
Even if the cursor is in the middle of a line, the marker will always be placed at the very beginning of that line.

| Button | Marker inserted |
| --- | --- |
| List | `- ` |
| Checklist | `- [ ] ` |
| Numbered List | `1. ` |

### Press Enter for the next item

When you press Enter on a list item, the marker for the next item is automatically inserted.
Pressing Enter on an empty item will exit the list.

---

## Code

Select "Code" from the "More" menu.

| Situation | Format inserted |
| --- | --- |
| With selection | <code>\`Selection\`</code> (Inline) |
| Without selection | <code>~~~</code> to <code>~~~</code> (Fence block) |

The cursor will be placed inside the fence block, so you can start writing the content immediately.

---

## Math

Select "Math" from the "More" menu.
Like Code, the behavior changes based on whether there is a selection.

| Situation | Format inserted |
| --- | --- |
| With selection | `$Selection$` (Inline) |
| Without selection | `$$ ~ $$` (Block) |

---

## Quote

Select "Quote" from the "More" menu.
This toggles a `> ` at the beginning of the selected line (or the current line).

- If multiple lines are selected, `> ` is added to all lines.
- If pressed while all selected lines already have `> `, they will be removed collectively.

---

## Link

Select "Link" from the "More" menu.
This cannot be used without a selection (the menu item will be grayed out).

It converts the selected text into the format `[Text](URL)` and places the cursor at the `URL` position.

Example: If you select "Wrot" and press it, it becomes `[Wrot]()`, with the cursor placed inside the `()`.

---

## Strikethrough and Highlight

| Button | Decoration |
| --- | --- |
| Strikethrough | `~~...~~` |
| Highlight | `==...==` |

Both are selected from the "More" menu.
They cannot be used without a selection (the menu item will be grayed out).
Pressing the button again removes the decoration.

---

## Images and Embeds

Detailed instructions for the 🖼️ Add Image button and 📎 Embed button are summarized on a separate page.
👉 [How to use Images, Links, and Embeds](./links-and-embeds.md)

---

## Posting Shortcuts

- Ctrl/Cmd + Enter: Post
- Post Button: Click with a mouse to post
