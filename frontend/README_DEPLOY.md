# 🚀 Deployment Guide: Crave Quest

This guide will walk you through hosting your project using **Vercel** for the frontend and **Render** for the backend.

---

## 1. Prerequisites
- A **GitHub** account.
- A **MongoDB Atlas** account (Cloud Database).
- Accounts on [Vercel](https://vercel.com) and [Render](https://render.com).

---

## 2. Step 1: Database (MongoDB Atlas)
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new Cluster (the Free Tier is fine).
3. In **Network Access**, add `0.0.0.0/0` (Allow access from anywhere).
4. In **Database Access**, create a user with a password.
5. Get your **Connection String** (choose "Drivers" and copy the `mongodb+srv://...` URL).

---

## 3. Step 2: Backend (Render)
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Set the following:
   - **Name**: `crave-quest-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
5. Click **Advanced** and add these **Environment Variables**:
   - `MONGO_URI`: (Your MongoDB Atlas string)
   - `JWT_SECRET`: (Any random long string)
   - `CLIENT_URL`: `https://your-frontend-name.vercel.app` (You'll update this after deploying the frontend)
   - `NODE_ENV`: `production`
   - `RAZORPAY_KEY_ID`: (Your key)
   - `RAZORPAY_KEY_SECRET`: (Your secret)
6. Click **Create Web Service**. 
7. **Note**: Copy the URL Render gives you (e.g., `https://crave-quest-api.onrender.com`).

---

## 4. Step 3: Frontend (Vercel)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New** > **Project**.
3. Import your GitHub repository.
4. Set the following:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (The root of the repo)
5. Under **Environment Variables**, add:
   - `VITE_API_URL`: (The URL you copied from Render)
   - `VITE_RAZORPAY_KEY_ID`: (Your public key)
6. Click **Deploy**.

---

## 5. Step 4: Final Connection
Once Vercel gives you your production URL (e.g., `https://crave-quest.vercel.app`):
1. Go back to your **Render Dashboard**.
2. Update the `CLIENT_URL` environment variable to match your Vercel URL.
3. Render will automatically redeploy.

---

## ✅ Your app is now live!
- **Frontend**: Managed by Vercel (Fast UI).
- **Backend**: Managed by Render (Supports Socket.io).
- **Database**: Managed by MongoDB Atlas (Cloud Storage).
