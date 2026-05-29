# Summond.design

> A daily feed of the most inspiring AI-built projects. Pulled automatically from Product Hunt and Dribbble. Zero maintenance. Free forever.

---

## Setup — 3 steps, ~10 minutes, costs nothing

---

### Step 1 — Get 2 free API keys

**Dribbble** (for UI screenshots from designers)
1. Go to → https://dribbble.com/oauth/applications/new
2. App name: `Summond`, Website: `https://summond.design`
3. Click Register — copy the **Access Token**

**Product Hunt** (for trending AI-built products with real thumbnails)
1. Go to → https://www.producthunt.com/v2/oauth/applications
2. Click "Add an application", fill in the name
3. Copy the **API Key** and **Secret**

---

### Step 2 — Add your keys

In this folder, rename `.env.example` to `.env.local`

Open `.env.local` and replace the placeholder text:

```
DRIBBBLE_ACCESS_TOKEN=paste_your_dribbble_token_here
PRODUCT_HUNT_API_KEY=paste_your_key_here
PRODUCT_HUNT_API_SECRET=paste_your_secret_here
```

Save the file.

---

### Step 3 — Put it online (free)

1. Create a free account at **github.com** and upload this folder as a new repository
2. Go to **vercel.com**, sign in with GitHub, click "New Project", select your repo
3. Before deploying, click **"Environment Variables"** and add the same 3 keys
4. Click **Deploy**

Your site is live. That's it. It updates automatically every hour.

---

## Running on your own computer

```bash
npm install
npm run dev
```

Then open http://localhost:3000

---

## How it works

- Every hour, the site fetches the most upvoted AI products from Product Hunt and the most liked UI shots from Dribbble
- Real images from those posts fill the masonry grid automatically
- Click any card to see it full size and visit the original
- Filter by category using the pills at the top
- Nothing is stored — it all comes live from the APIs

## Cost

**£0/month, forever.** Both APIs are free.
