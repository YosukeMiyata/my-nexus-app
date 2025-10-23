import { NexusSDK } from '@avail-project/nexus-core';
import { useEffect, useState } from 'react';
import { useAccount, useWalletClient, useConnectorClient } from 'wagmi';
import type { EthereumProvider, WindowWithEthereum } from '@/types';

// 環境変数からネットワーク設定を取得
const networkMode = (process.env.NEXT_PUBLIC_NETWORK ?? 'testnet') as 'mainnet' | 'testnet';

// Nexus SDKのインスタンスを動的に作成するように変更
let nexusSDK: NexusSDK | null = null;

const createNexusSDK = () => {
  if (!nexusSDK) {
    // 新しいAPIに合わせて初期化方法を変更
    nexusSDK = new NexusSDK({
      network: networkMode,
      debug: true,
    });
  }
  return nexusSDK;
};

export function useNexusSDK() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { data: connectorClient } = useConnectorClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastConnectedAddress, setLastConnectedAddress] = useState<string | null>(null);

  // ウォレットクライアントを取得する関数
  const getWalletClient = async (): Promise<EthereumProvider | null> => {
    let attempts = 0;
    const maxAttempts = 30; // 3秒間待機

    while (attempts < maxAttempts) {
      const client = walletClient || connectorClient;
      if (client) {
        return {
          ...client,
          on: (_event: string, _callback: (...args: unknown[]) => void) =>
            client as unknown as EthereumProvider,
          removeListener: (_event: string, _callback: (...args: unknown[]) => void) =>
            client as unknown as EthereumProvider,
        } as unknown as EthereumProvider;
      }

      // window.ethereumに直接アクセスを試行
      if (typeof window !== 'undefined' && (window as WindowWithEthereum).ethereum) {
        return (window as WindowWithEthereum).ethereum as EthereumProvider;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    // 最後の手段としてwindow.ethereumを返す
    if (typeof window !== 'undefined' && (window as WindowWithEthereum).ethereum) {
      return (window as WindowWithEthereum).ethereum as EthereumProvider;
    }

    return null;
  };

  // SDK初期化
  const initializeSDK = async (): Promise<boolean> => {
    if (!isConnected || !address) {
      return false;
    }

    // アドレスが変更された場合、Nexus SDKを再初期化
    const shouldReinitialize = !isInitialized || lastConnectedAddress !== address;

    if (shouldReinitialize) {
      try {
        const clientToUse = await getWalletClient();
        if (!clientToUse) {
          throw new Error('No wallet client available for initialization');
        }

        // 新しいSDKインスタンスを作成
        const sdkInstance = createNexusSDK();

        let ethereumProvider: EthereumProvider;

        if (clientToUse === (window as WindowWithEthereum).ethereum) {
          ethereumProvider = {
            ...clientToUse,
            request: clientToUse.request.bind(clientToUse) as EthereumProvider['request'],
            on: (_event: string, _callback: (...args: unknown[]) => void) => {
              return ethereumProvider;
            },
            removeListener: (_event: string, _callback: (...args: unknown[]) => void) => {
              return ethereumProvider;
            },
          };
        } else {
          ethereumProvider = {
            ...clientToUse,
            request: clientToUse.request.bind(clientToUse) as EthereumProvider['request'],
            on: (_event: string, _callback: (...args: unknown[]) => void) => {
              return ethereumProvider;
            },
            removeListener: (_event: string, _callback: (...args: unknown[]) => void) => {
              return ethereumProvider;
            },
          };
        }

        // 新しいAPIに合わせて初期化処理を修正
        await sdkInstance.initialize(ethereumProvider);
        setIsInitialized(true);
        setLastConnectedAddress(address);

        console.log('Nexus SDK initialized successfully with new API');
        return true;
      } catch (error) {
        console.error('Failed to initialize Nexus SDK:', error);
        throw error;
      }
    }

    return true;
  };

  // ウォレット接続状態の変化を監視
  useEffect(() => {
    if (!isConnected || !address) {
      setIsInitialized(false);
      setLastConnectedAddress(null);
    }
  }, [isConnected, address]);

  return {
    nexusSDK: createNexusSDK(),
    isInitialized,
    initializeSDK,
    getWalletClient,
  };
}
