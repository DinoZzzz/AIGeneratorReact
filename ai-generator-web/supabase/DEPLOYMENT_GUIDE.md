# Deployment Guide - Admin Reset Password Edge Function

## Overview
This guide will help you deploy the `admin-reset-password` Edge Function to enable admins to reset passwords for any user.

## Prerequisites
- Supabase CLI installed
- Project linked to Supabase

## Step 1: Install Supabase CLI

### Windows Installation Options:

**Option A: Using Scoop (Recommended)**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Option B: Using Chocolatey**
```powershell
choco install supabase
```

**Option C: Using NPX (No installation needed)**
```bash
# Replace all 'supabase' commands with 'npx supabase'
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy admin-reset-password
```

**Option D: Direct Binary Download**
1. Download the latest Windows release: https://github.com/supabase/cli/releases
2. Extract the `supabase.exe` file
3. Add to your PATH or run from the directory

## Step 2: Login to Supabase

```bash
supabase login
```

## Step 3: Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

> **Finding your project ref:**
> - Go to your Supabase Dashboard
> - Look in the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
> - Or go to Settings → General

## Step 4: Deploy the Edge Function

```bash
supabase functions deploy admin-reset-password
```

## Step 5: Verify Deployment

1. Go to Supabase Dashboard → Edge Functions
2. You should see `admin-reset-password` listed
3. Check the logs to ensure it deployed successfully

## Environment Variables

The Edge Function automatically has access to:
- `SUPABASE_URL` - Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key (automatically injected)

No additional environment variables are needed!

## Testing

### Test Locally (Optional)

```bash
# Serve the function locally
supabase functions serve admin-reset-password

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/admin-reset-password' \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "userId": "user-uuid-here",
    "password": "newpassword123"
  }'
```

### Test in Production

1. Login as admin in your app
2. Go to Examiners page
3. Edit any user
4. Enter a new password
5. Save
6. Try logging in as that user with the new password

## Troubleshooting

### Error: "Function not found"
- Run: `supabase functions deploy admin-reset-password`
- Check Dashboard → Edge Functions to verify deployment

### Error: "Only admins can reset passwords"
- Current user must have `role: 'admin'` in profiles table
- Check: `SELECT role FROM profiles WHERE id = 'your-user-id'`

### Error: "Missing authorization header"
- User must be logged in
- Check browser console for authentication errors

### Edge Function timeout
- Increase timeout in Supabase Dashboard → Edge Functions → `admin-reset-password` → Settings

## Success!

Once deployed, admins can now:
- ✅ Reset passwords for any user
- ✅ Reset passwords for other admins
- ✅ Change their own password
- ✅ All without being logged out

The password field in the Edit Examiner dialog will now work for all users!
