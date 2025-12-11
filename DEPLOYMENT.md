# 🚀 Deployment Guide - VocabLah

## Quick Deploy Options

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```
**Configuration**: Already set up in `vercel.json` ✅

---

### Option 2: Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```
**Configuration**: Already set up in `netlify.toml` ✅

---

### Option 3: GitHub Pages
```bash
# Add to package.json:
{
  "homepage": "https://yourusername.github.io/VocabLah",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}

# Install gh-pages
npm install -D gh-pages

# Deploy
npm run deploy
```

---

## Pre-Deployment Checklist

### ✅ Required Steps:

1. **Generate lock file**
   ```bash
   npm install
   git add package-lock.json
   ```

2. **Fix Tailwind CDN** (CRITICAL)
   ```bash
   # Install Tailwind
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

   Create `tailwind.config.js`:
   ```js
   export default {
     content: [
       "./index.html",
       "./**/*.{js,ts,jsx,tsx}",
     ],
     darkMode: 'class',
     theme: {
       extend: {
         colors: {
           primary: '#A855F7',
           'primary-hover': '#9333EA',
           // ... rest from index.html
         }
       }
     }
   }
   ```

   Remove CDN from `index.html`:
   ```html
   <!-- DELETE this line: -->
   <script src="https://cdn.tailwindcss.com"></script>
   ```

3. **Create PWA icons**
   - Add `public/icon-192.png`
   - Add `public/icon-512.png`
   - Add `public/apple-touch-icon.png`
   - Add `public/favicon.ico`

4. **Update index.html**
   ```html
   <!-- Add in <head>: -->
   <link rel="manifest" href="/manifest.json">
   <meta name="theme-color" content="#A855F7">
   <link rel="apple-touch-icon" href="/apple-touch-icon.png">
   ```

5. **Test build locally**
   ```bash
   npm run build
   npm run preview
   ```

---

## Environment Variables

No environment variables currently needed! 🎉

The app runs entirely client-side with localStorage.

---

## Deployment Platforms

### Vercel
- **Free tier**: Yes
- **Build time**: ~30s
- **CDN**: Global edge network
- **Custom domain**: Free
- **SSL**: Automatic

### Netlify
- **Free tier**: Yes
- **Build time**: ~30s
- **CDN**: Global CDN
- **Custom domain**: Free
- **SSL**: Automatic
- **Forms**: Built-in (if needed later)

### GitHub Pages
- **Free tier**: Yes
- **Build time**: ~1-2min
- **CDN**: GitHub's CDN
- **Custom domain**: Yes
- **SSL**: Automatic with custom domain

---

## Post-Deployment

### 1. Test checklist:
- [ ] Homepage loads
- [ ] Add a word
- [ ] Create collection
- [ ] Review session works
- [ ] Dark mode toggle
- [ ] Settings persist
- [ ] Mobile responsive

### 2. Performance check:
```bash
# Run Lighthouse
npm install -g lighthouse
lighthouse https://your-deployed-url.com --view
```

**Target scores:**
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

### 3. Monitor:
- Set up error tracking (Sentry)
- Add analytics (Plausible/Umami)
- Monitor Core Web Vitals

---

## Troubleshooting

### Build fails with "Tailwind not found"
```bash
npm install -D tailwindcss postcss autoprefixer
```

### Blank page after deploy
- Check browser console for errors
- Verify routing config in `vercel.json` or `netlify.toml`
- Check build output directory is `dist`

### localStorage not working
- Check incognito mode
- Verify no CSP blocking localStorage
- Add error boundaries

---

## Custom Domain Setup

### Vercel:
```bash
vercel domains add yourdomain.com
```

### Netlify:
```bash
netlify domains:add yourdomain.com
```

---

## Future Enhancements

### Service Worker (Offline Support)
```typescript
// Register in index.tsx
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
```

### Analytics Integration
```typescript
// Add to index.html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

---

## Support

- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com
- Vite Docs: https://vitejs.dev/guide

---

**Last Updated**: 2025-12-11
