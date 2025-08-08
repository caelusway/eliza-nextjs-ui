import { etherscanService, ChainId } from './etherscan-service';

export interface RealTokenData {
  // Basic token info
  contractAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  
  // Market data
  price: string;
  marketCap: string;
  volume24h: string;
  
  // On-chain data
  holders: string;
  transfers24h: string;
  
  // Additional metrics
  liquidity: string;
  fdv: string; // Fully Diluted Valuation
  
  // Meta
  chain: string;
  lastUpdated: string;
}

interface DEXScreenerResponse {
  pairs?: Array<{
    baseToken: {
      address: string;
      name: string;
      symbol: string;
    };
    priceUsd: string;
    volume: { h24: number };
    liquidity: { usd: number };
    marketCap: number;
    fdv: number;
  }>;
}

interface CoinGeckoResponse {
  market_data?: {
    current_price?: { usd: number };
    market_cap?: { usd: number };
    total_volume?: { usd: number };
    fully_diluted_valuation?: { usd: number };
  };
}

class TokenDataService {
  private readonly BASE_CHAIN_ID: ChainId = 8453;
  
  async getRealTokenData(contractAddress: string, chainId: ChainId = this.BASE_CHAIN_ID): Promise<RealTokenData> {
    try {
      console.log(`[TokenDataService] Fetching real data for ${contractAddress} on chain ${chainId}`);
      
      // Get basic token info from Etherscan
      const [tokenInfo, holders, transfers] = await Promise.allSettled([
        this.getBasicTokenInfo(contractAddress, chainId),
        this.getRealHolderCount(contractAddress, chainId),
        this.getTransferCount(contractAddress, chainId)
      ]);
      
      // Get market data from DEX aggregators
      const marketData = await this.getMarketData(contractAddress, chainId);
      
      const baseInfo = tokenInfo.status === 'fulfilled' ? tokenInfo.value : this.getDefaultTokenInfo(contractAddress);
      const holderCount = holders.status === 'fulfilled' ? holders.value : '0';
      const transferCount = transfers.status === 'fulfilled' ? transfers.value : '0';
      
      // Calculate real market metrics
      const totalSupplyNumber = parseFloat(baseInfo.totalSupply) / Math.pow(10, parseInt(baseInfo.decimals) || 18);
      const price = marketData.price || '0';
      const priceNumber = parseFloat(price);
      const realMarketCap = (totalSupplyNumber * priceNumber).toString();
      
      const realData: RealTokenData = {
        contractAddress: baseInfo.contractAddress,
        name: baseInfo.tokenName,
        symbol: baseInfo.symbol,
        decimals: parseInt(baseInfo.decimals),
        totalSupply: this.formatTokenAmount(baseInfo.totalSupply, parseInt(baseInfo.decimals)),
        
        price: price,
        marketCap: this.formatUSD(realMarketCap),
        volume24h: marketData.volume24h || '0',
        
        holders: holderCount,
        transfers24h: transferCount,
        
        liquidity: marketData.liquidity || '0',
        fdv: marketData.fdv || realMarketCap,
        
        chain: this.getChainName(chainId),
        lastUpdated: new Date().toISOString()
      };
      
      console.log(`[TokenDataService] Real data assembled:`, realData);
      return realData;
      
    } catch (error) {
      console.error('[TokenDataService] Error fetching real data:', error);
      return this.getFallbackData(contractAddress, chainId);
    }
  }
  
  private async getBasicTokenInfo(contractAddress: string, chainId: ChainId) {
    return await etherscanService.getTokenInfo(contractAddress, chainId);
  }
  
  private async getRealHolderCount(contractAddress: string, chainId: ChainId): Promise<string> {
    try {
      // Try to get holder count from token holder endpoint
      const result = await etherscanService['makeRequest']<string>('token', 'tokenholdercount', {
        contractaddress: contractAddress
      }, chainId);
      
      return result || '0';
    } catch (error) {
      console.warn('[TokenDataService] Could not fetch holder count:', error);
      return '0';
    }
  }
  
  private async getTransferCount(contractAddress: string, chainId: ChainId): Promise<string> {
    try {
      // Get recent transactions to estimate activity
      // This is an approximation since we can't get exact 24h transfer count easily
      const result = await etherscanService['makeRequest']<any[]>('account', 'tokentx', {
        contractaddress: contractAddress,
        page: '1',
        offset: '100',
        sort: 'desc'
      }, chainId);
      
      if (Array.isArray(result) && result.length > 0) {
        // Count transactions from last 24 hours
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        const recentTxs = result.filter(tx => 
          parseInt(tx.timeStamp) * 1000 > oneDayAgo
        );
        return recentTxs.length.toString();
      }
      
      return '0';
    } catch (error) {
      console.warn('[TokenDataService] Could not fetch transfer count:', error);
      return '0';
    }
  }
  
  private async getMarketData(contractAddress: string, chainId: ChainId) {
    // Try multiple sources for market data
    const sources = [
      () => this.getDEXScreenerData(contractAddress, chainId),
      () => this.getCoinGeckoData(contractAddress),
      () => this.getUniswapData(contractAddress, chainId)
    ];
    
    for (const getSource of sources) {
      try {
        const data = await getSource();
        if (data.price && parseFloat(data.price) > 0) {
          return data;
        }
      } catch (error) {
        console.warn('[TokenDataService] Market data source failed:', error);
      }
    }
    
    return { price: '0', volume24h: '0', liquidity: '0', fdv: '0' };
  }
  
  private async getDEXScreenerData(contractAddress: string, chainId: ChainId) {
    try {
      // DEXScreener supports Base chain
      const chainName = chainId === 8453 ? 'base' : 'ethereum';
      const url = `https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TokenDataService/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`DEXScreener API error: ${response.status}`);
      }
      
      const data: DEXScreenerResponse = await response.json();
      
      if (data.pairs && data.pairs.length > 0) {
        const pair = data.pairs[0]; // Use the first (most liquid) pair
        return {
          price: pair.priceUsd || '0',
          volume24h: this.formatUSD(pair.volume?.h24?.toString() || '0'),
          liquidity: this.formatUSD(pair.liquidity?.usd?.toString() || '0'),
          fdv: this.formatUSD(pair.fdv?.toString() || '0')
        };
      }
      
      return { price: '0', volume24h: '0', liquidity: '0', fdv: '0' };
    } catch (error) {
      console.warn('[TokenDataService] DEXScreener failed:', error);
      throw error;
    }
  }
  
  private async getCoinGeckoData(contractAddress: string) {
    try {
      // CoinGecko API (free tier)
      const url = `https://api.coingecko.com/api/v3/coins/ethereum/contract/${contractAddress}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TokenDataService/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      
      const data: CoinGeckoResponse = await response.json();
      
      if (data.market_data) {
        return {
          price: data.market_data.current_price?.usd?.toString() || '0',
          volume24h: this.formatUSD(data.market_data.total_volume?.usd?.toString() || '0'),
          liquidity: '0', // CoinGecko doesn't provide liquidity directly
          fdv: this.formatUSD(data.market_data.fully_diluted_valuation?.usd?.toString() || '0')
        };
      }
      
      return { price: '0', volume24h: '0', liquidity: '0', fdv: '0' };
    } catch (error) {
      console.warn('[TokenDataService] CoinGecko failed:', error);
      throw error;
    }
  }
  
  private async getUniswapData(contractAddress: string, chainId: ChainId) {
    // This would require more complex implementation with Uniswap subgraph
    // For now, return empty data
    return { price: '0', volume24h: '0', liquidity: '0', fdv: '0' };
  }
  
  private getDefaultTokenInfo(contractAddress: string) {
    return {
      contractAddress,
      tokenName: 'BioDAO Token',
      symbol: 'BIO',
      decimals: '18',
      totalSupply: '0'
    };
  }
  
  private getFallbackData(contractAddress: string, chainId: ChainId): RealTokenData {
    return {
      contractAddress,
      name: 'BioDAO Token',
      symbol: 'BIO',
      decimals: 18,
      totalSupply: '0',
      
      price: '0',
      marketCap: '0',
      volume24h: '0',
      
      holders: '0',
      transfers24h: '0',
      
      liquidity: '0',
      fdv: '0',
      
      chain: this.getChainName(chainId),
      lastUpdated: new Date().toISOString()
    };
  }
  
  private formatTokenAmount(amount: string, decimals: number): string {
    try {
      const num = parseFloat(amount) / Math.pow(10, decimals);
      if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
      } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }
      return num.toLocaleString();
    } catch {
      return '0';
    }
  }
  
  private formatUSD(value: string): string {
    try {
      const num = parseFloat(value);
      if (num >= 1000000000) {
        return '$' + (num / 1000000000).toFixed(1) + 'B';
      } else if (num >= 1000000) {
        return '$' + (num / 1000000).toFixed(1) + 'M';
      } else if (num >= 1000) {
        return '$' + (num / 1000).toFixed(1) + 'K';
      }
      return '$' + num.toFixed(2);
    } catch {
      return '$0';
    }
  }
  
  private getChainName(chainId: ChainId): string {
    const chains: Record<ChainId, string> = {
      1: 'Ethereum',
      42161: 'Arbitrum',
      8453: 'Base',
      10: 'Optimism',
      534352: 'Scroll',
      81457: 'Blast'
    };
    return chains[chainId] || 'Unknown';
  }
}

export const tokenDataService = new TokenDataService();