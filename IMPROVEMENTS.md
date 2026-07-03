# Synchronization Pipeline Improvements

This document details the enhancements made to `sync.js` to resolve date shifting, rate limiting, and missing header bugs, improving overall robustness and reliability.

## Summary of Changes

### 1. Fix Timezone Shift in `formatJoinDate`
- **Problem:** When formatting the join date using `new Date(joinedAt).toLocaleDateString()`, Node.js uses the host server's local timezone. Depending on the server's region, the parsed date could shift to the previous day (e.g., displaying `Jan 6` instead of `Jan 7` for a UTC timestamp at midnight).
- **Solution:** Added `{ timeZone: 'UTC' }` to the `toLocaleDateString` format options to ensure the output date is timezone-independent and matches the source data.

### 2. Implement Sequential Jikan API Requests
- **Problem:** The synchronization loop fired concurrent requests to Jikan's `/statistics` and `/users` endpoints via `Promise.all`. Under high load or when Jikan is rate-limiting clients (3 requests per second limit), concurrent requests can easily trigger `HTTP 429 Too Many Requests` status codes.
- **Solution:** Modified the fetching logic to query Jikan sequentially with a 1-second delay in between.

### 3. Add Custom User-Agent Headers
- **Problem:** Both Jikan and Discord APIs recommend or require a custom, descriptive `User-Agent` header for all requests to prevent automatic blocking or throttling.
- **Solution:** Added a static `USER_AGENT` header (`mal-discord-widget-sync/1.0.0`) to both Jikan and Discord HTTP calls.

### 4. Robust Days Watched Parsing
- **Problem:** The original `formatDaysWatched` function checked `typeof daysWatched === 'number'`. If an API response returns the value as a string representation of a float/int, the function would fallback to `0.0`.
- **Solution:** Upgraded the parsing logic to use `Number.parseFloat(daysWatched)` and check for `NaN` using `Number.isNaN(parsed)`.
