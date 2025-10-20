# Database Setup Instructions

## ✅ What's Been Done

All database setup has been completed automatically:

1. ✅ Created `image_metadata` table with full-text search capabilities
2. ✅ Created indexes for optimal performance
3. ✅ Created `search_images_by_text()` function for semantic search
4. ✅ Created `upsert_image_metadata()` function for data management
5. ✅ Enabled Row Level Security (RLS) based on organization_id and key
6. ✅ Set up automatic timestamps and triggers

## 📝 What You Need to Do

### 1. Install Supabase Client

Run this command to install the Supabase JavaScript client:

```bash
npm install @supabase/supabase-js
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root of your project with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://uuerpqlqvisllxwevryb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1ZXJwcWxxdmlzbGx4d2V2cnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNTMyODYsImV4cCI6MjA3NTgyOTI4Nn0._rtFWNZp-ZlwFvlvxTQIZjB8YeH77JtieYXcN6T1j7I
```

**Note:** Make sure `.env.local` is in your `.gitignore` file (it should be by default).

### 3. Verify the Setup

You can verify the database setup by running these queries in the Supabase SQL Editor:

```sql
-- Check if table exists
SELECT * FROM image_metadata LIMIT 1;

-- Test the search function
SELECT * FROM search_images_by_text(
    'test_org_id',
    'test_key',
    'test query',
    10
);

-- Test the upsert function
SELECT upsert_image_metadata(
    'test_org_id',
    'test_key',
    '/test/path',
    'test-item-123',
    'https://example.com/preview.jpg',
    'Test alt text',
    'Test description'
);
```

## 🔧 Using the Database in Your Application

### Import the helpers

```typescript
import {
  upsertImageMetadata,
  searchImagesByText,
  getImageByItemId,
  getAllImages,
  updateImageMetadata,
  deleteImage,
  getUrlParams
} from '@/src/lib/supabase-client';
```

### Save image metadata when uploading

```typescript
// Get organization and key from URL
const params = getUrlParams();
if (!params) return;

// Save to database
await upsertImageMetadata({
  organization_id: params.organizationId,
  key: params.key,
  image_item_path: imageData.itemPath,
  image_item_id: imageData.itemId,
  image_preview_path: imageData.previewUrl,
  alt_text: imageData.altText,
  description: imageData.description
});
```

### Search images

```typescript
const results = await searchImagesByText(
  organizationId,
  key,
  'sunset beach',
  20
);
```

### Get a specific image

```typescript
const image = await getImageByItemId(
  organizationId,
  key,
  'item-id-123'
);
```

## 🔍 Full-Text Search Features

The search functionality supports:

- **Natural language queries**: "beautiful sunset over the ocean"
- **Phrase searches**: `"exact phrase"`
- **Boolean operators**: `word1 AND word2`, `word1 OR word2`
- **Exclusions**: `word1 -word2`
- **Automatic relevance ranking**: Results sorted by relevance

## 🔒 Security

- **Row Level Security (RLS)** is enabled on the `image_metadata` table
- Access is controlled by `organization_id` and `key` parameters
- The anon key is safe to use in client-side code
- Each organization can only access their own data

## 📊 Monitoring

You can monitor your database usage in the Supabase Dashboard:

1. Go to https://supabase.com/dashboard
2. Select your project: "robertobarbedo's Project"
3. Navigate to "Database" > "Tables" to view data
4. Check "Database" > "Functions" to see the helper functions

## 🚀 Next Steps

1. Install the Supabase client package
2. Add environment variables
3. Update your `handleSave` function to also save to Supabase
4. Implement the search functionality in the "Find" tab
5. Test the integration

## 📝 Database Schema

Your table structure:

```
image_metadata
├── id (UUID, primary key)
├── organization_id (TEXT)
├── key (TEXT)
├── image_item_path (TEXT)
├── image_item_id (TEXT)
├── image_preview_path (TEXT)
├── alt_text (TEXT, nullable)
├── description (TEXT, nullable)
├── search_vector (TSVECTOR, auto-generated)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

## 💡 Tips

- The `search_vector` column is automatically maintained - you don't need to update it manually
- Use the `upsert_image_metadata` function to avoid duplicate entries
- The search function returns results sorted by relevance
- All timestamps are in UTC

