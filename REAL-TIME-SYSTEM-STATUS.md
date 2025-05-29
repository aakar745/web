# Real-Time System Status Feature

This document describes the implementation of the real-time system status feature that replaces hardcoded values with actual system information in the admin settings panel.

## Overview

The system now provides real-time information about:
- Log file sizes and line counts
- Memory usage statistics
- Database collection and document counts
- Redis cache status and memory usage
- Disk usage for uploads directory

## Backend Implementation

### API Endpoint
- **Route**: `GET /api/admin/system-status`
- **Authentication**: Admin role required
- **Controller**: `adminController.getSystemStatus`

### System Information Collected

#### 1. Log Files
```typescript
logs: {
  size: string;        // Main log file size (KB/MB)
  lines: number;       // Line count in main log
  errorSize: string;   // Error log file size
}
```

**Implementation:**
- Reads `logs/all.log` and `logs/error.log`
- Counts lines by reading file content
- Formats sizes in KB/MB based on file size

#### 2. Memory Usage
```typescript
memory: {
  used: number;        // Heap memory used (MB)
  total: number;       // Total memory allocated (MB)
  percentage: number;  // Memory usage percentage
}
```

**Implementation:**
- Uses Node.js `process.memoryUsage()`
- Calculates total from RSS + heap + external memory
- Returns values in megabytes

#### 3. Database Statistics
```typescript
database: {
  collections: number;  // Number of MongoDB collections
  totalSize: string;    // Total database size
  documents: number;    // Total document count
}
```

**Implementation:**
- Uses `db.listCollections()` to get collection list
- Runs `collStats` command for each collection
- Aggregates size and document counts

#### 4. Redis Cache Status
```typescript
cache: {
  connected: boolean;  // Redis connection status
  keys: number;        // Number of keys in database
  memory: string;      // Redis memory usage
}
```

**Implementation:**
- Tests Redis connection using existing `testRedisConnection()`
- Creates temporary Bull queue to access Redis client
- Parses Redis INFO commands for memory and keyspace data

#### 5. Disk Usage
```typescript
disk: {
  used: string;        // Uploads directory size
  available: string;   // Available space (placeholder)
  percentage: number;  // Usage percentage (placeholder)
}
```

**Implementation:**
- Recursively calculates `uploads/` directory size
- Formats in MB/GB based on size
- Full disk statistics would require OS-specific commands

## Frontend Implementation

### State Management
```typescript
const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
```

### Loading System Status
- Loads on component mount with `useEffect`
- Refreshes after cleanup operations
- Manual refresh button available

### UI Updates

#### Before (Hardcoded)
```tsx
<p>Current logs: <strong>256KB</strong> (1997 lines)</p>
<p>Clears: Rate limits, circuit breakers, expired keys</p>
```

#### After (Real-time)
```tsx
<p>Current logs: <strong>{systemStatus?.logs.size}</strong> ({systemStatus?.logs.lines} lines)</p>
<p>Redis status: <strong className={connected ? 'text-green-600' : 'text-red-600'}>
  {systemStatus?.cache.connected ? 'Connected' : 'Disconnected'}
</strong></p>
```

### Cards Updated

1. **Log Files Cleanup**
   - Real log file sizes and line counts
   - Separate error log size display

2. **Cache Cleanup**
   - Redis connection status (green/red)
   - Actual cache memory usage
   - Key count from Redis

3. **Database Cleanup**
   - Real collection count
   - Total document count
   - Database size

4. **Memory Optimization**
   - Current memory usage in MB and percentage
   - Total allocated memory
   - Disk usage for uploads

## API Response Example

```json
{
  "status": "success",
  "data": {
    "systemStatus": {
      "logs": {
        "size": "1.24 MB",
        "lines": 2847,
        "errorSize": "15 KB"
      },
      "memory": {
        "used": 87,
        "total": 142,
        "percentage": 61
      },
      "database": {
        "collections": 5,
        "totalSize": "2.34 MB", 
        "documents": 156
      },
      "cache": {
        "connected": true,
        "keys": 23,
        "memory": "1.2M"
      },
      "disk": {
        "used": "145 MB",
        "available": "Unknown",
        "percentage": 0
      }
    }
  }
}
```

## Benefits

1. **Accurate Information**: Real system status instead of hardcoded values
2. **Better Monitoring**: Admin can see actual resource usage
3. **Informed Decisions**: Clean up when actually needed based on real data
4. **Real-time Updates**: Status refreshes after cleanup operations
5. **Professional UI**: Shows actual system health and status

## Error Handling

- Graceful fallbacks for missing files/directories
- Non-critical errors don't break the entire status response
- Loading states while fetching data
- Optional Redis/database information if services unavailable

## Performance Considerations

- Status collection is async and optimized
- File operations use efficient Node.js APIs
- Database queries are lightweight (metadata only)
- Redis operations are minimal and quick
- Status is cached on frontend until manual refresh

## Future Enhancements

1. **Full Disk Usage**: OS-specific commands for complete disk statistics
2. **Network Statistics**: API request rates and response times
3. **Error Monitoring**: Recent error counts and types
4. **Performance Metrics**: Average response times and throughput
5. **Auto-refresh**: Periodic status updates every 30 seconds

This implementation provides a comprehensive, real-time view of system health and resource usage for better administrative control and monitoring. 