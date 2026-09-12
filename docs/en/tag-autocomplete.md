# How Tag Autocomplete Works

When you type `#` followed by a few letters in Wrot's post box, a list of tags you’ve used before pops up automatically.
It’s a handy way to avoid typos or inconsistent tag names and quickly drop in your go-to tags.

Here’s a quick walkthrough on how to use it, how it works behind the scenes, and how to tweak the settings.

---

## The Basics

1. Type `#` in the post box (the full-width `＃` works as well).
2. A dropdown will show tags from your previous posts.
3. Keep typing to filter the list in real time.
4. Pick the tag you want, and you're good to go.

### Selecting and Applying Tags

- **Keyboard**: Navigate with the `↑` and `↓` arrows, then hit `Enter` or `Tab` to insert the tag.
- **Mouse / Touch**: Just click or tap the tag from the list.

> **Tip**: Your posting shortcuts (`Ctrl + Enter` / `Cmd + Enter`) still work while the tag list is open, so you can send your post right away without closing the popup first.

### How the Filtering Works

- **Case-insensitive**: Upper and lower case don't matter. Typing "app" will match both "app" and "App".
- **Smart sorting**: Tags that start with what you typed show up first, followed by partial matches (up to 5 suggestions at a time).
- **IME friendly**: If you're using Japanese input, it filters as you type before you even confirm your text conversion, saving you extra keypresses.

---

## How Wrot Remembers Your Tags

- **What gets saved**: Only tags from notes you've posted through the Wrot timeline.
- **When it updates**: Every time you share a post, any tags in it are automatically saved to your history (duplicates are skipped).
- **History limit**: Wrot keeps up to 200 of your most recently used tags. Once you cross that limit, older ones make way for the new ones.
- **Where it’s stored**: Saved safely in a file called `tags.json` inside your plugin folder, totally separate from your settings.

### What Doesn't Show Up

- **Symbols in formatting or code**: Hashes in URLs, internal links, inline code (` `), or formatting symbols aren't treated as tags.
- **Tags elsewhere in your Vault**: Wrot doesn't index your whole Vault. It only tracks tags you've actually posted with Wrot.
- **Unused rule tags**: Tags in your "Tag Rules" settings won't pop up until you've posted them at least once.

---

## Turning It Off or Wiping History

If you want to turn this off, head over to "Advanced" and toggle **Tag Autocomplete** off (it's ON by default).

- **Turning it off**: Stops the popup from showing up and pauses new tag tracking.
- **Clearing history**: Switching the toggle OFF instantly wipes all your saved tag data (`tags.json`). Turning it back ON starts you off with a fresh, empty list.
  - _Note: There's no way to delete tags individually._

---

## Troubleshooting

### Suggestions aren't popping up

- Double-check that "Tag Autocomplete" is turned ON under "Advanced".
- Keep in mind that Wrot only suggests tags you've posted in the past. New tags won't show up until you've used them once.

### A tag I used isn't showing up

- Once you publish a post with that tag, it'll start showing up in the list next time.
- Tags wrapped in code blocks or embedded in URLs from past posts don't get logged as real tags.

### Want to reset your list and start fresh?

- Since you can't delete tags one by one, simply toggle "Tag Autocomplete" OFF and then back ON in settings. This wipes the slate clean so Wrot can start learning your tags from scratch.
