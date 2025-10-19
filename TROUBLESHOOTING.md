# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### ❌ Error: "operation not permitted, open '.next/trace'"

**Full Error:**
```
operation not permitted, open 'C:\...\sitecore-xm-cloud-smart-image-field\.next\trace'
errno: -4048, code: 'EPERM', syscall: 'open'
```

**Cause:** Node.js processes are still running and have files locked in the `.next` directory.

**Solution:**

#### Option 1: Use the Restart Script (Easiest)
```powershell
.\restart-dev.ps1
```

#### Option 2: Manual Steps
```powershell
# 1. Stop all Node processes
Get-Process node | Stop-Process -Force

# 2. Wait a moment
Start-Sleep -Seconds 2

# 3. Remove .next directory
Remove-Item -Path ".next" -Recurse -Force

# 4. Start dev server
npm run dev
```

#### Option 3: Close Terminal and Retry
1. Close all terminal windows
2. Open a new terminal
3. Run `npm run dev`

---

### ❌ Error: "ENOENT: no such file or directory, routes-manifest.json"

**Cause:** The `.next` build directory is missing or corrupted.

**Solution:**
```bash
# Clean and rebuild
rm -rf .next
npm run dev
```

Or on Windows:
```powershell
Remove-Item -Path ".next" -Recurse -Force
npm run dev
```

---

### ❌ Error: "Port 3000 is already in use"

**Cause:** Another process is using port 3000.

**Solution 1: Kill the process using the port**
```powershell
# Find and kill the process
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | 
    Select-Object -ExpandProperty OwningProcess | 
    ForEach-Object { Stop-Process -Id $_ -Force }

npm run dev
```

**Solution 2: Use a different port**
```bash
npm run dev -- -p 3001
```

---

### ❌ Supabase 401 Unauthorized Error

**Error:** "401 (Unauthorized)" when saving to database

**Cause:** Row Level Security (RLS) policy was blocking requests.

**Status:** ✅ FIXED - RLS policies have been updated to be permissive.

**If you still see this error:**
1. Clear browser cache and refresh
2. Restart your dev server
3. Check that `.env.local` has the correct anon key

---

### ❌ Supabase Connection Errors

**Error:** "Failed to save to Supabase" or network errors

**Checklist:**
1. ✅ Check `.env.local` exists in project root
2. ✅ Verify environment variables are set:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
3. ✅ Restart dev server after adding `.env.local`:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```
4. ✅ Check Supabase project status: https://supabase.com/dashboard
5. ✅ Open browser console and check for detailed error messages

---

### ❌ "Missing URL params" Warning

**Warning in Console:** "Skipping Supabase save - missing URL params or imageUrl"

**Cause:** The URL doesn't have required parameters.

**Solution:** Make sure your URL includes:
```
http://localhost:3000/?organizationId=org_xxxxx&key=xxxxxx
```

Both `organizationId` and `key` are required for database operations.

---

### ❌ Module Not Found Errors

**Error:** "Module not found: Can't resolve '@supabase/supabase-js'"

**Solution:**
```bash
# Reinstall dependencies
npm install

# If that doesn't work, clean install
rm -rf node_modules package-lock.json
npm install
```

---

### ❌ TypeScript Errors in IDE

**Error:** Red squiggly lines in VS Code/Cursor

**Solution:**
```bash
# Restart TypeScript server in VS Code
# Press: Ctrl+Shift+P (Cmd+Shift+P on Mac)
# Type: "TypeScript: Restart TS Server"
# Press Enter

# Or close and reopen the project
```

---

### ❌ Changes Not Reflecting in Browser

**Cause:** Browser cache or Next.js cache

**Solution:**
1. **Hard refresh browser:**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Disable cache in DevTools:**
   - Open Chrome DevTools (F12)
   - Go to Network tab
   - Check "Disable cache"

---

## Quick Diagnostic Commands

### Check if Node is running
```powershell
Get-Process node
```

### Check if port 3000 is in use
```powershell
Get-NetTCPConnection -LocalPort 3000
```

### Check environment variables
```powershell
Get-Content .env.local
```

### Verify Supabase package is installed
```powershell
npm list @supabase/supabase-js
```

### Test Supabase connection
Open browser console and run:
```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

---

## Nuclear Option: Complete Reset

If nothing else works:

```powershell
# Stop all Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Clean everything
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue

# Reinstall
npm install

# Start fresh
npm run dev
```

---

## Getting Help

If you're still stuck:

1. **Check the logs** - Look at the full error message in the terminal
2. **Check browser console** - Press F12 and look for errors
3. **Check Supabase logs** - Go to Supabase Dashboard > Logs
4. **Review documentation:**
   - `database/README.md` - Database documentation
   - `DATABASE_CONNECTED.md` - Setup verification
   - `database/UPSERT_EXPLAINED.md` - How data is saved

---

## Common Workflow Issues

### Save button stays disabled
- ✅ Make sure you've made changes (uploaded image or edited metadata)
- ✅ Check browser console for errors
- ✅ Verify `hasChanges` state is updating

### No console logs when saving
- ✅ Make sure browser DevTools is open
- ✅ Check Console tab (not Elements or Network)
- ✅ Clear console and try again

### Data not appearing in Supabase
- ✅ Verify URL has `organizationId` and `key` parameters
- ✅ Check browser console for "Saved to Supabase" message
- ✅ Refresh Supabase table view
- ✅ Run SQL query to check:
  ```sql
  SELECT * FROM image_metadata ORDER BY created_at DESC LIMIT 10;
  ```

---

## Prevention Tips

1. **Always stop the dev server cleanly** - Use Ctrl+C, don't close the terminal
2. **Keep dependencies updated** - Run `npm update` occasionally
3. **Clear cache periodically** - Delete `.next` folder when switching branches
4. **Use the restart script** - When in doubt, use `.\restart-dev.ps1`
5. **Check environment variables** - After pulling changes, verify `.env.local` exists

---

## Script Files Available

- `restart-dev.ps1` - Clean restart of dev server
- `setup-env.ps1` - Recreate `.env.local` file
- `database/VERIFY_SETUP.sql` - Test database setup

Run any script with:
```powershell
.\script-name.ps1
```

