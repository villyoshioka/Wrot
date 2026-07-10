# Using Tag Integration

Because Wrot memos are stored as code blocks, tags written inside them are normally invisible to Obsidian.
Tag Integration removes that wall: tags inside your memos appear in the graph view and match tag searches, just like regular tags.
This page explains what it does, how it works, and how to exclude specific tags.

---

## What You Get

### Tags appear in the graph view

Tags inside your memos show up as tag nodes in the graph view, connected to the notes that contain those memos.

- If the same tag also exists as a regular tag in a note body or its properties, both merge into the same node naturally.
- Make sure **"Tags"** is turned on in the graph view's display settings (it is off by default in Obsidian).

### Tag searches find your memos

Searches in the form `tag:#tagname` now match notes containing memos with that tag, and the search results highlight where the tag appears in the memo.

- Clicking a tag node in the graph view opens a search that finds your memos the same way.
- Clicking or tapping a tag in the timeline opens the same kind of tag search.

---

## Which Tags Are Included

Only tags that are displayed as tags on screen are included (the same rule as tag autocomplete).

- A `#` inside URLs, links, code, or formatting does not count as a tag. If it doesn't look like a tag on screen, it won't appear in the graph or search either.

---

## Settings

Toggle **"Tag Integration"** in the **Advanced** section of Settings (on by default).

- When off, tags stay inside Wrot: they no longer appear in the graph or tag searches, and clicking a tag in the timeline falls back to a plain text search.

### Excluding specific tags

If you'd rather a tag not create connections, you can exclude it individually via tag rules.

1. Turn on **"Use Tag Rules"** in the **Tag Rules** section.
2. Create a rule for the tag and turn on **"Exclude from Tag Integration"**.

An excluded tag written inside memos stays inside Wrot — it no longer appears in the graph or tag searches. The same tag written as a regular tag in note bodies or properties keeps working as usual.

Unlike colors, the order in which tags appear within a memo doesn't matter here. Each tag you exclude is left out individually.

---

## About the First Launch

On the first launch, the integration support file (`tag-integration.json`) that the feature relies on is newly created, so integration (graph view and tag search) may take a moment to kick in. Subsequent launches reflect everything right away.

---

## Troubleshooting

### Tags don't appear in the graph view

- Check that **"Tags"** is turned on in the graph view's display settings (off by default in Obsidian).
- Check that **"Tag Integration"** is turned on in Settings.
- Check that the tag isn't excluded via a tag rule ("Exclude from Tag Integration").
- Right after startup, it may take a moment for tags to appear.

### Tag searches don't find my memos

- Only searches in the form `tag:#tagname` match memos. Plain text search results are unchanged.
- Excluded tags don't appear in searches either.

### A deleted tag still shows in the graph

- The graph updates when the note's changes are saved. Wait a moment, or restart Obsidian to tidy things up.
