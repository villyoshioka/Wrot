# Adding Dates and Times

In Wrot, you can quickly insert a time or date simply by typing `@` at the start of a line or right after a space in the editor.
It is an easy way to write out schedules and log events without worrying about typos.

This guide walks you through inserting times, grabbing the current time, picking dates, and chaining timestamps in lists.

---

## The Basics

1. Type `@` at the beginning of a line or right after a space. It also works if you type a full-width `＠`.
2. A small menu will pop up showing times from `00:00` to `23:45` in 15-minute intervals.
3. Start typing numbers to narrow down the list.
4. Pick the time you want. The `@` symbol will turn into your chosen time, such as `20:00`, followed by a space so you can keep typing without breaking your flow.

If you are on a line with a bullet list, checklist, numbered list, or quote block, typing `@` directly after the list marker works too.

### How to Navigate and Confirm

- **Keyboard**: The menu opens without anything selected. Use `↓` to browse from the top or `↑` to browse from the bottom, then press `Enter` or `Tab` to confirm. Hitting `Enter` before you select an item just creates a regular line break.
- **Mouse or Tap**: Just click or tap whatever you want from the menu.
- **Closing the Menu**: Hit `Esc` to close it. If you keep writing without picking a time, the `@` symbol will simply stay as regular text.

### How the Search Works

- **Skipping the leading zero**: Typing `@8` shows options from `08:00` through `08:45`. Typing `@2` brings up `02:00` through `02:45` along with `20:00` through `23:45`.
- **Specific minutes**: If you type three or four digits, that exact time will show up in the menu. For instance, typing `@830` pulls up `08:30`, and `@2037` gives you `20:37`.
- **Full-width numbers**: Even if you type `＠２０` while using a Japanese keyboard layout, it filters the options just like regular numbers, and the final time will always be half-width.

---

## Quick Timestamp (@now)

If you type `@now` at the start of a line or right after a space and hit the spacebar or `Enter`, it instantly turns into the current time down to the minute, like `14:32`. It does not round to 15 minutes.

- As soon as you type `@n`, the `@now` option will show up in the menu. You can select it right there, or just finish typing the word and press the spacebar or `Enter`.
- If you actually want to keep the literal text `@now`, hit undo (`Ctrl + Z` / `Cmd + Z`) right after it converts, and it will switch back.
- Make sure to type this in alphanumeric characters. If you leave Japanese input on, it will turn into "のw" instead.

---

## Picking a Date (@date)

Type `@date` at the start of a line or right after a space and press the spacebar or `Enter` to bring up the date picker. Once you pick a date, `@date` is replaced by that date followed by a space. The format follows whatever you set under "Header date format" in settings, like `November 24, 2026`.

- As soon as you type `@d`, the `@date` option appears in the menu. Pick it to open the picker.
- On phones and tablets, a scroll wheel shows up. Spin it to the date you want, then tap the date shown underneath to confirm.
- On computers, a calendar appears right beneath where you are typing. Click a date to select it.
- The picker starts on today's date, but you can scroll back to past dates as well.
- If you dismiss the picker without choosing anything, `@date` stays as plain text. On a computer, typing or deleting text while the calendar is visible will also close it.
- If you want the literal text `@date` to stay, just hit undo (`Ctrl + Z` / `Cmd + Z`) right after it changes.

---

## Today's Date (@today)

Type `@today` at the start of a line or right after a space and press the spacebar or `Enter` to drop in today's date. It uses the exact same format as `@date`.

- As soon as you type `@t`, `@today` appears in the menu. Select it to insert the date.
- If you want to keep the actual text `@today`, press undo (`Ctrl + Z` / `Cmd + Z`) right after it changes.
- Just like with `@now`, make sure your keyboard is set to alphanumeric input.

---

## Timestamps in Lists

When you hit `Enter` at the end of a list item that starts with a time, the next line will automatically start with an `@` and pop open the time picker right away. This is handy when you want to build out a schedule or an itinerary step by step.

- **If you do not need a time**: Just hit `Backspace` once to delete the `@` and turn the line back into a standard list item. Hitting `Enter` again lets you leave the list as usual.
- **Supported lists**: This works automatically with bullet lists, checklists, numbered lists, and lists inside quotes. It even triggers if you typed out the previous time by hand.

---

## Automatic Formatting When Posting

If a single-digit hour is sitting at the start of a line or right after a list marker, Wrot will pad it with a zero when you publish, turning something like `9:30` into `09:30`. Times written in the middle of a sentence will not be changed.

---

## Troubleshooting

### The suggestions are not popping up

- Make sure your `@` is placed at the very start of a line, right after a list or quote marker, or preceded by a space. It will not trigger if you type it directly against another word, which prevents email addresses from opening the menu by accident.
- The picker will not trigger inside code blocks wrapped in `~~~` or inline code marked with backticks.

### Commands like @now, @date, or @today are not working

- Double check that the text is at the start of a line, right after a marker, or preceded by a space.
- Make sure you were not typing with Japanese input turned on.
