# Changelog

Newest first. The in-app copy lives in `src/pages/Mail/ChangelogPage.tsx` (Settings → About → What's new).

## 4.0.0 - October 12, 2026

Q-Mail 4.0 is the redesign Simon James built and published as **Q-Mail+** (1.0.0 on October 5, 2026, then 1.0.1 and 1.0.2 after testing with the community) in [SJQortal/Q-Apps-Plus](https://github.com/SJQortal/Q-Apps-Plus), merged back into Q-Mail. Every change is its own commit in this history; the audit, data contract and test records are in [docs/apps/Q-Mail+.md](https://github.com/SJQortal/Q-Apps-Plus/blob/main/docs/apps/Q-Mail%2B.md).

It reads and writes the same QDN data as Q-Mail 3.2.1 (services, identifiers and encryption), so your mail shows up in both versions, and mail sent from either one opens in the other. The new data is additive, and 3.2.1 ignores it: optional `to` and `cc` lists in direct mail, `archived` and `settings` in the published mail state, and replies that link to earlier messages instead of copying them.

**Platform and quality**
- React 19.3, MUI 9.4, Redux Toolkit 2, react-router 6.30, Vite 8 and TypeScript 5.9. The editor runs on Quill 2 (react-quill-new), and mail is still written in the Quill 1 markup Q-Mail 3 reads.
- ESLint 9 with the React hooks rules, about 870 vitest tests, error boundaries around the app and the reader, and a screenshot check (`node e2e/screens.mjs`) that checks every screen at five sizes in four themes with an axe-core accessibility audit.

**Look and layout**
- The Hub 3.0 layout: mailboxes, message list and message side by side on desktop; list and message in narrower windows; one pane at a time on phones, with a bottom bar and a floating Compose; a compact layout on a phone held sideways.
- Drag the borders between the mailboxes, the list and the message to set their widths; they are remembered. With no message open, the list uses the whole width.
- Four themes (Hub 3.0, Q-Mail Classic, Black and White) that follow Hub's light/dark switch, and a full Settings page (Account, Appearance, Mail, Sync, About).

**Phones and GO**
- 44 px touch targets, sheets and full-screen dialogs, a header that hides on scroll, Send above the keyboard, and Back that closes what is on top: a preview, sheet or dialog first, then the open message or the composer.
- Swipe right to close what is on top, as Back does; the mailboxes menu closes with a swipe left. An arrow shows when letting go will close.
- Press and hold a message for its menu. The composer's placeholder goes as soon as a phone keyboard starts the first word.
- Keyboard shortcuts on screens 600 px and wider, with a `?` help dialog.

**Reading mail**
- Read and unread state that survives a reload and can be published with your mail state; unread counts in the mailboxes, the bottom bar and the window title; unread senders in blue.
- Archive (with Undo) and Mark unread, from the list or from the open message; Select all in the inbox and in Archived.
- Right-click a message, or press and hold it, for Open, Reply, Reply all, Forward, Mark as read or unread, Archive or Move to inbox, Select, and Delete in Sent; sender groups have a menu too.
- Exact dates everywhere ("Sun 2 Aug, 08:58", with the year when it isn't this year); hover over a date, or tap it on a phone, for the full date and how long ago it was.
- Search across the inbox, Archived, Sent and alias inboxes, with message bodies on request.
- An open message shows its Cc names. Messages already on your node open in about half a second, and mail that is on your node but not yet assembled opens instead of waiting on "Preparing…".
- `qortal://` links open through Hub, so a group join link asks Hub to join the group. Names with hidden characters, often used to imitate someone, are crossed out, as in Hub.

**Replies that don't grow** (on advice from the Qortal developers)
- A reply no longer quotes the message you answer. That message shows above the editor for context (Preview, Full or Hide) and is not copied into the reply.
- A reply carries links to the last 10 earlier messages in `generalData.threadV2` instead of copies of them, so every reply stays under 2 KB. With a quote and copies, the 50th reply in a conversation weighed about 570 KB.
- "Show earlier" loads the earlier messages from QDN five at a time, back to the start of the conversation, newest first, with the senders' avatars. Messages that were deleted, weren't sent to you or aren't on your node yet say so.
- Mail that carries copies of earlier messages (from Q-Mail 3, or Q-Mail+ 1.0.0) shows them as before, marked as quoted. Q-Mail 3 opens the new replies without their earlier messages.
- A reply comes from the name the mail was sent to, not the active name.

**Writing mail**
- Reply all, and Forward with `Fwd:` and the original attachments; a Drafts mailbox that looks like the inbox; Ctrl/Cmd+Enter sends.
- A Cc row: Reply all fills it, and Cc names are visible to every recipient. "Send to alias", "Cc" and "Bcc" explain what they do when you hover over them, reach them with the keyboard or long-press them.
- Recipient suggestions with avatars, and every name is checked before sending. From shows each of your names with its avatar, and is searchable when you have more than 15 names.
- A mail footer (Settings → Mail): one for all your names or one per name, added to new mail and, if you like, to replies and forwards.
- An alias message can't carry Cc or Bcc names; Q-Mail now says so instead of quietly dropping the Bcc copies.

**Attachments**
- Every kind opens in the app: images, text, audio, video and PDF, with size, type, progress from peers and Save all. PDFs open in Hub's own PDF reader, with the built-in viewer as a fallback.
- From the list: a message's files show beside its subject with short names, and open or save without opening the message or marking it read.
- In the composer, "Attach files" is a real button (or drop files on it or on the text); attached files show as tiles you can preview before sending. A file whose type the browser doesn't know is no longer refused when its name has an extension.

**Names, aliases and threads**
- Settings → Account: the active mailbox is a dropdown, with search when you have more than 15 names.
- The names under Inbox, Aliases and Sent fold away; a name under Inbox can be hidden from its menu, or while all its mail is archived (Settings → Mail).
- The alias scan reads at most 500 resources per run and remembers where it stopped.
- Group threads as list and pane, with unread marks, paging and reply-to-post quoting. Settings → Mail → "Show group threads" hides them, and then nothing about threads is loaded.

**Lighter on Qortal**
- The first load for one name takes 6 searches instead of about 25; with many names it asks once for all of them (126 searches instead of 413 on an account with 88 names and 43 groups).
- Searches are merged and cached for the session, avatars load lazily, and polling pauses while the tab is hidden and backs off. New mail shows within 2 minutes.
- The first download is about 395 kB instead of 1,576 kB, with the composer, reader, threads and the PDF viewer loading on demand; Classic's font is 83% smaller.

**Hub, GO and safety**
- Declining a Hub prompt, in any of Hub's 12 languages, quietly cancels; publishing waits as long as Hub does and checks QDN before a retry; deleted and not-yet-available mail shows as such; a screen that fails to load offers Reload instead of a blank app, and a broken message only fails in its own place.
- Other people's messages are handled more safely: message HTML is sanitised with DOMPurify 3.4, thread posts are sanitised and show their real publisher as author, links in old mail follow the same rules, and Forward only re-sends real attachments.
- Back and the panes never use `window.history`, which every Hub tab shares.
- The published-state question comes once per name per session, and "Publish Q-Mail State" asks first and says what it publishes.
- The local-only rating in Settings → About is hidden.

## 3.2.1 - May 28th 2026

- **Fixed:** `/to/:name` links now open the composer automatically instead of landing in the inbox with a prefilled recipient (impact: users following mail-style deep links to start a message).

## 3.2.0 - May 28, 2026

- **Added:** High-contrast top-of-mail loading banner with a prominent spinner and `Fetching mail and state...` text so users can clearly see when the inbox is still loading (how to use: just wait for the banner to clear before assuming QDN state failed).
- **Added:** Checkbox in the initial QDN state prompt to enable `Always fetch and apply QDN state` directly from the load dialog (how to use: check the box before proceeding if you want future loads to skip the prompt).
- **Fixed:** Opening an inbox or alias message now marks it read automatically, so sender groups unbold once every message under them has been read (impact: users reading messages one by one instead of using bulk actions).
- **Fixed:** QDN state prompt no longer flashes or remounts while mail data continues loading in the background (impact: users loading published mailbox state on slower connections).
- **Added:** Inbox `Select all` control for the visible grouped message list (how to use: open Inbox, then use the new top checkbox to select or clear the currently shown messages).
- **Changed:** Published QDN state loading now prompts as soon as the state is discovered in search and continues fetching in the background, so applying it no longer waits for the full download to finish (migration/notes: the prompt still lets you decline loading without changing your mailbox).
- **Added:** `Always fetch and apply QDN state` preference in the right-side menu so Q-Mail can automatically load published state without prompting on this account (how to use: open the user menu, then enable the new checkbox).

## 3.1.2 - May 28, 2026

- **Changed:** Merged PhilReact's upstream interface refresh and clear-notification action into Q-Mail's main branch (migration/notes: no action required).
- **Fixed:** Kept the local state-publish updates intact while incorporating the upstream merge so existing read-state and publish flows continue to work.

## 3.1.1 - April 14, 2026

- **Fixed:** Grouped inbox selection now keeps checked messages selected so the bulk `Mark as Read` action appears and works as expected (impact: users selecting messages inside expanded sender/recipient groups).
- **Fixed:** `Mark as Read` now updates mailbox message state via Redux so marked messages stop rendering as unread/bold in the inbox UI (impact: users marking messages without opening each one).
- **Added:** Sidebar action to publish Q-Mail read-state to QDN, plus a startup prompt to load published state for the authenticated account (how to use: click `Publish Q-Mail State` in the left sidebar, then accept the load prompt on another node).
- **Changed:** Published Q-Mail state now tracks per-message `read` and `subject` independently and merges newly discovered subject/read updates across sessions (migration/notes: sidebar `Publish Q-Mail State` now shows a `!` badge when there are unpublished state changes).
- **Changed:** Pending `Publish Q-Mail State` now uses a high-visibility warning treatment (orange background, orange border/outline, and orange icon) to make unpublished state changes obvious.
- **Fixed:** Grouped sender labels now match read state and no longer stay bold after all messages in a group are marked read (impact: unread emphasis in inbox groups is now consistent with message rows).
- **Added:** Bulk `Mark as Unread` action for selected inbox messages/groups (how to use: select messages with checkboxes, then click `Mark as Unread` in the sticky action bar).

## 3.1.0 - March 24, 2026

- Improved small-screen usability with a clearer mobile menu trigger, a visible/tappable mobile send button, a larger top-level Compose action, and a more responsive sidebar that avoids horizontal scrolling.
- Enabled authenticate-on-startup by default and fixed the onboarding tour so choosing Skip no longer causes it to reopen on later visits.
- Refined sidebar navigation with larger section labels, stronger active-state contrast, a collapsed-by-default `Q-Mail Threads` section, and a dedicated `Alias Compose` action when viewing an alias inbox.
- Fixed alias inbox behavior so alias selection no longer leaks into normal inbox mode, saved aliases always appear under `+Aliases`, linked reply aliases display directly beneath each alias, and replies from alias inboxes inherit the linked reply alias.
- Improved alias workflows with local reply-alias linking, a safer add-alias flow, alias compose requirements for new alias-authored mail, and proper return/discard behavior when leaving alias compose.
- Reworked the reply composer so the original message preview can be toggled between Preview / Full / Hide, the editor fills the available space, replies focus cleanly at the top, and discard support works in inline compose mode.
- Added local per-recipient direct-message drafts, enabled BCC while replying, and fixed the React SVG warning in the send icon component.

## v3.0.0 - March 4, 2026

- Full Q-Mail UI refresh with the new app shell, sidebar navigation, polished light/dark themes, and unified Lexend/Illinois typography with text size controls.
- Inbox, Aliases, Sent, and Threads now open as dedicated pages, with combined views plus quick subviews for each owned name, alias, and active thread group.
- Message lists are now conversation-focused, with grouped entries for repeat contacts, expandable history, wider list usage, and full timestamp display.
- Compose is now a full-page workflow, with improved Reply/Forward behavior that starts replies with quoted context and smoother editor interactions.
- Added local full-text mailbox search across decrypted messages (name, subject, and message content), with progressive results as scanning continues.
- Added alias management tools, including saved alias controls and resumable alias scan progress.
- Added Sent message delete support (replacement publish), plus fixes for send reliability and special-character name handling in mail lookups.
- Added in-menu app ratings support using the `qmails` ratings poll.

## v2.2.0 - September 11, 2025

- Added multi-name account support so switching and using alternate names works more reliably.
- Improved name-related loading behavior in Inbox, Sent, and app startup flows.

## v2.1.0 - January 6, 2025

- Introduced a mobile-friendly layout for core Q-Mail pages.
- Improved usability on smaller screens for reading and composing messages.

## v2.0.1 - February 21, 2024

- Added avatar images in thread posts for clearer conversation context.
- Polished the thread experience after the v2.0.0 refresh.

## v2.0.0 - January 16, 2024

- Major refresh of the mail reading and composing experience.
- Added threaded conversation workflows and expanded reply handling.
- Improved status handling and overall message-view stability.

## v1.2.1 - December 31, 2023

- Reduced unnecessary loading overlays for regular mail views.
- Smoothed everyday navigation in standard inbox workflows.

## v1.2.0 - December 31, 2023

- Added BCC support for sending messages to additional recipients.
- Improved editor behavior and reply-content handling in messages.

## v1.1.0 - December 30, 2023

- Improved attachments and download handling.
- Switched message publishing to a multi-publish flow for better delivery handling.

## v1.0.0 - December 8, 2023

- Initial standalone Q-Mail release.
