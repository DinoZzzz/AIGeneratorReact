# Railway Deployment for AI Generator Web

## Quick Start

### 1. Prerequisites
- Railway account ([railway.app](https://railway.app))
- Supabase project with configured database
- This repository pushed to GitHub

### 2. Deploy to Railway

#### Option A: Deploy from GitHub (Recommended)
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Railway will auto-detect Vite and configure build settings

#### Option B: Deploy with Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### 3. Configure Environment Variables

In your Railway project dashboard, go to **Variables** tab and add the following:

#### Required Environment Variables

| Variable Name | Description | Example Value |
|--------------|-------------|---------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

#### How to Get Supabase Credentials
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Project API keys** → `anon` `public` key → `VITE_SUPABASE_ANON_KEY`

### 4. Build Configuration

Railway will automatically:
- Install dependencies: `npm install`
- Build the app: `npm run build`
- Start the server: `npm run start`

The app will be available at: `https://your-app.up.railway.app`

## Deployment Settings

### Build Command
```bash
npm install && npm run build
```

### Start Command
```bash
npm run start
# OR directly:
npx serve -s dist -l $PORT
```

### Port Configuration
- Railway automatically assigns a `PORT` environment variable
- The app is configured to use `$PORT` in the start script
- Default preview port: 8080

## Post-Deployment Checklist

- [ ] Environment variables are set correctly
- [ ] App builds successfully
- [ ] App is accessible via Railway URL
- [ ] Supabase connection works
- [ ] Authentication flow works
- [ ] All API calls to Supabase succeed

## Troubleshooting

### Build Fails
- Check build logs in Railway dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compiles locally: `npm run build`

### App Doesn't Load
- Check deployment logs
- Verify environment variables are set
- Ensure Supabase URL is accessible

### Supabase Connection Issues
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check Supabase project is active
- Verify RLS policies allow public access where needed

### Port Issues
- Railway automatically provides `PORT` env variable
- Start script uses `--port $PORT` to bind correctly
- Don't hardcode port numbers

## Custom Domain (Optional)

1. Go to Railway project **Settings**
2. Click **Domains**
3. Add custom domain
4. Update DNS records as instructed
5. SSL certificate is automatically provisioned

## Environment-Specific Notes

### Production Considerations
- Enable Supabase RLS (Row Level Security)
- Review authentication policies
- Set up proper CORS if needed
- Consider adding rate limiting
- Enable logging and monitoring

### Local Development
Create a `.env.local` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Run locally:
```bash
npm run dev
```

## Support

- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs
- Vite Docs: https://vitejs.dev
