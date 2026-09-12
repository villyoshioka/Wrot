# How to Use Tag Rules

Wrot lets you automatically change the color of your notes based on their tags.
By giving each tag a distinct look—like a muted tone for `#journal` or a vibrant shade for `#work`—you can organize and scan your timeline at a glance.

You can also use tags to keep specific notes off your timeline altogether.
This guide walks you through setting up tag rules and explains how each option works under the hood.

---

## 1. Enable the Feature

To get started, head to your settings and toggle on **"Use Tag Rules"** under the "Tag Rules" section.

- Enabling this creates a default rule that is unlocked and ready to customize right away.
- Disabling it reverts your notes to your standard Obsidian theme colors, though your saved rules will remain intact.

---

## 2. Create a Rule

Every rule pairs a **target tag** with a **custom color scheme**.

### Choose a Target Tag

Enter the name of the tag you want to style. You can type it with or without the leading `#`.

- For example, entering `journal` will target any note containing `#journal`.

### Set Your Base Colors (Background and Text)

Pick a **background color** for the note card and a **text color** for the body text.
Since these form the foundation of your rule, both are required.

---

## 3. Fine-Tune Colors Further (Optional)

The two base colors get the job done, but if you want to tweak the design, two extra color options are available.
If you leave these blank, Wrot automatically calculates balanced shades based on your background and text choices.

### Accent Color

This highlights elements like tags, internal links, and external URLs.

- **When left blank**: Uses your Obsidian theme's default accent color.
- **When set**: Styles tags and links in your chosen color. You can reset this at any time.

### Sub Color and Application Scope

This styles secondary elements around your text, such as timestamps, list markers, and blockquotes.

- **When left blank**: Automatically generates a middle-ground shade between your background and text colors.
- **When set**: Applies your color to specific elements. You can toggle individual parts on or off using the checkboxes below; unchecked items fall back to the auto-generated color.

| Application Scope    | Target Elements                       |
| :------------------- | :------------------------------------ |
| **Timestamps, etc.** | Timestamps, menu icons, and pin icons |
| **Quotes**           | Blockquotes (`>`)                     |
| **Lists**            | Bulleted lists and checkboxes         |
| **OGP Cards**        | Link preview cards                    |

---

## 4. Hide Notes from the Timeline

Toggle on **"Hide from timeline"** within a rule to keep matching notes off your main Wrot timeline.

- **Your data stays intact**: The underlying daily note files are untouched, so you can still read them anytime by opening the file directly.
- **Live Preview and Reading View**: Notes display normally when opened. They are only hidden from the Wrot timeline view.
- **Pinned notes stay put**: Pinned notes are an exception and will remain anchored to the top of your timeline even if they have a hidden tag.
- **How multiple tags work**: Colors follow the first tag in the note text, but **the hide rule checks every tag**. If a note includes even one hidden tag, it stays off your timeline.

---

## 5. Prevent Accidental Edits with Locks

Each rule header includes a **lock icon**.

- Rules are **locked** by default to prevent accidental edits while you scroll.
- Click the lock icon to **unlock** a rule whenever you need to update its tag or colors.
- **How locks work**: Unlocking is temporary while the settings panel is open. Once you close settings, all rules automatically lock again, while your settings remain safely saved.

---

## 6. Set Up Multiple Rules

Click "Add rule" or hit the `+` icon in the header to create extra rules.

- Adding a new rule automatically locks existing ones so you can focus on the new entry.
- Rules are listed in order from top to bottom.

### Tag Priority and Overlaps

When a note has multiple tags matching different rules, **the tag that appears first in the note text takes priority**.

- Example: If a note contains `#work #important` in that order and both have rules, Wrot applies the `#work` rule.
- Only one color scheme applies per note, so subsequent tags are ignored for styling.

---

## Where Colors Take Effect

Your tag rules apply across all note views in Obsidian:

- **Timeline** (The Wrot list view)
- **Live Preview** (Edit mode)
- **Reading View** (Read mode)

Your notes maintain a consistent look no matter which view mode you use.

---

## Troubleshooting

### Colors Aren't Updating

- Make sure "Use Tag Rules" is toggled on.
- Double-check that the tag name in your rule matches the tag in your note.
- If your note has multiple tags, check whether a rule is assigned to the tag that appears first.

### A Note Disappeared from the Timeline

- Check if "Hide from timeline" is enabled on any tag attached to the missing note.
- Don't worry, the note itself isn't deleted. You can find it by opening the daily note file directly.

### Can't Edit Rule Settings

- Click the lock icon in the rule header to unlock it for editing.

### Sub Color Isn't Applying to Some Parts

- Head to the "Application Scope" section under sub-color and make sure the checkboxes for those elements are selected.
