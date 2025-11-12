# Vercel Deployment Guide

## Environment Variables to Set on Vercel

Go to your Vercel project settings → Environment Variables and add the following:

```
PORT=5000
JWT_SECRET=bloomgradmalithdamsara
CLOUDINARY_API_KEY=846836578735318
CLOUDINARY_API_SECRET=jcNd7SR590O2ervBbMkPXsxkuk8
CLOUDINARY_CLOUD_NAME=dhjhjl4xi
STRIPE_SECRET_KEY=sk_test_51SSYrd5EphtTabiYC26oQ4zAK9cIsM9hzLot92Mo2XnPteuyoacPfWkohYR9Wa9dD0Od32bsMCmkJq9Oz0tFOPXo005iFytnNM
VITE_STACK_PROJECT_ID=75f184bf-2676-4c43-91a2-dc337dac4fff
VITE_STACK_PUBLISHABLE_CLIENT_KEY=pck_qktg7njwwszptx4zeqpgtenyg2w4tfvcgm3r40evezc6r
STACK_SECRET_SERVER_KEY=ssk_m7qy0484vpb83595s3dnzh10de85z4k763fz5hs45zps0
DATABASE_URL=postgresql://neondb_owner:npg_HjuGPOS1Cy0h@ep-winter-king-adhcgxnb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
NODE_ENV=production
```

## Changes Made for Vercel Compatibility

1. **server.js**: 
   - Modified to export the Express app for Vercel serverless
   - Database initialization now happens on-demand per request
   - Changed `sequelize.sync({ alter: false })` for production safety
   - Cron jobs disabled on Vercel (use Vercel Cron or external service)

2. **vercel.json**: 
   - Simplified configuration
   - Removed unnecessary includeFiles config

3. **cronJobs.js**:
   - Added check to prevent cron jobs from running on Vercel

## Important Notes

⚠️ **Cron Jobs**: The automatic monthly invoice generation and report generation won't run on Vercel. Options:
- Use Vercel Cron Jobs (add to vercel.json)
- Use an external cron service (cron-job.org, EasyCron)
- Manually trigger via API endpoints

⚠️ **Database Sync**: Database schema changes must be tested locally first. The production setting `alter: false` prevents automatic schema changes.

## Deployment Steps

1. Commit all changes to git
2. Push to your repository
3. Vercel will auto-deploy
4. Add environment variables in Vercel dashboard
5. Redeploy to apply environment variables

## Testing

After deployment, test these endpoints:
- GET https://bloombackend.vercel.app/ (should return "BloomGrad API is running!")
- GET https://bloombackend.vercel.app/api/products (test products endpoint)
- POST https://bloombackend.vercel.app/api/auth/login (test authentication)
