# Q-Mail

Qortal's encrypted mail Q-App. Send mail between Qortal names, with attachments, Cc and Bcc, aliases and group threads, all on QDN and readable only by the people it is sent to.

**Version 4.0** is a redesign first published as Q-Mail+ 1.0.0 (2026-10-05), built by Simon James in [SJQortal/Q-Apps-Plus](https://github.com/SJQortal/Q-Apps-Plus) and tested with the community through 1.0.2. It reads and writes the same QDN data as Q-Mail 3.2.1: mail sent with either version opens in both, and nothing needs migrating. `CHANGELOG.md` lists every change.

## What's new in 4.0

- **The current stack:** React 19.3, MUI 9.4, Redux Toolkit 2, Vite 8 and TypeScript 5.9.
  - A Quill 2 editor (react-quill-new) that still writes mail in the Quill 1 markup Q-Mail 3 reads.
  - ESLint 9 with the React hooks rules, and about 870 vitest tests.
- **Built for phones and GO:**
  - one pane at a time, a bottom bar and a floating Compose;
  - a header that hides as you scroll, and Send kept above the keyboard;
  - Back and a swipe that close what is on top (a preview, a sheet, a dialog, then the message or the composer);
  - press-and-hold menus, 44 px targets, and a compact layout for phones held sideways.
- **The Hub 3.0 layout on desktop:** mailboxes, message list and message side by side, with borders you can drag to set their widths.
- **Four themes** (Hub 3.0, Q-Mail Classic, Black, White):
  - they follow Hub's light/dark switch without a reload;
  - text contrast is at least 4.5:1;
  - Settings → Appearance switches between them.
- **Replies that don't grow** (on advice from the Qortal developers): a reply no longer quotes or copies earlier messages. It links to the last 10, and "Show earlier" loads them from QDN back to the start of the conversation. Every reply stays under 2 KB; with a quote and copies, the 50th reply weighed about 570 KB.
- **Reading mail:**
  - read state that survives reloads, unread counts, Archive with Undo, and Select all in the inbox and Archived;
  - a menu on right click or long press (Reply, Forward, Mark read or unread, Archive, Select);
  - exact dates, Cc names in the open message, and search across all your mail;
  - attachments that open in the app (PDFs in Hub's own reader), also straight from the list.
- **Writing mail:** Reply all with a Cc row, Forward with the attachments, a Drafts mailbox, recipient suggestions with avatars and name checks, attachments as tiles you can preview, and a mail footer.
- **Names:** an active-mailbox switcher with search above 15 names; names under Inbox that fold away or can be hidden; group threads you can hide in Settings.
- **Lighter on Qortal:**
  - 6 searches on the first load instead of about 25, and one search for all your names when you have many (126 instead of 413 with 88 names and 43 groups);
  - merged, cached searches, lazy avatars, and polling that pauses while the tab is hidden;
  - a first download of about 395 kB instead of 1,576 kB.
- **Safer:** message HTML sanitised with DOMPurify 3.4, thread posts shown with their real publisher, names with hidden characters crossed out as in Hub, declined Hub prompts that cancel quietly, and Back that never uses the `window.history` all Hub tabs share.

## Develop

```bash
npm ci
npm run dev          # Qortal calls need Hub (Dev Mode); tests use the mocks in src/test/setup.ts
npm test
npm run lint
npm run build
node e2e/screens.mjs # every screen at 5 sizes in 4 themes, with overflow, accessibility (axe) and call-count checks
```

The screenshot check needs Playwright, either a global `playwright`, or `playwright-core` plus a Chromium-based browser in `QPLUS_CHROMIUM`. See the header of `e2e/screens.mjs`. Nothing in it publishes or touches a node: every publish and save in its mocks is declined.

To publish, zip the contents of `dist/` with `index.html` at the root, and publish the zip in Hub as an `APP` resource under the name `Q-Mail`.

## Data

Mail uses the same services, identifiers, encryption calls and JSON shapes as 3.2.1:
- `MAIL_PRIVATE` for direct mail, Bcc copies, alias mail and thread messages (`_mail_qortal_qmail_<name>_<address>_mail_<id>`, `qortal_qmail_thmsg_group<id>_…`);
- `MAIL` for group thread headers (`qortal_qmail_thread_group<id>_<token>`);
- `ATTACHMENT_PRIVATE` for attachments (`attachments_qmail_…`);
- `DOCUMENT_PRIVATE` for the published mailbox state (`qmail_state_v1`);
- mail bodies in the Quill 1 markup of `textContentV2`.

New data is additive, and 3.2.1 ignores all of it:
- direct mail can carry top-level `to` and `cc` lists (Cc names are visible to every recipient; Bcc names are never written);
- `qmail_state_v1` gains top-level `archived` (archived message ids) and `settings` (theme, text size, watched aliases, alias reply links, footer);
- a reply's `generalData.threadV2` holds `{ reference: { identifier, name, service } }` entries without `data`, the newest 10. Q-Mail 3.2.1 skips entries without `data`, so it opens these replies without their earlier messages.

In the browser, 3.2.1's storage keys keep their shapes (`qmail_persistance_*`, `qmail_compose_drafts_*`, the alias keys). New ones include `qmail_read_state_*`, `qmail_archived_*`, `qmail-general-consent` and `qmail-ui-theme`.

## Notes for maintainers

- **Theme kit:** `src/hub-theme/` is the theme kit from [SJQortal/Q-Apps-Plus](https://github.com/SJQortal/Q-Apps-Plus) (`shared/hub-theme`), copied in. Edit it here, or copy in later versions from there. ESLint skips it.
- **References in comments:** "the original app" means Q-Mail 3.2.1. `docs/QORTAL.md` (Hub and GO pitfalls, QDN efficiency rules) and `docs/DESIGN.md` are in [SJQortal/Q-Apps-Plus/docs](https://github.com/SJQortal/Q-Apps-Plus/tree/main/docs), and "data contract §…" is the data contract in [docs/apps/Q-Mail+.md](https://github.com/SJQortal/Q-Apps-Plus/blob/main/docs/apps/Q-Mail%2B.md).
- **History:** every change in this history is its own commit, with a message that explains it. The platform upgrade comes first, then the redesign, then the fixes from testing.
- **Records:** the full audit, data contract, Qortal call counts, Hub test records and the Hub and GO pitfalls found are in [docs/apps/Q-Mail+.md](https://github.com/SJQortal/Q-Apps-Plus/blob/main/docs/apps/Q-Mail%2B.md).
- **Removed** (all unused or replaced; details in `CHANGELOG.md` and the records):
  - about 85 files of code that never ran (chat and flex-layout screens, an audio player, an unused sidebar and menus, and other leftovers);
  - dependencies: axios, compressorjs, core-js, flexlayout-react, localforage, mime, moment, philliplm-react-modern-audio-player, quill-image-resize-module-react, react-copy-to-clipboard, react-dnd, react-grid-layout, react-intersection-observer, react-joyride, react-masonry-css, react-quill, react-resize-detector, react-toastify, react-virtuoso, slate, the @tiptap packages and worker-loader;
  - unused fonts.
