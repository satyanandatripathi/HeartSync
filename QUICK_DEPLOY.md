# Quick Deploy Guide - Render Edition

## 🚀 Fastest Way: Vercel + Render (100% Free!)

## 📦 Deploy from Local Machine (No GitHub Required!)

You can deploy directly from your local directory using CLI:

```bash
# Navigate to your project
cd C:\Users\parth_0e90e2t\OneDrive\Desktop\HeartSync

# Login to Render
render login

# Deploy signaling server (uploads local files)
render deploy

# Get your URL
render services:show heartsync-signaling
```

That's it! No GitHub needed. See `LOCAL_DEPLOY.md` for complete local deployment guide.

---

## 🚀 Fastest Way: Everything on Render (100% Free!)

### Option 1: Deploy Both to Render (Recommended!)

Deploy both Next.js app and signaling server to Render - everything in one place!

```bash
# Login
render login

# Deploy signaling server first
render deploy --config render.yaml

# Get signaling server URL
render services:show heartsync-signaling
# Copy the URL

# Deploy Next.js app
render services:create
# Name: heartsync-app
# Build: npm install && npm run build
# Start: npm start
# Plan: free

# Set environment variable
render env:set NEXT_PUBLIC_SIGNALING_SERVER=https://heartsync-signaling.onrender.com --service heartsync-app
# Replace with your actual URL

# Restart Next.js app
render services:restart heartsync-app
```

**See `RENDER_ONLY.md` for complete guide!**

---

## 🚀 Alternative: Vercel + Render (100% Free!)

### 1. Deploy Next.js to Vercel (5 minutes)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts, then deploy to production
vercel --prod
```

**That's it!** Vercel will:
- Auto-detect Next.js
- Build your app
- Deploy it
- Give you a URL like: `https://heartsync.vercel.app`

### 2. Deploy Signaling Server to Render (5 minutes) - FREE TIER

#### Option A: Using Render CLI (Fastest!)

```bash
# Install Render CLI
# Windows: Download from https://github.com/render-oss/render-cli/releases
# macOS/Linux: brew install render

# Login
render login

# Deploy (uses render.yaml automatically)
render deploy

# Or deploy interactively
render services:create
# Follow prompts, or use render.yaml config
```

#### Option B: Using Render Dashboard

1. **Go to**: https://render.com
2. **Sign up** (free with GitHub/Google)
3. **New** → **Web Service**
4. **Connect your GitHub repo** (select HeartSync)
5. **Configure**:
   - **Name**: `heartsync-signaling`
   - **Environment**: `Node`
   - **Region**: Choose closest to you
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: (leave empty)
   - **Build Command**: `npm install` (or leave empty)
   - **Start Command**: `node server.js`
   - **Plan**: **Free** (or Starter for $7/month if you need more)
6. **Advanced Settings**:
   - **Health Check Path**: `/` (optional)
   - **Auto-Deploy**: `Yes`
7. **Create Web Service**
8. **Wait for deployment** (2-3 minutes)
9. **Get URL**: Render gives you a URL like `https://heartsync-signaling.onrender.com`

### 3. Connect Them Together

1. **Go to Vercel Dashboard**:
   - Your project → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_SIGNALING_SERVER` = `https://heartsync-signaling.onrender.com`
   - Save

2. **Redeploy Vercel**:
   ```bash
   vercel --prod
   ```

3. **Done!** Your app is live!

### 4. Test It

1. Open your Vercel URL: `https://heartsync.vercel.app`
2. The signaling server URL should auto-fill from the environment variable
3. Click "Start Connection"
4. Share the URL with your partner and test!

## Alternative: All on Render

If you prefer everything in one place:

1. **Render Dashboard** → **New** → **Web Service**
2. **Service 1** (Next.js):
   - Connect GitHub repo
   - Build: `npm install && npm run build`
   - Start: `npm start`
   - Plan: Free
3. **Service 2** (Signaling):
   - Same repo, different service
   - Start: `node server.js`
   - Plan: Free
4. **Set Environment Variable**:
   - In Service 1, add: `NEXT_PUBLIC_SIGNALING_SERVER` = Service 2's URL

## Cost

- **Vercel**: Free (generous limits)
- **Render Free Tier**: Free (with some limitations)
- **Total**: **100% FREE!** 🎉

### Render Free Tier Limitations:
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds (cold start)
- 750 hours/month free (enough for always-on if you use it regularly)
- For always-on, upgrade to Starter ($7/month)

## Troubleshooting

**Connection fails?**
- Check Railway logs for signaling server
- Verify environment variable is set correctly
- Make sure both services are running

**Build fails?**
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify TypeScript compiles without errors

## Need Help?

See `DEPLOY.md` for detailed instructions and other deployment options.

