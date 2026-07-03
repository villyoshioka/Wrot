# Using Tag Autocomplete

In Wrot, typing `#` in the post form shows tags from your past posts as suggestions.
It lets you enter your usual tags quickly and accurately, without recalling the exact spelling.
This page explains how autocomplete works and where the suggestions come from.

---

## The Basics

1. Type `#` in the post form (the full-width `＃` works too).
2. Tags you've used in past posts appear as suggestions.
3. Keep typing to narrow down the list.
4. Pick a suggestion to insert the tag.

### Picking a Suggestion

- **Keyboard** — Use ↑↓ to choose, then Enter or Tab to confirm.
- **Tap / Click** — Simply press a suggestion to confirm it.

Your usual post shortcut (Ctrl / Cmd + Enter) still works while suggestions are shown. Posting takes priority, so when you're done writing, just post as usual.

### How Filtering Works

- Matching is case-insensitive.
- Tags that start with your input come first, followed by tags that contain it.
- Up to 5 suggestions are shown at a time.
- Filtering also works while an IME composition is in progress (with unconfirmed characters), so you may find your tag before confirming the conversion.

---

## Where Do Suggestions Come From?

- Suggestions are the **tags contained in posts you've made through Wrot**.
- Each time you post, the tags you used are added to the suggestions (no duplicates).
- Recently used tags are remembered with priority. Up to 200 tags are kept; beyond that, the least recently used ones are forgotten first.
- Suggestion data is stored separately from your settings, in a file inside the plugin folder (`tags.json`).

### What Doesn't Become a Suggestion

- A `#` written inside URLs, links, code, or formatting doesn't count as a tag. If it doesn't render as a tag, it won't become a suggestion either.
- Tags from other notes in your vault are not collected. Only tags posted through Wrot count.
- Tags registered in tag rules don't become suggestions just by being registered. They join the list once you actually use them in a post.

---

## Turning It Off & Clearing Suggestions

Toggle **"Tag Autocomplete"** in the **Basic** section of Settings (on by default).

- When turned off, suggestions stop appearing and no new tags are remembered.
- Your saved suggestions are kept. Turn it back on to pick up where you left off.

### Clearing All Suggestions

Use the **trash icon** in the "Tag Autocomplete" row to delete all remembered suggestions.

- Press it once and it changes to a "press again to confirm" label.
- Press it again to perform the deletion.
- If you wait a moment instead, it returns to the icon without deleting anything—so an accidental press is harmless.

Deletion is all-at-once only; you cannot remove individual suggestions.

---

## Troubleshooting

### No Suggestions Appear

- Check that "Tag Autocomplete" is turned on in Settings.
- Only tags posted through Wrot become suggestions. A tag you've never used in a post won't appear.

### A Tag You Expect Is Missing

- Use the tag once in a post, and it will appear in the suggestions from then on.
- Tags written inside URLs or code in past posts are not collected.

### Starting Over

- Since individual suggestions can't be removed, clear them all with the trash icon. As you keep posting with tags, the suggestions will grow back.
