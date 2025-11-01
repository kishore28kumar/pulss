# Custom Domain Setup Guide

This guide will help you set up a custom domain (e.g., `pharmacy.mycompany.com`) for your Pulss store.

## Prerequisites

Before you begin, make sure you have:

1. ✅ Access to your domain's DNS settings (via your domain registrar or DNS provider)
2. ✅ Super admin approval for custom domain feature (contact support if not enabled)
3. ✅ Admin access to your Pulss tenant dashboard
4. ✅ The custom domain you want to use (subdomain recommended, e.g., `pharmacy.mycompany.com`)

## Overview

Setting up a custom domain involves three main steps:

1. **Add Domain**: Add your custom domain in the Pulss dashboard
2. **Configure DNS**: Add DNS records at your domain provider
3. **Verify Domain**: Verify ownership and activate SSL certificate

Total setup time: **5-10 minutes** (DNS propagation may take up to 48 hours)

---

## Step 1: Add Your Custom Domain

### 1.1 Navigate to Custom Domains

1. Log in to your Pulss admin dashboard
2. Go to **Settings** → **Branding** → **Custom Domains**
3. Click **Add Domain** button

### 1.2 Enter Domain Information

Fill in the form:
- **Domain Name**: `pharmacy.mycompany.com` (without http:// or https://)
- **Set as Primary**: Check if this will be your main domain
- Click **Add Domain**

**Important Notes**:
- Use a subdomain (e.g., `pharmacy.mycompany.com`) rather than root domain (`mycompany.com`)
- The domain must not already be in use by another tenant
- You can add multiple domains if needed

### 1.3 Save Domain Details

After adding, you'll see:
- ✅ Domain added successfully
- 📋 DNS configuration instructions
- 🔑 Verification token

**Keep this page open** - you'll need the DNS records in the next step.

---

## Step 2: Configure DNS Records

You need to add two types of DNS records at your domain provider:

### 2.1 Add TXT Record (For Verification)

This proves you own the domain.

**Record Details**:
- **Type**: `TXT`
- **Host/Name**: `_pulss-verification.pharmacy.mycompany.com`
- **Value**: `<verification-token>` (provided in dashboard)
- **TTL**: `3600` (or use default)

**Example for different DNS providers**:

#### Cloudflare
1. Go to DNS settings
2. Click **Add record**
3. Select **TXT** type
4. Name: `_pulss-verification.pharmacy`
5. Content: `<verification-token>`
6. Click **Save**

#### GoDaddy
1. Go to DNS Management
2. Click **Add**
3. Type: **TXT**
4. Host: `_pulss-verification.pharmacy`
5. TXT Value: `<verification-token>`
6. Click **Save**

#### Namecheap
1. Go to Advanced DNS
2. Click **Add New Record**
3. Type: **TXT Record**
4. Host: `_pulss-verification.pharmacy`
5. Value: `<verification-token>`
6. Click **Save**

#### AWS Route 53
1. Go to Hosted Zones
2. Select your domain
3. Click **Create Record**
4. Name: `_pulss-verification.pharmacy.mycompany.com`
5. Type: **TXT**
6. Value: `"<verification-token>"`
7. Click **Create**

### 2.2 Add CNAME Record (For Routing)

This routes traffic to Pulss servers.

**Record Details**:
- **Type**: `CNAME`
- **Host/Name**: `pharmacy.mycompany.com`
- **Value**: `app.pulss.io` (or the value shown in your dashboard)
- **TTL**: `3600` (or use default)

**Example**:

#### Cloudflare
1. Click **Add record**
2. Select **CNAME** type
3. Name: `pharmacy`
4. Target: `app.pulss.io`
5. ⚠️ Disable **Proxy status** (orange cloud) initially
6. Click **Save**

#### Other Providers
Follow similar steps as TXT record, but select **CNAME** type.

### 2.3 Alternative: A Record (If CNAME Not Supported)

If your DNS provider doesn't support CNAME for your record:

**Record Details**:
- **Type**: `A`
- **Host/Name**: `pharmacy.mycompany.com`
- **Value**: `<IP-address>` (provided in dashboard)
- **TTL**: `3600`

---

## Step 3: Verify Domain

### 3.1 Wait for DNS Propagation

DNS changes can take time to propagate:
- **Typical**: 5-30 minutes
- **Maximum**: Up to 48 hours

### 3.2 Check DNS Propagation

You can check if DNS records are live:

**Online Tools**:
- https://dnschecker.org
- https://www.whatsmydns.net

**Command Line**:
```bash
# Check TXT record
dig _pulss-verification.pharmacy.mycompany.com TXT

# Check CNAME record
dig pharmacy.mycompany.com CNAME

# Check A record (if using A instead of CNAME)
dig pharmacy.mycompany.com A
```

### 3.3 Verify in Dashboard

Once DNS records are propagated:

1. Go back to **Custom Domains** in Pulss dashboard
2. Find your domain in the list
3. Click **Verify** button
4. Wait for verification (usually takes a few seconds)

**Success Indicators**:
- ✅ Status changes to "Verified"
- 🔒 SSL provisioning starts automatically
- 🌐 Domain becomes active

### 3.4 SSL Certificate

After verification:
- SSL certificate is automatically provisioned (Let's Encrypt)
- Takes 2-5 minutes
- Status will show "SSL: Active" when ready
- Certificate auto-renews before expiration

---

## Step 4: Test Your Domain

### 4.1 Access Your Store

Visit your custom domain:
```
https://pharmacy.mycompany.com
```

You should see your branded store with:
- ✅ HTTPS (secure connection)
- ✅ Your custom branding
- ✅ No Pulss branding (if white-label is enabled)

### 4.2 Test Different Pages

Make sure these work:
- Homepage: `https://pharmacy.mycompany.com`
- Products: `https://pharmacy.mycompany.com/products`
- Login: `https://pharmacy.mycompany.com/login`
- Orders: `https://pharmacy.mycompany.com/orders`

### 4.3 Set as Primary (Optional)

If you want this to be your main domain:
1. Go to domain settings
2. Check **Set as Primary**
3. All links and emails will use this domain

---

## Troubleshooting

### Issue: Domain Verification Failing

**Possible Causes**:
1. DNS records not propagated yet → Wait longer (up to 48 hours)
2. TXT record value incorrect → Double-check the verification token
3. TXT record name incorrect → Should be `_pulss-verification.{your-domain}`

**Solution**:
```bash
# Check if TXT record is visible
dig _pulss-verification.pharmacy.mycompany.com TXT

# You should see your verification token in the response
```

### Issue: Domain Showing as "Failed"

**Possible Causes**:
1. CNAME/A record not configured correctly
2. DNS pointing to wrong server

**Solution**:
```bash
# Check CNAME record
dig pharmacy.mycompany.com CNAME

# Should return: app.pulss.io (or your platform domain)
```

### Issue: SSL Certificate Not Activating

**Possible Causes**:
1. Domain not verified
2. DNS records not pointing correctly
3. Firewall blocking Let's Encrypt validation

**Solution**:
1. Ensure domain shows as "Verified"
2. Check DNS records are correct
3. Wait a few more minutes
4. If still failing after 10 minutes, contact support

### Issue: Cloudflare Orange Cloud

If using Cloudflare with proxy (orange cloud):

**Initial Setup**:
1. Keep proxy **disabled** (gray cloud) during verification
2. After domain is verified and SSL is active
3. You can re-enable proxy (orange cloud)

**Cloudflare SSL Mode**:
- Set SSL mode to **Full (Strict)** in Cloudflare dashboard
- **DO NOT** use Flexible SSL mode

### Issue: Getting DNS_PROBE_FINISHED_NXDOMAIN

**Possible Causes**:
1. DNS records not propagated
2. Wrong DNS records
3. Typo in domain name

**Solution**:
1. Verify domain spelling is correct
2. Check DNS records at provider
3. Wait for propagation (use dnschecker.org)
4. Try from different network/device

### Issue: Mixed Content Warning

**Cause**: Some resources loading over HTTP instead of HTTPS

**Solution**:
1. Ensure all assets use relative URLs or HTTPS
2. Check custom CSS for HTTP references
3. Contact support if issue persists

---

## Advanced Configuration

### Multiple Domains

You can add multiple domains:
1. Follow steps 1-3 for each domain
2. Set one as **primary** (for links/emails)
3. Others can redirect to primary

**Example**:
- Primary: `pharmacy.mycompany.com`
- Secondary: `shop.mycompany.com` (redirects to primary)

### Subdomains

Add multiple subdomains:
- `pharmacy.mycompany.com` - Main store
- `shop.mycompany.com` - Alternative URL
- `store.mycompany.com` - Another alternative

Each requires separate DNS records and verification.

### Root Domain Setup

⚠️ **Not Recommended** but possible:

For root domain (`mycompany.com`):
1. Use **A record** instead of CNAME
2. Point to IP provided in dashboard
3. May have limitations with CDN/load balancing

**Best Practice**: Use subdomain (e.g., `shop.mycompany.com`)

### Cloudflare Configuration

For best results with Cloudflare:

1. **SSL Mode**: Full (Strict)
2. **Always Use HTTPS**: On
3. **Automatic HTTPS Rewrites**: On
4. **Minimum TLS Version**: 1.2
5. **Edge Certificates**: Let managed certificate provision

### DNS Provider Recommendations

**Recommended Providers**:
- ✅ Cloudflare (fast propagation, free SSL, DDoS protection)
- ✅ AWS Route 53 (enterprise-grade, programmable)
- ✅ Namecheap (user-friendly, affordable)

**Works Well**:
- ✅ GoDaddy
- ✅ Google Domains
- ✅ DigitalOcean
- ✅ Hover

---

## Security Best Practices

### 1. Use HTTPS Only
- Never serve content over HTTP
- Enable "Force HTTPS" in settings
- Set HSTS headers

### 2. Keep DNS Records Updated
- Don't share verification tokens
- Remove old/unused domains
- Monitor for unauthorized changes

### 3. Regular SSL Certificate Checks
- Certificates auto-renew
- Check expiration dates in dashboard
- Receive renewal notifications

### 4. Enable DNSSEC (Optional)
- Protects against DNS spoofing
- Enable at your DNS provider
- Recommended for high-security needs

---

## DNS Record Templates

### Quick Reference Table

| Record Type | Host/Name | Value | TTL |
|-------------|-----------|-------|-----|
| TXT | `_pulss-verification.pharmacy.mycompany.com` | `<verification-token>` | 3600 |
| CNAME | `pharmacy.mycompany.com` | `app.pulss.io` | 3600 |
| A (alternative) | `pharmacy.mycompany.com` | `<IP-address>` | 3600 |

### BIND Format

```bind
_pulss-verification.pharmacy.mycompany.com. 3600 IN TXT "<verification-token>"
pharmacy.mycompany.com. 3600 IN CNAME app.pulss.io.
```

### Terraform (AWS Route 53)

```hcl
resource "aws_route53_record" "verification" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "_pulss-verification.pharmacy.mycompany.com"
  type    = "TXT"
  ttl     = 3600
  records = ["<verification-token>"]
}

resource "aws_route53_record" "cname" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "pharmacy.mycompany.com"
  type    = "CNAME"
  ttl     = 3600
  records = ["app.pulss.io"]
}
```

---

## Monitoring & Maintenance

### Domain Health Checks

Monitor your domain:
- ✅ SSL certificate expiration
- ✅ DNS record status
- ✅ Domain verification status
- ✅ Uptime monitoring

**Dashboard Indicators**:
- 🟢 Green: All healthy
- 🟡 Yellow: Warning (e.g., SSL expiring soon)
- 🔴 Red: Issue requires attention

### Email Notifications

You'll receive emails for:
- Domain verification success
- SSL certificate renewal
- SSL certificate expiring soon
- Domain verification failures
- DNS issues detected

### Regular Checks

**Monthly**:
- Verify domain is still working
- Check SSL certificate status
- Review DNS records

**Quarterly**:
- Audit domains in use
- Remove unused domains
- Update documentation

---

## Costs & Billing

### Domain Costs
- Domain registration: Varies by provider ($10-50/year typical)
- DNS hosting: Often free or included

### Pulss Costs
- Custom domain feature: Included in Premium/Enterprise plans
- SSL certificates: Free (Let's Encrypt)
- No additional bandwidth/hosting costs

### Third-Party Services
- Domain registrar fees (annual)
- Premium DNS providers (optional)
- Advanced DDoS protection (optional)

---

## FAQ

### Can I use multiple custom domains?
Yes, add as many as needed. Set one as primary.

### How long does setup take?
5-10 minutes active work. DNS propagation: up to 48 hours.

### Do I need to renew SSL certificates?
No, automatic renewal before expiration.

### Can I use my root domain?
Yes, but subdomain recommended for flexibility.

### What if I change domain providers?
Update DNS records at new provider. No Pulss changes needed.

### Can I remove a domain later?
Yes, delete from dashboard anytime. No impact on other domains.

### Does this affect my existing subdomain?
No, both can work simultaneously. Set preferred as primary.

### Is DNSSEC supported?
Yes, enable at your DNS provider.

---

## Support

Need help?

- 📚 **Documentation**: https://docs.pulss.io/custom-domains
- 💬 **Live Chat**: Available in dashboard
- 📧 **Email**: support@pulss.io
- 🎫 **Support Ticket**: Create in dashboard

**Enterprise Customers**: Contact your account manager

---

## Checklist

Use this checklist to track your setup:

- [ ] Feature enabled by super admin
- [ ] Domain added in dashboard
- [ ] TXT record added to DNS
- [ ] CNAME/A record added to DNS
- [ ] DNS propagation confirmed (dnschecker.org)
- [ ] Domain verified in dashboard
- [ ] SSL certificate active
- [ ] Domain tested and working
- [ ] Set as primary (if desired)
- [ ] Team notified of new domain

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
