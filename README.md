# Wrot

**English** ・ [日本語](https://github.com/villyoshioka/Wrot/blob/main/docs/ja/README.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](https://opensource.org/licenses/MIT)
[![release](https://img.shields.io/github/v/release/villyoshioka/Wrot)](https://github.com/villyoshioka/Wrot/releases/latest)

> **Note**: **While the source code is public, I do not offer individual support for this plugin.**

---

## What is Wrot?

Write + Jot = **Wrot**. It’s a lightweight micro-journaling plugin for Obsidian designed for quick thoughts and daily reflections.
Wrot offers the casual ease of social media, but in a private space that's for your eyes only—no algorithms, no external organization. Whether it’s a quick vent, a random thought, or a simple memo, it’s your space to keep whatever you want.
Everything you write is saved directly into your Daily Notes. This means it works seamlessly with Obsidian’s search, linking, and review features, making the app feel like a more natural extension of your daily life.

---

## Features

- **Rich UI** — A post editor with a dedicated toolbar for formatting, lists, links, and quotes. The timeline view makes writing and revisiting your notes feel intuitive and satisfying. See [Formatting Guide](https://github.com/villyoshioka/Wrot/blob/main/docs/en/formatting-guide.md) for more details.
- **Pin Important Notes** — Keep essential memos at the top of your timeline regardless of the date. Perfect for shopping lists, active tasks, or reminders you don't want to lose track of.
- **Tag Filtering** — Simply click a `#tag` to instantly view all related notes via Obsidian's built-in search.
- **Tag Autocomplete** — Typing `#` in the post form suggests tags from your past posts, so you can reuse your usual tags quickly and accurately. Can be turned off in settings.
- **Color-Coded Tags** — Assign custom background and text colors to your most-used tags. Posts will automatically highlight based on your rules, making it easy to categorize by mood, priority, or project at a glance. See [Using Tag Rules](https://github.com/villyoshioka/Wrot/blob/main/docs/en/tag-rules.md) for more details.
- **Links & URL Previews** — Supports internal links (![[]]), external URLs, and OGP cards. Get a quick look at link content with image previews. See [Using Images, Links, and Embeds](https://github.com/villyoshioka/Wrot/blob/main/docs/en/links-and-embeds.md) for more details.
- **Seamless Image Uploads** — Quickly attach screenshots or image files via paste, drag-and-drop, or the upload button. Preview thumbnails before you post, and easily remove any mistakes with a single click.
- **Fully Customizable** — Tailor your workspace by adjusting background/text colors and even customizing the post button’s text and icon.

---

## Where is my data stored?

Every note is stored as a ` ```wr ` code block directly within your Obsidian **Daily Notes**. There are no hidden databases or external services involved; everything stays locally within your Vault.

Since your data is stored in plain text, you can edit or delete entries simply by opening the note. You are always in full control of your data.

By adjusting the date format in Obsidian's "Daily Notes" settings (e.g., `GGGG-[W]WW` for weekly or `YYYY-MM` for monthly), you can easily adapt Wrot for weekly or monthly logging.

> **Requirement**: Wrot requires the Obsidian core plugin **"Daily Notes"** to be enabled.

---

## Requirements

- **Minimum Obsidian version**: 1.5.0
- Works on all platforms supported by [Obsidian](https://obsidian.md/):
  - macOS
  - iOS / iPadOS
  - Windows (Untested)
  - Linux (Untested)
  - Android (Untested)

---

## Supported Languages

Wrot supports **11 languages across 12 locales**. It automatically syncs with your Obsidian language settings and defaults to English for unsupported languages.

| Language            | Locale  |
| ------------------- | ------- |
| Japanese            | `ja`    |
| English (US)        | `en`    |
| English (UK)        | `en-GB` |
| Korean              | `ko`    |
| Spanish             | `es`    |
| Portuguese          | `pt`    |
| French              | `fr`    |
| German              | `de`    |
| Italian             | `it`    |
| Russian             | `ru`    |
| Traditional Chinese | `zh-TW` |
| Simplified Chinese  | `zh-CN` |

---

## Get Started in 3 Steps

1. **Install the Plugin** — Via the [Obsidian Community Store](#from-the-obsidian-community-store) or [Manual Installation](#manual-installation).
2. **Open the Sidebar** — Click the feather icon or use the Command Palette to "Open" to bring up your timeline.
3. **Start Writing** — Type your thoughts and hit the post button (or Ctrl/Cmd+Enter). That’s it—your daily log has begun.

### From the Obsidian Community Store

1. Go to Obsidian **Settings → Community Plugins → Browse**.
2. Search for `Wrot` and click **Install**.
3. Once installed, click **Enable**.

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [Releases](https://github.com/villyoshioka/Wrot/releases).
2. Open your Vault folder and place these files in `.obsidian/plugins/wrot/` (Create the folders if they don't exist).
3. Enable Wrot in Obsidian **Settings → Community Plugins** (If it doesn't appear, click the refresh icon).

> **Pro Tip**: The `.obsidian` folder is hidden by default. On macOS Finder, press `Cmd + Shift + .` to reveal it. On Windows, enable "Hidden items" in the File Explorer view settings.

---

## Settings

Wrot is highly customizable. Key settings include:

- **View Placement** — Choose between the left/right sidebar or the main editor area.
- **Themes** — Custom background and text colors for both Light and Dark modes.
- **Tag Styling** — Set specific colors for tags to categorize your timeline visually.
- **Pin Limits** — Choose to pin 1, 3, or 5 notes to the top.
- **Button Customization** — Change the post button’s label and icon.
- **Time Formats** — Customize how timestamps appear (e.g., `YYYY/MM/DD HH:mm:ss`).
- **URL Previews** — Toggle OGP card previews on or off.

---

## Privacy

Wrot operates entirely locally. Your data is never collected, shared, or tracked.

_External network requests are only made when URL Previews are enabled, specifically to fetch OGP data for the links you post._

---

## License

Wrot is licensed under the [MIT License](https://github.com/villyoshioka/Wrot/blob/main/LICENSE).

---

## Acknowledgments

Wrot was inspired by the following projects. A huge thank you to their developers:

- [Obsidian Memos](https://github.com/Quorafind/Obsidian-Memos) (Now: [Thino](https://github.com/Quorafind/Obsidian-Thino)) by [Quorafind](https://github.com/Quorafind)
- [Mobile First Daily Interface (MFDI)](https://github.com/tadashi-aikawa/mobile-first-daily-interface) by [tadashi-aikawa](https://github.com/tadashi-aikawa)

Special thanks to [catnose](https://x.com/catnose99) (Kioku LLC) for [Nani](https://nani.now/en), which helped refine the multilingual support for this plugin.

---

## Development

This plugin is developed by the author with the assistance of AI (Anthropic's Claude) to ensure high-quality design and functionality. For more details, see the [AI Usage Policy](https://github.com/villyoshioka/Wrot/blob/main/AI_POLICY.md).

**Developed by**: Vill Yoshioka ([@villyoshioka](https://github.com/villyoshioka))
