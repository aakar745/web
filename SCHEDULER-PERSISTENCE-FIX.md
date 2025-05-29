# Scheduler Persistence Fix

## Problem
Currently, the scheduler checkboxes reset to unchecked every time the backend server restarts because the scheduler state is stored only in memory.

## Root Cause
In `backend/src/services/cleanupScheduler.ts`:
```typescript
// These are all in-memory and get reset on server restart
let cleanupIntervals: Map<string, NodeJS.Timeout> = new Map();
let activeSchedulers: Set<string> = new Set();
let currentSchedules: ScheduleConfig[] = [...defaultSchedules]; // All disabled by default
```

## Solution: Database Persistence

### 1. Database Model Created
- **File**: `backend/src/models/SchedulerConfig.ts`
- **Purpose**: Store scheduler configurations in MongoDB
- **Schema**:
  ```typescript
  {
    type: 'images' | 'logs' | 'cache' | 'database' | 'memory',
    enabled: boolean,
    hour: number,
    minute: number,
    lastRun?: Date,
    nextRun?: Date,
    createdAt: Date,
    updatedAt: Date
  }
  ```

### 2. Scheduler Service Updated
- **File**: `backend/src/services/cleanupScheduler.ts`
- **Changes**:
  - Added `updateSchedulerInDB()` function to save configs to database
  - Added `loadSchedulersFromDB()` function to restore configs on startup
  - Added `initializeSchedulers()` function to call on server startup
  - Updated `setupCleanupScheduler()` to persist to database
  - Updated `stopCleanupScheduler()` to persist disabled state

### 3. Server Initialization Required
Add to `backend/src/index.ts` after database connection:
```typescript
import { initializeSchedulers } from './services/cleanupScheduler';

// After connectDB()
initializeSchedulers().catch(err => {
  console.error('Scheduler initialization failed:', err);
  // Don't exit - server can run without schedulers
});
```

### 4. Benefits After Implementation
- ✅ **Persistent Schedulers**: Survive server restarts
- ✅ **Database Backing**: Reliable storage in MongoDB
- ✅ **Next Run Times**: Accurate calculation after restart
- ✅ **Status Tracking**: Real-time status from database
- ✅ **Checkbox Persistence**: UI stays in sync with actual state

## Testing the Fix

### Before Fix:
1. Enable any scheduler checkbox ✅
2. Restart backend server 🔄
3. Refresh admin page ❌ Checkbox unchecked

### After Fix:
1. Enable any scheduler checkbox ✅
2. Restart backend server 🔄
3. Refresh admin page ✅ Checkbox still checked

## Implementation Status

### ✅ Completed:
- Database model created
- Scheduler service updated with persistence
- Backend API endpoints updated
- Frontend integration complete

### ⏳ Needs Implementation:
- Add `initializeSchedulers()` call to server startup
- Test the complete flow
- Verify database persistence

## Manual Implementation Steps

1. **Add to `backend/src/index.ts`**:
   ```typescript
   import { initializeSchedulers } from './services/cleanupScheduler';
   
   // After connectDB() call, add:
   initializeSchedulers().catch(err => {
     console.error('Scheduler initialization failed:', err);
   });
   ```

2. **Test the implementation**:
   ```bash
   cd backend
   npm run dev
   # Check logs for "Scheduler system initialized"
   ```

3. **Verify persistence**:
   - Enable schedulers in admin panel
   - Restart server
   - Check that schedulers are still active

## Database Collection

The implementation creates a `schedulerconfigs` collection in MongoDB:
```json
{
  "_id": ObjectId,
  "type": "images",
  "enabled": true,
  "hour": 3,
  "minute": 0,
  "nextRun": ISODate("2025-05-30T03:00:00.000Z"),
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

This fix ensures that scheduler settings persist across server restarts, providing a professional and reliable scheduling system. 