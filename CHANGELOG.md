# Release Notes

## 2.3.1 - 2026-05-26

### Bug Fixes

- Fixed an issue where the today button's color did not follow the text color setting.

---

## 2.3.0 - 2026-05-25

### New Features

- Added a calendar button to the date navigation. Tap it to jump to any date. You can toggle its visibility in the settings.

### Improvements

- Refined the design of the date navigation.

### Bug Fixes

- Fixed an issue where the preview highlight on decoration buttons could fail to activate on the first tap.

---

## 2.2.1 - 2026-05-25

### Bug Fixes

- Fixed an issue where the icon of the 3-dot menu button on a memo card did not change to the accent color while the menu was open.

---

## 2.2.0 - 2026-05-24

### New Features

- Added Simplified Chinese support. When Obsidian's language is set to "简体中文", the Wrot UI automatically switches to Simplified Chinese.

### Bug Fixes

- Fixed an issue where the right padding of memo blocks in Live View was narrower than the left padding.
- Improved an issue where the input form was slow to render on tablets when Obsidian was started or when the Wrot panel was opened while focus was inside a Live View card.

### Improvements

- Improved internal structure.

---

## 2.1.0 - 2026-05-24

### New Features

- Added Traditional Chinese support. When Obsidian's language is set to "繁體中文", the Wrot UI automatically switches to Traditional Chinese.

### Improvements

- Improved internal structure.

---

## 2.0.3 - 2026-05-23

### Improvements

- Improved internal structure.

---

## 2.0.2 - 2026-05-22

### Bug Fixes

- Stabilized the behavior of jumping from a quote card in Reading View.

### Improvements

- Adjusted the appearance of inline code in Live View.

---

## 2.0.1 - 2026-05-20

### Improvements

- Refined the toolbar CSS.

---

## 2.0.0 - 2026-05-20

### Important Changes

- Registered as an Obsidian Community Plugin. You can now search for and install `Wrot` from the Community Plugins screen.

### Updates

- Updated dependencies.

### New Features

- Added multi-language support. In addition to Japanese, the app now supports **9 languages across 10 locales**: English (US / UK), Korean, Spanish, Portuguese, French, German, Italian, Russian. It automatically follows Obsidian's language settings and falls back to English for unsupported languages. When the language is changed, the post button text, input field placeholder, and header date format will automatically update to the default values of the new language.

### Improvements

- Renamed "Quote" in the post's three-dot menu to "Quote Post." This makes it easier to distinguish from the "Quote" (Markdown blockquote) in the formatting menu.

---

## 1.14.0 - 2026-05-17

### Updates

- Updated dependencies.

### Deprecated

- Removed the "Jump to Original Note" feature that was previously added to the three-dot menu for pinned posts. It was retracted because it caused critical bugs that were difficult to fix.

### Bug Fixes

- Fixed an issue where the cursor could become invisible when creating a new line immediately after closing formatting (bold/italic) while the IME was in an unconfirmed state.
- Fixed a bug where the copy button on cards with tag color rules was not displaying correctly in Reading View.
- Fixed an issue where the display of quote cards would sometimes not follow checkbox operations on the timeline.
- Fixed an issue where jumping from a quote card would occasionally not work correctly.
- Fixed a bug where the display of blockquotes could become distorted.
- Adjusted some color schemes that were difficult to see.

---

## 1.13.1 - 2026-05-13

### Bug Fixes

- Fixed an issue where "Jump to Original Note" did not work correctly in Live Preview.

---

## 1.13.0 - 2026-05-13

### Updates

- Updated dependencies.

### New Features

- Added "Jump to Original Note" to the three-dot menu of pinned posts. It opens the corresponding Daily Note and scrolls to the specific block.

### Improvements

- Reduced the file size of the plugin.
- Clicking on a quote card now also scrolls the target block to the center of the screen.
- The icons for the three-dot menu button and the pinning indicator now sync with the text color settings.
- Obsolete setting items are now automatically cleaned up.

---

## 1.12.1 - 2026-05-11

### Bug Fixes

- Fixed a bug where clicking a date label would occasionally fail to open the Daily Note.

---

## 1.12.0 - 2026-05-11

### New Features

- Added scope settings for "Sub Colors" in Tag-Specific Color Rules. You can now toggle them ON/OFF for four different group units.

### Improvements

- Adjusted the color scheme.
- Reduced flickering when interacting with checkboxes.

---

## 1.11.0 - 2026-05-10

### Updates

- Updated dependencies.

### New Features

- Supported quoting from posts. By selecting "Quote" from the post's copy menu, you can insert a card into the current post that displays the content of the source. Clicking the quote card takes you to the original post.
  Additionally, separate tag color rules can be applied to the source and the quote, allowing them to be displayed with independent color schemes without interfering with each other.
- Added "Sub Color" settings to Tag-Specific Color Rules. You can now individually specify colors for sub-elements such as timestamps and blockquote vertical lines.

### Improvements

- Improved the nested representation of blockquotes (`>`).
- Adjusted the margins for each view.
- Organized the internal structure.

### Bug Fixes

- Fixed an issue on mobile where a white background would appear when tapping a disabled item in the post format menu.

---

## 1.10.2 - 2026-05-05

### Improvements

- Improved the response of the "Add Image" button's light-up display when closing the dialog.
- Changed the lock icon in Tag-Specific Color Rules to a design with a keyhole.

---

## 1.10.1 - 2026-05-04

### Updates

- Updated dependencies.

### Improvements

- The "Add Image" button now also lights up with the accent color when pressed.
- Modified the internal structure.

---

## 1.10.0 - 2026-05-03

### New Features

- Added a setting to customize the date format displayed in the date navigation. A "Header Date Format" has been added above the timestamp format.

### Improvements

- Improved the behavior of the bold and italic buttons both when clicking and when selecting text.
- Modified the internal structure.

---

## 1.9.1 - 2026-05-02

### Improvements

- Adjusted the layout of dropdown items in the settings screen for the mobile version.
- Changed the default background color to one that blends better with Obsidian's standard themes. This only applies to new installations or when resetting the background color.

---

## 1.9.0 - 2026-05-02

### Improvements

- Supported Obsidian's Weekly and Monthly note workflows. If you change the date format in Obsidian's "Daily Notes" settings to something like `GGGG-[W]WW` (Weekly) or `YYYY-MM` (Monthly), memos within the same week or month will be consolidated into the same note.
- Tapping a date label again will now focus on the existing tab instead of opening a new one.

---

## 1.8.2 - 2026-05-01

### Improvements

- Added a locking mechanism to each rule in "Change colors by tag" to prevent accidental changes. You can toggle the lock by tapping the lock icon; it will return to a locked state every time you reopen the settings screen.

---

## 1.8.1 - 2026-04-30

### Improvements

- Adjusted the position of the checkbox checkmark.
- Renamed the "Other Settings" category in the settings screen to "Display Settings."

---

## 1.8.0 - 2026-04-30

### New Features

- Added an image attachment feature to the post form. You can open a file selection dialog via the image button (next to the paperclip icon) in the toolbar. It also supports pasting from the clipboard (Cmd+V) and dragging and dropping image files into the form.

### Improvements

- Image files referenced via `obsidian://` URLs will now display as unresolved links if the file is deleted.

### Notes

- Only one image can be attached per memo.
- Only PNG, GIF, and JPEG can be selected in the file selection dialog. Pasting and drag-and-drop also accept WebP, SVG, BMP, etc.
- Image files are saved in the format `Pasted Image YYYYMMDDHHmmss.<extension>`.
- Copying and pasting files directly from the OS file manager (Finder / Explorer, etc.) is not supported. To add images from a file manager, use the "Add Image" button or drag and drop.

---

## 1.7.0 - 2026-04-27

### New Features

- When an image file is specified via an `obsidian://` URL (e.g., `obsidian://open?vault=MyVault&file=photo.png`), an image preview will be displayed with the same look as an `![[]]` embed. See [docs/en/links-and-embeds.md](docs/en/links-and-embeds.md) for details.

### Improvements

- Improved the visual balance when "Follow Obsidian Font Size" is ON. It now follows Obsidian's body text size while maintaining Wrot's original font size ratios (Body, UI Small, UI Extra Small).
- Readjusted the wording in the settings screen.

---

## 1.6.1 - 2026-04-25

### Improvements

- When "Follow Obsidian Font Size" is ON, the three-dot buttons and pin icons for each memo now also follow the font size.
- Adjusted the wording in the settings screen.

---

## 1.6.0 - 2026-04-24

### New Features

- Added a memo pinning feature. You can now pin memos to the top of the timeline regardless of the date. Pinned memos display a pin icon in the bottom right of the card.
- Added a "Pin Limit" item to the settings screen. You can choose from 1, 3, or 5. The default is 3.

### Improvements

- Replaced the copy button next to the timestamp on each memo with a three-dot menu. You can perform "Copy," "Pin," and "Unpin" actions from the menu.
- The active button now glows with the accent color while the three-dot menu is open. This makes it easier to see which menu is currently active.

### Notes

- If a pinned memo is deleted from the Daily Note within Obsidian, it will automatically be unpinned.
- If the pin limit is changed to a smaller value, the most recently pinned items will remain, and older ones will be unpinned to fit the limit.

---

## 1.5.0 - 2026-04-23

### New Features

- Supported code blocks (`~~~` syntax). They are displayed with syntax highlighting.
- Supported math blocks (`$$...$$`).
- The "Code" and "Math" buttons in the post form's three-dot menu now insert the block version when no text is selected. When text is selected, they insert the inline version as before.

### Notes

- Syntax highlighting for code blocks is disabled for memos with tag color rules applied. If you want to write code with highlighting, please do not use tags or use tags not registered in the rules.
- When writing a code block inside a memo, use `~~~` instead of ` ``` ` to avoid conflict with the outer ` ```wr ` fence.

---

## 1.4.5 - 2026-04-18

### Bug Fixes

- Fixed an issue where the font size for the entire timeline (post body, input fields, dates, buttons, etc.) was larger than before on mobile even when font size following was OFF. While v1.4.4 addressed this only for timestamps, all elements have now been returned to their original size.

---

## 1.4.4 - 2026-04-18

### Bug Fixes

- Fixed an issue where the timestamp font size on the mobile timeline was larger than before even when font size following was OFF.

---

## 1.4.3 - 2026-04-18

### New Features

- Added a "Follow Obsidian Font Size" toggle to the Basic Settings. When turned ON, Wrot's font size will link to Obsidian's appearance settings. The default is OFF, maintaining the original look.

### Improvements

- When adding a new tag-specific card color rule, the default background and text colors will now match your current theme (Light/Dark).

---

## 1.4.2 - 2026-04-16

### Bug Fixes

- Fixed a bug where the checkmark color for a successful copy (via the timeline copy button) did not use the accent color defined in the tag-specific card color rules.

---

## 1.4.1 - 2026-04-15

### New Features

- Added accent colors to Tag-Specific Card Color Rules. You can now override the color of tags, internal links, URLs, math highlighting, and copy-complete icons for each rule. Adjust this if the default accent color is hard to see against the background color. If left unset, the theme's accent color is used as before.

### Improvements

- Added "Basic Settings" and "Display Settings" headings to the settings screen to organize related items.
- Fine-tuned the settings screen.
- Fine-tuned the post form.

---

## 1.4.0 - 2026-04-14

### New Features

- Added Tag-Specific Card Color Rules. By registering a tag name with a background and text color in the settings, the color of posts containing that tag will change. This is reflected in the Wrot sidebar, Reading View, and Live Preview. If a post matches multiple rules, the color of the first tag mentioned in the body will be applied. OGP and Twitter cards also follow these rules.
- You can now open Wrot's settings screen directly from the toolbar's three-dot menu. This makes it easier to adjust color settings while writing posts.

### Improvements

- Toolbar buttons now automatically wrap to prevent overflowing in narrow sidebars or when pinned on iPad.
- Adjusted the post card width in the mobile timeline view to match Obsidian's sidebar width.

---

## 1.3.2 - 2026-04-14

### Improvements

- The post button icon and the input field placeholder can now be hidden by leaving them blank in the settings.
- Increased the margin at the bottom of the timeline in mobile view to prevent overlap with the bottom UI.

---

## 1.3.1 - 2026-04-13

### Updates

- Updated dependencies.

---

## 1.3.0 - 2026-04-13

### New Features

- Added "Link" to the toolbar's three-dot menu. It converts selected text into the `[text](URL)` format and moves the cursor to the URL input position.
- The input field placeholder can now be customized from the settings screen.

### Improvements

- Reordered the color settings in the settings screen.

### Bug Fixes

- Fixed a bug where the toolbar button remained in a selected state even after deleting the markers (`**` / `*`) in bold or italic mode.

---

## 1.2.0 - 2026-04-12

### New Features

- The post button icon can now be changed from the settings screen.

### Improvements

- Optimized the display for iPad. The layout now renders correctly in both fixed and non-fixed sidebars.

---

## 1.1.1 - 2026-04-11

### Improvements

- Revised the developer name and description displayed in the plugin list.

---

## 1.1.0 - 2026-04-11

### New Features

- Added an embed button to the toolbar that converts the selection into `![[selected text]]` with a single tap. Tapping again on a selection that is already `![[...]]` or `[[...]]` will remove the formatting.
- Internal links and embed links (`[[X]]` / `![[X]]`) now display as unresolved links if the target note does not exist. The display updates automatically when notes are created or deleted.

### Bug Fixes

- Fixed an issue in Reading View where the copy button for code blocks was always visible even without hovering.
- Fixed a bug in Live Preview where the background of the code block copy button (wr) was filled, making text at the end of the memo invisible.

---

## 1.0.3 - 2026-04-10

### Bug Fixes

- Fixed a bug on mobile where the background highlight remained after tapping date navigation buttons (Previous / Next / Today).

---

## 1.0.2 - 2026-04-10

### Improvements

- Added feedback when clicking a date label.

---

## 1.0.1 - 2026-04-09

### Bug Fixes

- Fixed a bug where the accent color was not reflected in tags, links, URLs, and math in Live Preview.
- Fixed an issue where memos could not be posted using Cmd+Enter (macOS) or Ctrl+Enter (Windows/Linux).

---

## 1.0.0 - 2026-04-09

Initial release.

### Feature List

- **Timeline View**: Displays a list of memos in card format in the sidebar.
- **Text Formatting**: Supports bold, italic, strikethrough, highlight, and inline code.
- **Inline Math**: Renders LaTeX formulas using $...$ syntax.
- **Lists**: Supports bulleted lists, numbered lists, and checklists.
- **Quotes**: Supports blockquotes (> ).
- **Tags**: Categorize memos with #tags and click to search.
- **Links/Embeds**: Supports internal links (![[]]), external URLs, and obsidian:// URLs.
- **URL Previews**: Displays OGP cards, Twitter/X embeds, and image previews.
- **Live Preview Support**: Rich formatting and hidden markers in the editor.
- **Reading View Support**: Rich display is also available in viewing mode.
- **Customization**: Background and text colors can be set separately for light and dark modes.
- **Checked Strikethrough**: Toggle strikethrough for completed checkboxes ON/OFF in settings.
- **BRAT Support**: Supports installation via BRAT.
