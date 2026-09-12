# Using the Toolbar

The toolbar on the post form comes packed with your most frequently used buttons right out of the box.
With Wrot, you have full control over your setup—choose which buttons stay on the toolbar, tuck less-used ones into the "More" menu (⋯), or disable the ones you don't need entirely. You can also reorder them anytime just by dragging and dropping.

Moving a button to the menu won't affect how it works. Only disabled buttons are hidden from both the toolbar and the menu.

---

## Entering Edit Mode

1. Open the **⋯ (More)** menu on the far right of the toolbar.
2. Select **"Edit Toolbar"**.

This switches the toolbar into edit mode, lining up all available buttons in a single row.

- **Normal**: Buttons currently visible on your toolbar
- **Semi-transparent (dimmed)**: Buttons stored in the ⋯ menu
- **Semi-transparent with a slash**: Disabled buttons

\*If "Edit Toolbar" isn't showing up in the menu, go to "Advanced" and turn on **"Show Toolbar Edit Button"**.

---

## Working in Edit Mode

### 1. Toggling Button States (Click or Tap)

Clicking or tapping a button cycles through its states in this order:

> **Show on Toolbar** (Normal) → **Move to Menu** (Dimmed) → **Disable** (Dimmed with slash) → **Show on Toolbar**

### 2. Rearranging Buttons (Drag and Drop)

Press and hold or drag any button to move it wherever you like.

- Hidden and disabled buttons still hold a place in the line. That way, you can set their position now and turn them on later whenever you're ready.

### 3. Saving or Canceling Edits

Action buttons will appear at the end of the toolbar while you're editing.

| Button | Action                                                  |
| :----: | :------------------------------------------------------ |
| **✓**  | Saves your changes and exits edit mode.                 |
| **✕**  | Discards your changes and restores the previous layout. |

> **Good to Know While Editing**
>
> - **Don't forget to save**: Your changes won't take effect until you click **✓**.
> - **Form locking**: While editing the toolbar, typing, posting, and managing past notes are temporarily paused (you can still switch between dates).
> - **Finish note edits first**: You can't edit the toolbar while actively editing a note inline. Wrap up or cancel your note edit first.

---

## How the "More" Menu (⋯) Works

Buttons you move off the toolbar will live inside the ⋯ menu. Items in this menu follow a fixed order and won't change even if you rearrange your toolbar:

> Image → Embed → List → Checklist → Numbered List → Code → Math → Quote → Bold → Italic → Link → Strikethrough → Highlight → Pin Later

### Behavior Changes in the Menu

Almost everything works the exact same way as it does on the toolbar, with just two small exceptions:

- **Bold and Italic**:
  On the toolbar, you can trigger these styles before you start typing. Inside the menu, they **only work when you have text selected** and stay greyed out otherwise.
- **Pin Later**:
  If a note is pinned for a specific date, a checkmark appears next to this item (just like the button lighting up on the toolbar).

---

## Resetting to Default

You can reset your toolbar back to its original layout anytime using **"Reset Toolbar"** under "Advanced".
To prevent accidental clicks, the first click asks for confirmation, and the second click runs the reset.

---

## A Few Extra Notes

- **Syncs across devices**: Your toolbar layout stays the same across desktop and mobile. It's stored in `layout.json` inside your plugin folder, so your individual notes stay untouched.

---

## Troubleshooting

### I can't see "Edit Toolbar" in the menu

- Double-check that **"Show Toolbar Edit Button"** is turned on under "Advanced".
- Make sure you aren't currently editing an existing note.

### Buttons aren't moving when I try to drag them

- The fixed buttons on the ends (✓, ✕, and ⋯) can't be moved.
- A quick click or tap just toggles the button's state. Make sure you press and drag to reorder.

### My custom layout didn't save

- Make sure you clicked **✓** to confirm your changes before leaving (clicking ✕ throws away your edits).

### I'm missing a button

- **Check the ⋯ menu**: Any button taken off the toolbar ends up here.
- **Check if it's disabled**: If it's not in the menu either, it's turned off. Open "Edit Toolbar" and click the slashed button to bring it back.
