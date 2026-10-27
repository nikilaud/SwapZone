# SwapZone — Vanilla JS + Supabase

Responsive second-hand marketplace starter made with HTML, CSS, and vanilla JavaScript. No build step is required.

## Features included

- Responsive layout for desktop, tablet, and mobile.
- Search by title, description, or category.
- Category filter, condition filter, and sort by newest/price.
- Supabase email/password signup, login, and logout.
- Create, read, update, and delete listings (CRUD).
- Per-user ownership enforced with PostgreSQL Row Level Security (RLS).
- Upload listing photos as WebP or AVIF, maximum 2 MiB.
- Optional YouTube/Vimeo video link; videos are embedded rather than uploaded.
- Demo listings are shown before Supabase is configured so the layout is easy to preview.

## 1. Create your Supabase project

1. Go to https://supabase.com and create a project.
2. Open **SQL Editor** in the project dashboard.
3. Open `supabase-setup.sql`, copy all of it, paste it into SQL Editor, and run it.
4. The script creates `public.listings`, its RLS policies, and a public `listing-images` storage bucket restricted to WebP/AVIF files up to 2 MiB.
5. In **Project Settings → API** (or the API Keys page), copy the Project URL and the **publishable** key. Do not use a `service_role` or secret key in frontend code.
6. Open `js/config.js` and replace the two placeholder values:

```js
export const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";
```

Use the actual values from your own project. The publishable key is designed to be used from browser code when RLS is configured correctly. Never put the service-role/secret key in this repository.

If table queries return a message about the Data API, check your Supabase project's Data API settings and ensure the `public` schema/table is exposed to the Data API. The SQL grants and RLS policies in this file must remain in place.

## 2. Enable and configure authentication

1. In Supabase, open **Authentication → Providers** and make sure Email is enabled.
2. For a real deployment, configure **Authentication → URL Configuration** with your local development URL and your Netlify site URL as allowed redirect URLs.
3. If email confirmation is enabled, new users must click the confirmation email before they can log in. For a quick classroom demo you can change the email confirmation setting in Supabase Auth, but enabling confirmation is safer for a public site.

## 3. Run it locally

Because the JavaScript files use ES modules, use a local web server rather than opening `index.html` directly as a `file://` URL.

Easy options:

- VS Code: install **Live Server**, right-click `index.html`, and choose **Open with Live Server**.
- Or, if Python is installed, open a terminal inside this folder and run `python -m http.server 5500`, then open http://localhost:5500.

Without Supabase credentials, the site still previews with demo listings; authentication and CRUD require a configured Supabase project.

## 4. Publish with GitHub + Netlify

1. Create a GitHub repository named `swapzone`.
2. Upload the contents of this folder (make `index.html` visible at the repository root).
3. In Netlify, select **Add new site → Import an existing project** and connect the GitHub repository.
4. Build command: leave empty. Publish directory: `.` (the repository root).
5. After deployment, copy your Netlify URL and add it to Supabase Auth's allowed redirect URLs.
6. Test signup, login, add listing, edit, delete, image upload, search and filters.

## 5. How the rubric maps to the code

- **Responsive:** CSS media queries in `css/style.css`.
- **GitHub / Netlify:** documented deployment; no build tooling needed.
- **CRUD:** `loadListings`, `saveListing`, `openListingForm`, `deleteListing` in `js/app.js`.
- **Auth:** Supabase `signUp`, `signInWithPassword`, and `signOut` in `js/app.js`.
- **At least 2 filters:** search, category, condition, and price sorting.
- **2 MB + media:** client checks reject uploads over 2 MiB and non-WebP/AVIF images; Storage bucket repeats those restrictions server-side. Video links are limited to YouTube/Vimeo and embedded from their platforms.
- **Vanilla JS:** DOM, events, `fetch` via Supabase's JS client, async/await. The Supabase client is loaded from jsDelivr as an ES module.

## Current project limitations / good next upgrades

- The “I'm interested” button is intentionally a placeholder; a messaging feature would need a `messages` table or seller contact field with suitable RLS policies.
- Demo cards use remote Unsplash images for preview only. User-uploaded listing photos are restricted to WebP/AVIF and 2 MiB.
- This is a teaching project starter, not a full production marketplace. Before public launch, add moderation/reporting, stronger spam controls, and pagination.
