'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/atoms/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/Dialog';
import { useNexusBalance } from '@/hooks/useNexusBalance';
import { useWeb3Context } from '@/providers/Web3Provider';

const ViewUnifiedBalance = () => {
  const { isConnected, address, chainId } = useAccount();
  const { network } = useWeb3Context();
  const { unifiedBalance, loading, error, refetch } = useNexusBalance();
  const [isOpen, setIsOpen] = useState(false);
  const [isWalletReady, setIsWalletReady] = useState(false);

  // Chain IDに基づいてネットワーク名を取得
  const getNetworkName = (chainId: number) => {
    const networkMap: Record<number, string> = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia',
      84532: 'Base Sepolia',
      421614: 'Arbitrum Sepolia',
      11155420: 'Optimism Sepolia',
      80002: 'Polygon Amoy',
      10143: 'Monad Testnet',
      10: 'Optimism',
      137: 'Polygon',
      42161: 'Arbitrum',
      43114: 'Avalanche',
      8453: 'Base',
      534352: 'Scroll',
      56: 'BNB Chain',
    };
    return networkMap[chainId] || `Unknown (${chainId})`;
  };

  // ウォレット接続状態の安定を待つ
  useEffect(() => {
    if (isConnected && address) {
      // デバッグ情報を表示
      console.log('Wallet connection info:', {
        isConnected,
        address,
        chainId,
        network,
        expectedSepoliaChainId: 11155111,
      });

      // ウォレット接続後、少し待ってから準備完了とする
      const timer = setTimeout(() => {
        setIsWalletReady(true);
      }, 1000); // 1秒待機
      return () => clearTimeout(timer);
    } else {
      setIsWalletReady(false);
    }
  }, [isConnected, address, chainId, network]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && isWalletReady) {
      // モーダルが開かれた時に残高取得を実行
      // ウォレットが準備完了してから実行
      setTimeout(() => {
        refetch();
      }, 200); // 少し長めの遅延を設定
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="font-bold" disabled={!isWalletReady}>
          {isWalletReady
            ? 'View Unified Balance'
            : isConnected
              ? 'Preparing Wallet...'
              : 'Connect Wallet to View Balance'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-bold">Unified Balance</DialogTitle>
          <DialogDescription className="font-semibold">
            {isWalletReady ? (
              <span className="flex justify-between items-center">
                <span>
                  Network: {getNetworkName(chainId || 0)} (Chain ID: {chainId})
                  {chainId === 1 && (
                    <span className="text-orange-600 text-xs ml-2">
                      ⚠️ Mainnet detected - Switch to Sepolia for testing
                    </span>
                  )}
                </span>
                <span>
                  Address: {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </span>
            ) : isConnected ? (
              'Wallet is connecting, please wait...'
            ) : (
              'Please connect your wallet to view your unified balance using Nexus SDK.'
            )}
          </DialogDescription>
        </DialogHeader>

        {isWalletReady && (
          <div className="space-y-4 mt-4">
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">
                  {unifiedBalance === null
                    ? 'Initializing Nexus SDK...'
                    : 'Fetching balances from all chains...'}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-700 text-sm font-medium mb-2">⚠️ Demo Mode</p>
                <p className="text-yellow-600 text-sm">{error}</p>
                <p className="text-yellow-600 text-xs mt-2">
                  This is demo data. The actual Nexus SDK API is currently unavailable.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button onClick={() => refetch()} className="text-sm" size="sm">
                    Retry
                  </Button>
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="outline"
                    className="text-sm"
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}

            {unifiedBalance && !loading && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-bold text-green-800 mb-2">Total Portfolio Value</h3>
                  <p className="text-2xl font-bold text-green-600">
                    ${unifiedBalance.totalUSD.toFixed(2)}
                  </p>
                </div>

                <div>
                  <h3 className="font-bold mb-3">Balances by Chain</h3>

                  {/* デバッグ情報 */}
                  <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
                    <details>
                      <summary className="cursor-pointer font-medium">
                        Debug Info (Click to expand)
                      </summary>
                      <div className="mt-2 space-y-1">
                        <div>Total entries: {unifiedBalance.balances.length}</div>
                        <div>
                          ETH entries:{' '}
                          {unifiedBalance.balances.filter((b) => b.symbol === 'ETH').length}
                        </div>
                        {unifiedBalance.balances
                          .filter((b) => b.symbol === 'ETH')
                          .map((eth, i) => (
                            <div key={`eth-${eth.chain}-${eth.chainId || i}`} className="ml-2">
                              ETH #{i + 1}: {eth.balance} on {eth.chain} (ID:{' '}
                              {eth.chainId || 'undefined'})
                            </div>
                          ))}
                        <div className="mt-2 pt-2 border-t border-gray-300">
                          <div>Current chain ID: {chainId || 'undefined'}</div>
                          <div>Current network: {network}</div>
                        </div>
                      </div>
                    </details>
                  </div>

                  {/* ETH残高のチェーン別集計 */}
                  {(() => {
                    const ethBalances = unifiedBalance.balances
                      .filter(
                        (balance) => balance.symbol === 'ETH' && parseFloat(balance.balance) > 0
                      )
                      .reduce(
                        (acc, balance) => {
                          const chainName = balance.chain || 'Unknown';
                          if (!acc[chainName]) {
                            acc[chainName] = {
                              total: 0,
                              totalUSD: 0,
                              chainId: balance.chainId,
                              count: 0,
                            };
                          }
                          acc[chainName].total += parseFloat(balance.balance);
                          acc[chainName].totalUSD += balance.usdValue || 0;
                          acc[chainName].count += 1;
                          return acc;
                        },
                        {} as Record<
                          string,
                          { total: number; totalUSD: number; chainId?: number; count: number }
                        >
                      );

                    if (Object.keys(ethBalances).length > 0) {
                      return (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">ETH Balance by Chain</h4>
                          <div className="space-y-1">
                            {Object.entries(ethBalances).map(([chain, data]) => (
                              <div key={chain} className="flex justify-between items-start text-sm">
                                <div className="text-blue-700">
                                  {chain} {data.chainId && `(ID: ${data.chainId})`}
                                  {data.count > 1 && (
                                    <span className="text-xs text-blue-500 ml-1">
                                      ({data.count} entries)
                                    </span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="font-medium text-blue-800">
                                    {data.total.toFixed(6)} ETH
                                  </div>
                                  <div className="text-xs text-blue-600">
                                    ${data.totalUSD.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t border-blue-200">
                            <div className="flex justify-between items-center text-sm font-medium">
                              <span className="text-blue-800">Total ETH:</span>
                              <div className="text-right">
                                <div className="text-blue-900">
                                  {Object.values(ethBalances)
                                    .reduce((sum, data) => sum + data.total, 0)
                                    .toFixed(6)}{' '}
                                  ETH
                                </div>
                                <div className="text-xs text-blue-700">
                                  $
                                  {Object.values(ethBalances)
                                    .reduce((sum, data) => sum + data.totalUSD, 0)
                                    .toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="space-y-2">
                    {/* {unifiedBalance.balances
                      .filter(balance => parseFloat(balance.balance) > 0) // 残高が0より大きいもののみ表示
                      .map((balance, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{balance.balance} {balance.symbol}</div>
                            <div className="text-sm text-gray-600">
                              {balance.chain} {balance.chainId && `(Chain ID: ${balance.chainId})`}
                            </div>
                            {balance.contractAddress && (
                              <div className="text-xs text-gray-500">
                                Contract: {balance.contractAddress.slice(0, 6)}...{balance.contractAddress.slice(-4)}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              {balance.usdValue ? `$${balance.usdValue.toFixed(2)}` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      ))} */}

                    {/* 残高が0のトークンは折りたたみ式で表示 */}
                    {unifiedBalance.balances.filter((balance) => parseFloat(balance.balance) === 0)
                      .length > 0 && (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                          Show zero balances (
                          {
                            unifiedBalance.balances.filter(
                              (balance) => parseFloat(balance.balance) === 0
                            ).length
                          }{' '}
                          tokens)
                        </summary>
                        <div className="mt-2 space-y-1">
                          {unifiedBalance.balances
                            .filter((balance) => parseFloat(balance.balance) === 0)
                            .map((balance, index) => (
                              <div
                                key={`zero-${balance.symbol}-${balance.chain}-${balance.chainId || index}`}
                                className="flex justify-between items-center p-2 bg-gray-25 rounded text-sm"
                              >
                                <div>
                                  <span className="text-gray-500">0 {balance.symbol}</span>
                                  <span className="text-xs text-gray-400 ml-2">
                                    ({balance.chain})
                                  </span>
                                </div>
                                <div className="text-xs text-gray-400">$0.00</div>
                              </div>
                            ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!unifiedBalance && !loading && !error && (
              <div className="text-sm text-gray-600 mt-4">
                {chainId === 1 ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-800 mb-2">
                      ⚠️ Network Switch Required
                    </h4>
                    <p className="text-orange-700 text-sm mb-2">
                      You are currently connected to Ethereum Mainnet (Chain ID: 1). For testing
                      purposes, please switch to Sepolia testnet (Chain ID: 11155111).
                    </p>
                    <p className="text-orange-600 text-xs">
                      In your wallet, switch to Sepolia network to use the test environment.
                    </p>
                  </div>
                ) : (
                  <div>
                    Nexus SDK is now active! Your unified balance across all supported networks will
                    be displayed here.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ViewUnifiedBalance;
