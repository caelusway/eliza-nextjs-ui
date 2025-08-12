import { NextRequest, NextResponse } from 'next/server';
import { etherscanService, ChainId } from '@/services/etherscan-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address') || '0xb5d85cbf7cb3ee0d56b3bb207d5fc4b82f43f511'; // Default test address
    const chainsParam = searchParams.get('chains');
    
    // Parse chain IDs from query parameter or use default
    let chainIds: ChainId[] = [42161, 8453, 10, 534352, 81457]; // Default chains
    
    if (chainsParam) {
      chainIds = chainsParam.split(',').map(id => parseInt(id.trim()) as ChainId);
    }

    console.log(`[MultiChain API] Getting balances for address: ${address} across chains: ${chainIds.join(', ')}`);

    // Get balances across multiple chains
    const balances = await etherscanService.getMultiChainBalances(address, chainIds);
    
    // Format balances in ETH (divide by 10^18)
    const formattedBalances = Object.entries(balances).reduce((acc, [chainName, balance]) => {
      const ethBalance = parseFloat(balance) / Math.pow(10, 18);
      acc[chainName] = {
        wei: balance,
        eth: ethBalance.toFixed(6),
        formatted: ethBalance > 0.001 ? `${ethBalance.toFixed(4)} ETH` : '< 0.001 ETH'
      };
      return acc;
    }, {} as Record<string, { wei: string; eth: string; formatted: string }>);

    return NextResponse.json({
      success: true,
      data: {
        address,
        chains: chainIds,
        balances: formattedBalances,
        totalChains: chainIds.length,
        timestamp: new Date().toISOString()
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    });

  } catch (error) {
    console.error('[MultiChain API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch multi-chain balances',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}