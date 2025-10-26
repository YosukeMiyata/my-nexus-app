'use client';

import { useState, useEffect, useId, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import { useNexusSDK } from '@/hooks/useNexusSDK';
import { useWeb3Context } from '@/providers/Web3Provider';
import type {
  BridgeAndExecuteParams,
  BridgeAndExecuteResult,
  BridgeAndExecuteSimulationResult,
} from '@avail-project/nexus-core';

interface BridgeAndExecuteTestProps {
  className?: string;
  selectedToken?: 'USDT' | 'USDC' | null;
  defaultFunction?: 'donate' | 'swapUsdcToPyusd';
}

export default function BridgeAndExecuteTest({
  className,
  selectedToken,
  defaultFunction = 'donate',
}: BridgeAndExecuteTestProps) {
  const { isConnected, address } = useAccount();
  const { nexusSDK, isInitialized, initializeSDK } = useNexusSDK();
  const { network } = useWeb3Context();
  const id = useId();

  // フォームの状態
  const [formData, setFormData] = useState({
    token: selectedToken || 'USDC',
    amount: '1',
    toChainId: '421614', // Arbitrum Sepolia
    sourceChains: '84532', // Base Sepolia
    contractAddress: '0x025755dfebe6eEF0a58cEa71ba3A417f4175CAa3', // DonationPoolコントラクトアドレス（Arbitrum Sepolia）
    functionName: defaultFunction,
    recipient: '',
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // USDCコントラクトアドレス（Arbitrum Sepolia）
    pyusdAddress: '0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1', // PYUSDコントラクトアドレス（Arbitrum Sepolia）
  });

  // 実行状態
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BridgeAndExecuteResult | null>(null);
  const [simulation, setSimulation] = useState<BridgeAndExecuteSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // ネットワーク名からチェーンIDを取得
  const getChainIdFromNetwork = useCallback((networkName: string): number | null => {
    const networkMap: { [key: string]: number } = {
      ethereum: 1,
      base: 8453,
      'base-sepolia': 84532,
      polygon: 137,
      arbitrum: 42161,
      'arbitrum-sepolia': 421614,
      optimism: 10,
      avalanche: 43114,
    };
    return networkMap[networkName.toLowerCase()] || null;
  }, []);

  // 現在のネットワークに基づいてデフォルト値を設定
  useEffect(() => {
    if (network) {
      const currentChainId = getChainIdFromNetwork(network);
      if (currentChainId) {
        setFormData((prev) => ({
          ...prev,
          sourceChains: currentChainId.toString(),
        }));
      }
    }
  }, [network, getChainIdFromNetwork]);

  // selectedTokenが変更された時にフォームを更新
  useEffect(() => {
    if (selectedToken) {
      setFormData((prev) => ({
        ...prev,
        token: selectedToken,
      }));
    }
  }, [selectedToken]);

  // コンポーネント表示時にSDK初期化を自動実行
  useEffect(() => {
    if (isConnected && !isInitialized && !isInitializing) {
      console.log('Bridge & Execute: SDK初期化を開始します...');
      setIsInitializing(true);
      initializeSDK().finally(() => {
        setIsInitializing(false);
      });
    }
  }, [isConnected, isInitialized, isInitializing, initializeSDK]);

  // フォームの更新
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // シミュレーション実行
  const handleSimulate = async () => {
    if (!isInitialized || !nexusSDK) {
      setError('Nexus SDKが初期化されていません');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSimulation(null);

    try {
      const params: BridgeAndExecuteParams = {
        token: formData.token as 'USDC' | 'USDT' | 'ETH',
        amount: formData.amount,
        toChainId: parseInt(formData.toChainId, 10) as
          | 1
          | 8453
          | 137
          | 42161
          | 10
          | 43114
          | 421614
          | 84532,
        sourceChains: formData.sourceChains.split(',').map((id) => parseInt(id.trim(), 10)),
        recipient: (formData.recipient || address) as `0x${string}`,
        execute: {
          contractAddress: formData.contractAddress as `0x${string}`,
          contractAbi: [
            {
              inputs: [
                { internalType: 'address', name: 'token', type: 'address' },
                { internalType: 'uint256', name: 'amount', type: 'uint256' },
              ],
              name: 'donate',
              outputs: [],
              stateMutability: 'nonpayable',
              type: 'function',
            },
            {
              inputs: [
                { internalType: 'address', name: 'usdc', type: 'address' },
                { internalType: 'address', name: 'pyusd', type: 'address' },
                { internalType: 'uint256', name: 'amount', type: 'uint256' },
                { internalType: 'address', name: 'to', type: 'address' },
              ],
              name: 'swapUsdcToPyusd',
              outputs: [],
              stateMutability: 'nonpayable',
              type: 'function',
            },
          ],
          functionName: formData.functionName,
          buildFunctionParams: (_token, amount, _chainId, _userAddress) => {
            const decimals = 6; // USDC decimals
            const amountWei = BigInt(parseFloat(amount) * 10 ** decimals);
            if (formData.functionName === 'donate') {
              return {
                functionParams: [formData.usdcAddress as `0x${string}`, amountWei],
              };
            } else {
              return {
                functionParams: [
                  formData.usdcAddress as `0x${string}`,
                  formData.pyusdAddress as `0x${string}`,
                  amountWei,
                  _userAddress,
                ],
              };
            }
          },
          tokenApproval: {
            token: formData.token as 'USDC' | 'USDT' | 'ETH',
            amount: formData.amount,
          },
        },
        waitForReceipt: false,
      };

      const simulationResult = await nexusSDK.simulateBridgeAndExecute(params);
      setSimulation(simulationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'シミュレーションに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 実際の実行
  const handleExecute = async () => {
    if (!isInitialized || !nexusSDK) {
      setError('Nexus SDKが初期化されていません');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const params: BridgeAndExecuteParams = {
        token: formData.token as 'USDC' | 'USDT' | 'ETH',
        amount: formData.amount,
        toChainId: parseInt(formData.toChainId, 10) as
          | 1
          | 8453
          | 137
          | 42161
          | 10
          | 43114
          | 421614
          | 84532,
        sourceChains: formData.sourceChains.split(',').map((id) => parseInt(id.trim(), 10)),
        recipient: (formData.recipient || address) as `0x${string}`,
        execute: {
          contractAddress: formData.contractAddress as `0x${string}`,
          contractAbi: [
            {
              inputs: [
                { internalType: 'address', name: 'token', type: 'address' },
                { internalType: 'uint256', name: 'amount', type: 'uint256' },
              ],
              name: 'donate',
              outputs: [],
              stateMutability: 'nonpayable',
              type: 'function',
            },
            {
              inputs: [
                { internalType: 'address', name: 'usdc', type: 'address' },
                { internalType: 'address', name: 'pyusd', type: 'address' },
                { internalType: 'uint256', name: 'amount', type: 'uint256' },
                { internalType: 'address', name: 'to', type: 'address' },
              ],
              name: 'swapUsdcToPyusd',
              outputs: [],
              stateMutability: 'nonpayable',
              type: 'function',
            },
          ],
          functionName: formData.functionName,
          buildFunctionParams: (_token, amount, _chainId, _userAddress) => {
            const decimals = 6; // USDC decimals
            const amountWei = BigInt(parseFloat(amount) * 10 ** decimals);
            if (formData.functionName === 'donate') {
              return {
                functionParams: [formData.usdcAddress as `0x${string}`, amountWei],
              };
            } else {
              return {
                functionParams: [
                  formData.usdcAddress as `0x${string}`,
                  formData.pyusdAddress as `0x${string}`,
                  amountWei,
                  _userAddress,
                ],
              };
            }
          },
          tokenApproval: {
            token: formData.token as 'USDC' | 'USDT' | 'ETH',
            amount: formData.amount,
          },
        },
        waitForReceipt: true,
        requiredConfirmations: 1,
      };

      const result = await nexusSDK.bridgeAndExecute(params);
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '実行に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        {!isConnected && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">ウォレットを接続してください</p>
          </div>
        )}

        {(!isInitialized || isInitializing) && isConnected && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              {selectedToken
                ? `${selectedToken}用のNexus SDKを初期化中...`
                : 'Nexus SDKを初期化中...'}{' '}
              しばらくお待ちください
            </p>
            <div className="mt-2">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full animate-pulse"
                  style={{ width: '60%' }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {isInitialized && isConnected && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              ✅{' '}
              {selectedToken
                ? `${selectedToken}用のNexus SDK初期化完了！`
                : 'Nexus SDK初期化完了！'}{' '}
              テストを開始できます
            </p>
          </div>
        )}

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">
            🔄 Base Sepolia → Arbitrum Sepolia ブリッジ & 実行テスト
          </h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              <strong>テスト内容:</strong> Base SepoliaのUSDCをArbitrum
              Sepoliaにブリッジ後、DonationPoolコントラクトでdonateまたはswapUsdcToPyusdを実行
            </p>
            <p>
              <strong>利用可能な関数:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>
                <strong>donate:</strong> トークンを寄付（USDCをDonationPoolに寄付）
              </li>
              <li>
                <strong>swapUsdcToPyusd:</strong> USDCをPYUSDにスワップ
              </li>
            </ul>
            <p>
              <strong>必要な設定:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>DonationPoolコントラクトアドレス（Arbitrum Sepolia）</li>
              <li>USDCコントラクトアドレス（Arbitrum Sepolia）: デフォルト設定済み</li>
              <li>PYUSDコントラクトアドレス（Arbitrum Sepolia）: デフォルト設定済み</li>
              <li>送信元チェーン: Base Sepolia (84532)</li>
              <li>宛先チェーン: Arbitrum Sepolia (421614)</li>
            </ul>
            <p className="text-xs text-blue-600 mt-2">
              <strong>注意:</strong> テスト前にBase SepoliaでUSDCを取得し、Arbitrum
              SepoliaでETHを取得してください。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${id}-token`}>ブリッジトークン</Label>
            <select
              id={`${id}-token`}
              value={formData.token}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleInputChange('token', e.target.value)
              }
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="USDC">USDC (USD Coin)</option>
              <option value="USDT">USDT (Tether USD)</option>
              <option value="WETH">WETH (Wrapped Ether)</option>
              <option value="ETH">ETH (Ethereum)</option>
            </select>
            <p className="text-xs text-gray-600">
              Base SepoliaからArbitrum Sepoliaにブリッジするトークンを選択
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${id}-amount`}>数量</Label>
            <Input
              id={`${id}-amount`}
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${id}-toChainId`}>宛先チェーンID</Label>
            <Input
              id={`${id}-toChainId`}
              value={formData.toChainId}
              onChange={(e) => handleInputChange('toChainId', e.target.value)}
              placeholder="421614 (Arbitrum Sepolia)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${id}-sourceChains`}>送信元チェーンID（カンマ区切り）</Label>
            <Input
              id={`${id}-sourceChains`}
              value={formData.sourceChains}
              onChange={(e) => handleInputChange('sourceChains', e.target.value)}
              placeholder="84532 (Base Sepolia)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${id}-contractAddress`}>
              DonationPoolコントラクトアドレス（Arbitrum Sepolia）
            </Label>
            <Input
              id={`${id}-contractAddress`}
              value={formData.contractAddress}
              onChange={(e) => handleInputChange('contractAddress', e.target.value)}
              placeholder="0x..."
            />
            <p className="text-xs text-gray-600">
              Arbitrum SepoliaにデプロイされたDonationPoolコントラクトのアドレス
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${id}-functionName`}>関数名</Label>
            <select
              id={`${id}-functionName`}
              value={formData.functionName}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleInputChange('functionName', e.target.value)
              }
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="donate">donate - トークンを寄付</option>
              <option value="swapUsdcToPyusd">swapUsdcToPyusd - USDCをPYUSDにスワップ</option>
            </select>
            <p className="text-xs text-gray-600">DonationPoolコントラクトで実行したい関数名</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${id}-usdcAddress`}>
              USDCコントラクトアドレス（Arbitrum Sepolia）
            </Label>
            <Input
              id={`${id}-usdcAddress`}
              value={formData.usdcAddress}
              onChange={(e) => handleInputChange('usdcAddress', e.target.value)}
              placeholder="0x..."
            />
            <p className="text-xs text-gray-600">Arbitrum SepoliaのUSDCコントラクトアドレス</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${id}-pyusdAddress`}>
              PYUSDコントラクトアドレス（Arbitrum Sepolia）
            </Label>
            <Input
              id={`${id}-pyusdAddress`}
              value={formData.pyusdAddress}
              onChange={(e) => handleInputChange('pyusdAddress', e.target.value)}
              placeholder="0x..."
            />
            <p className="text-xs text-gray-600">Arbitrum SepoliaのPYUSDコントラクトアドレス</p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`${id}-recipient`}>受信者アドレス（空の場合は現在のアドレス）</Label>
            <Input
              id={`${id}-recipient`}
              value={formData.recipient}
              onChange={(e) => handleInputChange('recipient', e.target.value)}
              placeholder={address || '0x...'}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSimulate}
            disabled={!isConnected || !isInitialized || isLoading}
            className="flex-1"
          >
            {isLoading ? 'シミュレーション中...' : 'シミュレーション実行'}
          </Button>
          <Button
            onClick={handleExecute}
            disabled={!isConnected || !isInitialized || isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isLoading ? '実行中...' : '実際に実行'}
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">エラー: {error}</p>
          </div>
        )}

        {simulation && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">シミュレーション結果</h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>成功:</strong> {simulation.success ? 'はい' : 'いいえ'}
              </p>
              {simulation.totalEstimatedCost && (
                <p>
                  <strong>推定コスト:</strong> {JSON.stringify(simulation.totalEstimatedCost)}
                </p>
              )}
              {simulation.metadata?.approvalRequired && (
                <p>
                  <strong>承認が必要:</strong> はい
                </p>
              )}
              {simulation.metadata?.bridgeReceiveAmount && (
                <p>
                  <strong>ブリッジ受信数量:</strong> {simulation.metadata.bridgeReceiveAmount}
                </p>
              )}
              {simulation.steps && (
                <div>
                  <p>
                    <strong>ステップ:</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4">
                    {simulation.steps.map((step, index) => (
                      <li key={`step-${index}-${JSON.stringify(step)}`}>{JSON.stringify(step)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">実行結果</h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>成功:</strong> {result.success ? 'はい' : 'いいえ'}
              </p>
              {result.bridgeSkipped && (
                <p>
                  <strong>ブリッジスキップ:</strong> はい（十分な資金があるため）
                </p>
              )}
              {result.bridgeTransactionHash && (
                <p>
                  <strong>ブリッジトランザクションハッシュ:</strong> {result.bridgeTransactionHash}
                </p>
              )}
              {result.executeTransactionHash && (
                <p>
                  <strong>実行トランザクションハッシュ:</strong> {result.executeTransactionHash}
                </p>
              )}
              {result.approvalTransactionHash && (
                <p>
                  <strong>承認トランザクションハッシュ:</strong> {result.approvalTransactionHash}
                </p>
              )}
              {result.error && (
                <p className="text-red-600">
                  <strong>エラー:</strong> {result.error}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
