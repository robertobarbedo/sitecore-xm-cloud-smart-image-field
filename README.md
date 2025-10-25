````markdown
# 🖼️ Sitecore XM Cloud Smart Image Field

A custom field extension for Sitecore XM Cloud that provides advanced image management capabilities including:

- **Image Upload**: Upload images directly to Sitecore Media Library with drag-and-drop support
- **Image Search**: Find and select existing images from your Sitecore Media Library
- **AI-Powered Captions**: Automatically generate alt text and descriptions using OpenAI
- **Smart Cropping**: Generate responsive crops with focal point control
- **Metadata Management**: Store and retrieve image metadata including dimensions, size, and MIME type

## 🚀 Features

### Image Upload & Selection
- Drag-and-drop image upload
- Search existing images in Media Library
- Real-time image preview
- Automatic dimension detection

### AI Integration
- OpenAI-powered image analysis
- Automatic alt text generation
- Smart description creation
- One-click caption enhancement

### Responsive Cropping
- Visual focal point selector
- Automatic crop generation for multiple viewports (mobile, tablet, desktop)
- Preview all crop variations
- Upload crops to Sitecore Media Library

### Metadata Storage
- Supabase integration for extended metadata
- Store image dimensions, size, MIME type
- Track focal points for smart cropping
- Save cropped version references

## 🎨 Design Guidelines

This extension follows the [Sitecore Blok Design System](https://blok.sitecore.com/) to ensure consistency with the XM Cloud interface. All UI components adhere to Blok design patterns and principles for a seamless user experience.

For design specifications and mockups, see the `/design` folder.

## 📦 Getting Started

### Prerequisites

1. **Sitecore XM Cloud** instance with Marketplace Apps enabled
2. **Supabase** account and project ([Setup Guide](database/SETUP.md))
3. **OpenAI API** key (optional, for AI-powered captions)

### Installation

1. Clone this repository:
   ```sh
   git clone <repository-url>
   cd sitecore-xm-cloud-smart-image-field
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Configure environment variables (`.env.local`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Set up the database:
   - Follow the [Database Setup Guide](database/SETUP.md)
   - Run the migrations in the `database/migrations/` folder
   - Configure your library settings directly in Supabase

5. Run the development server:
   ```sh
   npm run dev
   ```

6. Deploy and configure in Sitecore XM Cloud:
   - Deploy your application to a hosting provider
   - Install the extension in XM Cloud Marketplace
   - Configure as a Custom Field extension point
   - See [Sitecore Marketplace documentation](https://doc.sitecore.com/mp/en/developers/marketplace/extension-points.html)

## 🛠️ Configuration

### Library Configuration

Configure your image library settings directly in the Supabase `libraries` table:

```sql
INSERT INTO libraries (organization_id, key, name, preview_host, base_folder)
VALUES (
  'your-org-id',
  'your-key',
  'My Library',
  'https://your-preview-host.com/',
  '/sitecore/media library/your-base-folder'
);
```

### URL Parameters

The field supports several URL parameters for customization:

- `vmobile=WIDTHxHEIGHT` - Mobile crop dimensions (e.g., `vmobile=540x675`)
- `vtablet=WIDTHxHEIGHT` - Tablet crop dimensions (e.g., `vtablet=768x960`)
- `vdesksmall=WIDTHxHEIGHT` - Small desktop crop dimensions (e.g., `vdesksmall=1024x768`)
- `acapt=1` - Auto-caption: Automatically run AI analysis on upload
- `acrop=1` - Auto-crop: Automatically upload crops after generation

### New Image Flow

When using `acapt=1` and/or `acrop=1`, the field operates in wizard mode:
1. **New Image**: Upload or find an image
2. **Metadata**: Edit or auto-generate captions (if `acapt=1`)
3. **Cropping**: Select focal point and upload crops (if crop dimensions configured and `acrop=1`)

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── analyze-image/  # OpenAI image analysis
│   │   ├── proxy-image/    # CORS proxy for images
│   │   └── upload/         # Sitecore media upload
│   ├── layout.tsx        # App layout
│   └── page.tsx          # Main field extension
├── components/
│   ├── AppContext.tsx    # SDK context viewer
│   ├── ImageCropping.tsx # Cropping interface
│   ├── ImageFind.tsx     # Image search
│   ├── ImageMetadata.tsx # Caption editor
│   ├── ImageSelector.tsx # Upload interface
│   └── ItemInfo.tsx      # Selected image info
├── lib/
│   ├── config.ts         # Supabase config fetching
│   ├── folder-manager.ts # Sitecore folder operations
│   ├── supabase-client.ts # Supabase client
│   └── openai/           # OpenAI integration
└── utils/
    └── hooks/            # React hooks
```

## 🗄️ Database Schema

The field uses Supabase with the following tables:

- `image_metadata` - Stores image metadata (dimensions, focal points, crops)
- `libraries` - Configuration for image libraries (configured manually)

See [Database Documentation](database/README.md) for details.

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Organization-level data isolation
- Secure API routes with authentication
- See [Security Model](database/SECURITY_MODEL.md)

## 📝 License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

## 🐛 Issues

If you encounter any issues or have suggestions for improvements, please open an issue on the repository.

## 📚 Documentation

- [Database Setup](database/SETUP.md)
- [Security Model](database/SECURITY_MODEL.md)
- [Image Cropping Feature](IMAGE_DIMENSIONS_FEATURE.md)
- [Focus Point Feature](FOCUS_POINT_FEATURE.md)
- [AI Recommendations](IMAGE_RECOMMENDATIONS_FEATURE.md)
````