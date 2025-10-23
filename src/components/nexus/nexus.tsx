'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/atoms/Button';
import { Card, CardContent } from '@/components/atoms/Card';
import { useWeb3Context } from '@/providers/Web3Provider';
import BridgeDialog from './BridgeDialog';
import { NexusBridgeButton } from './NexusBridgeButton';
import { CustomBridgeButton } from './CustomBridgeButton';

const Nexus = () => {
  const { isConnected } = useAccount();
  const { network } = useWeb3Context();
  const [isBridgeDialogOpen, setIsBridgeDialogOpen] = useState(false);

  return (
    <Card className="border-none shadow-none">
      <CardContent>
        <div className="flex flex-col justify-center items-center gap-y-4">
          <div className="w-full mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Nexus SDK Status (Updated)</h3>
            <p className="text-sm text-blue-600">
              Network: {network} | Wallet: {isConnected ? 'Connected' : 'Not Connected'}
            </p>
            <p className="text-xs text-blue-500 mt-1">
              Using latest nexus-core and nexus-widgets packages
            </p>
            <p className="text-xs text-blue-500 mt-1">
              Testnet Bridge: Sepolia → Base Sepolia (Chain ID: 84532)
            </p>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-lg border border-gray-400 p-6 shadow-sm text-center">
              <h3 className="text-lg font-semibold mb-4">Bridge Tokens (Legacy)</h3>
              <Button
                disabled={!isConnected}
                onClick={() => setIsBridgeDialogOpen(true)}
                className="w-full font-bold rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isConnected ? 'Bridge Tokens (Legacy)' : 'Connect Wallet First'}
              </Button>
            </div>
            <div className="bg-card rounded-lg border border-gray-400 p-6 shadow-sm text-center">
              <h3 className="text-lg font-semibold mb-4">Bridge Tokens (New Widget)</h3>
              <NexusBridgeButton prefill={{ token: 'ETH', amount: '0.1', chainId: 84532 }}>
                {({ onClick, isLoading }) => (
                  <Button
                    disabled={!isConnected}
                    onClick={onClick}
                    className="w-full font-bold rounded-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    {isLoading
                      ? 'Preparing Widget...'
                      : isConnected
                        ? 'Bridge with New Widget'
                        : 'Connect Wallet First'}
                  </Button>
                )}
              </NexusBridgeButton>
            </div>
            <div className="bg-card rounded-lg border border-gray-400 p-6 shadow-sm text-center">
              <h3 className="text-lg font-semibold mb-4">Bridge Tokens (Custom)</h3>
              <CustomBridgeButton prefill={{ token: 'ETH', amount: '0.1', chainId: 84532 }}>
                {({ onClick, isLoading }) => (
                  <Button
                    disabled={!isConnected}
                    onClick={onClick}
                    className="w-full font-bold rounded-lg bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    {isLoading
                      ? 'Bridging...'
                      : isConnected
                        ? 'Bridge with Custom'
                        : 'Connect Wallet First'}
                  </Button>
                )}
              </CustomBridgeButton>
            </div>
          </div>
          <div className="w-full flex items-center gap-x-4">
            <div className="bg-card rounded-lg border border-gray-400 p-6 shadow-sm text-center w-1/2">
              <h3 className="text-lg font-semibold mb-4">Transfer Tokens</h3>
              <Button
                disabled={!isConnected}
                className="w-full font-bold rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isConnected ? 'Transfer Tokens' : 'Connect Wallet First'}
              </Button>
            </div>
            <div className="bg-card rounded-lg border border-gray-400 p-6 shadow-sm text-center w-1/2">
              <h3 className="text-lg font-semibold mb-4">Bridge & Supply USDC on AAVE</h3>
              <Button
                disabled={!isConnected}
                className="w-full font-bold rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isConnected ? 'Bridge & Supply USDC' : 'Connect Wallet First'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Bridge Dialog */}
      <BridgeDialog isOpen={isBridgeDialogOpen} onOpenChange={setIsBridgeDialogOpen} />
    </Card>
  );
};

export default Nexus;
