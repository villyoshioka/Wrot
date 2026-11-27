# Working with Images, Links, and Embeds

Wrot uses Obsidian's own Markdown syntax for images, links to notes, and OGP previews of websites.

---

## 1. The Link Button

Use **Link** in the "⋯" menu to link text to a note in your Vault or to a web page.

- To add a new link, select the text you want to link, then press the button.
- To change an existing link, select the link text or place the cursor on the link, then press the button.

A field opens below the form. Type a **note name** or a **URL** and press `Enter` to confirm.

- As you type a note name, suggestions appear that you can pick with the arrow keys or a tap. Pressing `Enter` confirms what you typed.
- Anything starting with `https://`, `http://`, or `obsidian://` becomes an external link. Anything else links to a note in your Vault.
- When changing an existing link, press **Remove link** on the right of the field to remove the link.

In the post form, a link shows only its text, in the accent color. Links are saved like this:

| Link target   | Saved as                                                                         |
| :------------ | :------------------------------------------------------------------------------- |
| Note in Vault | `![[Note Name\|Link Text]]` (`![[Note Name]]` if the text matches the note name) |
| External URL  | `[Link Text](URL)`                                                               |

> **Changed in v3.0.0**
>
> The old 📎 (Embed) button has been merged into the Link button. If you had customized your toolbar layout, the 📎 button is removed automatically.

---

## 2. Attaching Images

### 3 Ways to Attach Images

1. **Image button (🖼️)**: Pick an image file on your device from the file dialog.
2. **Paste from the clipboard**: Paste an image copied from a screenshot or an image editor into the post form (`Ctrl + V` / `Cmd + V`).
3. **Drag and drop**: Drag an image file onto the post form.

### Where Images Are Saved and How They Are Named

- Images are **saved to your Vault when you post**. If you cancel the post, they are not saved.
- Images go to the folder set in Obsidian under Settings > Files and links > Default location for new attachments.
  - If you turn on "Custom attachment folder" in Wrot's settings, images attached in Wrot are saved to a separate folder. If that folder doesn't exist, they go to the location set in Obsidian.
- Files are renamed to `Pasted Image YYYYMMDDHHmmss.<extension>`.
- By default, attached images are compressed and stripped of location and other embedded data before saving. If you turn off "Compress images" in Wrot's settings, images are saved without compression.
  - Compressed images are saved as WebP. iPhone and iPad can't write WebP, so there they become JPEG or PNG (with transparency).
  - Animated images such as GIFs, and images that would not get smaller, are saved unchanged.

### Things to Know

- You can attach **one image** per post.
- Supported formats:
  - Image button: `PNG` / `JPEG` / `GIF`
  - Paste and drag and drop: the above plus `WebP` / `SVG` / `BMP`
- Copying an image file itself in Finder or File Explorer and pasting it is not supported. To add an image from your computer, use the Image button or drag and drop.

---

## 3. Embedding Images by Hand

You can also embed images from your Vault or the web by typing the syntax yourself.

### Images in Your Vault (Recommended)

```markdown
![[photo.png]]
```

If the file is in your Vault, the image is shown in the post. Supported extensions are `png`, `jpg`, `jpeg`, `gif`, `svg`, `webp`, and `bmp`.

### Web Image URLs

```text
https://example.com/photo.png
```

URLs ending in an image extension are shown as images whether link previews are on or off.

### Obsidian URL Scheme

```text
obsidian://open?vault=MyVault&file=photo.png
```

If the image is found in that Vault, it is shown as an image. Otherwise it is shown as a regular link.

---

## 4. Linking Between Notes

Besides the Link button, you can type links to other notes in your Vault by hand.

```markdown
![[Note Name]]
![[Note Name|Link Text]]
[[Note Name]]
```

- Text after `|` is shown instead of the note name.
- Clicking any of these opens the note. A link to a note that doesn't exist yet is shown in faint italics, and clicking it creates the note.
- Note links in posts appear in Graph View and backlinks like Obsidian's own links, and they are updated when you rename the note.

---

## 5. OGP Previews for Websites

An external URL can be shown as a card (an OGP card) with the page's title and thumbnail.

### When Preview Cards Appear

- **"Link previews"** is turned on in Wrot's settings
- The URL starts with `http://` or `https://`
- OGP data such as the title or description can be fetched from the page

### X (Twitter) Post Links

Post URLs on `https://twitter.com/...` and `https://x.com/...` are shown as a dedicated card.

---

## Troubleshooting

### Images aren't displaying properly

- Check that the file name and extension match the file in your Vault.
- Check that the closing brackets of `![[ ]]` aren't missing.
- Hand-typed image embeds stay as text in the post form but are shown as images in the timeline.
- Check that the image format is supported.

### Link preview cards don't appear

- Check that "Link previews" is turned on in Wrot's settings.
- Check that the website supports OGP (meta tags).
- Direct links to image files are shown as images, not cards.
