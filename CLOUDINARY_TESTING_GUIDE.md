# Cloudinary Integration Testing Guide

## 1. VERIFY UPLOAD ENDPOINT

### Step 1: Get Admin Token
```bash
POST http://localhost:5000/api/auth/login
Body (raw JSON):
{
  "email": "admin@example.com",
  "password": "Admin@123"
}
```
Copy the `token` from response and save it.

### Step 2: Upload Image to Cloudinary (POST Only)
```bash
POST http://localhost:5000/api/media/upload
```

**Headers:**
- Authorization: Bearer {YOUR_TOKEN_HERE}

**Body: Form-data**
- file: (select any image file)
- tag: test-property (optional, defaults to 'other')
- name: (optional, custom name)
- description: (optional)
- altText: (optional, for accessibility)

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Media uploaded successfully",
  "data": {
    "mediaAsset": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "image.jpg",
      "fileName": "image.jpg",
      "cloudinaryUrl": "https://res.cloudinary.com/dyhbdio6q/image/upload/v1711270800/bhumi-website/test-property/1711270800000-image.jpg",
      "cloudinaryPublicId": "bhumi-website/test-property/1711270800000-image.jpg",
      "tag": "test-property",
      "mimeType": "image/jpeg",
      "size": 125000,
      "altText": "image.jpg",
      "createdAt": "2026-03-24T10:30:00Z"
    },
    "url": "https://res.cloudinary.com/dyhbdio6q/image/upload/v1711270800/...",
    "width": 1200,
    "height": 800
  }
}
```

⚠️ **Important:** Save the `_id` value from the response - you'll need it for testing retrieval (Section 3, Method 3)

---

## 2. VERIFY IMAGE IS IN CLOUDINARY

### Check Cloudinary Dashboard:
1. Go to: https://console.cloudinary.com/console/c/dyhbdio6q/media_library/folders
2. Login with your Cloudinary account
3. Look for folder: `bhumi-website/test-property/`
4. Should see your uploaded image
5. Click on image → note the URL and public ID

### Verify Image Transformation:
Image should be automatically transformed to:
- Width: 1200px
- Height: 800px
- Format: Auto-optimized (WebP for modern browsers)
- Quality: Auto (q_auto)

---

## 3. TEST RETRIEVAL ENDPOINT

⚠️ **IMPORTANT:** After uploading (Step 2), use these GET endpoints to retrieve the uploaded media. Do NOT use `/api/media/upload` for GET requests - that's POST only!

### Method 1: Get All Media Assets
```bash
GET http://localhost:5000/api/media
```
**No Authorization Required** - This is a public endpoint

**Response Should Include:**
```json
{
  "success": true,
  "message": "Media assets retrieved",
  "data": {
    "mediaAssets": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "image.jpg",
        "fileName": "image.jpg",
        "cloudinaryUrl": "https://res.cloudinary.com/...",
        "cloudinaryPublicId": "bhumi-website/test-property/1711270800000-image.jpg",
        "tag": "test-property",
        "altText": "image.jpg",
        "mimeType": "image/jpeg",
        "size": 125000,
        "createdAt": "2026-03-24T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "skip": 0,
      "limit": 20,
      "pages": 1
    }
  }
}
```

### Method 2: Filter by Tag
```bash
GET http://localhost:5000/api/media?tag=test-property
```
**No Authorization Required** - Add `?tag=test-property` to filter results

### Method 3: Get Specific Media By ID
```bash
GET http://localhost:5000/api/media/{mediaAssetId}
```
Replace `{mediaAssetId}` with the `_id` from the upload response or from Method 1 results.

**Response:**
```json
{
  "success": true,
  "message": "Media asset retrieved",
  "data": {
    "mediaAsset": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "image.jpg",
      "cloudinaryUrl": "https://res.cloudinary.com/...",
      "tag": "test-property"
    }
  }
}
```

## 4. VERIFY UPLOAD WORKED

### Check Response Fields:
- ✅ `mediaAsset._id` → MongoDB document ID (save this)
- ✅ `cloudinaryUrl` → Full Cloudinary URL
- ✅ `cloudinaryPublicId` → Path in Cloudinary (format: `bhumi-website/{tag}/{timestamp}-{filename}`)
- ✅ `width` & `height` → Image dimensions

### Browser Step:
1. Copy the `cloudinaryUrl` from Step 2 response
2. Paste in browser: `https://res.cloudinary.com/dyhbdio6q/image/upload/v1711270800/...`
3. Image should load successfully
4. Maximum load time: ~2 seconds

---

## 5. RETRIEVE UPLOADED MEDIA

### Retrieve All Media:
```bash
GET http://localhost:5000/api/media
```
- No authentication required
- Response time should be < 500ms

### Retrieve by Tag:
```bash
GET http://localhost:5000/api/media?tag=test-property
```

### Retrieve Single Media Asset:
```bash
GET http://localhost:5000/api/media/{mediaAssetId}
```
Replace `{mediaAssetId}` with the `_id` from your upload response.

---

## 6. STRESS TEST (Multiple Uploads)

### Upload 5-10 Images Sequentially:
```bash
For each image:
POST http://localhost:5000/api/media/upload
Headers:
  Authorization: Bearer {ADMIN_TOKEN}
Body: Form-data with different images and tags
```

**Monitor:**
- Response time for each upload → should be < 5 seconds per image
- Check status in each response (should be 201 Created)
- All uploaded media should appear in GET `/api/media`

### Verify All Uploads:
```bash
GET http://localhost:5000/api/media
```
Should return all uploaded images instantly with complete metadata.

---

## 7. VERIFY DATABASE STORAGE

### Check MongoDB:
```bash
db.mediaassets.find().pretty()
```

**Expected Fields:**
- `_id`: MongoDB ObjectId (unique identifier)
- `name`: Media name/title
- `fileName`: Original filename
- `cloudinaryUrl`: Full Cloudinary URL
- `cloudinaryPublicId`: Path in Cloudinary (e.g., `bhumi-website/test-property/1711270800000-image.jpg`)
- `tag`: Tag for organization (e.g., "test-property")
- `mimeType`: File MIME type (e.g., "image/jpeg")
- `size`: File size in bytes
- `altText`: Accessibility text
- `createdAt`: Upload timestamp
- `uploadedBy`: User ID who uploaded it

---

## 8. DELETE ENDPOINT TEST (Admin Only)

```bash
DELETE http://localhost:5000/api/media/{mediaAssetId}
Headers:
  Authorization: Bearer {ADMIN_TOKEN}
```
Replace `{mediaAssetId}` with the `_id` from your upload.

**Expected Response:**
```json
{
  "success": true,
  "message": "Media asset deleted successfully"
}
```

**Verify Deletion:**
1. Check Cloudinary dashboard → Image should be deleted
2. Run GET `/api/media` → Image should not appear in list
3. Check MongoDB → Document should be removed from mediaassets collection

---

## 9. OPTIMIZATION CHECKLIST

- [ ] Upload time < 3 seconds per image
- [ ] Retrieval time < 500ms for list
- [ ] Image size optimized (< 200KB)
- [ ] Dimensions correctly transformed (1200x800)
- [ ] Format auto-optimized (WebP supported)
- [ ] Quality auto-adjusted (q_auto)
- [ ] All metadata stored in MongoDB
- [ ] Cloudinary dashboard shows all uploads
- [ ] Folder structure: `bhumi-website/{tag}/{timestamp}-{filename}`
- [ ] Delete removes from both Cloudinary and MongoDB

---

## 10. COMMON ISSUES & FIXES

### Issue: 401 Unauthorized
**Fix:** Admin token expired or missing. Get new token from login endpoint and add it to Authorization header.

### Issue: 500 Error - "Cast to ObjectId failed"
**Fix:** This happens when you use GET `/api/media/upload`. That endpoint is **POST only**. Use:
- `GET /api/media` - for all media
- `GET /api/media/{id}` - for specific media

### Issue: File too large
**Fix:** Max file size is 10MB by default. Check the `MAX_FILE_SIZE` environment variable.

### Issue: File type not allowed
**Fix:** Check your `.env` file for `ALLOWED_UPLOAD_TYPES`. Should include image MIME types like `image/jpeg,image/png,image/webp`.

### Issue: No file provided
**Fix:** Ensure you're including a file in Form-data with key name `file` (not `image` or anything else).

### Issue: Cloudinary URL returns 404
**Fix:** Check that the image exists in your Cloudinary dashboard. Verify the `cloudinaryPublicId` from the upload response.

### Issue: Slow uploads
**Fix:** Check file size and internet connection. Large files take longer. Monitor with Network tab in DevTools.

---

## 11. QUICK START (TL;DR)

### 1️⃣ Get Admin Token
```bash
POST http://localhost:5000/api/auth/login
Body (JSON):
{
  "email": "admin@example.com",
  "password": "Admin@123"
}
```
Copy the `token` value.

### 2️⃣ Upload Image
```bash
POST http://localhost:5000/api/media/upload
Headers:
  Authorization: Bearer {token}
Body (Form-data):
  file: (choose an image)
  tag: test-property
```
Save the `data.mediaAsset._id` from response.

### 3️⃣ Verify Upload
```bash
GET http://localhost:5000/api/media?tag=test-property
```
You should see your uploaded image in the response.

### 4️⃣ Retrieve Specific Image
```bash
GET http://localhost:5000/api/media/{id}
```
Replace `{id}` with the ID from step 2.

---

## 12. AUTOMATION SCRIPT (Postman)

Add this to Postman **Pre-request Script** on login request:

```javascript
// Auto-save token to environment
pm.sendRequest({
    url: "http://localhost:5000/api/auth/login",
    method: "POST",
    header: {"Content-Type": "application/json"},
    body: {
        mode: 'raw',
        raw: JSON.stringify({
            email: "admin@example.com",
            password: "Admin@123"
        })
    }
}, (err, response) => {
    if (!err) {
        const token = response.json().data.token;
        pm.environment.set("admin_token", token);
        console.log("✅ Token saved: " + token.substring(0, 20) + "...");
    } else {
        console.error("❌ Login failed:", err);
    }
});
```

Then use `{{admin_token}}` in any Authorization header instead of pasting the token manually.
