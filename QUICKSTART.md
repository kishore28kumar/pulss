# 🚀 Quick Start Guide

## One Command Setup

```bash
npm start
```

That's it! This command will:
- ✅ Start all Docker containers
- ✅ Setup the database
- ✅ Generate Prisma client
- ✅ Run migrations
- ✅ Seed sample data
- ✅ Start all services

## Access Your Apps

- **🌐 Storefront:** http://localhost:3000
- **👨‍💼 Admin Dashboard:** http://localhost:3001
- **🔌 Backend API:** http://localhost:5000

## Useful Commands

```bash
# Stop all services
npm run stop

# View all logs
npm run logs

# View specific service logs
npm run logs:backend
npm run logs:admin
npm run logs:storefront

# Restart all services
npm run restart

# Open database GUI
npm run db:studio

# Reseed database
npm run db:seed
```

## Default Credentials

**Tenant Slug:** `default`

When registering or making API calls, use:
```
X-Tenant-Slug: default
```

## Troubleshooting

**If something goes wrong:**

1. Stop everything:
   ```bash
   npm run stop
   ```

2. Start fresh:
   ```bash
   npm start
   ```

**Still having issues?**

View the logs:
```bash
npm run logs
```

---

**Need more details?** See [README.md](README.md) for full documentation.

