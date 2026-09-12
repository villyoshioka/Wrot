# Wrot

**English** ・ [日本語](https://github.com/villyoshioka/Wrot/blob/main/docs/ja/README.md)

**Micro-journaling for Obsidian. Capture your day like you're tweeting to yourself.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](https://opensource.org/licenses/MIT)
[![release](https://img.shields.io/github/v/release/villyoshioka/Wrot)](https://github.com/villyoshioka/Wrot/releases/latest)

---

## What is Wrot?

Write + Jot = **Wrot**. It brings effortless micro-journaling to Obsidian, combining the depth of writing with the speed of quick note-taking.

Think of it as your own private social feed. You get the quick, low-friction feel of posting online, but with zero algorithm, zero audience, and zero pressure. Dump random thoughts, quick updates, or fleeting ideas as they happen.

Because every post drops straight into your daily notes, Wrot works hand-in-hand with Obsidian’s native search, backlinks, and review workflows without breaking a sweat.

---

## What you can do

- **A social-style timeline paired with a rich editor**  
  Browse your entries in a clean, chronological feed. The editor comes packed with a customizable toolbar for formatting, lists, quotes, and internal links ([learn more](https://github.com/villyoshioka/Wrot/blob/main/docs/en/toolbar.md)).
- **Keep important notes pinned**  
  Keep key notes or active tasks stuck to the top of your feed. You can even schedule a note to pin itself automatically on a future date ([learn more](https://github.com/villyoshioka/Wrot/blob/main/docs/en/pinning.md)).
- **Built right into Obsidian's tag system**  
  Tags in your posts act just like standard tags across your vault. They pop up in Graph View, show up in search, and open in Obsidian's global search with a click ([learn more](https://github.com/villyoshioka/Wrot/blob/main/docs/en/tag-integration.md)).
- **Tag autocomplete**  
  Type `#` in the input box to instantly see your most-used tags, making tagging fast and painless ([learn more](https://github.com/villyoshioka/Wrot/blob/main/docs/en/tag-autocomplete.md)).
- **Tag rules with auto color-coding**  
  Set custom background and text colors for specific tags to visually group your feed by project, mood, or urgency ([learn more](https://github.com/villyoshioka/Wrot/blob/main/docs/en/tag-rules.md)).
- **Internal links and rich link previews**  
  Mention notes using standard `![[]]` syntax or paste links to generate rich OGP link cards, keeping your context clear at a glance ([learn more](https://github.com/villyoshioka/Wrot/blob/main/docs/en/links-and-embeds.md)).
- **Hassle-free image attachments**  
  Paste images straight from your clipboard, drop them onto the screen, or pick files using the attachment button. Check thumbnail previews before hitting post.
- **Customizable look and feel**  
  Tweak the UI to fit your aesthetic with separate light/dark mode color schemes, custom post button labels, and custom icons.

---

## How it works

Wrot saves your entries as ` ```wr ` code blocks inside the file designated by Obsidian's Daily Notes plugin. No custom databases, no external servers, no vendor lock-in. Everything stays inside plain text files in your vault.

You can post, edit, and clean up entries directly from the timeline, or open the raw Markdown file whenever you prefer.

If you format your daily notes by week (like `GGGG年WW週`) or month (like `YYYY年MM月`), Wrot seamlessly adapts into a weekly or monthly log instead.

> **Note**: Wrot relies on Obsidian's core Daily Notes plugin, so make sure it is turned on.

---

## Requirements

- Obsidian **v1.13.0** or newer
- Supported platforms
  - macOS
  - iOS / iPadOS
  - Windows (untested)
  - Linux (untested)
  - Android (untested)

---

## Languages

Wrot supports **11 languages across 12 locales**. It automatically follows your Obsidian interface language and falls back to English if your language isn't supported yet.

| Language     | Locale  | Language            | Locale  |
| :----------- | :------ | :------------------ | :------ |
| Japanese     | `ja`    | French              | `fr`    |
| English (US) | `en`    | German              | `de`    |
| English (UK) | `en-GB` | Italian             | `it`    |
| Korean       | `ko`    | Russian             | `ru`    |
| Spanish      | `es`    | Traditional Chinese | `zh-TW` |
| Portuguese   | `pt`    | Simplified Chinese  | `zh-CN` |

---

## Quick Start

1. **Install Wrot** through the Community Plugins tab or manually.
2. **Open your timeline** by clicking the ribbon icon or triggering the "Open" command from the Command Palette.
3. **Start logging** by typing a note and pressing the post button or hitting `Ctrl / Cmd + Enter`.

### Installation

**Via Obsidian Community Plugins**

1. Go to Settings > Community plugins > Browse.
2. Search for `Wrot` and hit Install.
3. Once downloaded, click Enable.

**Manual Install**

1. Grab `main.js`, `manifest.json`, and `styles.css` from the latest [Release](https://github.com/villyoshioka/Wrot/releases).
2. Move all three files into `.obsidian/plugins/wrot/` inside your vault (create the `wrot` folder if needed).
3. Open Settings > Community plugins in Obsidian, hit Reload, and enable Wrot.

> **Tip**: The `.obsidian` folder is hidden by default. Press `Cmd + Shift + .` on macOS or turn on "Hidden items" under the View tab in Windows File Explorer to reveal it.

---

## Customization

Wrot gives you fine-grained control over how your feed looks and behaves.

- **Panel location**: Dock your timeline in the left sidebar, right sidebar, or main editor area.
- **Color themes**: Customize light and dark mode colors independently.
- **Tag rules**: Color-code specific tags for quick visual filtering.
- **Pinning**: Limit pinned items (1, 3, or 5 notes) and keep pinned notes sticky at the top when scrolling.
- **Button setup**: Customize post and update labels/icons, or hide the delete button from the post menu.
- **Timestamp format**: Adjust how dates and times display (e.g., `YYYY/MM/DD HH:mm:ss`).
- **Link previews**: Turn OGP link preview cards on or off.

---

## Privacy

Wrot does not track you or collect any data. Everything runs 100% locally on your device.

_Note: If link previews are enabled, Wrot sends a standard web request to the destination URL to retrieve preview metadata._

---

## License

[MIT License](https://github.com/villyoshioka/Wrot/blob/main/LICENSE)

---

## Credits

Wrot was built standing on the shoulders of these incredible projects. Huge thanks to the creators:

- [Obsidian Memos](https://github.com/Quorafind/Obsidian-Memos) (now [Thino](https://github.com/Quorafind/Obsidian-Thino)) by [Quorafind](https://github.com/Quorafind)
- [Mobile First Daily Interface (MFDI)](https://github.com/tadashi-aikawa/mobile-first-daily-interface) by [tadashi-aikawa](https://github.com/tadashi-aikawa)

Translations are powered by [Nani](https://nani.now/ja). Special thanks to [catnose](https://x.com/catnose99) (Kioku LLC) for such a helpful tool.

---

## Behind the Scenes

The project author handles all design, architecture, and quality control, leveraging Anthropic's Claude as a development assistant. For more details, see our [AI Use Policy](https://github.com/villyoshioka/Wrot/blob/main/AI_POLICY.md).

**Author**: Vill Yoshioka ([@villyoshioka](https://github.com/villyoshioka))
