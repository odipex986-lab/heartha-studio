# Supabase Contact Form Setup

## 1. Create the table and policy

In the Supabase dashboard, open the SQL Editor and run:

- `supabase/contact_inquiries.sql`

This creates the `contact_inquiries` table and allows browser clients to insert new inquiries without exposing read access.

## 2. Add frontend environment variables

Create a local env file from:

- `.env.example`

Use these keys:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Only use the public anon key in the frontend. Do not put the service role key in this app.

## 3. Add the same vars in Vercel

In Vercel Project Settings -> Environment Variables, add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Add them for Production and Preview, then redeploy.

## 4. Test

After redeploying:

1. Submit the contact form on the website.
2. Open `public.contact_inquiries` in Supabase Table Editor.
3. Confirm the new row appears.

## Notes

- Reads are still blocked by RLS.
- This setup is enough for website submissions today.
- When we build the admin app, we can add authenticated admin read policies and notifications on top of the same table.
