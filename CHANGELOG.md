# Release Notes

## 3.7.0 - 2026-11-27

### New Features

- Added Pin as Recurring, which unchecks a post's checkboxes each time the date changes

### Improvements

- Pressing Enter on a list item that starts with a date now also lets you carry on with `@` on the next item
- Improved translations

---

## 3.6.0 - 2026-11-24

### Updates

- Updated dependencies

### New Features

- Added picking a date to insert by typing `@date` in the post form
- Added inserting today's date by typing `@today` in the post form

### Improvements

- Adjusted the default text color
- Tapping the drums to choose a date for "Pin later" on phones and tablets no longer closes the menu

---

## 3.5.0 - 2026-11-19

### Important Changes

- If you were using the default background and text colors, they now follow Obsidian's own colors. To keep a fixed color, pick one in the settings.

### Updates

- Updated dependencies

### Improvements

- Background and text colors that are not set now follow Obsidian's own colors
- Improved translations

---

## 3.4.0 - 2026-11-15

### Important Changes

- Replaced the "Open" command with commands that choose where to open Wrot. If you had a hotkey assigned to it, please reassign it.

### New Features

- Added commands to open Wrot in the left sidebar, right sidebar, or main area, and to open its settings

### Improvements

- Made the plugin lighter

### Bug Fixes

- Fixed quote cards in Live Preview sometimes not showing the colors of the quoted post's tag rule
- Fixed URLs and quote links sometimes not being colored correctly while editing a post in Live Preview

---

## 3.3.1 - 2026-11-14

### Updates

- Updated dependencies

### Improvements

- Time input now works right after a space, not only at the start of a line
- Typing `@n` now offers `@now` in the time suggestions
- Time suggestions no longer grow too tall
- Improved the internal structure

---

## 3.3.0 - 2026-11-13

### Updates

- Updated dependencies

### New Features

- Added inserting a time by typing `@` at the start of a line in the post form, picked from a list or the current time with `@now`
- Added carrying on with a time on the next item when you press Enter on a list item that starts with a time

### Improvements

- Tag autocomplete now treats ø, ß, and similar letters the same as o and ss
- Adjusted the calendar size
- Improved the internal structure

---

## 3.2.0 - 2026-11-03

### Updates

- Updated dependencies

### Improvements

- Adapted to Pele, the new Mermaid rendering engine in Obsidian 1.15, so diagrams match the post's colors
- Indenting a list in the post form now moves its nested items too
- Tag autocomplete now ignores accents

---

## 3.1.1 - 2026-11-01

### Updates

- Updated dependencies

### Improvements

- The post form now gets the cursor when you press the Today button
- Adjusted the calendar size

### Bug Fixes

- Fixed the post form width breaking under certain conditions\
  With this fix, class names now start with wrot- instead of wr-, so CSS snippets that restyle Wrot need updating
- Fixed checkboxes toggled in the timeline sometimes reverting under certain conditions

---

## 3.1.0 - 2026-10-21

### Updates

- Updated dependencies

### New Features

- Added a way to copy just the code or math from the post menu

### Improvements

- Tab now indents inside code blocks in the post form
- Brackets and quotes now close automatically in the post form, and closing tags are filled in inside HTML and similar code blocks
- Improved translations

### Bug Fixes

- Fixed tag suggestions appearing when typing # inside a code block
- Fixed pins and Pin Later pins sometimes being removed under certain conditions
- Fixed checkboxes toggled in the daily note not showing up in the timeline right away

---

## 3.0.4 - 2026-10-17

### Updates

- Updated dependencies

### Bug Fixes

- Fixed the cursor disappearing instead of the menu opening when long-pressing the post form on mobile under certain conditions

---

## 3.0.3 - 2026-10-15

### Updates

- Updated dependencies

### Improvements

- Code blocks written with backticks are now changed to tildes when you post
- Improved translations

---

## 3.0.2 - 2026-10-12

### Improvements

- Improved the internal structure
- Made tag suggestions easier to tap

---

## 3.0.1 - 2026-10-11

### Improvements

- Improved plugin performance
- Tags and URLs in the post form are now shown in the accent color
- Tag suggestions now open with nothing selected
- Tags written with a full-width "＃" are now changed to "#" once you finish typing them

---

## 3.0.0 - 2026-10-11

### Important Changes

- Raised the minimum required version to Obsidian 1.14.4.
- Redesigned the post form so Markdown syntax is hidden and your text looks close to how it will appear. See [New Posting Form in Ver3.0.0 and Up](https://github.com/villyoshioka/Wrot/blob/3.0.1/docs/en/posting-form-v3.md) for what has changed.
- Removed the Embed button from the toolbar and merged it into the Link button. If you had customized your toolbar layout, the Embed button is removed automatically.

### Updates

- Updated dependencies

### New Features

- Added the ability to add and edit links to notes and web pages from the Link button
- Note links in posts now show up in Graph View and backlinks, and follow note renames
- Added support for showing note links with display text, such as `![[Note|Text]]`
- Added support for Obsidian 1.14's colored highlights, with a color menu on the Highlight button
- Added support for stacking formatting

### Improvements

- Tags and links inside formatting are now treated as tags and links
- Adjusted how list markers, checkboxes, and inline code are displayed
- Adjusted the colors of quotes and of the links and lists inside them
- Adjusted highlight colors to stay readable against the background

### Bug Fixes

- Fixed tags, links, and URL cards in Live Preview sometimes switching to editing instead of opening when pressed
- Fixed tags right inside bold text or highlights sometimes not being recognized

---

## 2.28.3 - 2026-10-03

### Updates

- Updated dependencies

### Improvements

- Adjusted code block highlight colors to stay readable against the background and text colors

---

## 2.28.2 - 2026-09-30

### Updates

- Updated dependencies

### Improvements

- The gradient brightness can now be chosen
- Adjusted the gradient style
- Rearranged the settings

---

## 2.28.1 - 2026-09-29

### Improvements

- Extended the gradient to the whole post form, and renamed the setting to "Post Form Gradient"
- Adjusted the gradient colors
- Improved translations

### Bug Fixes

- Fixed "Template heading selection" still being selectable on mobile when there are no headings to choose
- Fixed the cursor disappearing on mobile after pressing a toolbar button while text was still being composed

---

## 2.28.0 - 2026-09-27

### Updates

- Updated dependencies

### New Features

- Added Template Heading Selection, which puts your posts under a heading you pick from your daily note template (choose one in "Template Heading Selection" in the settings)
- Added an accent-color gradient for the post button (turn on "Post Button Gradient" in the settings)

---

## 2.27.0 - 2026-09-21

### Updates

- Updated dependencies

### New Features

- Added compression of attached images and removal of location and similar data (turn off "Compress Images" in the settings to save them as before)

### Improvements

- Improved the internal structure
- Improved translations

### Bug Fixes

- Fixed obsidian:// links to a missing note or a wrong path being shown as if the file existed
- Fixed full-width punctuation right after a URL being treated as part of the link
- Fixed the "Strikethrough for Checked Items" setting not applying to open notes until they were reopened

### Notes

- Compressed images are saved as WebP, except on iPhone and iPad, where WebP cannot be written and they become JPEG or PNG instead.

---

## 2.26.0 - 2026-09-12

### Updates

- Updated dependencies

### New Features

- Added a setting to open Wrot when Obsidian starts while the display position is Main Area (turn on "Open on Startup" in the settings)

### Improvements

- Reworked the startup path so Wrot loads lighter
- Changes to the display position now take effect right away

### Bug Fixes

- Fixed draft restore and tag integration not running when Obsidian starts with Wrot's tab hidden

---

## 2.25.0 - 2026-09-07

### New Features

- Toolbar buttons can now be disabled
- Pinned posts now scroll along with the timeline (turn on "Keep Pins at the Top" in the settings to keep them at the top)

### Improvements

- Made tag rules easier to add
- The default date formats now follow Obsidian's language
- In the default toolbar, Pin Later has moved into the three-dot menu
- Adjusted the post layout
- Made the plugin lighter

### Bug Fixes

- Fixed the timeline becoming unscrollable at large font sizes when pins are kept at the top

---

## 2.24.2 - 2026-09-05

### Bug Fixes

- Fixed the three-dot menus on phones leaving extra space under the last item when following Obsidian's font size
- Fixed the three-dot menus on desktop and tablet not scrolling when their items do not fit on screen, leaving the lower items out of reach

---

## 2.24.1 - 2026-09-05

### Updates

- Updated dependencies

### Bug Fixes

- Fixed the layout sometimes breaking when following Obsidian's font size
- Fixed the items inside the three-dot menus not following the font size
- Fixed the Pin Later calendar still paging back to months and years with nothing left to pick

---

## 2.24.0 - 2026-09-03

### Updates

- Updated dependencies

### Improvements

- An unposted draft is now kept
- Opening Wrot from the command now places the cursor in the post form
- Adjusted the spacing of the toolbar while it is being arranged

### Bug Fixes

- Fixed another post sometimes disappearing from the timeline when a post was pinned
- Fixed the Pin Later allowance sometimes not being freed when a waiting post was deleted
- Fixed Pin Later staying pressable in the toolbar's menu when its allowance was full

---

## 2.23.0 - 2026-08-29

### Updates

- Updated dependencies

### New Features

- The post form's toolbar can now be arranged

### Improvements

- Bold and italic now leave a space after the closing marks when applied to a selection, the same as when the marks are closed while writing
- The toolbar's menu and the Pin Later date picker now follow the post form when the pane is resized while they are open

### Bug Fixes

- Fixed the toolbar's menu and the Pin Later date picker not lining up with the right edge of the post form
- Fixed past years being selectable in the year list of the Pin Later date picker

---

## 2.22.1 - 2026-08-25

### Improvements

- A post set with Pin Later is now pinned as soon as you come back to Obsidian on its day
- Improved the internal structure

### Bug Fixes

- Fixed the clock mark shown while a post waits for its Pin Later day appearing fainter than the pin mark
- Fixed the Pin Later button in the post form's toolbar not closing the date picker when pressed a second time

---

## 2.22.0 - 2026-08-25

### New Features

- Added Pin Later, which pins a post on a day you choose
- Pin Later can also be set from the post form's toolbar while you are still writing

### Improvements

- The post form now offers a button for backing out of an edit
- Added press feedback to the toolbar buttons and the post menu buttons
- Split the post menu into three groups so items are easier to find

---

## 2.21.1 - 2026-08-22

### Updates

- Updated dependencies

### Bug Fixes

- Fixed the link card breaking up on a phone or in a narrow pane, where lines were cut in half or ran into each other

---

## 2.21.0 - 2026-08-21

### Improvements

- Shortened the descriptions in the settings
- Moved the image folder settings below the calendar settings

### Bug Fixes

- Fixed the lock on a tag rule ending up on a different rule after one was deleted

---

## 2.20.0 - 2026-08-20

### New Features

- Added a setting for the folder images added from Wrot are saved to

### Improvements

- Improved the internal structure

### Bug Fixes

- Fixed the sub color of a tag rule not following a change of background or text color in the settings right away
- Fixed the text for a missing embedded image not matching the color of an unresolved link

---

## 2.19.1 - 2026-08-15

### Updates

- Updated dependencies

### Bug Fixes

- Fixed a decoration being applied even though it had not been closed
- Fixed a decoration sometimes leaving one of its markers on screen
- Fixed the icon gallery link in the settings being hard to tell apart from the text around it

---

## 2.19.0 - 2026-08-12

### Updates

- Updated dependencies

### Improvements

- Tab in the post form now indents a list item, and Shift+Tab outdents it
- Made a half-width space, an ideographic space and a tab all indent by the same level
- Made a new line keep the list level, and an empty item step out one level
- Made numbered lists count by position rather than by the digits typed

### Bug Fixes

- Fixed nested lists being shown as written instead of as levels
- Fixed the posts of a deleted note staying in the timeline until the date was changed

---

## 2.18.0 - 2026-08-06

### New Features

- Added post deletion (turn on "Delete Button" in the settings)
- Added "Disable delete button" to the tag rules

### Bug Fixes

- Fixed the placeholder shown in place of a quoted post that no longer exists being displayed in Japanese in every language

---

## 2.17.0 - 2026-08-05

### Updates

- Updated dependencies

### New Features

- Added post editing
- Added "Update Button Text" and "Update Button Icon" to the settings

---

## 2.16.1 - 2026-07-31

### Improvements

- Applied the line breaks of setting descriptions to all languages
- Improved the internal structure

---

## 2.16.0 - 2026-07-31

### Important Changes

- Raised the minimum required version to Obsidian 1.13.0.

### Updates

- Updated dependencies

### New Features

- Added support for the new settings API in Obsidian 1.13.0 and later
- Added "Hide from timeline" to tag rules

### Improvements

- Shortened the setting descriptions
- Removed the button for deleting tag autocomplete candidates
- Made the plugin start up faster
- Tag integration no longer re-reads unchanged notes on every startup

---

## 2.15.2 - 2026-07-27

### Improvements

- Improved the internal structure

---

## 2.15.1 - 2026-07-27

### Bug Fixes

- Fixed toggling a checkbox sometimes applying to the wrong post
- Fixed tags staying behind after reloading during the tag integration scan

### Improvements

- Reduced unnecessary work when refreshing the display
- Improved the internal structure

---

## 2.15.0 - 2026-07-14

### Improvements

- The post button text can now be left blank for an icon-only button when an icon is set
- Changed some of the colors used while tag autocomplete is open

---

## 2.14.1 - 2026-07-12

### Bug Fixes

- Fixed quote cards and URL previews being shown in source mode
- Fixed the nested quote marker "QT:" inside quote cards appearing in the same accent color as links
- Fixed the screen briefly shifting up and down when jumping to a quoted post under certain conditions

---

## 2.14.0 - 2026-07-11

### Improvements

- Tags in posts can now be pressed to search in Reading View and Live Preview as well
- Made it easier to tell when a tag has been pressed
- Changed the library loading order to improve plugin performance

### Notes

- If you use math, the first expression after startup may take a moment to appear. After that, math appears right away as before.

---

## 2.13.0 - 2026-07-10

### New Features

- Added Tag Integration

### Improvements

- Unified the checkbox behavior in Live Preview with Reading View
- Aligned the copy button in Reading View with the top-right corner of the block
- Adjusted the order and wording of the settings screen

### Bug Fixes

- Fixed text on phones sometimes not being deletable right after picking a suggestion

### Notes

- On the first launch after updating, Wrot creates the file that tag integration uses, so tags may take a moment to show up in graph view and tag search. Later launches do not take this extra time.

---

## 2.12.1 - 2026-07-08

### Bug Fixes

- Fixed the vertical quote line color in Live Preview not matching the timeline and Reading View

---

## 2.12.0 - 2026-07-05

### Improvements

- Significantly reworked the internal structure

### Bug Fixes

- Fixed the copy button staying unlit and appearing to float during the quote-jump flash on cards with a tag rule color
- Fixed the pin mark on mobile being misaligned with the timestamp and the three-dot button
- Fixed the strikethrough sometimes lagging and quote cards flickering when a checkbox was toggled in the timeline
- Fixed the post form sometimes twitching continuously with themes that heavily restyle buttons

---

## 2.11.0 - 2026-07-04

### Improvements

- Improved the tag autocomplete settings UI
- Adjusted the descriptions in settings

---

## 2.10.0 - 2026-07-02

### Updates

- Updated dependencies

### New Features

- Added tag autocomplete

### Improvements

- Improved the internal structure

---

## 2.9.1 - 2026-06-24

### Bug Fixes

- Fixed the layout breaking when Wrot was opened in the main area on phones

---

## 2.9.0 - 2026-06-23

### Deprecated

- Removed Zen Mode after finding through actual use that it did not fit Wrot.

### Improvements

- The three-dot menu now always opens in the same position
- Improved how the display adapts to width and layout
- Buttons now also change size when following the font size

---

## 2.8.0 - 2026-06-21

### Updates

- Updated dependencies

### New Features

- Added Zen Mode
- Added a setting for pinned post visibility in Zen Mode

---

## 2.7.2 - 2026-06-12

### Updates

- Updated dependencies

### Improvements

- Aligned the vertical position of checkboxes with the text
- Improved the internal structure

---

## 2.7.1 - 2026-06-12

### Updates

- Updated dependencies

### Improvements

- Tapping a URL card on mobile now gives the same visual feedback as on desktop
- Improved the internal structure

### Bug Fixes

- Fixed an extra blank line sometimes appearing in posts with a quote nested inside a quote
- Fixed the three-dot menu button sometimes not changing color while the menu was open

---

## 2.7.0 - 2026-06-07

### Important Changes

- Renamed the "Open Wrot" command to "Open". If you had a hotkey assigned to it, please reassign it.
- Raised the minimum required version to Obsidian 1.8.7.

### Updates

- Updated dependencies

### Improvements

- Improved the internal structure
- Balanced the left and right spacing around posts containing images in Reading View

---

## 2.6.1 - 2026-06-07

### Improvements

- Improved the internal structure

---

## 2.6.0 - 2026-06-07

### New Features

- Added a setting to choose the shape of calendar date buttons

### Improvements

- Moved the tag rule settings into their own section in the settings
- Adjusted the defaults for new installs to match Obsidian's default theme
- Adjusted the position of the copy button relative to the first line of a post in Reading View

### Bug Fixes

- Fixed an extra border sometimes appearing around the post form's input field with some themes

---

## 2.5.1 - 2026-05-31

### Bug Fixes

- Fixed the post button being pressable while the post was empty

---

## 2.5.0 - 2026-05-30

### Improvements

- Changed the month and year display to the natural order for each language
- Tapping a date or year in the calendar on phones now shows what you tapped
- Adjusted the calendar borders and shadows

---

## 2.4.0 - 2026-05-29

### Updates

- Updated dependencies

### Improvements

- Revamped the calendar so it looks and works the same on desktop, phones, and tablets

---

## 2.3.2 - 2026-05-27

### Bug Fixes

- Fixed blockquotes sometimes not working correctly under certain conditions

---

## 2.3.1 - 2026-05-26

### Bug Fixes

- Fixed the Today button's color not following the text color setting

---

## 2.3.0 - 2026-05-25

### New Features

- Added a calendar button to the date navigation

### Improvements

- Refined the design of the date navigation

### Bug Fixes

- Fixed the highlight on formatting buttons pressed without selecting text sometimes not showing the first time

---

## 2.2.1 - 2026-05-25

### Bug Fixes

- Fixed the three-dot menu button on a post not turning the accent color while the menu was open

---

## 2.2.0 - 2026-05-24

### New Features

- Added Simplified Chinese support

### Bug Fixes

- Fixed the right padding of posts in Live Preview being narrower than the left
- Fixed the post form being slow to appear on tablets when Wrot was opened right after Obsidian started or while the cursor was in Live Preview

### Improvements

- Improved the internal structure

---

## 2.1.0 - 2026-05-24

### New Features

- Added Traditional Chinese support

### Improvements

- Improved the internal structure

---

## 2.0.3 - 2026-05-23

### Improvements

- Improved the internal structure

---

## 2.0.2 - 2026-05-22

### Bug Fixes

- Stabilized the behavior of jumping from a quote card in Reading View

### Improvements

- Adjusted the appearance of inline code in Live Preview

---

## 2.0.1 - 2026-05-20

### Improvements

- Refined the toolbar CSS

---

## 2.0.0 - 2026-05-20

### Important Changes

- Registered as an Obsidian Community Plugin. You can now search for and install `Wrot` from the Community Plugins screen.

### Updates

- Updated dependencies

### New Features

- Added multi-language support for 9 languages across 10 locales

### Improvements

- Renamed "Quote" in the post's three-dot menu to "Quote Post"

---

## 1.14.0 - 2026-05-17

### Updates

- Updated dependencies

### Deprecated

- Removed "Jump to Original Note" from the three-dot menu of pinned posts, because it caused serious bugs that were hard to fix.

### Bug Fixes

- Fixed the cursor sometimes disappearing when starting a new line right after closing bold or italic while text was still being composed
- Fixed the copy button on posts with a tag rule not showing correctly in Reading View
- Fixed quote cards sometimes not updating after a checkbox was toggled in the timeline
- Fixed jumping from a quote card sometimes not working correctly
- Fixed blockquotes sometimes looking broken
- Adjusted some color schemes that were difficult to see

---

## 1.13.1 - 2026-05-13

### Bug Fixes

- Fixed "Jump to Original Note" not working correctly in Live Preview

---

## 1.13.0 - 2026-05-13

### Updates

- Updated dependencies

### New Features

- Added "Jump to Original Note" to the three-dot menu of pinned posts

### Improvements

- Made the plugin lighter
- Pressing a quote card now also scrolls the target block to the center of the screen
- The three-dot menu and pin mark icons now follow the text color setting
- Settings that are no longer used are now cleaned up automatically

---

## 1.12.1 - 2026-05-11

### Bug Fixes

- Fixed clicking a date label sometimes not opening the daily note

---

## 1.12.0 - 2026-05-11

### New Features

- Added scope settings for "Sub Colors" in Tag-Specific Color Rules

### Improvements

- Adjusted the color scheme
- Reduced flickering when interacting with checkboxes

---

## 1.11.0 - 2026-05-10

### Updates

- Updated dependencies

### New Features

- Added quoting posts
- Added "Sub Color" settings to Tag-Specific Color Rules

### Improvements

- Improved how nested quotes are displayed
- Adjusted the margins for each view
- Improved the internal structure

### Bug Fixes

- Fixed a white background appearing on mobile when tapping a disabled item in the toolbar's three-dot menu

---

## 1.10.2 - 2026-05-05

### Improvements

- Improved how the "Add Image" button's highlight responds when the image picker is closed
- Changed the lock icon in Tag-Specific Color Rules to one with a keyhole

---

## 1.10.1 - 2026-05-04

### Updates

- Updated dependencies

### Improvements

- The "Add Image" button now also lights up with the accent color when pressed
- Improved the internal structure

---

## 1.10.0 - 2026-05-03

### New Features

- Added a setting to customize the date format displayed in the date navigation

### Improvements

- Improved the behavior of the bold and italic buttons both when clicking and when selecting text
- Improved the internal structure

---

## 1.9.1 - 2026-05-02

### Improvements

- Adjusted the layout of dropdowns in the settings on mobile
- Changed the default background color to one that blends better with Obsidian's standard themes

---

## 1.9.0 - 2026-05-02

### Improvements

- Supported Obsidian's Weekly and Monthly note workflows
- Tapping a date label again now focuses the existing tab instead of opening a new one

---

## 1.8.2 - 2026-05-01

### Improvements

- Added a lock to each rule in "Change colors by tag" to prevent accidental changes

---

## 1.8.1 - 2026-04-30

### Improvements

- Adjusted the position of the checkbox checkmark
- Renamed the "Other Settings" category in the settings screen to "Display Settings"

---

## 1.8.0 - 2026-04-30

### New Features

- Added image attachments to the post form

### Improvements

- Image files referenced via `obsidian://` URLs now display as unresolved links if the file is deleted

### Notes

- Only one image can be attached per post.
- Only PNG, GIF, and JPEG can be selected in the file selection dialog. Pasting and drag-and-drop also accept WebP, SVG, BMP, etc.
- Image files are saved in the format `Pasted Image YYYYMMDDHHmmss.<extension>`.
- Copying a file in Finder or Explorer and pasting it is not supported. To add an image from Finder or Explorer, use the "Add Image" button or drag and drop it.

---

## 1.7.0 - 2026-04-27

### New Features

- Added image previews, shown like an `![[]]` embed, for image files linked with an `obsidian://` URL

### Improvements

- Improved the visual balance when "Follow Obsidian Font Size" is on
- Adjusted the wording in the settings screen

---

## 1.6.1 - 2026-04-25

### Improvements

- When "Follow Obsidian Font Size" is on, the three-dot buttons and pin icons on each post now also follow the font size
- Adjusted the wording in the settings screen

---

## 1.6.0 - 2026-04-24

### New Features

- Added pinning posts
- Added a "Pin Limit" item to the settings screen

### Improvements

- Replaced the copy button next to the timestamp on each post with a three-dot menu
- The button you pressed now glows with the accent color while the three-dot menu is open

### Notes

- If you delete a pinned post from its daily note, it is unpinned automatically.
- If you lower the pin limit, the most recently pinned posts stay pinned and older ones are unpinned to fit.

---

## 1.5.0 - 2026-04-23

### New Features

- Added support for code blocks (`~~~` syntax)
- Added support for math blocks (`$$...$$`)
- Pressing "Code" or "Math" in the post form's three-dot menu without selecting text now inserts a block

### Notes

- Syntax highlighting in code blocks is turned off for posts with a tag color rule. To get highlighting, leave the post untagged or use a tag that is not in any rule.
- To write a code block inside a post, use `~~~` instead of ` ``` ` so it does not clash with the outer ` ```wr ` fence.

---

## 1.4.5 - 2026-04-18

### Bug Fixes

- Fixed posts, the input field, dates, buttons, and other text on mobile appearing larger than before even when font size following was off

---

## 1.4.4 - 2026-04-18

### Bug Fixes

- Fixed timestamps on mobile appearing larger than before even when font size following was off

---

## 1.4.3 - 2026-04-18

### New Features

- Added "Follow Obsidian Font Size" to the Basic Settings

### Improvements

- New tag-specific card color rules now start with background and text colors that match your light or dark theme

---

## 1.4.2 - 2026-04-16

### Bug Fixes

- Fixed the checkmark shown after copying with the timeline copy button not using the accent color of the tag-specific card color rule

---

## 1.4.1 - 2026-04-15

### New Features

- Added accent colors to Tag-Specific Card Color Rules

### Improvements

- Added "Basic Settings" and "Display Settings" headings to the settings screen to organize related items
- Fine-tuned the settings screen
- Fine-tuned the post form

---

## 1.4.0 - 2026-04-14

### New Features

- Added Tag-Specific Card Color Rules
- You can now open Wrot's settings screen directly from the toolbar's three-dot menu

### Improvements

- Toolbar buttons now wrap automatically instead of overflowing in narrow sidebars or when the sidebar is pinned on iPad
- Adjusted the post card width in the mobile timeline view to match Obsidian's sidebar width

---

## 1.3.2 - 2026-04-14

### Improvements

- The post button icon and the input field placeholder can now be hidden by leaving them blank in the settings
- Increased the margin at the bottom of the timeline in mobile view to prevent overlap with the bottom UI

---

## 1.3.1 - 2026-04-13

### Updates

- Updated dependencies

---

## 1.3.0 - 2026-04-13

### New Features

- Added "Link" to the toolbar's three-dot menu
- The input field placeholder can now be customized from the settings screen

### Improvements

- Reordered the color settings in the settings screen

### Bug Fixes

- Fixed a toolbar button staying lit after deleting the markers (`**` / `*`) when bold or italic was pressed without selecting text

---

## 1.2.0 - 2026-04-12

### New Features

- The post button icon can now be changed from the settings screen

### Improvements

- Optimized the display for iPad

---

## 1.1.1 - 2026-04-11

### Improvements

- Changed the developer name and description shown in the plugin list

---

## 1.1.0 - 2026-04-11

### New Features

- Added an embed button to the toolbar that turns the selection into `![[selected text]]`
- Internal links and embed links (`[[X]]` / `![[X]]`) now display as unresolved links if the target note does not exist

### Bug Fixes

- Fixed the code block copy button in Reading View always being visible, even without hovering
- Fixed the code block copy button (wr) in Live Preview having a filled background that hid text at the end of the post

---

## 1.0.3 - 2026-04-10

### Bug Fixes

- Fixed the background color staying on mobile after tapping the date navigation buttons (Previous / Next / Today)

---

## 1.0.2 - 2026-04-10

### Improvements

- Added feedback when pressing a date label

---

## 1.0.1 - 2026-04-09

### Bug Fixes

- Fixed the accent color not applying to tags, links, URLs, and math in Live Preview
- Fixed posting with Cmd+Enter (macOS) or Ctrl+Enter (Windows/Linux) not working

---

## 1.0.0 - 2026-04-09

Initial release.

### Feature List

- **Timeline View**: Shows your posts as cards in the sidebar.
- **Text Formatting**: Supports bold, italic, strikethrough, highlight, and inline code.
- **Inline Math**: Renders LaTeX math written with `$...$`.
- **Lists**: Supports bulleted lists, numbered lists, and checklists.
- **Quotes**: Supports blockquotes (> ).
- **Tags**: Categorize posts with `#tags` and press a tag to search.
- **Links/Embeds**: Supports internal links (`![[]]`), external URLs, and obsidian:// URLs.
- **URL Previews**: Displays OGP cards, Twitter/X embeds, and image previews.
- **Live Preview Support**: Shows formatting in the editor with the markers hidden.
- **Reading View Support**: Shows formatting in Reading View too.
- **Customization**: Background and text colors can be set separately for light and dark modes.
- **Checked Strikethrough**: Choose in the settings whether checked items get a strikethrough.
- **BRAT Support**: Supports installation via BRAT.
