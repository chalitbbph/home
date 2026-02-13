
# Storage Hub Pro: Deployment Guide

Follow these steps for the cheapest ($0/month) deployment.

### 1. Version Control (GitHub)
- Initialize a local git repo: `git init`.
- Commit all files: `git add . && git commit -m "Initial commit"`.
- Create a new repository on GitHub and push your code.

### 2. Static Hosting (Free Tier)
This app is client-side and uses `localStorage` for data persistence.
- **Vercel** (Highly Recommended):
  1. Go to [vercel.com](https://vercel.com).
  2. Import your GitHub project.
  3. Vercel will automatically detect the build settings (assuming standard Vite/React setup).
  4. Deploy. You will get a free URL like `storage-hub-pro.vercel.app`.
- **Netlify**: Similar process to Vercel.

### 3. Persistent Shared Data (Optional Upgrade)
If you want data to persist across different browsers/users (not just your local browser), consider:
- **Supabase (Free Tier)**: Replace the `storageService.ts` calls with Supabase DB calls. This gives you a real PostgreSQL database with a generous free tier.

### 4. Custom Domain (Cheap Upgrade)
- You can buy a `.com` or `.net` for ~$10-15/year from Namecheap or Cloudflare and point it to Vercel/Netlify for a more professional look.
