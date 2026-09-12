# How Pinning Works

Pinning lets you keep important notes right at the top of your timeline, regardless of when they were posted. It’s perfect for things you need to see constantly, like daily to-do lists or active projects.

If you don't need a note pinned right away, you can use **"Pin Later"** instead. It works just like a reminder, holding the note in place until a specific date and then pinning it automatically.

Here is a quick breakdown of how regular Pinning and "Pin Later" work, along with details on pin limits.

---

## 1. Regular Pinning (Instant)

To pin a note immediately, click the top-right menu on any post card and select **"Pin"**. This locks the note to the top of your timeline.

- **Visible everywhere**: The note stays pinned at the very top, no matter which date you're looking at.
- **No duplicate posts**: Pinned notes move to the top area and temporarily hide from their original spot in the timeline.
- **Pin icon**: A hollow pin icon appears at the bottom right of the note so you know it’s pinned.
- **How to unpin**: Open the menu and choose **"Unpin"**. The note will go right back to its original date in your timeline.

> **Note**: You can’t delete a note while it’s pinned. This keeps you from accidentally wiping out important notes. Just unpin the note first if you want to delete it.

---

## 2. Pin Later (Scheduled)

With "Pin Later," you can pick a future date and let the app automatically pin your note when that day comes.

### Scheduling an existing note

Open the menu on the top right of a post, select **"Pin Later"**, and pick a date.

- **On Desktop**: This opens a standard calendar picker.
- **On Mobile and Tablet**: This brings up a quick scroll wheel.
- **Date options**: You can pick any date starting tomorrow. If you need something pinned today, just use regular "Pin."
- **Changing dates**: If you need to pick a different date, unpin the note first and set it up again.

### Scheduling a new post

You can also schedule a pin right from the editor toolbar using the **clock icon (Pin Later button)**.

1. Click the clock icon and choose your date from the calendar.
2. The icon will light up to show it's active. You can hover over it anytime to double-check the date.
3. Write your note and hit publish. It will save with the "Pin Later" date attached.

- Click the highlighted clock icon again if you want to clear the schedule.
- You can't set a schedule from the toolbar while editing a post inline. Use the card's menu instead.

### Before the scheduled date arrives

Until the day comes, your note stays right where it was posted in the main timeline. It won't move to the top just yet.

- A small clock icon appears at the bottom right to show it’s scheduled.
- Scheduled notes are locked from deletion, just like regular pinned notes.

### When the date arrives

Once midnight hits on your chosen date, the note automatically turns into a pinned note and moves up to the top.

- **Icon update**: The clock icon changes to a solid pin, making it easy to tell apart from regular pinned notes.
- **Display order**: Scheduled pins sit right below your regular pinned notes.
- **Duration**: The note stays pinned even after the date passes until you manually unpin it.
- **How to unpin**: Open the menu and select **"Unpin"**.

* The app doesn't refresh the screen the exact second the date changes. It will automatically update the next time you switch back into Obsidian or publish a new note.

---

## 3. Keep Pinned Notes Visible While Scrolling (Sticky Mode)

By default, your pinned notes scroll away along with the rest of your timeline.

If you want your pinned section to stay visible as you scroll, go to "Advanced" and turn on **"Keep Pins at the Top."** This locks the pinned section to the top of your screen while allowing the main timeline below it to scroll freely.

---

## 4. Pin Limits

You can set your maximum pin limit to **1, 3, or 5 notes** under the "Advanced" section using the **"Pin Limit"** option.

- **Independent slots**: **Regular Pins and "Pin Later" notes have completely separate limits.** For example, if your limit is set to 3, you can have 3 active pins and 3 scheduled pins at the same time (up to 6 total).
- **Hitting the limit**: Once you reach your limit, the menu options and toolbar clock button are disabled, and a quick alert will let you know you're at capacity.
- **Reserving a spot**: Clicking the clock icon in the editor holds a spot for your note immediately, so you won't lose your slot while typing.
- **Slot count after activation**: Even after a scheduled note moves to the top, it keeps using a "Pin Later" slot. It won't take up any of your regular pin slots.
- **Lowering your limit**: If you reduce your pin limit in settings, any extra pinned or scheduled notes will be automatically unpinned.

---

## Troubleshooting

### My scheduled note didn't pin on the target date

- The screen doesn't instantly refresh at midnight. Try switching back into Obsidian or posting a new note to trigger the timeline update.

### I can't select "Pin Later"

- Make sure you haven't already hit your maximum limit for scheduled pins.
- You can't add a new schedule to a note that is already pinned or scheduled.
- You can't select this option while actively editing a note in edit mode. Save or cancel your edit first.

### I can't delete a note

- Notes that are currently pinned or scheduled are protected to prevent accidental deletion. Select "Unpin" from the menu first, then delete the note.
- Notes with a tag whose rule has "Disable delete button" turned on cannot be deleted either.
