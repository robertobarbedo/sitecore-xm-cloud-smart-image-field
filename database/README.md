# Database Setup - Supabase/PostgreSQL

This folder contains all database migrations and functions for the Smart Image Field application.

## Structure

```
database/
├── migrations/           # SQL migration files
├── functions/           # Reusable SQL functions
└── README.md           # This file
```

## Database Schema

### Table: `image_metadata`

Stores metadata for images with full-text search capabilities.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| organization_id | TEXT | Organization identifier from Sitecore |
| key | TEXT | Access key for the content |
| image_item_path | TEXT | Full path to the image in Sitecore media library |
| image_item_id | TEXT | Unique item ID from Sitecore |
| image_preview_path | TEXT | URL path for image preview |
| alt_text | TEXT | Alt text for accessibility |
| description | TEXT | Detailed description for semantic search |
| search_vector | TSVECTOR | Full-text search vector (auto-maintained) |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### Indexes

- `idx_image_metadata_org_key` - Composite index on (organization_id, key)
- `idx_image_metadata_item_id` - Index on image_item_id
- `idx_image_metadata_search` - GIN index for full-text search

### Security

- **Row Level Security (RLS)** is enabled
- Access is controlled by `organization_id` and `key` parameters
- No user-based authentication required

## Functions

### `search_images_by_text()`

Search images using full-text search on alt_text and description fields.

**Parameters:**
- `p_organization_id` (TEXT) - Organization ID
- `p_key` (TEXT) - Access key
- `p_search_query` (TEXT) - Search query (supports natural language)
- `p_limit` (INT, default 20) - Maximum results to return

**Returns:** Table with matching images sorted by relevance

**Example:**
```sql
SELECT * FROM search_images_by_text(
    'org_lxSEYVnF3YpVUlEQ',
    'e3641953fabc471fb110d46241bce7a1',
    'sunset beach',
    10
);
```

### `upsert_image_metadata()`

Insert or update image metadata.

**Parameters:**
- `p_organization_id` (TEXT) - Organization ID
- `p_key` (TEXT) - Access key
- `p_image_item_path` (TEXT) - Image path in media library
- `p_image_item_id` (TEXT) - Sitecore item ID
- `p_image_preview_path` (TEXT) - Preview URL path
- `p_alt_text` (TEXT, optional) - Alt text
- `p_description` (TEXT, optional) - Description

**Returns:** UUID of the inserted/updated record

**Example:**
```sql
SELECT upsert_image_metadata(
    'org_lxSEYVnF3YpVUlEQ',
    'e3641953fabc471fb110d46241bce7a1',
    '/sitecore/media library/images/photo.jpg',
    'item-123',
    'https://example.com/-/media/images/photo.jpg',
    'Beach sunset',
    'Beautiful sunset over the beach with orange sky'
);
```

## Setup Instructions

### 1. Apply the Migration

The migration has been applied to your Supabase project. If you need to reapply it manually:

```bash
# Using Supabase CLI
supabase db push

# Or run the migration file directly in Supabase SQL Editor
```

### 2. Verify the Setup

Check that the table and functions were created:

```sql
-- Check table
SELECT * FROM image_metadata LIMIT 1;

-- Test search function
SELECT * FROM search_images_by_text('your_org_id', 'your_key', 'test', 10);
```

## Full-Text Search

The table uses PostgreSQL's full-text search with:
- **Weighted search vectors**: Alt text has higher weight (A) than description (B)
- **English language**: Optimized for English text (can be changed)
- **Automatic updates**: The search_vector column updates automatically when alt_text or description changes
- **GIN index**: Fast searches even with large datasets

### Search Features

- Natural language queries
- Phrase searches: `"exact phrase"`
- Boolean operators: `word1 AND word2`, `word1 OR word2`
- Exclusions: `word1 -word2`
- Relevance ranking

## Environment Variables

Add these to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## TypeScript Integration

See `src/lib/supabase-client.ts` for the TypeScript client setup and helper functions.

