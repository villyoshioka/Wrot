# How Tag Autocomplete Works

When you type `#` and a few letters in Wrot's post form, tags you've used before are shown as suggestions. This helps prevent typos and inconsistent tag names.

---

## The Basics

1. Type `#` in the post form. The full-width `＃` works too, and a tag written with it turns into a regular `#` once you finish typing it.
2. Tags from your previous posts are shown as suggestions.
3. Keep typing to narrow the list by prefix and partial matches.
4. Select the tag you want.

### Choosing a Suggestion

- **Keyboard**: The list opens with nothing selected. Press `↓` to start from the top or `↑` to start from the bottom, then press `Enter` or `Tab` to insert the tag. Pressing `Enter` before choosing one inserts a normal line break.
- **Mouse / Touch**: Click or tap a suggestion to insert it.

> **Tip**: The posting shortcut (`Ctrl + Enter` / `Cmd + Enter`) still works while suggestions are shown.

### Filtering

- Upper and lower case are treated the same.
- Accents are ignored as well. For example, "cafe" also matches "café".
- Tags that start with what you typed come first, followed by partial matches. Up to 5 suggestions are shown.
- With Japanese input, the list filters on text you haven't confirmed yet, so you can pick a tag before confirming.

---

## How Suggestions Are Collected

- Only **tags in posts made from the Wrot timeline** become suggestions.
- When you post, the tags in it are added to the history automatically, without duplicates.
- The history keeps up to **200 tags**, favoring recently used ones. Past that limit, the tags you used longest ago are removed first.
- The history is stored in `tags.json` in the plugin folder, separate from your settings.

### What Isn't Included

- A `#` in a URL, internal link, inline code (` `), or formatting syntax isn't treated as a tag, so it isn't added to the history.
- Tags in other notes in your vault aren't collected.
- Tags you've added in the "Tag Rules" settings aren't suggested until you've posted them from Wrot at least once.

---

## Turning It Off and Resetting the History

Turn **Tag autocomplete** on or off in the "Advanced" section of the settings. It's on by default.

- When it's off, no suggestions are shown and new tags aren't added to the history.
- Turning it off **deletes the whole tag history** (`tags.json`). When you turn it back on, the history starts from empty.
  You can't remove individual tags from the history.

---

## Troubleshooting

### No suggestions are shown

- Check that "Tag autocomplete" is on in the "Advanced" settings.
- Only tags you've posted from Wrot are suggested.
- Inside a code block (between `~~~` fences), typing `#` doesn't show suggestions.

### A tag I want isn't suggested

- Post once with that tag, and it will be suggested from then on.
- In past posts, tags inside code blocks or in URLs aren't recorded as tags.

### I want to reset the history

- There's no way to remove tags one by one, so turn "Tag autocomplete" off in the settings and then back on.
