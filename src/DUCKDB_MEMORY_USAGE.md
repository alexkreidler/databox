# DuckDB Memory Usage Guide

This guide explains how to retrieve and monitor DuckDB memory usage in the DataBox application.

## Overview

DuckDB provides several mechanisms to monitor memory usage, including PRAGMA statements, system queries, and configuration options. This is particularly important when running DuckDB in a browser environment with WebAssembly, where memory constraints are stricter than native environments.

## Methods to Get DuckDB Memory Usage

### 1. Using PRAGMA Statements

DuckDB provides PRAGMA commands to query memory-related settings and statistics:

#### Get Memory Limit
```sql
PRAGMA memory_limit;
```
Returns the current memory limit set for DuckDB. By default, this is typically 80% of available system memory, but in browser environments, it's constrained by the WebAssembly memory limits.

**Note:** This returns the configured memory limit, not the actual current usage. For actual memory usage, query `PRAGMA database_size` or use the WebAssembly memory APIs described below.

#### Get Maximum Memory
```sql
PRAGMA max_memory;
```
Shows the maximum amount of memory DuckDB is allowed to use.

#### Example Implementation
```typescript
import { runQuery, type AsyncDuckDB } from 'duckdb-wasm-kit';

// This function should be called from a React component or custom hook
// where you have access to the db instance from useDuckDb()
async function getDuckDBMemoryLimit(db: AsyncDuckDB) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    // runQuery handles connection management internally
    const result = await runQuery(db, 'PRAGMA memory_limit');
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching memory limit:', error);
    throw new Error(`Failed to fetch memory limit: ${message}`);
  }
}

// Usage in a React component:
// const { db } = useDuckDb();
// const memoryLimit = await getDuckDBMemoryLimit(db);
```

### 2. Using Database Statistics Queries

Query the `duckdb_settings()` table function to get all settings including memory-related ones:

```sql
SELECT * FROM duckdb_settings() WHERE name LIKE '%memory%';
```

This returns settings such as:
- `memory_limit`: The memory limit
- `max_memory`: Maximum memory DuckDB can use
- `temp_directory`: Where temporary files are stored

#### Example Implementation
```typescript
import { runQuery, type AsyncDuckDB } from 'duckdb-wasm-kit';

async function getDuckDBMemorySettings(db: AsyncDuckDB) {
  try {
    const result = await runQuery(
      db, 
      "SELECT * FROM duckdb_settings() WHERE name LIKE '%memory%'"
    );
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching memory settings:', error);
    throw new Error(`Failed to fetch memory settings: ${message}`);
  }
}
```

### 3. Query Temporary File Usage

DuckDB may spill to disk when memory is exhausted. Query temporary files:

```sql
SELECT * FROM duckdb_temporary_files();
```

### 4. Database Size Information

Check the size of database files and tables:

```sql
-- Get table sizes
SELECT 
  table_name,
  estimated_size,
  column_count,
  estimated_size / 1024.0 / 1024.0 as size_mb
FROM duckdb_tables();
```

### 5. Using WebAssembly Memory APIs

In addition to DuckDB-specific queries, you can monitor the WebAssembly memory used by DuckDB. The Stats component in this project uses this approach:

```typescript
// Define interface for the Performance memory API (Chromium-based browsers)
interface PerformanceMemory {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

// Type guard to check if memory API is available
function hasMemoryAPI(perf: Performance): perf is Performance & { memory: PerformanceMemory } {
  return 'memory' in perf && perf.memory !== undefined;
}

// Check WebAssembly heap memory usage
const memory = hasMemoryAPI(performance) ? {
  jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
  totalJSHeapSize: performance.memory.totalJSHeapSize,
  usedJSHeapSize: performance.memory.usedJSHeapSize,
} : null;
```

## Complete Example: Memory Stats Component

Here's a complete example of how to add DuckDB memory information to the existing Stats component:

```typescript
import { useDuckDb, runQuery } from 'duckdb-wasm-kit';
import { useAsync } from 'react-async-hook';
import prettyBytes from 'pretty-bytes';

export const DuckDBMemoryStats = () => {
  const { db } = useDuckDb();
  
  const memoryStats = useAsync(async () => {
    if (!db) return null;
    
    try {
      // Run queries in parallel for better performance
      // Note: DuckDB WASM generally supports concurrent queries,
      // but if you experience issues, run them sequentially instead
      const [memoryLimitResult, settingsResult, dbStatsResult] = await Promise.all([
        runQuery(db, 'PRAGMA memory_limit'),
        runQuery(db, "SELECT * FROM duckdb_settings() WHERE name LIKE '%memory%'"),
        runQuery(db, 'SELECT * FROM duckdb_tables()')
      ]);
      
      return {
        memoryLimit: memoryLimitResult,
        settings: settingsResult,
        dbStats: dbStatsResult
      };
    } catch (error) {
      console.error('Error fetching DuckDB memory stats:', error);
      return null;
    }
  }, [db]);
  
  if (!memoryStats.result) return null;
  
  return (
    <div>
      <h3>DuckDB Memory Usage</h3>
      {/* Render your stats here */}
    </div>
  );
};
```

## Configuring Memory Limits

You can configure DuckDB's memory limit when initializing it:

```typescript
import { initializeDuckDb } from 'duckdb-wasm-kit';

// Initialize with custom memory limit
// Accepts string format (e.g., '512MB', '1GB') or numeric bytes
await initializeDuckDb({
  config: {
    memory_limit: '512MB', // String format
    // or: memory_limit: 536870912, // Numeric bytes (512MB)
  }
});
```

## Browser-Specific Considerations

### WebAssembly Memory Limits
- WebAssembly has a default memory limit (typically 2GB or 4GB depending on the browser)
- DuckDB WASM uses dynamic memory allocation within these constraints
- Monitor both DuckDB's reported memory usage and WebAssembly heap usage

### Cross-Origin Isolation
When cross-origin isolation is enabled (`crossOriginIsolated` is true), you get access to:
- `performance.measureUserAgentSpecificMemory()` - More detailed browser memory information
- Multi-threading support - Better performance but potentially higher memory usage

### Storage API
Use the Storage API to monitor OPFS (Origin Private File System) usage:

```typescript
async function getStorageUsage(): Promise<{ usage: number; quota: number } | { error: string }> {
  const estimate = await navigator.storage?.estimate();
  if (!estimate) {
    return { error: 'Storage API not supported' };
  }
  const usage = estimate.usage || 0;
  const quota = estimate.quota || 0;
  console.log(`Using ${prettyBytes(usage)} of ${prettyBytes(quota)}`);
  return { usage, quota };
}
```

This shows the total storage used by DuckDB's persistent storage, which complements in-memory usage.

## Performance Monitoring

To monitor query-specific memory usage:

```typescript
import { type AsyncDuckDB, runQuery } from 'duckdb-wasm-kit';
import prettyBytes from 'pretty-bytes';

// Shared type definitions
interface PerformanceMemory {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

function hasMemoryAPI(perf: Performance): perf is Performance & { memory: PerformanceMemory } {
  return 'memory' in perf && perf.memory !== undefined;
}

async function executeQueryWithMemoryMonitoring(db: AsyncDuckDB, query: string) {
  const hasMemory = hasMemoryAPI(performance);
  const beforeMemory = hasMemory ? performance.memory.usedJSHeapSize : null;
  const startTime = performance.now();
  
  let result;
  try {
    result = await runQuery(db, query);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Query failed:', error);
    throw new Error(`Query execution failed: ${message}`);
  }
  
  const afterMemory = hasMemory ? performance.memory.usedJSHeapSize : null;
  const endTime = performance.now();
  
  // Only calculate delta if both measurements are available
  if (beforeMemory !== null && afterMemory !== null) {
    console.log({
      executionTime: `${(endTime - startTime).toFixed(2)}ms`,
      memoryDelta: prettyBytes(afterMemory - beforeMemory),
      currentMemory: prettyBytes(afterMemory)
    });
  } else {
    console.log({
      executionTime: `${(endTime - startTime).toFixed(2)}ms`,
      note: 'Memory measurements not available (use a Chromium-based browser)'
    });
  }
  
  return result;
}
```

**Note:** Memory measurements may not be accurate if garbage collection occurs between measurements. For more reliable monitoring, consider taking multiple measurements and averaging them.

## Resources

- [DuckDB PRAGMA Statements](https://duckdb.org/docs/sql/statements/pragma.html)
- [DuckDB Configuration](https://duckdb.org/docs/configuration/overview.html)
- [DuckDB WASM Documentation](https://github.com/duckdb/duckdb-wasm)
- [MDN: Performance.memory](https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory)
- [MDN: Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API)

## Implementation in DataBox

The existing `Stats.tsx` component in this project already shows browser-level memory statistics. To add DuckDB-specific memory information:

1. Import `useDuckDb` and `runQuery` from `duckdb-wasm-kit`
2. Query DuckDB using the PRAGMA and system table approaches shown above
3. Display the results alongside the existing browser memory stats
4. Consider adding a refresh mechanism to update DuckDB statistics on demand

See `src/components/Stats.tsx` for the current implementation of memory statistics display.
