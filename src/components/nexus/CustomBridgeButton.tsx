'use client';

import { type ReactNode, useState } from 'react';
import { useAccount } from 'wagmi';
import { useNexusSDK } from '@/hooks/useNexusSDK';

interface CustomBridgeButtonProps {
  children: ({ onClick, isLoading }: { onClick: () => void; isLoading: boolean }) => ReactNode;
  prefill?: {
    token?: string;
    amount?: string;
    chainId?: number;
  };
}

export function CustomBridgeButton({ children, prefill }: CustomBridgeButtonProps) {
  const { isConnected, address, chainId } = useAccount();
  const { nexusSDK, isInitialized, initializeSDK } = useNexusSDK();
  const [isLoading, setIsLoading] = useState(false);

  const handleBridge = async () => {
    if (!isConnected || !address) {
      console.log('Wallet not connected');
      return;
    }

    setIsLoading(true);

    try {
      // SDK初期化
      if (!isInitialized) {
        await initializeSDK();
      }

      // 現在のチェーンに基づいてブリッジ設定を調整
      const currentChainId = chainId || 11155111; // Sepolia
      const targetChainId = prefill?.chainId || (currentChainId === 11155111 ? 84532 : 137); // Base Sepolia or Polygon

      // ブリッジを実行
      const result = await nexusSDK.bridge({
        token: (prefill?.token || 'ETH') as 'ETH' | 'USDC' | 'USDT',
        amount: parseFloat(prefill?.amount || '0.1'),
        chainId: targetChainId as 137 | 84532,
      });

      if (result.success) {
        alert(
          `ブリッジが成功しました！${result.explorerUrl ? `トランザクション: ${result.explorerUrl}` : ''}`
        );
      } else {
        alert(`ブリッジが失敗しました: ${result.error || '不明なエラー'}`);
      }
    } catch (error) {
      console.error('Bridge error:', error);
      alert(
        `ブリッジ中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

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
    <>
      {children({
        onClick: handleBridge,
        isLoading: isLoading,
      })}
    </>
  );
}
