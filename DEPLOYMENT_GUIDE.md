# Pulss Deployment Guide

This guide helps you deploy the Pulss white-label platform to production.

## Prerequisites

- Supabase project (already configured)
- Domain name for your platform
- SSL certificate (automatic with most hosting providers)

## Deployment Options

### Option 1: Netlify (Recommended for Beginners)

1. **Connect to Git Repository**
   - Fork/clone the repository to your GitHub
   - Connect Netlify to your repository

2. **Configure Build Settings**
   ```
   Build Command: npm run build
   Publish Directory: dist
   ```

3. **Set Environment Variables**
   ```
   VITE_SUPABASE_URL=https://fefwfetsmqbggcujeyug.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZndmZXRzbXFiZ2djdWpleXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDM5MjMsImV4cCI6MjA3NDM3OTkyM30.-C9D9sC24AqP0fQedmwGs9YpEVbt1D5yvg8vVfhOurA
   VITE_DEFAULT_SUPERADMIN_EMAIL=lbalajeesreeshan@gmail.com
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_when_available
   ```

4. **Deploy**
   - Click "Deploy Site"
   - Your app will be available at `https://your-site-name.netlify.app`

### Option 2: Vercel

1. **Import Project**
   - Go to Vercel dashboard
   - Import your Git repository

2. **Configure**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Set Environment Variables** (same as Netlify)

4. **Deploy**

### Option 3: AWS (Advanced)

1. **S3 + CloudFront Setup**
   - Create S3 bucket for static hosting
   - Set up CloudFront distribution
   - Configure Route 53 for domain

2. **Build and Upload**
   ```bash
   npm run build
   aws s3 sync dist/ s3://your-bucket-name --delete
   aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
   ```

## Post-Deployment Steps

### 1. Domain Configuration

- **Custom Domain**: Configure your custom domain (e.g., `pulss.com`)
- **SSL Certificate**: Ensure HTTPS is enabled
- **Redirects**: Set up www → non-www redirects if needed

### 2. Supabase Configuration

1. **Update Allowed Origins**
   ```
   Authentication → Settings → Site URL
   Add: https://yourdomain.com
   ```

2. **Storage Policies**
   ```sql
   -- Allow public access to product images
   CREATE POLICY "Public product images" ON storage.objects
     FOR SELECT USING (bucket_id = 'product-images');
   ```

### 3. Performance Optimization

1. **Enable Gzip/Brotli** (automatic with most CDNs)
2. **Image Optimization**: Consider using Cloudinary for images
3. **Caching Headers**: Set appropriate cache headers

### 4. Monitoring Setup

1. **Analytics**: Add Google Analytics if needed
2. **Error Tracking**: Consider Sentry for error monitoring
3. **Uptime Monitoring**: Set up uptime checks

## Migration to Different Providers

### Moving from Netlify to AWS

1. **Build your app**
   ```bash
   npm run build
   ```

2. **Upload to S3**
   ```bash
   aws s3 sync dist/ s3://your-new-bucket
   ```

3. **Update DNS**
   - Point your domain to new AWS CloudFront distribution

4. **Update Environment Variables**
   - No changes needed if using same Supabase instance

### Moving Supabase Project

1. **Export Data**
   ```sql
   -- Export all data from current project
   pg_dump your_current_database > backup.sql
   ```

2. **Import to New Project**
   ```sql
   -- Import to new Supabase project
   psql new_database < backup.sql
   ```

3. **Update Environment Variables**
   ```
   VITE_SUPABASE_URL=https://new-project.supabase.co
   VITE_SUPABASE_ANON_KEY=new-anon-key
   ```

## Maintenance Tasks

### Regular Updates

1. **Dependencies**
   ```bash
   npm audit
   npm update
   ```

2. **Security**
   - Review Supabase RLS policies quarterly
   - Update API keys if compromised
   - Monitor access logs

### Backup Strategy

1. **Database Backups**
   ```bash
   # Daily automated backup
   pg_dump your_database > backups/$(date +%Y%m%d).sql
   ```

2. **File Storage Backups**
   - Set up automated Supabase Storage backups
   - Consider cross-region replication

### Scaling Considerations

1. **Database**
   - Monitor Supabase usage
   - Upgrade plan as needed

2. **CDN**
   - Monitor bandwidth usage
   - Optimize images and assets

3. **Performance**
   - Use Lighthouse for regular performance audits
   - Monitor Core Web Vitals

## Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Clear node modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Environment Variables Not Loading**
   - Ensure variables start with `VITE_`
   - Restart development server after changes
   - Check provider documentation for environment setup

3. **Supabase Connection Issues**
   - Verify URL and keys in environment
   - Check Supabase project status
   - Review network policies

4. **Image Upload Issues**
   - Check Supabase Storage policies
   - Verify file size limits
   - Review CORS settings

### Support

For deployment issues:
1. Check the provider's documentation (Netlify/Vercel/AWS)
2. Review build logs for specific errors
3. Ensure all environment variables are set correctly
4. Test locally with production build: `npm run build && npm run preview`

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Supabase RLS policies reviewed
- [ ] No API keys in frontend code
- [ ] CORS properly configured
- [ ] File upload limits set
- [ ] Rate limiting configured
- [ ] Regular security updates