# Fixing R2 Custom Domain Configuration

## 🚨 **Current Issue**
Your custom domain `theayofolahan.com` is showing a 404 error because the R2 bucket isn't properly configured for public access with the custom domain.

## 🔧 **Step-by-Step Fix**

### 1. **Enable Public Access on R2 Bucket**

1. **Go to Cloudflare Dashboard**
   - Log into your Cloudflare account
   - Navigate to **R2 Object Storage**

2. **Select Your Bucket**
   - Click on your bucket name
   - Go to **Settings** tab

3. **Enable Public Access**
   - Find **"Public Access"** section
   - Click **"Allow Access"** or **"Enable Public Access"**
   - Confirm the action

### 2. **Configure Custom Domain**

1. **Add Custom Domain**
   - In your bucket settings, find **"Custom Domains"**
   - Click **"Add Custom Domain"**
   - Enter: `theayofolahan.com`
   - Click **"Add Domain"**

2. **Verify DNS Settings**
   - Cloudflare will show you DNS records to add
   - Make sure these are added to your domain's DNS settings
   - Wait for DNS propagation (can take up to 24 hours)

### 3. **Verify Domain Setup**

1. **Check Domain in Cloudflare**
   - Go to **DNS** section in Cloudflare dashboard
   - Ensure `theayofolahan.com` is added as a zone
   - Verify DNS records are correct

2. **Test Domain Access**
   - Try accessing: `https://theayofolahan.com/ACTIVEYARD/ykb10.jpg`
   - Should return the image, not a 404 error

### 4. **Alternative: Use R2.dev URL Temporarily**

If custom domain setup is complex, you can temporarily use the R2.dev URL:

```javascript
// In your code, use:
const imageUrl = 'https://pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev/ACTIVEYARD/ykb10.jpg';
```

## 🛠️ **Troubleshooting**

### **Common Issues:**

1. **Domain Not Added to Cloudflare**
   - Add `theayofolahan.com` as a zone in Cloudflare
   - Use CNAME setup if domain is managed elsewhere

2. **DNS Propagation**
   - Wait 24-48 hours for DNS changes to propagate
   - Use `dig theayofolahan.com` to check DNS status

3. **Bucket Permissions**
   - Ensure bucket allows public read access
   - Check bucket policy settings

4. **SSL Certificate**
   - Custom domains need SSL certificates
   - Cloudflare should handle this automatically

### **Testing Commands:**

```bash
# Test DNS resolution
nslookup theayofolahan.com

# Test HTTPS access
curl -I https://theayofolahan.com/ACTIVEYARD/ykb10.jpg

# Test R2.dev URL (should work)
curl -I https://pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev/ACTIVEYARD/ykb10.jpg
```

## 🔄 **Fallback System**

I've implemented a fallback system in your code that:

1. **Tests custom domain** on page load
2. **Falls back to R2.dev URL** if custom domain fails
3. **Shows placeholder** if both fail
4. **Logs errors** for debugging

## 📋 **Checklist**

- [ ] R2 bucket has public access enabled
- [ ] Custom domain `theayofolahan.com` is added to R2 bucket
- [ ] Domain is added to Cloudflare as a zone
- [ ] DNS records are properly configured
- [ ] SSL certificate is active
- [ ] Test image URL works: `https://theayofolahan.com/ACTIVEYARD/ykb10.jpg`

## 🆘 **If Still Not Working**

1. **Use R2.dev URL temporarily**:
   ```bash
   # Replace all instances of:
   https://theayofolahan.com/
   # With:
   https://pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev/
   ```

2. **Contact Cloudflare Support** if domain setup is complex

3. **Check Cloudflare Logs** for any errors

## 🎯 **Expected Result**

After proper configuration:
- `https://theayofolahan.com/ACTIVEYARD/ykb10.jpg` should load the image
- No 404 errors
- Faster loading times
- Better SEO with custom domain
