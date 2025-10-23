'use client';

import { BridgeButton } from '@avail-project/nexus-widgets';
import type { ReactNode } from 'react';
import { useAccount } from 'wagmi';

interface NexusBridgeButtonProps {
  children: ({ onClick, isLoading }: { onClick: () => void; isLoading: boolean }) => ReactNode;
  prefill?: {
    token?: string;
    amount?: string;
    chainId?: number;
  };
}

export function NexusBridgeButton({ children, prefill }: NexusBridgeButtonProps) {
  const { isConnected, address } = useAccount();

  // ウォレットが接続されていない場合
  if (!isConnected || !address) {
    return (
      <>
        {children({
          onClick: () => console.log('Wallet not connected'),
          isLoading: false,
        })}
      </>
    );
  }

  return (
    <BridgeButton
      prefill={
        prefill as { token?: 'ETH' | 'USDC' | 'USDT'; amount?: string; chainId?: 137 | 84532 }
      }
    >
      {({ onClick, isLoading }) => children({ onClick, isLoading })}
    </BridgeButton>
  );
}
