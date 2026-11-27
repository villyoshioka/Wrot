# Adding Dates and Times

Type `@` in the post form to pick a time or date and insert it.

---

## The Basics

1. Type `@` at the start of a line or right after a space (half-width or full-width). The full-width `＠` works too.
2. Times from `00:00` to `23:45` are shown as suggestions in 15-minute steps.
3. Keep typing digits to narrow the list.
4. Choose a time, and the `@` is replaced with a time such as `20:00`, followed by a space.

On a bulleted list, checklist, numbered list, or quote line, typing `@` right after the marker works too.

### Choosing a Suggestion

- **Keyboard**: The list opens with nothing selected. Press `↓` to start from the top or `↑` to start from the bottom, then press `Enter` or `Tab` to insert it. Pressing `Enter` before choosing one inserts a normal line break.
- **Mouse / Touch**: Click or tap a suggestion to insert it.
- Press `Esc` to close the list. If you keep writing without choosing a time, the `@` is treated as plain text.

### Filtering

- You can leave out the leading 0. `@8` suggests `08:00` to `08:45`. `@2` suggests `02:00` to `02:45` and `20:00` to `23:45`.
- Typing three or four digits also suggests times that aren't on a 15-minute step (for example, `@830` gives `08:30` and `@2037` gives `20:37`).
- Typing `＠２０` with Japanese input still filters the same way as half-width digits. The inserted time is half-width.

---

## Insert the Current Time (@now)

Type `@now` at the start of a line or right after a space, then press Space or `Enter`. It's replaced with the time at that moment (for example, `14:32`). It isn't rounded to 15 minutes.

- Typing `@n` shows `@now` as a suggestion. Choosing it inserts the current time.
- Pressing `Ctrl + Z` / `Cmd + Z` right after it turns into a time brings back `@now`.
- With Japanese input on, `now` turns into "のw", so type `@now` in English input.

---

## Pick a Date (@date)

Type `@date` at the start of a line or right after a space, then press Space or `Enter` to open the date picker. When you pick a date, `@date` is replaced with that date, followed by a space. The date uses the same format as "Header date format" in the settings (for example, `November 24, 2026`).

- Typing `@d` shows `@date` as a suggestion. Choosing it opens the date picker.
- On phones and tablets, a wheel appears. Turn it to the date you want, then tap the date shown below it to insert it.
- On desktop, a calendar appears below where you're typing. Click a date to insert it.
- The picker starts at today's date. You can pick past dates too.
- If you close it without picking a date, `@date` is treated as plain text. On desktop, typing or deleting text while the calendar is open also closes it.
- Pressing `Ctrl + Z` / `Cmd + Z` right after it turns into a date brings back `@date`.

---

## Insert Today's Date (@today)

Type `@today` at the start of a line or right after a space, then press Space or `Enter`. It's replaced with the date of that day, in the same format as `@date`.

- Typing `@t` shows `@today` as a suggestion. Choosing it inserts today's date.
- Pressing `Ctrl + Z` / `Cmd + Z` right after it turns into a date brings back `@today`.
- Like `@now`, type `@date` and `@today` in English input.

---

## Adding Times in a List

Press `Enter` at the end of a list item that starts with a time, and the next item starts with `@` and opens the time suggestions right away.

- If you don't need a time, press `Backspace` once. Only the `@` is removed and the item becomes a normal list item. Press `Enter` again to leave the list as usual.
- This works in bulleted lists, checklists, numbered lists, and lists inside quotes, including items that start with a time you typed by hand.

---

## Two-Digit Hours When Posting

A one-digit hour at the start of a line or right after a marker is saved with two digits when you post (for example, `9:30` becomes `09:30`). Times in the middle of a sentence aren't changed.

---

## Troubleshooting

### No suggestions are shown

- Check that the `@` is at the start of a line, right after a list or quote marker, or right after a space (half-width or full-width). An `@` typed right after other characters doesn't show suggestions, so you can write email addresses as usual.
- Inside a code block (between `~~~` fences) or inline code wrapped in `` ` ``, typing `@` doesn't show suggestions.

### @now, @date, or @today doesn't work

- Check that it's at the start of a line, right after a list or quote marker, or right after a space.
- Check that you aren't typing with Japanese input on.
