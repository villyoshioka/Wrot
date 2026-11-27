# How to Use Tag Rules

Wrot can change the color of posts automatically by tag, such as a calm color for `#journal` and a bright one for `#work`.

Besides colors, you can also keep posts with certain tags off the timeline.

---

## 1. Turn the Feature On

Turn on **"Use tag rules"** in the "Tag Rules" section of the settings.

- Turning it on adds one rule and opens it, ready to edit.
- Turning it off returns posts to your normal Obsidian theme colors. Your saved rules aren't deleted.

---

## 2. Create a Rule

Each rule is a pair of a **target tag** and the **colors to apply**.

### Target Tag

Enter the name of the tag whose color you want to change. The leading `#` is optional.

- Example: If you enter `journal`, posts containing `#journal` are targeted.

### Base Colors (Background and Text)

Set the **background color** of the post card and the **text color** of the body. Both are required.

---

## 3. Fine-Tuning Colors (Optional)

You can set two more colors.

### Accent Color

The color used for emphasis, such as tags, internal links, and external URLs.

- If you leave it blank, your Obsidian theme's accent color is used.
- The reset button returns it to how it was before you set it.

### Secondary Color and Where It Applies

The color used for parts around the body, such as timestamps, list markers, and quotes.

- If you leave it blank, a color between the background and text colors is generated automatically.
- Once set, you can choose whether to use it for each part below. Parts turned off use the generated color.

| Where it applies     | Parts                                  |
| :------------------- | :------------------------------------- |
| **Timestamps, etc.** | Post time, menu icon, and pin icon     |
| **Quotes**           | Quotes (`>`)                           |
| **Lists**            | Bulleted lists and checkboxes          |
| **Link previews**    | URL preview cards                      |

---

## 4. Hiding Posts from the Timeline

Turn on **"Hide from timeline"** in a rule to hide posts with that tag from the Wrot timeline.

- They aren't removed from your daily note. You can see them anytime by opening the note.
- They're shown as usual in Live Preview and Reading view.
- Pinned posts are an exception. They stay pinned at the top of the timeline even if they have a hidden tag.
- Colors are decided by the rule for the tag written first in the post, but **hiding checks every tag**. If a post has even one hidden tag, it's hidden from the timeline.

---

## 5. Excluding from Tag Integration and Preventing Deletion

### Exclude from Tag Integration

Turning on **"Exclude from tag integration"** in a rule makes that tag internal to Wrot, so it isn't shown in Graph view or tag search. For details, see [How Tag Integration Works](./tag-integration.md).

### Disable Delete Button

Turning on **"Disable delete button"** in a rule means posts with that tag can't be deleted from the post menu.

- This option is shown only when the "Delete button" setting is on.
- As with hiding, every tag on the post is checked. If a post has even one target tag, the delete button can't be pressed.

---

## 6. Locks Against Accidental Changes

Each rule's header has a **lock icon**.

- Rules are normally **locked (not editable)** so you don't change them by mistake.
- Clicking the lock icon **unlocks** the rule so you can edit its tag and colors.
- Locked and unlocked states last only while the settings screen is open. When you close it, every rule is locked again, but your colors and tags aren't lost.

---

## 7. Using More Than One Rule

Add rules with the "Add rule" button or the `+` button in the header.

- When you add a new rule, existing rules are locked automatically and only the new one is unlocked.
- Rules are listed from top to bottom.

### Priority When Tags Overlap

If a post has more than one tag with a rule, **the rule for the tag written first in the post is used**.

- Example: If a post has `#work #important` in that order and both have rules, the rule for `#work`, written first, is used.
- Only one rule's colors are used. The colors for tags written later aren't applied.

---

## Where Colors Are Applied

Tag rule colors are used everywhere posts are shown:

- **Timeline** (Wrot's list view)
- **Live Preview** (editing a note)
- **Reading view** (reading a note)

---

## Troubleshooting

### Colors don't change

- Check that "Use tag rules" is turned on.
- Check that the tag name in the rule matches the tag in the post.
- If the post has more than one tag, check whether the tag written first has a rule.

### A post disappeared from the timeline

- Check whether "Hide from timeline" is on in the rule for one of its tags.
- The post hasn't been deleted. You can find it by opening the daily note.

### I can't edit a rule

- Click the lock icon in the rule's header to unlock it.

### The secondary color isn't applied to some parts

- Check that the secondary color's toggle for that part is turned on.
