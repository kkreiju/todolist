# To-Do List Application — Agent Instructions

## Project context

Build a web-based To-Do List application using:

- **Next.js** with the App Router and React for the UI and routing.
- **Firebase Cloud Firestore** for task records.
- **Supabase Storage** for optional task background images.

The repository may still be a minimal scaffold. Inspect its current files and package scripts before assuming an app directory, JavaScript/TypeScript choice, or established conventions. Keep changes focused and consistent with what is actually present; do not introduce duplicate infrastructure unnecessarily.

## Product requirements

Each task has a short title, details/notes, an optional background image, and a completion state. Users must be able to create, read, update, and delete tasks, including replacing or removing an image when editing/deleting a task.

Firestore collection: `tasks`. Each document uses its Firestore document ID as `id` in application data and has this shape:

```ts
type Task = {
  id: string;
  title: string;
  details: string;
  imageUrl: string | null;
  imagePath: string | null;
  completed: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

Use Firestore server timestamps for creation/update times. When mapping documents, derive `id` from the document snapshot ID. Order tasks deterministically (normally newest first) and handle Firestore timestamps safely in UI code, including pending server timestamps where relevant.

## Architecture and implementation guidance

- Keep Firebase and Supabase client initialization in shared modules under `lib/` (for example `lib/firebase` and `lib/supabase`). Reuse Firebase app instances with `getApps()`/`getApp()` to avoid duplicate initialization during development.
- Put Firestore and Storage operations in a service module (for example `services/taskService`). Keep components focused on UI and interaction state.
- Keep client-only SDK usage and browser APIs in client components/modules. Do not import browser SDK code into server-only modules.
- Use the `@/` import alias only if it is configured in the repository; otherwise follow its actual import setup.
- Prefer small, accessible React components. Task tiles should present title/details, completion state, and clear edit/delete/complete actions. Make text readable over image backgrounds with an overlay and provide a sensible fallback when there is no image.
- Forms should validate required titles, expose upload/edit errors, and prevent duplicate submission while an operation is in progress. Use semantic HTML, labels, keyboard-operable controls, and meaningful button names.
- Handle loading, empty, and error states for task reads and mutations. Keep UI state in sync after successful operations and avoid silently swallowing Firestore errors.

## Image storage lifecycle

- Use the Supabase Storage bucket `task-backgrounds`; store files under a predictable namespace such as `backgrounds/` with collision-resistant names. Do not trust the original filename as a unique path.
- Save both the public URL (`imageUrl`) and bucket-relative object path (`imagePath`) in Firestore. Use `imagePath` for removal, not by attempting to parse a URL.
- On replacement, upload the new image before deleting the old image or updating the Firestore record. If a later step fails, avoid leaving the task pointing at a missing image; handle cleanup/rollback where practical and report failures.
- On task deletion, ensure a Storage deletion failure does not silently masquerade as full success. Choose and document a consistent failure policy; avoid deleting the Firestore document first if that would orphan an image without recording its path.
- Validate uploads (at least expected image MIME types and a reasonable size limit) in the UI/service. Remember client-side validation is not a security boundary; configure Storage policies appropriately.

## Environment and secrets

Read configuration from environment variables; never hardcode API keys or credentials in source files or commit `.env.local`:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

These `NEXT_PUBLIC_` values are exposed to the browser and are not secrets. Protect data with correctly configured Firestore and Supabase Storage security policies; never put service-role keys in client code. Fail clearly when required configuration is missing, without printing secret values. If repository files contain hardcoded credentials, do not copy them into new code or documentation; flag the issue and migrate initialization to environment variables as part of relevant work.

## Verification and changes

- Before running checks, inspect `package.json` and use only scripts and tooling that exist. Do not claim checks passed if they were not run.
- Add or update tests for meaningful data/service behavior when a test framework is available; otherwise keep code easy to verify and describe untested behavior.
- Avoid unrelated dependency changes, broad rewrites, and modifications to user work outside the requested scope.
- Do not add Firebase Authentication or assume user-specific task ownership unless requested; the current specification describes a shared `tasks` collection and does not define an auth model.
