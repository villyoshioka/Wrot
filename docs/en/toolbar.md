# Using the Toolbar

For each button on the post form's toolbar, you can choose whether it's shown on the toolbar, placed in the "More" menu (⋯), or disabled. You can also change the order by dragging and dropping.

Disabled buttons are shown in neither the toolbar nor the menu.

---

## Entering Edit Mode

1. Open the **⋯ (More)** menu at the right end of the toolbar.
2. Choose **"Edit toolbar"**.

The toolbar switches to edit mode and all buttons are lined up in one row.

- **Normal**: Buttons currently shown on the toolbar
- **Semi-transparent**: Buttons in the ⋯ menu
- **Semi-transparent with a slash**: Disabled buttons

Note: If "Edit toolbar" isn't in the menu, turn on **"Show toolbar edit button"** under "Advanced" in the settings.

---

## Working in Edit Mode

### 1. Switching States (Click or Tap)

Each time you press a button, its state changes in this order:

> **On the toolbar** (normal) → **In the menu** (semi-transparent) → **Disabled** (semi-transparent with a slash) → **On the toolbar**

### 2. Changing the Order (Drag and Drop)

Press and hold or drag a button to move it anywhere you like.

- Buttons in the menu and disabled buttons also have a place in the row. You can set their position while they're hidden and turn them on later.

### 3. Saving or Discarding Changes

While in edit mode, these buttons are shown at the end of the toolbar.

| Button | What it does                                        |
| :----: | :-------------------------------------------------- |
| **✓**  | Saves your changes and leaves edit mode             |
| **✕**  | Discards your changes, restores the previous layout, and leaves edit mode |

> **While editing**
>
> - Changes aren't saved until you press **✓**.
> - While editing, you can't type, post, or use the menus on past posts. You can still switch dates.
> - You can't start editing the toolbar while you're editing a post. Save or cancel the post edit first.

---

## How the More Menu (⋯) Works

The menu has a fixed order and lists items in this order, regardless of the toolbar order:

> Image → Bulleted list → Checklist → Numbered list → Code → Math → Quote → Bold → Italic → Link → Strikethrough → Highlight → Pin later

### What Changes in the Menu

These two work differently from when they're on the toolbar.

- **Bold and Italic**:
  On the toolbar you can press them without selecting text and format as you type. In the menu, they **work only when text is selected**. Otherwise they're grayed out.
- **Pin later**:
  When a pin for a set date is scheduled, a checkmark appears next to the menu item. It means the same thing as the button lighting up on the toolbar.

---

## Resetting to the Default

**"Reset toolbar"** under "Advanced" in the settings restores the default layout and states.
To prevent mistakes, the first press changes the button to a confirmation, and the second press resets the toolbar.

---

## Where the Layout Is Saved

The toolbar layout is shared between desktop and mobile. It's saved in `layout.json` in the plugin folder and isn't written to your notes.

---

## Troubleshooting

### "Edit toolbar" isn't in the menu

- Check that **"Show toolbar edit button"** is turned on under "Advanced" in the settings.
- Check that you aren't in the middle of editing a past post.

### Buttons can't be moved or reordered

- The fixed buttons at the ends (✓, ✕, and ⋯ itself) can't be reordered.
- A click (or tap) alone switches the state. To reorder, drag the button.

### The order I set went back to how it was

- Check that you pressed **✓** when you finished editing.

### I can't find a button

- Buttons placed in the menu are all inside the ⋯ menu.
- If it isn't in the menu either, it's disabled. Open "Edit toolbar" and click the slashed button to turn it back on.
