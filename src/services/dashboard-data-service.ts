import { tokenDataService, type RealTokenData } from './token-data-service';
import { researchDataService, type ResearchStats } from './research-data-service';
import { ChainId } from './etherscan-service';

export interface DashboardStats {
  // Token/Financial Data
  tokenStats: {
    price: string;
    volume24h: string;
    marketCap: string;
    totalSupply: string;
    holders: string;
    transfers24h?: string;
    liquidity?: string;
    fdv?: string;
    lastUpdated: string;
  };
  
  // Research Data
  researchStats: {
    paperCount: number;
    hypothesisCount: number;
    nodeCount: number;
    latestHypothesis?: {
      id: string;
      statement: string;
      preview: string;
      title?: string;
      created: string;
      metrics: {
        hasPercentage: boolean;
        hasPrediction: boolean;
        hasTimeframe: boolean;
      };
    };
  };

  // Meta Information
  meta: {
    tokenConfig: {
      contractAddress: string;
      chainId: number;
      name: string;
      symbol: string;
    };
    dataStatus: {
      tokenData: 'success' | 'error' | 'loading';
      researchData: 'success' | 'error' | 'loading';
    };
    lastUpdated: string;
  };
}

class DashboardDataService {
  private tokenAddress: string;
  private chainId: ChainId;
  private tokenName: string;
  private tokenSymbol: string;

  constructor() {
    this.tokenAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || '0x226a2fa2556c48245e57cd1cba4c6c9e67077dd2';
    this.chainId = parseInt(process.env.NEXT_PUBLIC_TOKEN_CHAIN_ID || '8453') as ChainId;
    this.tokenName = process.env.NEXT_PUBLIC_TOKEN_NAME || 'BIO Protocol';
    this.tokenSymbol = process.env.NEXT_PUBLIC_TOKEN_SYMBOL || 'BIO';
  }

  private async getTokenData(): Promise<{ data: RealTokenData; status: 'success' | 'error' }> {
    try {
      console.log('[Dashboard Data Service] Fetching token data...');
      const data = await tokenDataService.getRealTokenData(this.tokenAddress, this.chainId);
      return { data, status: 'success' };
    } catch (error) {
      console.error('[Dashboard Data Service] Token data error:', error);
      
      // Return fallback data
      const fallbackData: RealTokenData = {
        contractAddress: this.tokenAddress,
        name: this.tokenName,
        symbol: this.tokenSymbol,
        decimals: 18,
        totalSupply: '0',
        price: '0',
        marketCap: '$0',
        volume24h: '$0',
        holders: '0',
        transfers24h: '0',
        liquidity: '$0',
        fdv: '$0',
        chain: 'Base',
        lastUpdated: new Date().toISOString()
      };
      
      return { data: fallbackData, status: 'error' };
    }
  }

  private async getResearchData(): Promise<{ data: ResearchStats; status: 'success' | 'error' }> {
    try {
      console.log('[Dashboard Data Service] Fetching research data...');
      const data = await researchDataService.getResearchStats();
      return { data, status: 'success' };
    } catch (error) {
      console.error('[Dashboard Data Service] Research data error:', error);
      
      // Return fallback data
      const fallbackData: ResearchStats = {
        paperCount: 0,
        hypothesisCount: 0,
        nodeCount: 0,
      };
      
      return { data: fallbackData, status: 'error' };
    }
  }

  async getCompleteDashboardData(): Promise<DashboardStats> {
    console.log('[Dashboard Data Service] Fetching complete dashboard data...');
    
    const startTime = Date.now();
    
    // Fetch data from all sources in parallel
    const [tokenResult, researchResult] = await Promise.all([
      this.getTokenData(),
      this.getResearchData()
    ]);

    const endTime = Date.now();
    console.log(`[Dashboard Data Service] Data fetched in ${endTime - startTime}ms`);

    // Process research data
    const processedResearchStats = {
      ...researchResult.data,
      latestHypothesis: researchResult.data.latestHypothesis ? {
        ...researchResult.data.latestHypothesis,
        preview: researchDataService.formatHypothesisPreview(researchResult.data.latestHypothesis.statement, 120),
        metrics: researchDataService.extractHypothesisMetrics(researchResult.data.latestHypothesis.statement)
      } : undefined
    };

    const dashboardStats: DashboardStats = {
      tokenStats: {
        price: tokenResult.data.price,
        volume24h: tokenResult.data.volume24h,
        marketCap: tokenResult.data.marketCap,
        totalSupply: tokenResult.data.totalSupply,
        holders: tokenResult.data.holders,
        transfers24h: tokenResult.data.transfers24h,
        liquidity: tokenResult.data.liquidity,
        fdv: tokenResult.data.fdv,
        lastUpdated: tokenResult.data.lastUpdated
      },
      
      researchStats: processedResearchStats,
      
      meta: {
        tokenConfig: {
          contractAddress: this.tokenAddress,
          chainId: this.chainId,
          name: this.tokenName,
          symbol: this.tokenSymbol
        },
        dataStatus: {
          tokenData: tokenResult.status,
          researchData: researchResult.status
        },
        lastUpdated: new Date().toISOString()
      }
    };

    console.log('[Dashboard Data Service] Complete dashboard data assembled:', {
      tokenDataStatus: tokenResult.status,
      researchDataStatus: researchResult.status,
      paperCount: researchResult.data.paperCount,
      hypothesisCount: researchResult.data.hypothesisCount,
      hasLatestHypothesis: !!researchResult.data.latestHypothesis
    });

    return dashboardStats;
  }

  // Get only token stats (for backwards compatibility)
  async getTokenStats() {
    const tokenResult = await this.getTokenData();
    return {
      success: tokenResult.status === 'success',
      data: {
        volume24h: tokenResult.data.volume24h,
        marketCap: tokenResult.data.marketCap,
        price: tokenResult.data.price,
        holders: tokenResult.data.holders,
        totalSupply: tokenResult.data.totalSupply,
        transfers24h: tokenResult.data.transfers24h,
        liquidity: tokenResult.data.liquidity,
        fdv: tokenResult.data.fdv,
        tokenName: tokenResult.data.name,
        symbol: tokenResult.data.symbol,
        decimals: tokenResult.data.decimals,
        chain: tokenResult.data.chain,
        lastUpdated: tokenResult.data.lastUpdated
      },
      source: 'dashboard-data-service',
      timestamp: new Date().toISOString()
    };
  }

  // Get only research stats
  async getResearchOnlyStats() {
    const researchResult = await this.getResearchData();
    return {
      success: researchResult.status === 'success',
      data: researchResult.data,
      source: 'research-data-service',
      timestamp: new Date().toISOString()
    };
  }
}

export const dashboardDataService = new DashboardDataService();