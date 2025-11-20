# 🚀 Deploy Timension to timension.world

## ✅ Current Status

- **Domain:** timension.world (Active, expires May 27, 2026)
- **DNS:** Already configured to point to your VPS
  - Root (@): 72.61.171.192
  - www: 72.61.171.192
- **VPS:** server.fets.in (Ubuntu 25.04, 2 CPU, 8GB RAM)
- **Deployment Archive:** `timension-deployment.tar.gz` (167KB) - Ready!

---

## 🎯 Quick Deployment to VPS

### Option 1: Using SSH (Recommended)

#### Step 1: Connect to Your VPS
```bash
ssh root@72.61.171.192
# OR
ssh root@server.fets.in
```

#### Step 2: Install Web Server (if not already installed)

**For Nginx:**
```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

**For Apache:**
```bash
sudo apt update
sudo apt install apache2 -y
sudo systemctl start apache2
sudo systemctl enable apache2
```

#### Step 3: Create Website Directory
```bash
# Create directory for timension.world
sudo mkdir -p /var/www/timension.world
sudo chown -R $USER:$USER /var/www/timension.world
```

#### Step 4: Upload & Extract Files

**Method A: Using SCP (from your local machine)**
```bash
# From your Windows machine (in PowerShell or Git Bash)
cd "C:\Users\USER\Downloads\timension_-the-vintage-chronicle (4)"
scp timension-deployment.tar.gz root@72.61.171.192:/var/www/timension.world/

# Then on the VPS
cd /var/www/timension.world
tar -xzf timension-deployment.tar.gz
rm timension-deployment.tar.gz
```

**Method B: Using wget/curl (if archive is uploaded online)**
```bash
cd /var/www/timension.world
wget YOUR_ARCHIVE_URL -O timension.tar.gz
tar -xzf timension.tar.gz
rm timension.tar.gz
```

#### Step 5: Configure Web Server

**For Nginx:**
```bash
sudo nano /etc/nginx/sites-available/timension.world
```

Add this configuration:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name timension.world www.timension.world;

    root /var/www/timension.world;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/timension.world /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**For Apache:**
```bash
sudo nano /etc/apache2/sites-available/timension.world.conf
```

Add this configuration:
```apache
<VirtualHost *:80>
    ServerName timension.world
    ServerAlias www.timension.world
    DocumentRoot /var/www/timension.world

    <Directory /var/www/timension.world>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Enable rewrite for SPA
    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </IfModule>

    ErrorLog ${APACHE_LOG_DIR}/timension_error.log
    CustomLog ${APACHE_LOG_DIR}/timension_access.log combined
</VirtualHost>
```

Enable the site:
```bash
sudo a2ensite timension.world
sudo a2enmod rewrite
sudo systemctl reload apache2
```

#### Step 6: Install SSL Certificate (HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx -y  # For Nginx
# OR
sudo apt install certbot python3-certbot-apache -y  # For Apache

# Get SSL certificate
sudo certbot --nginx -d timension.world -d www.timension.world  # For Nginx
# OR
sudo certbot --apache -d timension.world -d www.timension.world  # For Apache
```

Follow the prompts and select:
- Your email address
- Agree to terms
- Redirect HTTP to HTTPS (recommended)

---

### Option 2: Using Hostinger File Manager + VPS Panel

1. **Access your VPS via Hostinger hPanel**
2. **Install a Control Panel** (if not installed):
   - Consider installing Webmin, CyberPanel, or similar
3. **Upload files** using the panel's file manager
4. **Configure virtual host** through the panel interface

---

## 🔍 Verification Steps

After deployment, verify everything works:

### 1. Check Website Access
```bash
# Test HTTP response
curl -I http://timension.world

# Should return 200 OK or 301/302 if redirecting to HTTPS
```

### 2. Visit in Browser
- http://timension.world (should redirect to HTTPS if configured)
- https://timension.world

### 3. Check DNS Propagation
```bash
# Check if DNS is resolving correctly
nslookup timension.world
dig timension.world
```

### 4. Test Features
- ✅ Page loads correctly
- ✅ Navigation works
- ✅ No 404 errors on page refresh
- ✅ Images and assets load
- ✅ Console has no errors (F12)

---

## 🐛 Troubleshooting

### Issue: "Connection Refused"
**Solution:**
```bash
# Check if web server is running
sudo systemctl status nginx  # or apache2

# Start if not running
sudo systemctl start nginx  # or apache2
```

### Issue: "403 Forbidden"
**Solution:**
```bash
# Fix permissions
sudo chown -R www-data:www-data /var/www/timension.world
sudo chmod -R 755 /var/www/timension.world
```

### Issue: "404 on Page Refresh"
**Solution:** Make sure .htaccess is present or server config has rewrite rules (see Step 5)

### Issue: SSL Certificate Fails
**Solution:**
```bash
# Make sure ports are open
sudo ufw allow 80
sudo ufw allow 443

# Check firewall status
sudo ufw status
```

---

## 📁 Your Deployment Files

**Archive Location:**
```
C:\Users\USER\Downloads\timension_-the-vintage-chronicle (4)\timension-deployment.tar.gz
```

**What's Inside:**
- `index.html` - Main HTML file
- `assets/index-ON_olHn7.js` - Bundled JavaScript (676KB)
- `.htaccess` - Apache rewrite rules

---

## 🔐 VPS Details

- **IP:** 72.61.171.192
- **Hostname:** server.fets.in
- **OS:** Ubuntu 25.04
- **Resources:** 2 CPU, 8GB RAM, 100GB Disk
- **Nameservers:**
  - NS1: 153.92.2.6
  - NS2: 1.1.1.1

---

## 🚀 Alternative: Docker Deployment

If you prefer Docker:

```bash
# Create Dockerfile
cat > Dockerfile <<'EOF'
FROM nginx:alpine
COPY . /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EOF

# Create nginx.conf
cat > nginx.conf <<'EOF'
server {
    listen 80;
    server_name timension.world www.timension.world;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Build and run
docker build -t timension .
docker run -d -p 80:80 --name timension-app timension
```

---

## ✅ Post-Deployment Checklist

- [ ] Website accessible at http://timension.world
- [ ] HTTPS working (https://timension.world)
- [ ] All pages load correctly
- [ ] No console errors
- [ ] Images and assets loading
- [ ] Navigation working properly
- [ ] Mobile responsive
- [ ] SSL certificate auto-renewal configured

---

## 📞 Support

- **Hostinger Support:** https://www.hostinger.com/support
- **GitHub:** https://github.com/hy4k/timension_C.git

**Your timension.world is ready to launch! 🎉**
