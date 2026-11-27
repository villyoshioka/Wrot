# How to Use Template Heading Selection

Pick a heading from your daily note template in **"Template heading selection"**, and Wrot adds your posts under that heading. You can gather posts under a heading like "Today's Log", or place them in the middle of the note.

Obsidian's core templates and Templater templates are both supported.

---

## 1. How to Set It Up

1. In Obsidian's **"Daily notes"** settings, set your template under **"Template file location"**.
2. In Wrot's settings, open **"Template heading selection"** in the "General" section.
3. From the list, choose the heading you want posts added under.

- **None**: The default. Posts are added at the end of the note, as before.
- The list is reloaded from the template each time you open the settings. After editing the template, reopen the settings.

---

## 2. Where Posts Are Added

Posts are added at the end of the selected heading's section.

- The section runs from the selected heading to just before the next heading of the same or a higher level.
- Posts made later on the same day are added below the earlier ones.
- Each post gets one blank line before and after it.
- If the same heading appears more than once, posts go under the one nearest the top of the note.
- Headings written in a post's text or inside code blocks are not counted.

---

## 3. Headings with Variables

You can choose a heading even if it contains variables such as dates.

### How They Appear in the List

The list shows the text as written in the template, before variables are replaced with dates or other values. The heading marks (`#`) are not shown.

For example, if your template has this heading:

```markdown
## <% tp.date.now("YYYY-MM-DD") %> Log
```

the list shows `<% tp.date.now("YYYY-MM-DD") %> Log`.

### Obsidian Core Template Variables

Variables such as `{{date}}` are replaced with the date of the note being posted to, and then Wrot looks for the heading.

### Templater Variables

- For a heading with text besides the variable, such as `<% tp.date.now("YYYY-MM-DD") %> Log`, Wrot uses that text to find it.
- If the whole heading is a variable, Wrot can read the following and find the heading as it actually appears:
  - `tp.date.now`, `tp.date.today`, `tp.date.tomorrow`, `tp.date.yesterday`
  - `tp.file.title`
- Wrot searches with both the date of the note being posted to and today's date, so the heading is found even when you post to a note from a past date.
- A heading made only of other variables (for example, `<% tp.file.folder() %>`) has no text to go by, so it doesn't appear in the list.

---

## 4. Using Templater

For Templater to replace the variables in your template, turn on **"Trigger Templater on new file creation"** under "File creation" in Templater's settings on each device you use. This setting is saved per device.

With this setting on, when Wrot creates a new daily note for a post, it adds the post after Templater has finished.

- Only the first post of the day takes a moment to appear.
- When Templater processes the new note, your post text is not affected.

---

## 5. When the Heading or Template Can't Be Found

### When the Note Has No Such Heading

The post is added at the end of the note, and the notice "Heading not found in daily note; post was appended to the bottom." appears.

- The notice appears only the first time after you choose a heading. If you choose the heading again, it appears once more.
- The heading setting isn't cleared. In notes that have the heading, posts are still added under it.

### When the Template Can't Be Found

If no daily note template is set or the file can't be found when you post, "Template heading selection" goes back to "None" and a notice appears. The post is added at the end of the note.

### What the Settings Show

In these cases, "Template heading selection" stays at "None" and can't be changed:

- No daily note template is set
- The template file can't be found
- The template has no headings that can be shown in the list

If the heading you had chosen is removed from the template, the setting also goes back to "None" when you open the settings.

---

## 6. Timeline Order

The timeline is sorted by post time, newest first, regardless of where posts are in the note.

---

## Troubleshooting

### Headings don't appear in the list

- Check that a template is set in Obsidian's "Daily notes" settings.
- Check that the template has headings such as `## Notes`.
- Headings made entirely of Templater variables that Wrot can't read are not shown. Adding text besides the variable makes them appear.
- If you edited the template, reopen the settings.

### Posts aren't added under the heading

- Check that the note you're posting to has the selected heading.

### Note headings still show the variables

- Check that "Trigger Templater on new file creation" is on in Templater's settings. It's a per-device setting, so turning it on on another device has no effect.
