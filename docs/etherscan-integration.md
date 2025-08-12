# Etherscan API Integration

This document describes the Etherscan API integration for fetching on-chain token data in the Eliza system.

## Overview

The integration fetches real-time token statistics from the Base network (Basescan) for the BioDAO token at address `0x226a2fa2556c48245e57cd1cba4c6c9e67077dd2`.

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
ETHER_SCAN_API_KEY=your_etherscan_api_key_here
```

### API Key Setup

1. Visit [Basescan](https://basescan.org/)
2. Create an account and get your API key
3. Add the key to your environment variables

## Architecture

### Services

- **`src/services/etherscan-service.ts`**: Core service for Etherscan API interactions
- **`src/hooks/use-token-stats.ts`**: React hook for fetching token statistics
- **`src/app/api/token-stats/route.ts`**: API route for server-side token data fetching

### Components

- **`src/components/dashboard/header/stats-row.tsx`**: Updated to display real token data

## Features

### Token Statistics

The integration provides the following token metrics:

- **Volume (24h)**: Trading volume over the last 24 hours
- **Market Cap**: Total market capitalization
- **Price**: Current token price
- **Holders**: Number of token holders
- **Total Supply**: Total token supply

### Data Flow

1. Client component calls `useTokenStats()` hook
2. Hook fetches data from `/api/token-stats` endpoint
3. API route calls Etherscan service
4. Service makes requests to Basescan API
5. Data is cached for 5 minutes to respect API limits

### Error Handling

- Graceful fallback to placeholder data if API fails
- Loading states with skeleton components
- Automatic retry every 5 minutes
- Comprehensive error logging

## API Endpoints

### GET `/api/token-stats`

Returns token statistics with caching headers.

**Response:**
```json
{
  "success": true,
  "data": {
    "volume24h": "1.2M",
    "marketCap": "8.1M",
    "price": "0.042",
    "holders": "1000+",
    "totalSupply": "12M"
  },
  "timestamp": "2024-01-17T10:30:00.000Z"
}
```

### GET `/api/token-stats/test`

Test endpoint for debugging API integration.

## Usage

### In Components

```tsx
import { useTokenStats } from '@/hooks/use-token-stats';

function MyComponent() {
  const { stats, loading, error } = useTokenStats();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <p>Volume: {stats?.volume24h}</p>
      <p>Market Cap: {stats?.marketCap}</p>
    </div>
  );
}
```

### Direct Service Usage

```tsx
import { etherscanService } from '@/services/etherscan-service';

const stats = await etherscanService.getTokenStats('0x226a2fa2556c48245e57cd1cba4c6c9e67077dd2');
```

## Testing

Run the test script to verify the integration:

```bash
node scripts/test-etherscan.js
```

## Rate Limits

- Free tier: 5 calls/second
- Data is cached for 5 minutes to minimize API calls
- Automatic fallback to placeholder data if rate limited

## Future Enhancements

- Real-time price feeds from DEX APIs
- Historical data charts
- Multi-chain support
- Advanced analytics and metrics 