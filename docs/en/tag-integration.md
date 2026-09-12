# How Tag Integration Works

Since Obsidian treats Wrot memos as code blocks, any tags you write inside them won't show up in core features like the graph view or tag search.

**Tag Integration** fixes this. It makes tags inside your Wrot memos act just like normal tags in your notes, so they show up in the graph view and turn up in tag searches without a hitch.

Here is a quick overview of what this feature does, how it works, and how to exclude certain tags if you want to keep things clean.

---

## What You Can Do

### 1. Spot tags in the Graph View

Tags in your memos appear as nodes in the graph view, connected by lines to the daily notes where you wrote them.

- They blend seamlessly into the same node as matching tags from your regular notes or properties.
- Note that you'll need to turn on **Tags** in your graph view display settings, as Obsidian keeps this toggled off by default.

### 2. Find memos with Tag Search

Searching for `tag:#tag-name` brings up any notes that contain memos with that tag.

- Search results highlight exactly where the tag sits inside your memo.
- Clicking a tag node in the graph view pulls up your memos the exact same way.
- Tapping or clicking a tag on your timeline or inside a note instantly opens this tag search.

### 3. See tags in the Tag List and Search Autocomplete

Tags you use in Wrot get added right to your vault-wide tag list.

- They sit right alongside your everyday tags in the sidebar's Tags pane.
- They pop up as suggestions when you type `tag:` in the search bar.
- They show up in the autocomplete menu when you type `#` in a regular note.

---

## Which Tags Are Picked Up?

This feature only applies to text that renders as an actual tag on your screen, using the same rules as tag autocomplete.

Hashtags (`#`) inside URLs, links, inline code (` `), or formatted text aren't treated as tags. If something doesn't look like a tag on screen, it won't show up in the graph or in search results.

---

## How to Set It Up

You can toggle this on or off under **Tag Integration** in the "Advanced" section. It is turned on by default.

- **When toggled off:** Tags go back to working strictly inside Wrot. They won't show up in the graph view or tag searches, and clicking a tag will just run a basic text search instead.

### Excluding specific tags

If you have quick scratchpad tags that you'd rather not clutter your main graph or tag list with, you can exclude them individually using tag rules.

1. Go to **Tag Rules** and toggle on **Use Tag Rules**.
2. Add a rule for the tag you want to leave out, then turn on **Exclude from Tag Integration**.

Excluding a tag only hides the copies written inside Wrot from your graph and search results. Tags with the same name in your regular notes or properties won't be touched at all.

Unlike color rules, tag order doesn't matter here. Any tag set to be excluded will be left out individually across the board.

---

## First-Time Startup

When you run this feature for the first time, Wrot generates a small helper file called `tag-integration.json` to handle your tags. Because of this, it might take a moment for things to populate in the graph or search results on your very first run. Everything will update instantly from the second time onward.

---

## Troubleshooting

### Tags aren't showing up in the Graph View

- **Check your graph settings:** Make sure the Tags filter is toggled on in your graph view settings. Obsidian leaves this off by default.
- **Check plugin settings:** Make sure Tag Integration is turned on in Wrot's settings.
- **Check exclusion rules:** Double-check whether that tag has been set to Exclude from Tag Integration.
- **Just started up?** If you just launched Obsidian or enabled the plugin, give it a moment to finish setting things up.

### Memos aren't showing up in Tag Search

- **Check your search format:** Make sure you're using the `tag:#tag-name` search syntax. Standard text search works differently.
- **Check exclusion rules:** Tags excluded in your tag rules won't show up in search results either.

### A deleted tag is still sitting in the graph

- Obsidian updates the graph when a note saves. Try waiting a few seconds, or reload Obsidian if it doesn't update right away.
