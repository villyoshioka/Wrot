# Working with Images, Links, and Embeds

Wrot integrates seamlessly with Obsidian’s native Markdown syntax, making it easy to display images, link to other notes, and show link previews for external websites.

This guide walks you through inserting these elements, how previews work, and a few key settings to keep in mind.

---

## 1. The Link Button

Use **Link** in the "⋯" menu to link text to a note in your Vault or to a web page.

- **Creating a new link**: Select the text you want to link and click the button.
- **Editing an existing link**: Select the link text, or place your cursor on the link, and click the button.

A small pop-up field opens below the editor. Type a **note name** or a **URL** and press `Enter` to confirm.

- Typing a note name brings up suggestions you can pick with the arrow keys or a tap (`Enter` confirms exactly what you typed).
- Anything starting with `https://`, `http://`, or `obsidian://` becomes an external link. Anything else links to a note in your Vault.
- While editing an existing link, click **Remove link** on the right side of the field to unlink the text.

In the post editor, a link shows only its label, in your accent color. Links are saved like this:

| Link Type     | Saved Format                                                                             |
| :------------ | :--------------------------------------------------------------------------------------- |
| Note in Vault | `![[Note Name\|Label Text]]` (or simply `![[Note Name]]` if the label matches the name) |
| Web address   | `[Label Text](URL)`                                                                      |

> **Changed in Ver3.0.0**
>
> The old 📎 (Embed) button has been merged into the Link button. If you had customized your toolbar layout, the 📎 button is removed automatically.

---

## 2. Attaching Images (Pasting and Drag-and-Drop)

You can attach screenshots and photos directly into your post.

### 3 Ways to Attach Images

1. **Image Button (🖼️)**: Opens a file browser so you can pick an image from your device.
2. **Paste from Clipboard**: Copy an image from a screenshot tool or image editor, then paste it right into the editor (`Ctrl + V` / `Cmd + V`).
3. **Drag and Drop**: Drag an image file and drop it straight onto the post area.

### Where Images Are Saved and Naming Rules

- **Saving behavior**: Images are **saved to your Vault only when you publish your post**. If you discard the post, the file won't be saved.
- **Default folder**: By default, Wrot respects your main Obsidian preferences under Settings > Files and links > Default location for new attachments.
  - If you turn on "Custom attachment folder" in Wrot's settings, any images attached through Wrot will go into a dedicated folder instead. If that folder doesn't exist, Wrot automatically falls back to your main Obsidian setting.
- **File names**: Images are automatically renamed using the format `Pasted Image YYYYMMDDHHmmss.<extension>`.
- **Compression**: By default, attached images are compressed and stripped of location and similar embedded data before saving. Turn off "Compress images" in Wrot's settings to save them as they are.
  - Compressed images are saved as WebP. On iPhone and iPad, where WebP cannot be written, they become JPEG or PNG (with transparency) instead.
  - GIFs and other animated images are never compressed. An image that would not get smaller is also saved as is.

### A Few Things to Note

- **Attachment limit**: You can attach up to **1 image** per post.
- **Supported file types**:
  - Image Button: `PNG`, `JPEG`, and `GIF`
  - Paste / Drag-and-Drop: `PNG`, `JPEG`, `GIF`, as well as `WebP`, `SVG`, and `BMP`
- **Copying files in Finder or File Explorer**: Copying an image file directly from Finder or Explorer and pasting it isn't supported. To add an image from your computer, use the Image button or drag and drop it into the editor.

---

## 3. Embedding Images Manually

You can also embed images manually using Markdown, whether they live in your Vault or on the web.

### Images in Your Vault (Recommended)

```markdown
![[photo.png]]
```

If the file exists in your Vault, an inline preview will show up automatically.
Supported formats include `png`, `jpg`, `jpeg`, `gif`, `svg`, `webp`, and `bmp`.

### Web Image URLs

```text
https://example.com/photo.png
```

URLs that end with an image extension will automatically render inline as an image, regardless of your URL preview settings.

### Obsidian URL Scheme

```text
obsidian://open?vault=MyVault&file=photo.png
```

If Wrot can locate the image in the specified Vault, it renders as an image. If it can't find the file, it defaults to a standard link.

---

## 4. Linking Between Notes

Besides the Link button, you can also type links to other notes in your Vault by hand.

```markdown
![[Note Name]]
![[Note Name|Label Text]]
[[Note Name]]
```

- Text after `|` is shown in place of the note name.
- Clicking any of these opens the linked note. A link to a note that does not exist yet is shown in faint italics, and clicking it creates that note.
- Note links inside posts work just like Obsidian's own links: they show up in Graph View and backlinks, and are updated automatically when you rename the note.

---

## 5. Web Link Previews (OGP Cards)

When you include an external URL, Wrot can display it as a rich preview card with a title, description, and thumbnail.

### When Preview Cards Show Up

- **"Link previews"** is enabled in Wrot's settings
- The link starts with `http://` or `https://`
- The destination website provides valid OGP metadata

### When Preview Cards Won't Show Up

- Link previews are turned off in settings
- You are using internal links like `obsidian://`
- The link points directly to an image file (the image itself will display instead)
- The target page is restricted or doesn't share OGP data

### X (Twitter) Links

Links to posts on `https://twitter.com/...` and `https://x.com/...` are automatically formatted into a custom card designed specifically for social posts.

---

## Troubleshooting

### Images aren't displaying properly

- Make sure the file name and extension match the file in your Vault exactly.
- Check that you haven't missed a closing bracket in `![[ ]]`.
- In the post editor, hand-typed image embeds intentionally stay as raw text (they show up as images in the timeline).
- Verify that the image format is supported.

### Link preview cards aren't showing up

- Double-check that "Link previews" is turned on in Wrot's settings.
- Make sure the website actually supports OGP meta tags.
- Direct links to image files will render as images rather than preview cards.
