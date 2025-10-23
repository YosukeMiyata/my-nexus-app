'use client';

import type { NexusNetwork } from '@avail-project/nexus-widgets';
import { NexusProvider } from '@avail-project/nexus-widgets';
import { lightTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import {
  mainnet,
  arbitrum,
  base,
  optimism,
  polygon,
  sepolia,
  arbitrumSepolia,
  baseSepolia,
  optimismSepolia,
  polygonAmoy,
} from 'wagmi/chains';
import { initializeAnalyticsSuppression } from '@/utils/analyticsSuppressor';

const defaultNetwork = (process.env.NEXT_PUBLIC_NETWORK ?? 'testnet') as NexusNetwork;
const isTestnet = defaultNetwork === 'testnet';

// 環境に応じてチェーンを選択
const getChains = () => {
  if (isTestnet) {
    return [sepolia, arbitrumSepolia, baseSepolia, optimismSepolia, polygonAmoy];
  } else {
    return [mainnet, base, arbitrum, optimism, polygon];
  }
};

const config = createConfig({
  // biome-ignore lint/suspicious/noExplicitAny: wagmiの型定義の制限によりanyが必要
  chains: getChains() as any,
  transports: getChains().reduce(
    (acc, chain) => {
      acc[chain.id] = http();
      return acc;
    },
    {} as Record<number, ReturnType<typeof http>>
  ),
  ssr: false,
});
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

interface Web3ContextValue {
  network: NexusNetwork;
  setNetwork: React.Dispatch<React.SetStateAction<NexusNetwork>>;
}

const Web3Context = createContext<Web3ContextValue | null>(null);

export function useWeb3Context() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3Context must be used within a Web3Provider');
  }
  return context;
}

const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const [network, setNetwork] = useState<NexusNetwork>(defaultNetwork);
  const [mounted, setMounted] = useState(false);
  const value = useMemo(() => ({ network, setNetwork }), [network]);

  useEffect(() => {
    setMounted(true);
    // Analytics SDKのエラー抑制を初期化
    initializeAnalyticsSuppression();
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <Web3Context.Provider value={value}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            modalSize="wide"
            theme={lightTheme({
              accentColor: '#fe8b6c',
              accentColorForeground: 'white',
              borderRadius: 'medium',
              fontStack: 'system',
            })}
            showRecentTransactions={false}
            appInfo={{
              appName: 'CrossDonate',
              learnMoreUrl: undefined,
            }}
            initialChain={isTestnet ? sepolia : mainnet}
          >
            <NexusProvider
              config={{
                network,
                debug: true,
              }}
            >
              {children}
            </NexusProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </Web3Context.Provider>
  );
};

export default Web3Provider;
