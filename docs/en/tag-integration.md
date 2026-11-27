# How Tag Integration Works

Obsidian treats Wrot posts as code blocks, so by default the tags in your posts don't appear in core features such as Graph View and tag search.

With **Tag integration** turned on, tags in your Wrot posts appear in Graph View and are found by tag search, the same as tags in a regular note.

---

## What You Can Do

### 1. Show tags in Graph View

Tags in your posts appear as nodes in Graph View, connected to the daily note the post is in.

- A tag with the same name in a note's body or properties shares the same node.
- Obsidian turns tags off in Graph View by default, so turn on **Tags** in the graph's filter settings.

### 2. Find posts with tag search

Searching for `tag:#tag-name` finds the notes that contain posts with that tag.

- Search results highlight where the tag is in the post.
- Clicking a tag node in Graph View shows the posts in the search results the same way.
- Clicking (or tapping) a tag in the timeline or in a note also opens this tag search.

### 3. Show tags in suggestions and the sidebar list

Tags you use in Wrot are added to Obsidian's vault-wide tag list.

- They appear in the sidebar's Tags pane alongside your other tags.
- They are suggested when you type `tag:` in the search box.
- They are also suggested when you type `#` in a regular note.

---

## Which Tags Count

The same rules as tag autocomplete apply: only text that is displayed as a tag counts.

- A `#` inside a URL, link, inline code (` `), or formatting isn't treated as a tag.

---

## Settings

Turn **Tag integration** on or off in the "Advanced" section of the settings. It's on by default.

- When it's off, tags are used only inside Wrot again. They no longer appear in Graph View or search results, and clicking a tag runs a normal text search.

### Excluding specific tags

Tags you don't want mixed into the graph or tag list can be excluded one by one with tag rules.

1. In the **Tag Rules** section, turn on **Use tag rules**.
2. Add a rule for the tag you want to exclude, then turn on **Exclude from tag integration**.

Only the copies written inside Wrot are removed from the graph and search. Tags with the same name in a note's body or properties aren't affected.

Unlike tag colors, the order of tags in a post doesn't matter here.

---

## First Startup

The first time this feature runs, Wrot creates a **helper file (`integration.json`)**, so tags may take a moment to appear in the graph and search. From the second startup on, they appear right away.

---

## Troubleshooting

### Tags don't appear in Graph View

- Check that "Tags" is turned on in the graph's filter settings. Obsidian turns it off by default.
- Check that "Tag integration" is turned on in Wrot's settings.
- Check that the tag isn't set to "Exclude from tag integration" in a tag rule.
- Right after the first startup, wait a little for the setup to finish.

### Tag search doesn't find my posts

- Check that you're searching with `tag:#tag-name`. Tag search works differently from a normal text search.
- Tags excluded with a tag rule don't appear in tag search results either.

### A tag I deleted is still in the graph

- The graph updates when a note is saved. Wait a little, or reload Obsidian.
