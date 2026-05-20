# How to Use Images, Links, and Embeds

Wrot supports images, note links, and URLs using the same syntax as Obsidian.
This page summarizes how to write each and how they are displayed.

---

## 📎 Embed Button

The 📎 button at the beginning of the input field toolbar is the gateway to all embeds supported by Wrot.
You can post images and Obsidian notes with this single button.

### How to Use

1. Pressing 📎 inserts `![[ ]]` and places the cursor inside.
2. Enter the file name in that state.

### When You Want to Wrap Selected Text

- If you select a file name and then press 📎, it will be automatically wrapped in `![[ ]]`.
- If you select a range already wrapped in `![[ ]]` or `[[ ]]` and press 📎, the syntax will be removed.

### Behavior When the Cursor is Inside `![[ ]]`

- The 📎 button will light up in an active state.
- Pressing it again will remove the `![[ ]]`.

---

## 🖼️ Attaching Images

You can paste images directly into the post form. This makes it easy to take a screenshot and post it immediately.

### Three Ways to Attach

1. Image Add Button — Pressing the image add button (to the left of 📎) at the beginning of the toolbar opens a file selection dialog.
2. Paste — Pasting an image from your clipboard into the post form (Cmd+V / Ctrl+V) will attach it. This applies to screenshots or images copied from image editing apps.
3. Drag & Drop — Dragging an image file into the post form and releasing it will attach it.

### Image Storage and File Names

- Images are saved only at the time of posting. If you close the form without posting, the image will not be saved anywhere.
- The storage location follows Obsidian's settings: Settings → Files & Links → Default location for new attachments.
- File names are automatically generated in the format `Pasted Image YYYYMMDDHHmmss.<extension>`.

### Important Notes

- Limit of one image per memo.
- Only PNG, GIF, and JPEG can be selected via the Image Add button. Paste and Drag & Drop also accept WebP, SVG, BMP, etc.
- Copying a file (Cmd+C / Ctrl+C) in your OS file manager (Finder / Explorer, etc.) and pasting it is not supported. To add an image from a file manager, use the Image Add button or Drag & Drop.

---

## 🖼️ Embedding Images Manually

If you want to embed an image already in your Vault or an image from an external URL, you can write the syntax directly.

There are three ways to display images in Wrot. All can be written manually or using the 📎 button.

### 1. Images Inside the Vault (Recommended)

```
![[photo.png]]
```

→ If the image exists in the Vault, it will be displayed as an image.

Supported extensions: `png` `jpg` `jpeg` `gif` `svg` `webp` `bmp`

### 2. Images on the Internet

```
https://example.com/photo.png
```

→ It will be displayed as an image regardless of whether the URL Preview setting is ON or OFF.

### 3. Images via Obsidian URL

```
obsidian://open?vault=MyVault&file=photo.png
```

→ If the image in the Vault can be resolved, it will be displayed as an image.
If it cannot be resolved, it will be displayed as a link.

---

## 🔗 Internal Note Links

You can also link to notes within your Vault.

```
![[Note Name]]
[[Note Name]]
```

The 📎 button only inserts `![[ ]]`. If you want to use `[[ ]]`, please write it manually.
In either syntax, clicking it will cause Obsidian to open that note.
Unlike images, notes are displayed as links.

---

## 🌐 URL Previews (OGP Cards)

External links can display information from the linked site as an OGP card.

### Conditions for Card Display

- "URL Preview" is turned ON in the settings.
- The URL starts with `http://` or `https://`.
- A title or description can be retrieved from the link destination.

### Cases Where Cards Are Not Displayed

- "URL Preview" is turned OFF in the settings.
- `obsidian://` URLs (these are files within a Vault, so they have no OGP information).
- Image URLs (these are displayed as image previews, not cards).
- Title or description could not be retrieved from the link destination.

### Twitter / X Posts

Links to `https://twitter.com/...` or `https://x.com/...` posts are displayed with a dedicated style.

---

## Troubleshooting

### Image Does Not Appear

- Check if the file name matches the file in the Vault exactly.
- Check if the extension is supported.
- Check if the `![[ ]]` brackets are closed correctly.

### URL Preview Does Not Appear

- Turn ON "URL Preview" in the settings.
- It will not appear if the destination does not have OGP information.
- For image URLs, it will be displayed as an image rather than an OGP card.
