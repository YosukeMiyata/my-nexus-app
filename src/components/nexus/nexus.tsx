'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/atoms/Button';
import { Card, CardContent } from '@/components/atoms/Card';
import { useWeb3Context } from '@/providers/Web3Provider';
import { useNexusSDK } from '@/hooks/useNexusSDK';
import BridgeDialog from './BridgeDialog';
import BridgeAndExecuteTest from './BridgeAndExecuteTest';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/atoms/Dialog';

const Nexus = () => {
  const { isConnected } = useAccount();
  const { network } = useWeb3Context();
  const { initializeSDK, isInitialized } = useNexusSDK();
  const [isBridgeDialogOpen, setIsBridgeDialogOpen] = useState(false);
  const [isBridgeAndExecuteOpen, setIsBridgeAndExecuteOpen] = useState(false);
  const [isBridgeAndSwapOpen, setIsBridgeAndSwapOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<'USDT' | 'USDC' | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const handleBridgeTokensClick = async () => {
    console.log('=== Bridge Tokensボタンクリック ===');
    console.log('SDK初期化状態:', { isInitialized, isConnected });

    if (!isInitialized) {
      console.log('SDK初期化を開始します...');
      setIsInitializing(true);
      try {
        await initializeSDK();
        console.log('SDK初期化が完了しました');
      } catch (error) {
        console.error('SDK初期化エラー:', error);
        alert(
          `SDK初期化に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`
        );
        return;
      } finally {
        setIsInitializing(false);
      }
    } else {
      console.log('SDKは既に初期化済みです');
    }

    // ダイアログを開く
    setIsBridgeDialogOpen(true);
  };

  return (
    <Card className="border-none shadow-none">
      <CardContent>
        <div className="flex flex-col justify-center items-center gap-y-4">
          <div className="w-full mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Nexus SDK Status</h3>
            <p className="text-sm text-blue-600">
              Network: {network} | Wallet: {isConnected ? 'Connected' : 'Not Connected'} | SDK:{' '}
              {isInitialized ? 'Initialized' : 'Not Initialized'}
            </p>
            {isInitializing && (
              <p className="text-sm text-orange-600 font-medium">SDK初期化中...</p>
            )}
          </div>

          <div className="w-full flex items-center gap-x-4">
            <div className="bg-card rounded-lg border border-gray-400 p-6 shadow-sm text-center w-1/2">
              <h3 className="text-lg font-semibold mb-4">Bridge Tokens</h3>
              <Button
                disabled={!isConnected || isInitializing}
                onClick={handleBridgeTokensClick}
                className="w-full font-bold rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {!isConnected
                  ? 'Connect Wallet First'
                  : isInitializing
                    ? 'Initializing SDK...'
                    : 'Bridge Tokens'}
              </Button>
            </div>
            <div className="bg-card rounded-lg border border-gray-400 p-6 shadow-sm text-center w-1/2">
              <h3 className="text-lg font-semibold mb-4">Transfer Tokens</h3>
              <Button
                disabled={!isConnected}
                className="w-full font-bold rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isConnected ? 'Transfer Tokens' : 'Connect Wallet First'}
              </Button>
            </div>
          </div>
          <div className="w-full flex items-center gap-x-4">
            <div className="bg-card rounded-lg border border-gray-400 p-6 shadow-sm text-center w-1/2">
              <h3 className="text-lg font-semibold mb-4">Bridge & Supply USDT on AAVE</h3>
              <Button
                disabled={!isConnected}
                onClick={() => {
                  setSelectedToken('USDT');
                  setIsBridgeAndExecuteOpen(true);
                }}
                className="w-full font-bold rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isConnected ? 'Bridge & Supply USDT' : 'Connect Wallet First'}
              </Button>
            </div>
            <div className="bg-card rounded-lg border border-gray-400 p-6 shadow-sm text-center w-1/2">
              <h3 className="text-lg font-semibold mb-4">Bridge & Donate USDC</h3>
              <Button
                disabled={!isConnected}
                onClick={() => {
                  setSelectedToken('USDC');
                  setIsBridgeAndExecuteOpen(true);
                }}
                className="w-full font-bold rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isConnected ? 'Bridge & Donate USDC' : 'Connect Wallet First'}
              </Button>
            </div>
          </div>
          <div className="w-full flex items-center gap-x-4">
            <div className="bg-card rounded-lg border border-gray-400 p-6 shadow-sm text-center w-1/2">
              <h3 className="text-lg font-semibold mb-4">Bridge & Swap USDC to PYUSD</h3>
              <Button
                disabled={!isConnected}
                onClick={() => {
                  setSelectedToken('USDC');
                  setIsBridgeAndSwapOpen(true);
                }}
                className="w-full font-bold rounded-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {isConnected ? 'Bridge & Swap USDC' : 'Connect Wallet First'}
              </Button>
            </div>
            <div className="bg-card rounded-lg border border-gray-400 p-6 shadow-sm text-center w-1/2">
              <h3 className="text-lg font-semibold mb-4">Bridge & Swap USDT to PYUSD</h3>
              <Button
                disabled={!isConnected}
                onClick={() => {
                  setSelectedToken('USDT');
                  setIsBridgeAndSwapOpen(true);
                }}
                className="w-full font-bold rounded-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {isConnected ? 'Bridge & Swap USDT' : 'Connect Wallet First'}
              </Button>
            </div>
          </div>
        </div>

        {/* Bridge & Execute Test Modal (Donate) */}
        <Dialog open={isBridgeAndExecuteOpen} onOpenChange={setIsBridgeAndExecuteOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedToken
                  ? `${selectedToken} Bridge & Donate テスト`
                  : 'Bridge & Donate テスト'}
              </DialogTitle>
            </DialogHeader>
            <BridgeAndExecuteTest selectedToken={selectedToken} />
          </DialogContent>
        </Dialog>

        {/* Bridge & Swap Test Modal */}
        <Dialog open={isBridgeAndSwapOpen} onOpenChange={setIsBridgeAndSwapOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedToken
                  ? `${selectedToken} Bridge & Swap テスト`
                  : 'Bridge & Swap テスト'}
              </DialogTitle>
            </DialogHeader>
            <BridgeAndExecuteTest 
              selectedToken={selectedToken} 
              defaultFunction="swapUsdcToPyusd"
            />
          </DialogContent>
        </Dialog>
      </CardContent>

      {/* Bridge Dialog */}
      <BridgeDialog isOpen={isBridgeDialogOpen} onOpenChange={setIsBridgeDialogOpen} />
    </Card>
  );
};

export default Nexus;
