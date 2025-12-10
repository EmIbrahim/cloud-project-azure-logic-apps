# TROUBLESHOOTING: Metadata Not Showing in Logic App

## The Problem You Encountered

When you uploaded a blob and checked your Logic App's "When a blob is added or modified" trigger, the user metadata (userid, useremail, username) was not appearing in:
- Get Blob Metadata action
- Get Blob Content action  
- Blob trigger outputs

## Root Cause

The issue was with the **timing** of when metadata was being set:

### ❌ **Old (Broken) Approach:**
1. Upload temp blob with metadata ✅
2. **Copy blob** from temp to final location
3. **Set metadata** on final blob AFTER copy completes
4. ❌ **Problem:** Logic App blob trigger fires immediately when blob is created (step 2)
5. ❌ By the time metadata is set (step 3), it's too late - the Logic App already ran

**Result:** Metadata shows up if you manually check the blob later, but the Logic App trigger doesn't see it because it fired before the metadata was set.

## The Fix (Implemented)

### ✅ **New (Working) Approach:**
1. Upload temp blob with metadata ✅
2. **Download** blob content from temp location
3. **Re-upload** to final location WITH metadata already attached
4. ✅ **Success:** Logic App blob trigger fires when blob is created AND metadata is already present
5. Delete temp blob

**Result:** Metadata is present from the moment the blob is created, so the Logic App can access it immediately.

## Code Changes Made

In `src/api/uploads.js`, the `uploadReceipt()` function was changed from:

```javascript
// OLD: Copy then set metadata (broken)
await destBlob.beginCopyFromURL(sourceBlob.url);
// wait for copy...
await destBlob.setMetadata(blobMetadata); // Too late!
```

To:

```javascript
// NEW: Re-upload with metadata (working) 
const downloadResponse = await sourceBlob.download();
const blobBody = await downloadResponse.blobBody;

await destBlob.uploadData(blobBody, {
  blobHTTPHeaders: { blobContentType: contentType },
  metadata: blobMetadata // Metadata present from the start!
});
```

## How to Verify It's Working

### 1. Check Browser Console
After uploading a receipt, you should see:
```
Re-uploading temp-1234567890-receipt.jpg to 1234567890-receipt.jpg with metadata...
Uploaded blob to final location with user metadata: {userid: "123", useremail: "user@example.com", username: "John Doe"}
```

### 2. Check Azure Portal
1. Go to your Storage Account
2. Navigate to Containers → `raw-receipts`
3. Click on an uploaded blob
4. Go to the "Metadata" tab
5. You should see three metadata fields:
   - `userid`
   - `useremail`  
   - `username`

### 3. Check Logic App Run History
1. Go to your Logic App
2. Open the run history
3. Click on a recent run triggered by blob upload
4. Expand the trigger step
5. Look for `Metadata` in the outputs - it should contain the user info!

## Access Metadata in Your Logic App

### Using the Blob Trigger Outputs
```json
@triggerBody()?['Metadata']?['userid']
@triggerBody()?['Metadata']?['useremail']
@triggerBody()?['Metadata']?['username']
```

### Using Get Blob Metadata Action
If you add a "Get blob metadata" action, the metadata will be in the outputs:
```json
@outputs('Get_blob_metadata')?['body']?['Metadata']?['useremail']
```

## Still Not Working?

If you've deployed the fix and it's still not working:

1. **Clear your browser cache** and hard refresh (Ctrl+Shift+R)
2. **Rebuild the app** if you're running locally:
   ```bash
   npm run build
   ```
3. **Check if you're logged in** - the user object must be populated
4. **Verify the code is running** - check browser console for the new log messages
5. **Upload a NEW blob** - old blobs won't have the metadata, only new uploads after the fix

## Alternative: Use HTTP Headers Instead

If blob metadata continues to be problematic, you can use the HTTP trigger approach instead:
- User info is sent in HTTP headers: `X-User-Id`, `X-User-Email`, `X-User-Name`
- User info is also in the request body: `userId`, `userEmail`, `userName`

Access in Logic App:
```json
@triggerOutputs()['headers']?['X-User-Email']
@triggerBody()?['userEmail']
```
