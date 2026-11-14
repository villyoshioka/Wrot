# Using Time Input

In Wrot, you can quickly insert a time by simply typing `@` at the start of a line, or right after a space, in the post box.
It is designed to help you log schedules and events fast, without worrying about typos.

This guide walks you through the basics of inserting times, adding the current timestamp, and building timed lists.

---

## The Basics

1. Type `@` at the beginning of a line or right after a space, half-width or full-width (full-width `＠` works as well).
2. A popup will appear showing times from `00:00` to `23:45` in 15-minute intervals.
3. Keep typing numbers to narrow down the options.
4. Pick a time, and the `@` will be replaced with it (e.g., `20:00`), followed by a space so you can keep writing without missing a beat.

This also works right after the marker in bullet points, checklists, numbered lists, and blockquotes.

### Selecting and Confirming

- **Keyboard**: The menu opens with nothing selected. Navigate with `↓` (from the top) or `↑` (from the bottom), then press `Enter` or `Tab` to confirm. If you haven't highlighted an option yet, `Enter` just creates a regular line break.
- **Mouse / Tap**: Click or tap an item from the list to insert it.
- **Dismissing**: Press `Esc` to close the menu. If you just keep typing without picking a time, the `@` will stay as plain text.

### How Filtering Works

- **Drop the leading zero**: Typing `@8` brings up `08:00`–`08:45`. Typing `@2` shows both `02:00`–`02:45` and `20:00`–`23:45`.
- **Times outside the 15-minute grid**: Enter 3 or 4 digits to suggest that exact time (e.g., `@830` for `08:30`, `@2037` for `20:37`).
- **Full-width digits supported**: Even if your Japanese IME is on and you type `＠２０`, it filters just like half-width input. The inserted time will always be standard half-width text.

---

## Inserting the Current Time (@now)

Type `@now` at the start of a line or right after a space, and hit the spacebar or `Enter` to replace it with the exact current time (e.g., `14:32`). It does not round to 15-minute intervals.

- Once you've typed `@n`, `@now` shows up in the dropdown menu. Pick it to insert the time at that very moment. You can also type it out in full and hit the spacebar or `Enter`.
- If you actually want to keep the text `@now`, just hit Undo (`Ctrl + Z` / `Cmd + Z`) right after it converts to a timestamp.
- Make sure to type `@now` in direct alphanumeric input, as an active Japanese IME will turn `now` into "のw".

---

## Chaining Times in a List

When you hit `Enter` at the end of a list item that begins with a time, the next line will automatically start with `@` and pop open the time picker. This makes building schedules and agendas effortless.

- **Don't need a time on the next line?** Hit `Backspace` once to remove the `@` and turn it back into a standard list item. Hit `Enter` again to exit the list as usual.
- **Supported lists**: Works seamlessly in bullet lists, checklists, numbered lists, and lists inside blockquotes—even if the previous time was typed by hand.

---

## Automatic Zero-Padding

When you post, any single-digit hour at the start of a line (or right after a list or blockquote marker) is automatically formatted to two digits (e.g., `9:30` becomes `09:30`). Times in the middle of a sentence won't be touched.

---

## Troubleshooting

### The suggestions aren't showing up

- Make sure `@` is at the very beginning of the line, immediately follows a list/blockquote marker, or comes right after a space (half-width or full-width). It won't trigger when it's attached to the text before it (so email addresses won't pop up the menu).
- Suggestions are disabled inside code blocks (areas fenced by `~~~`) and inside inline code wrapped in `` ` ``.

### @now doesn't convert to a time

- Check that `@now` is at the beginning of the line, right after a list/blockquote marker, or right after a space.
- Double-check that your Japanese IME wasn't active when typing.
