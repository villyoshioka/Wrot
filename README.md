# Wrot

**English** ・ [日本語](https://github.com/villyoshioka/Wrot/blob/main/docs/ja/README.md)

**An Obsidian plugin for logging your day the way you'd post a tweet.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](https://opensource.org/licenses/MIT)
[![release](https://img.shields.io/github/v/release/villyoshioka/Wrot)](https://github.com/villyoshioka/Wrot/releases/latest)

![Wrot timeline in the main editor area](https://raw.githubusercontent.com/villyoshioka/Wrot/main/docs/images/timeline-desktop-en.png)

---

## What is Wrot?

Write + Jot = **Wrot**, a micro-journaling plugin for Obsidian.

You can jot things down as casually as on social media, but nobody else sees your posts and nothing reorders them. Ideas as they come and small thoughts about your day can go down without a second thought.

Posts are saved straight into your daily notes, so Obsidian's search, links, and Graph View work as usual.

<p align="center">
  <img src="https://raw.githubusercontent.com/villyoshioka/Wrot/main/docs/images/posting-mobile.gif" alt="Posting from the Wrot timeline on iPhone" width="280">
  <img src="https://raw.githubusercontent.com/villyoshioka/Wrot/main/docs/images/timeline-mobile.png" alt="Wrot timeline on iPhone" width="280">
</p>

---

## What you can do

- **A social-style timeline with a rich editor**  
  The post form hides Markdown syntax, so bold text and lists look finished as you write ([learn more](https://github.com/villyoshioka/Wrot/blob/main/docs/en/posting-form-v3.md)). The toolbar inserts formatting, lists, quotes, and links, and you can choose which buttons it shows and in what order ([learn more](https://github.com/villyoshioka/Wrot/blob/main/docs/en/toolbar.md)).
- **Pinning**  
  Keep important posts or current tasks at the top of the timeline. You can also schedule a post to be pinned on a future date. Posts with checkboxes can be pinned as a daily checklist that unchecks itself each time the date changes ([learn more](https://github.com/villyoshioka/Wrot/blob/main/docs/en/pinning.md)).
- **Obsidian tag integration**  
  Tags in your posts work like any other tag in your vault: they appear in Graph View and tag search, and clicking one opens Obsidian's search ([learn more](https://github.com/villyoshioka/Wrot/blob/main/docs/en/tag-integration.md)).
- **Tag autocomplete**  
  Type `#` in the post form to see tags you've used before ([learn more](https://github.com/villyoshioka/Wrot/blob/main/docs/en/tag-autocomplete.md)).
- **Tag rules (color-coding)**  
  Set a background and text color for each tag to color-code the timeline by topic, mood, or priority ([learn more](https://github.com/villyoshioka/Wrot/blob/main/docs/en/tag-rules.md)).
- **Links and URL previews**  
  Add links to notes in your vault or to web pages. Links to web pages are shown as cards with a title and thumbnail ([learn more](https://github.com/villyoshioka/Wrot/blob/main/docs/en/links-and-embeds.md)).
- **Post under a template heading**  
  Pick a heading from your daily note template, and posts are added under it. Templates made with Templater work too ([learn more](https://github.com/villyoshioka/Wrot/blob/main/docs/en/template-heading-selection.md)).
- **Image attachments**  
  Paste from the clipboard, drag and drop, or pick a file with the attachment button. Before posting, you can check or remove attachments from their thumbnails.
- **Appearance**  
  Colors follow Obsidian's theme, and you can also set your own for light and dark mode. The post button's icon and label can be changed too.

---

## Where posts are saved

Wrot saves each post as a ` ```wr ` code block in the note set by Obsidian's Daily Notes plugin. It uses no external database, so all data stays in files in your vault.

You can post, edit, and delete from the timeline, or open the note and edit it directly.

If your daily note format is weekly (like `GGGG年WW週`) or monthly (like `YYYY年MM月`), Wrot works as a weekly or monthly log.

> **Note**: Wrot needs Obsidian's core Daily Notes plugin to be turned on.

---

## Requirements

- Obsidian **v1.14.4** or newer
- Supported platforms
  - macOS
  - iOS / iPadOS
  - Windows (untested)
  - Linux (untested)
  - Android (untested)

---

## Languages

Wrot supports **11 languages across 12 locales**. It follows your Obsidian interface language and falls back to English for languages it doesn't support.

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

1. Install Wrot from Community plugins or manually.
2. Open the timeline with the ribbon icon, or run "Open in left sidebar", "Open in right sidebar", or "Open in main area" from the Command Palette.
3. Write a post and press the post button or `Ctrl / Cmd + Enter`.

### Installation

**Via Obsidian Community Plugins**

1. Go to Settings > Community plugins > Browse.
2. Search for `Wrot` and click Install.
3. When it finishes, click Enable.

**Manual Install**

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [Release](https://github.com/villyoshioka/Wrot/releases).
2. Move all three files into `.obsidian/plugins/wrot/` inside your vault (create the `wrot` folder if needed).
3. Open Settings > Community plugins in Obsidian, click the reload icon, and enable Wrot.

> **Tip**: The `.obsidian` folder is hidden by default. Press `Cmd + Shift + .` on macOS or turn on "Hidden items" under the View tab in Windows File Explorer to reveal it.

---

## Customization

The main settings are:

- **Panel location**: left sidebar, right sidebar, or main area
- **Color theme**: separate colors for light and dark mode
- **Tag rules**: background and text color for each tag
- **Pinning**: maximum number of pinned posts (1, 3, or 5), and whether they stay at the top while scrolling
- **Buttons**: labels and icons for the post and update buttons, and whether the post menu shows Delete
- **Timestamp format**: how dates and times are shown (e.g., `YYYY/MM/DD HH:mm:ss`)
- **Link previews**: OGP preview cards on or off

![Wrot timeline docked in the right sidebar](https://raw.githubusercontent.com/villyoshioka/Wrot/main/docs/images/sidebar-desktop-en.png)

---

## Privacy

Wrot does not track you or collect any personal data. Everything is processed on your device.

_Note: If link previews are on, Wrot requests the linked page to fetch its preview data._

---

## License

[MIT License](https://github.com/villyoshioka/Wrot/blob/main/LICENSE)

Publishing a fork? See [About Forks](https://github.com/villyoshioka/Wrot/blob/main/FORKING.md).

---

## Credits

Wrot was inspired by these projects. Thanks to their authors for the great work that came before.

- [Obsidian Memos](https://github.com/Quorafind/Obsidian-Memos) (now [Thino](https://github.com/Quorafind/Obsidian-Thino)) by [Quorafind](https://github.com/Quorafind)
- [Mobile First Daily Interface (MFDI)](https://github.com/tadashi-aikawa/mobile-first-daily-interface) by [tadashi-aikawa](https://github.com/tadashi-aikawa)

Translations are made with [Nani](https://nani.now/ja). Sincere thanks to [catnose](https://x.com/catnose99) (Kioku LLC) for making such a useful tool.

---

## Development

The author handles all design, architecture, and quality control, and uses Anthropic's Claude as a development assistant. For details, see the [AI Use Policy](https://github.com/villyoshioka/Wrot/blob/main/AI_POLICY.md).

**Author**: Vill Yoshioka ([@villyoshioka](https://github.com/villyoshioka))
