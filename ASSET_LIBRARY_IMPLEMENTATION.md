# Asset Library to Storage Buckets Implementation

## Summary
Implemented functionality to store Asset Library images (logos and other design elements) into dedicated Supabase storage buckets when the "Create Concepts" button is clicked. The folder structure in the buckets uses the `briefId` as the folder name.

## Changes Made

### 1. Created AssetLibraryContext (`src/contexts/AssetLibraryContext.tsx`)
- **Purpose**: Share asset state across components
- **Features**:
  - Centralized asset management with `AssetLibraryProvider`
  - Stores assets with original File objects for upload
  - Provides helper methods: `addAsset`, `removeAsset`, `updateAsset`, `clearAssets`
  - Filter methods: `getLogoAssets`, `getImageAssets`, `getColorAssets`
  - Asset types: `logo`, `image`, `color`

### 2. Updated AssetLibrary Component (`src/components/ui/asset-library.tsx`)
- **Changes**:
  - Now uses `AssetLibraryContext` instead of local state
  - Preserves original File objects for server upload
  - Maintains all existing UI functionality (drag-and-drop, descriptions, colors)

### 3. Added Asset Upload to Storage Layer (`server/storage.ts`)
- **New Method**: `uploadAssetImage(briefId, file, fileName, mimeType, assetType)`
- **Storage Structure**: `{bucket}/{briefId}/{timestamp}_{filename}`
- **Buckets**:
  - `logos` - for logo assets
  - `assets` - for other design elements (product images, photos, etc.)
- **Features**:
  - Automatic filename sanitization
  - Timestamp-based naming to prevent collisions
  - Public URL generation
  - Error handling

### 4. Updated Brief Enhancement API (`server/api/briefs.ts`)
- **New Endpoint**: `POST /:briefId/upload-assets`
  - Dedicated endpoint for uploading assets
  - Accepts array of assets with type, name, url, description
  - Handles both image assets and color values
  
- **Modified Endpoint**: `POST /:briefId/enhance`
  - Now accepts `assets` array in request body
  - Uploads logo and image assets to appropriate buckets
  - Creates folder structure: `{briefId}/{timestamp}_{filename}`
  - Returns uploaded asset URLs in response
  - Preserves existing concept generation functionality

### 5. Updated LoadingPage (`src/pages/brief/LoadingPage.tsx`)
- **Changes**:
  - Added `useAssetLibrary` hook to access assets
  - Passes assets to enhance endpoint when generating concepts
  - Maintains existing polling and error handling

### 6. Updated App Configuration (`src/App.tsx`)
- **Changes**:
  - Wrapped app with `AssetLibraryProvider`
  - Ensures context is available throughout the application

## Storage Bucket Configuration
The implementation uses two pre-existing storage buckets:

1. **logos** bucket (`supabase/migrations/202510122211000_logos_bucket.sql`)
   - Stores brand logos
   - Public read access
   - Authenticated user upload/update/delete

2. **assets** bucket (`supabase/migrations/202510122211000_Design_Assets_bucket.sql`)
   - Stores other design elements (product images, photos, etc.)
   - Public read access
   - Authenticated user upload/update/delete

## Folder Structure in Buckets
```
logos/
  └── {briefId}/
      ├── {timestamp}_logo1.png
      └── {timestamp}_logo2.svg

assets/
  └── {briefId}/
      ├── {timestamp}_product1.jpg
      ├── {timestamp}_photo1.png
      └── {timestamp}_element1.png
```

## Flow
1. User uploads images to Asset Library section
2. User fills out brief form
3. User clicks "Create Concepts" button
4. Brief is created and user is redirected to LoadingPage
5. LoadingPage calls enhance endpoint with assets from context
6. Server uploads each asset to appropriate bucket:
   - Logos → `logos/{briefId}/...`
   - Other images → `assets/{briefId}/...`
   - Colors → stored as values (no upload needed)
7. Server returns uploaded asset URLs
8. Brief enhancement and concept generation proceeds as normal

## Benefits
- ✅ Centralized asset management
- ✅ Persistent storage in Supabase
- ✅ Organized folder structure by brief ID
- ✅ Public URLs for easy asset access
- ✅ No data loss on page navigation
- ✅ Proper separation of logos and other assets
- ✅ Timestamp-based naming prevents collisions
- ✅ Maintains backward compatibility

## API Response Example
```json
{
  "enhancedBrief": { ... },
  "concepts": [ ... ],
  "conceptsGenerated": true,
  "uploadedAssets": [
    {
      "type": "logo",
      "url": "https://.../logos/brief-id-123/1234567890_company-logo.png",
      "name": "company-logo.png",
      "description": "Main company logo"
    },
    {
      "type": "image",
      "url": "https://.../assets/brief-id-123/1234567891_product.jpg",
      "name": "product.jpg",
      "description": "Product hero image"
    },
    {
      "type": "color",
      "url": "#FF5733",
      "name": "#FF5733"
    }
  ]
}
```

## Testing Checklist
- [ ] Upload logo assets to Asset Library
- [ ] Upload other design elements to Asset Library
- [ ] Add color values
- [ ] Create a new brief and click "Create Concepts"
- [ ] Verify assets are uploaded to correct buckets
- [ ] Verify folder structure uses briefId
- [ ] Check that uploaded asset URLs are accessible
- [ ] Ensure concept generation still works correctly
- [ ] Test with multiple assets of same type
- [ ] Test with special characters in filenames

