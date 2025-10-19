#!/bin/bash
# Bash script to set up environment variables
# Run this in Terminal: chmod +x setup-env.sh && ./setup-env.sh

cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://uuerpqlqvisllxwevryb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1ZXJwcWxxdmlzbGx4d2V2cnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNTMyODYsImV4cCI6MjA3NTgyOTI4Nn0._rtFWNZp-ZlwFvlvxTQIZjB8YeH77JtieYXcN6T1j7I
EOF

echo "✅ Environment file created successfully!"
echo ""
echo "Next steps:"
echo "1. Restart your dev server: npm run dev"
echo "2. Open your app and upload an image"
echo "3. Check the console for '✅ Saved to Supabase'"

