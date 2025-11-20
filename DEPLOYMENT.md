# Timension - Hostinger VPS Deployment Guide

## 🚀 Quick Deployment Steps

### Step 1: Build the Project (Already Done!)
```bash
npm run build
```
✅ Build output is in the `dist/` folder

### Step 2: Upload to Hostinger VPS

You have **3 options** to deploy:

---

## Option A: Using Hostinger File Manager (Easiest)

1. Log into your **Hostinger hPanel**
2. Go to **Files** → **File Manager**
3. Navigate to `public_html/` (or your domain's root folder)
4. **Delete all existing files** in the folder (if any)
5. **Upload all files from the `dist/` folder**:
   - `index.html`
   - `.htaccess` (important for routing!)
   - `assets/` folder (contains the JavaScript bundle)

---

## Option B: Using FTP/SFTP (Recommended)

### Using FileZilla or Similar FTP Client:

1. **Get your FTP credentials** from Hostinger hPanel:
   - Host: `ftp.yourdomain.com` or your VPS IP
   - Username: Your Hostinger username
   - Password: Your Hostinger password
   - Port: 21 (FTP) or 22 (SFTP)

2. **Connect via FTP/SFTP**

3. Navigate to `public_html/`

4. **Upload the entire `dist/` folder contents**:
   - Drag and drop all files from your local `dist/` folder
   - Make sure `.htaccess` is uploaded (enable "Show hidden files" in FileZilla)

---

## Option C: Using MCP Server (Advanced - What We Just Set Up!)

Now that you have the **Hostinger MCP server** configured, you can use it to deploy:

### MCP Configuration Created:
File: `mcp.json`

```json
{
  "servers": {
    "hostinger-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["hostinger-api-mcp@latest"],
      "env": {
        "API_TOKEN": "yBLI059MPaWekTDa7clckshYDyAqF7E1KLHdZRqz4827daed"
      }
    }
  }
}
```

### To Use the MCP:
The MCP server allows you to manage your Hostinger VPS programmatically. You can use it to:
- Upload files
- Manage domains
- Configure settings
- Monitor server status

*(Note: You'll need to activate the MCP in Claude Code to use these features)*

---

## Step 3: Configure Environment Variables (Optional)

If you're using Supabase or Google Gemini API:

1. Create a `.env` file on your server (in the root directory, **NOT in public_html**)
2. Add your keys:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_key
   ```

**For Vite apps on Hostinger:**
- Environment variables need to be set at **build time**, not runtime
- If you need to change API keys, rebuild locally with the new `.env` file, then re-upload

---

## Step 4: Verify Deployment

1. Visit your domain: `https://yourdomain.com`
2. Check that:
   - ✅ The site loads correctly
   - ✅ Navigation works (no 404 errors on refresh)
   - ✅ Images and styles load properly
   - ✅ All features work as expected

---

## Troubleshooting

### Issue: 404 Error on Page Refresh
**Solution:** Make sure `.htaccess` file is uploaded and mod_rewrite is enabled on your server.

### Issue: Blank Page / White Screen
**Solution:**
1. Open browser console (F12)
2. Check for errors
3. Common causes:
   - Missing environment variables
   - Incorrect base path in build
   - CORS issues with APIs

### Issue: CSS/JS Not Loading
**Solution:**
1. Check that the `assets/` folder was uploaded
2. Clear browser cache
3. Check file permissions (should be 644 for files, 755 for folders)

### Issue: API Calls Failing
**Solution:**
1. Check CORS settings on your backend
2. Verify API keys are correct
3. Check browser console for specific error messages

---

## File Structure on Server

Your `public_html/` should look like this:

```
public_html/
├── index.html          (Main HTML file)
├── .htaccess          (Apache configuration - IMPORTANT!)
└── assets/
    └── index-[hash].js (Your bundled JavaScript)
```

---

## Performance Optimization

✅ **Already Implemented:**
- GZIP compression (via .htaccess)
- Browser caching (via .htaccess)
- Minified production build

🔄 **Future Optimizations:**
- Enable CDN (Cloudflare) through Hostinger
- Optimize images (use WebP format)
- Implement code splitting (mentioned in build warnings)

---

## SSL Certificate

Make sure you have HTTPS enabled:
1. Go to Hostinger hPanel
2. Navigate to **SSL**
3. Enable **Free SSL Certificate** (Let's Encrypt)
4. Wait 10-15 minutes for activation

---

## Need Help?

- **Hostinger Support:** https://www.hostinger.com/support
- **Project Repository:** https://github.com/hy4k/timension_-the-vintage-chronicle--4-.git

---

## Quick Reference Commands

```bash
# Build for production
npm run build

# Preview build locally before deploying
npm run preview

# Development server (local testing)
npm run dev
```

---

**🎉 Your Timension Chronicle is ready to travel through time on the web!**
