# Arranging the Toolbar

The post form's toolbar starts with the buttons most people reach for, but not everyone reaches for the same ones. You can decide which buttons sit on the bar, which are put away in its ⋯ menu, and which are disabled altogether, and you can put them in whatever order suits your hand.

Nothing is lost by putting a button away. Everything the toolbar can do stays available from the ⋯ menu. Only a disabled button is gone from both, and it comes back the moment you enable it again.

---

## Getting started

Open the ⋯ menu at the end of the toolbar and choose **"Edit toolbar"**.

The toolbar changes into a single row holding every button there is. The ones currently on the bar look normal; the ones put away look faded, and the disabled ones are faded with a slash through them. All of them can be moved.

If the menu has no such entry, turn on **"Show Toolbar Edit Button"** in the Advanced section of the settings.

---

## While arranging

**Press a button** to step it through its states: solid (on the bar), faded (in the menu), faded with a slash (disabled), and back to solid.

**Hold a button and drag** to move it. It lifts out of the row and follows your finger or pointer, and an empty place is left where it was. That empty place travels with you and shows where the button will land. Let go and it settles there.

The row is one list. A faded or disabled button still holds a place in it, so switching it back on brings it out where you left it.

Two buttons stay put at the end of the bar:

| Button | What it does |
| --- | --- |
| ✓ | Keeps the arrangement and finishes |
| ✕ | Discards it and leaves the toolbar as you found it |

Nothing is saved until you press ✓.

While you are arranging, the form is not for writing with and the posts below are not for acting on. Typing, posting, and the post menus are all out of use until you finish. Moving between dates still works.

You cannot start arranging while you are editing an existing post. Finish or cancel that edit first.

---

## The ⋯ menu

Whatever you put away appears in the ⋯ menu, always in the same order:

Image, Embed, List, Checklist, Numbered List, Code, Math, Quote, Bold, Italic, Link, Strikethrough, Highlight, Pin Later.

The order you give the bar does not change the order here, so a button is always in the same place in the menu no matter how you have arranged things.

### What changes for a button in the menu

Most buttons behave exactly as they do on the bar. Two are worth knowing about.

**Bold and Italic** work only on selected text once they are in the menu. On the bar they can also be pressed with nothing selected, which opens the marks and lets you type inside them — that relies on the button staying lit to show the mode is running, and a menu entry has no light to give. In the menu they are greyed out until you select something, the same as Strikethrough and Highlight.

**Pin Later** shows a tick beside it while a day is set, in place of the lit button. Choosing it opens the same date picker.

---

## Starting over

**"Reset Toolbar"** in the Advanced section of the settings puts the bar back to how it shipped. Press it once and it asks; press it again to go through with it. Leave it alone for a moment and it goes back to asking nothing.

The row is short enough to put right by hand, so this is only there for when it is quicker not to.

---

## Notes

- The arrangement is shared by desktop and mobile. There is one toolbar, not one per device.
- It is stored in `layout.json` beside the plugin's other files, not in your notes.
- A button added by a later version of Wrot arrives in the ⋯ menu, so an arrangement you have made is never shifted underneath you. Look there after an update if something new was announced and you cannot see it.

---

## Troubleshooting

### "Edit toolbar" is not in the menu

- Check **"Show Toolbar Edit Button"** in the Advanced section of the settings.
- It cannot be chosen while you are editing an existing post.

### A button will not move

- The ✓ and ✕ at the end of the bar are not part of the arrangement, and neither is the ⋯ itself.
- A short press switches a button on or off rather than moving it. Move your finger a little further before letting go.

### The arrangement went back to how it was

- Leaving with ✕ discards it. Only ✓ keeps it.
- Turning off "Show Toolbar Edit Button" while arranging also drops what was not kept.

### A button has gone missing

- Look in the ⋯ menu. Everything put away is there.
- If it is not there either, it is disabled. Open "Edit toolbar" and it shows with a slash; press it to enable it again.
