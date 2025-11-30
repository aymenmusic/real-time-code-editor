# 🚀 Deployment Guide - Real-Time Code Editor

This guide will walk you through deploying your application to production using **Render** (backend) and **Vercel** (frontend).

## 📋 Prerequisites

- GitHub account
- Render account (free): https://render.com
- Vercel account (free): https://vercel.com

---

## 🔧 Part 1: Deploy Backend to Render

### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Create New Web Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → Select **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `code-editor-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free

### Step 3: Create PostgreSQL Database

1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:

   - **Name**: `code-editor-db`
   - **Database**: `code_editor_db`
   - **User**: `code_editor_user`
   - **Region**: Same as your web service
   - **Instance Type**: Free

3. Click **"Create Database"**
4. Copy the **Internal Database URL** (starts with `postgresql://`)

### Step 4: Configure Environment Variables

In your Web Service settings, add these environment variables:

```
DATABASE_URL = <paste-your-database-internal-url>
SECRET_KEY = <generate-random-string-here>
ALLOWED_ORIGINS = https://your-frontend-url.vercel.app
```

**To generate SECRET_KEY**, run in terminal:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 5: Deploy Backend

1. Click **"Create Web Service"**
2. Wait for deployment (takes 3-5 minutes)
3. Copy your backend URL (e.g., `https://code-editor-backend.onrender.com`)

---

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Configure Environment Variables Locally

Create `frontend/.env.production`:

```env
VITE_API_URL=https://your-backend-url.onrender.com
VITE_WS_URL=wss://your-backend-url.onrender.com
```

**Important**: Use `https://` for API and `wss://` for WebSocket!

### Step 2: Push Changes to GitHub

```bash
git add .
git commit -m "Add production env config"
git push origin main
```

### Step 3: Deploy to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:

   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Add Environment Variables (same as .env.production):

   - `VITE_API_URL` = `https://your-backend-url.onrender.com`
   - `VITE_WS_URL` = `wss://your-backend-url.onrender.com`

5. Click **"Deploy"**

### Step 4: Update Backend CORS

1. Go back to Render dashboard
2. Edit your web service environment variables
3. Update `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
   ```
4. Save changes (this will redeploy)

---

## ✅ Part 3: Testing Your Deployed App

### Test Backend

Visit: `https://your-backend-url.onrender.com`

You should see: `{"message":"Welcome to the Code Execution API"}`

### Test Frontend

1. Visit your Vercel URL
2. Register a new account
3. Try logging in
4. Test the code editor
5. Test real-time collaboration (open in 2 browsers)

---

## 🔍 Troubleshooting

### Backend Issues

**500 Error on Backend:**

- Check Render logs: Dashboard → Your Service → Logs
- Verify DATABASE_URL is correctly set
- Ensure all dependencies are in requirements.txt

**Database Connection Failed:**

- Verify DATABASE_URL format: `postgresql://user:password@host:port/database`
- Check if database is running in Render

### Frontend Issues

**Can't Connect to Backend:**

- Verify environment variables are set correctly
- Check CORS is allowing your frontend domain
- Open browser console for errors

**WebSocket Connection Failed:**

- Ensure you're using `wss://` (not `ws://`) in production
- Check Render logs for WebSocket errors
- Render's free tier supports WebSockets!

### Common Fix: Cold Starts

Render's free tier goes to sleep after 15 minutes of inactivity. First request may take 30-60 seconds. This is normal on free tier.

---

## 💡 Next Steps After Deployment

1. **Custom Domain**: Add your own domain in Vercel settings
2. **Monitoring**: Enable Render metrics for performance tracking
3. **Backups**: Configure database backups in Render
4. **Analytics**: Add analytics to track usage
5. **Error Tracking**: Consider Sentry for error monitoring

---

## 📊 Cost Breakdown

### Free Tier (What You're Using):

- **Render PostgreSQL**: Free (1 GB storage, 60 min/month connected)
- **Render Web Service**: Free (750 hours/month)
- **Vercel**: Free (100 GB bandwidth/month)

### If You Outgrow Free Tier:

- **Render Starter**: $7/month (no sleep, more resources)
- **Vercel Pro**: $20/month (more bandwidth)

---

## 🎉 Success!

Your real-time code editor is now live! Share your Vercel URL with friends and start collaborating!

**Questions?** Check the logs in Render/Vercel dashboards for debugging.
