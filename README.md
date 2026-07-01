# 🌸 Shizen (自然) — Elegant Japanese Kana Learning with FSRS

**Shizen** is a highly polished, minimalist Japanese Kana learning application designed around the **Free Spaced Repetition Scheduler (FSRS)**. Master Hiragana and Katakana using elegant, cognitive spacing parameters, fluid transitions, and a beautiful Japandi-style interface designed for focused, mindful learning.

---

## ✨ Core Features

*   **🎓 FSRS Spaced Repetition Engine**: Powered by standard `ts-fsrs`, calculating optimal memory consolidation intervals (Again, Hard, Good, Easy) dynamically.
*   **🌱 Zen Practice Mode**: Staggered learning loops with custom session limits, letting you focus on small daily batches of Hiragana or Katakana.
*   **🌐 Tri-lingual Interface**: Elegant, fluid localization with support for **English (EN)**, **Japanese (JP)**, and **Indonesian (ID)**.
*   **🎛️ Detailed Scheduler Settings**: Customize your daily vocabulary limits, requested target retention rates, maximum spacing intervals, fuzz factors (jitter), and short-term step behaviors.
*   **📋 Detailed Card Browser**: Search, filter, inspect cognitive parameters (difficulty, stability, repetition state, interval), or manually reset/activate cards.
*   **🪵 Japandi Visual Style**: Organic beige tones (`#FBF9F6`), soft moss green highlights (`#6B7F6D`), clear typography pairing (*Space Grotesk* display + *Inter* body + *JetBrains Mono* data), and micro-animations with Framer Motion (`motion/react`).

---

## 🛠️ Tech Stack

*   **Frontend Library**: React 19 (Functional Components & Hooks)
*   **Bundler**: Vite 6
*   **Styling**: Tailwind CSS v4 (fully responsive)
*   **Animations**: Framer Motion (`motion/react`)
*   **Icons**: Lucide React
*   **Cognitive Loop**: `ts-fsrs` (Spaced Repetition algorithm)

---

## 🚀 Step-by-Step GitHub Setup

Follow these commands to initialize a local Git repository, commit your project, and push it to a new GitHub repository:

### 1. Initialize Git & Add Files
```bash
git init
git add .
```

### 2. Make Your Initial Commit
```bash
git commit -m "feat: initial commit of Shizen kana spacing loop application"
```

### 3. Link and Push to GitHub
Create a new **empty repository** on GitHub (do not initialize with README or `.gitignore` since they are already included here), then run:
```bash
# Set default branch to main
git branch -M main

# Add your GitHub remote repository URL
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# Push to main
git push -u origin main
```

---

## ⚡ Step-by-Step Vercel Deployment

Deploying Shizen to Vercel is extremely simple and can be done either via the **Vercel Web Dashboard** or the **Vercel CLI**.

### Option A: Via the Vercel Dashboard (Recommended)

1.  Go to [Vercel](https://vercel.com/) and log in (or sign up with your GitHub account).
2.  Click **Add New...** and select **Project**.
3.  Import your GitHub repository (`YOUR_REPOSITORY_NAME`).
4.  Vercel will automatically detect the **Vite** framework preset.
5.  **Build and Output Settings** are already pre-configured:
    *   **Framework Preset**: `Vite`
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
6.  Click **Deploy**. Your app will be live on a secure, custom `.vercel.app` URL in less than a minute!

### Option B: Via Vercel CLI (Command Line)

If you prefer to deploy directly from your local terminal:

1.  Install the Vercel CLI globally:
    ```bash
    npm install -g vercel
    ```
2.  Log in to your Vercel account via CLI:
    ```bash
    vercel login
    ```
3.  Trigger the deployment at your project root:
    ```bash
    vercel
    ```
    *Answer the setup questions (Vercel will auto-detect the Vite build presets).*
4.  To deploy to production, run:
    ```bash
    vercel --prod
    ```

---

## ⚙️ Configuration Notes

*   **Routing & Refreshing**: This project includes a custom `/vercel.json` routing rules file. It configures a rewrite rule that intercepts all requests and redirects them to `/index.html`. This ensures that if you implement routing or refresh pages deep within a tab layout, Vercel serves the SPA smoothly without returning a 404 error.
*   **Static Asset Caching**: `vercel.json` is set to cache assets inside the `/assets/` directory for up to 1 year using the `immutable` directive, guaranteeing lightning-fast, gas-saving subsequent page loads.

---

## 📜 License

This project is open-source. Feel free to modify, extend, and practice your Japanese Kana daily!
