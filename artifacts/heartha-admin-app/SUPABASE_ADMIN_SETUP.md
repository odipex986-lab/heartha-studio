# Heartha Admin Setup

## 1. Add admin access policies

Run this SQL in the Supabase SQL Editor:

- `supabase/admin_app_access.sql`

This allows signed-in admin accounts using `odipex986@gmail.com` or `hearthastudio@gmail.com` to read and update `contact_inquiries`.

## 2. Create an admin auth user

In Supabase:

1. Open `Authentication -> Users`
2. Create a user with one of the approved admin emails
3. Set a password for that user

## 3. Add mobile env vars

Create a local `.env` file from `.env.example` with:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

For this project, use the same Supabase URL and publishable key already configured in Vercel.

## 4. Start the app

```bash
pnpm --filter heartha-admin-app run start
```

Then launch it in Expo Go or on an Android emulator.

## Notes

- The app signs in with email and password.
- The mobile app only reads and updates inquiry status.
- Website visitors still only have insert access through the existing public policy.
