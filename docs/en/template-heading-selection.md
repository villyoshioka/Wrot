# How to Use Template Heading Selection

Wrot plays nicely with your daily note templates. By picking a target under "Template heading selection", you can tell Wrot exactly which heading your posts should land under. It is a great way to funnel quick thoughts into a section like "Today's Log", or just slip entries into the middle of a page rather than tacking them onto the end.

This works right out of the box with Obsidian's core templates, as well as setups powered by Templater.

Here is a quick walkthrough on how to set it up, where your entries end up, how dynamic titles are handled, and what happens if something goes missing.

---

## 1. How to Set It Up

1. Open Obsidian settings, head to "Daily notes", and make sure your template is linked under "Template file location".
2. In Wrot settings, scroll to the "General" section and open "Template heading selection".
3. Wrot will pull in every heading it finds in that template. Simply choose the one you want to use.

- Leave it set to "None" if you want things to work the old way, which drops every post at the very end of your note.
- The list reloads fresh each time you open the screen. If you tweak your template, just back out of settings and hop back in to see the changes.

---

## 2. Where Entries Land

New posts slip right into the tail end of the section you picked.

- A section runs from your target heading down to the next heading of the same or higher level.
- Multiple posts on the same day simply stack beneath one another in the order you sent them.
- Wrot pads each entry with a blank line above and below so your notes stay clean.
- If you have two identical headings on the page, Wrot always targets the first one it finds.
- Headings inside code blocks or within the text of your posts are ignored completely.

---

## 3. Headings with Dynamic Variables

You can still target headings even when they rely on variables like dates.

### What You Will See in the Menu

The picker displays the raw template markup rather than evaluated dates, and it drops the Markdown `#` marks to keep things readable.

If your template has a line like this:

```markdown
## <% tp.date.now("YYYY-MM-DD") %> Log
```

You will see `<% tp.date.now("YYYY-MM-DD") %> Log` in the list, rather than an expanded date like `2026-09-27 Log`.

### Obsidian's Built-in Variables

For variables like `{{date}}`, Wrot looks at the date of the note you are writing to, swaps it in, and tracks down the right heading.

### Templater Tags

- If the heading has regular text wrapped around a tag, such as `<% tp.date.now("YYYY-MM-DD") %> Log`, Wrot uses those surrounding words as an anchor to track it down.
- If the entire heading is just a Templater expression, Wrot knows how to evaluate the following tags on its own:
  - `tp.date.now`, `tp.date.today`, `tp.date.tomorrow`, and `tp.date.yesterday`
  - `tp.file.title`
- When resolving dates, Wrot checks both today's date and the date tied to the note itself, so backfilling older daily notes works without a hitch.
- Headings made up entirely of unsupported tags, like `<% tp.file.folder() %>`, will not appear in the menu because Wrot has no plain text to anchor to.
  - Adding even a single descriptive word outside the tag solves this, making the heading show up in your list and match reliably.

---

## 4. Templater Setup

To make sure your variables get expanded properly, open Templater settings and toggle on "Trigger Templater on new file creation" under "File creation". This toggle is stored locally on each device, so remember to flip it on across all your phones, tablets, and computers.

With this enabled, whenever Wrot spins up a brand-new daily note for your post, it gives Templater a moment to finish populating the page before dropping your text in.

- Your very first post of the day might take a second longer to appear while Templater wraps up.
- Because Wrot waits until Templater finishes, your post text is safe from being overwritten.

---

## 5. When Things Go Missing

### When a Note Lacks the Heading

Wrot simply appends the post to the end of the file instead, and pops up a quick alert letting you know the heading was not found.

- This heads-up only shows once per heading selection. If you re-select the heading later on, it will remind you again.
- Your settings stay intact, so notes that do have the heading will still catch posts in the right spot.

### When the Template Cannot Be Found

If your daily note template is unlinked or the file has gone missing, Wrot resets your heading choice back to "None", gives you a heads-up, and drops your post at the bottom of the page.

### When the Option Is Unavailable

"Template heading selection" stays locked on "None" whenever:

- You have not selected a daily note template
- The template file is missing from your vault
- The template has no headings that Wrot can read

If you delete the chosen heading from your template file, opening settings will automatically reset your choice back to "None".

---

## 6. Timeline Behavior

The timeline always lines up your posts by the exact time you sent them, latest first, regardless of where they actually sit inside the Markdown file. Posts grouped under a heading and posts tucked at the bottom of the page blend into a single chronological stream.

---

## Troubleshooting

### Headings Missing from the List

- Verify that a template is linked in Obsidian's "Daily notes" settings.
- Make sure your template actually uses Markdown headings like `## Notes`.
- Check if the heading is just a raw Templater tag that Wrot cannot read on its own. Adding a regular word outside the tag will bring it right up.
- Reopen the settings panel to make sure Wrot rescans your latest changes.

### Posts Not Landing Under the Heading

- Confirm that the heading actually exists in the daily note you are writing into.

### Headings Stuck as Raw Code

- Check whether "Trigger Templater on new file creation" is switched on in Templater. Remember that this setting does not sync across devices and has to be enabled manually on each one.
