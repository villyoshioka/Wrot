# Working with Images, Links, and Embeds

Wrot integrates seamlessly with Obsidian’s native Markdown syntax, making it easy to display images, link to other notes, and show link previews for external websites.

This guide walks you through inserting these elements, how previews work, and a few key settings to keep in mind.

---

## 1. 📎 The Embed Button

The **📎 (Embed Button)** in the toolbar gives you a quick shortcut to insert images or link to other notes.

- **Inserting a new link**: Click the button without selecting any text to insert `![[ ]]`. The cursor will automatically land inside the brackets so you can start typing the file or note name right away.
- **Wrapping existing text**: Select any text and click the button to wrap it in `![[ ]]`.
- **Removing brackets**: Select text that is already wrapped in `![[ ]]` or `[[ ]]` and click the button. You can also click it again while your cursor is inside the brackets (when the button is highlighted) to remove them.

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
  - If you turn on "Image Folder" in Wrot's settings, any images attached through Wrot will go into a dedicated folder instead. If that folder doesn't exist, Wrot automatically falls back to your main Obsidian setting.
- **File names**: Images are automatically renamed using the format `Pasted Image YYYYMMDDHHmmss.<extension>`.

### A Few Things to Note

- **Attachment limit**: You can attach up to **1 image** per note.
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

Linking to other notes in your Vault uses the same bracket syntax.

```markdown
![[Note Name]]
[[Note Name]]
```

The 📎 button inserts `![[ ]]` by default. If you want a plain text link like `[[ ]]`, simply type the brackets yourself. Clicking either format opens the linked note.

---

## 5. Web Link Previews (OGP Cards)

When you include an external URL, Wrot can display it as a rich preview card with a title, description, and thumbnail.

### When Preview Cards Show Up

- **"URL Preview"** is enabled in Wrot's settings
- The link starts with `http://` or `https://`
- The destination website provides valid OGP metadata

### When Preview Cards Won't Show Up

- URL Previews are turned off in settings
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
- Verify that the image format is supported.

### Link preview cards aren't showing up

- Double-check that "URL Preview" is turned on in Wrot's settings.
- Make sure the website actually supports OGP meta tags.
- Direct links to image files will render as images rather than preview cards.
