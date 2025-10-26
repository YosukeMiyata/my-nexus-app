'use client';

import { useState, useId, useEffect, useCallback } from 'react';
import { Button } from '@/components/atoms/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/Dialog';
import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import { useNexusSDK } from '@/hooks/useNexusSDK';
import { useAccount } from 'wagmi';
import type { SUPPORTED_CHAINS_IDS } from '@avail-project/nexus-core';

interface BridgeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// メインネットとテストネットで利用可能なトークンを分ける
const MAINNET_TOKENS = ['ETH', 'USDC', 'USDT'] as const;
const TESTNET_TOKENS = ['ETH', 'USDC', 'USDT'] as const;

// メインネットチェーン
const MAINNET_CHAINS = [
  { id: 1, name: 'Ethereum' },
  { id: 10, name: 'Optimism' },
  { id: 137, name: 'Polygon' },
  { id: 42161, name: 'Arbitrum' },
  { id: 43114, name: 'Avalanche' },
  { id: 8453, name: 'Base' },
  { id: 534352, name: 'Scroll' },
  { id: 56, name: 'BNB Chain' },
] as const;

// テストネットチェーン（Nexus SDK公式サポートチェーン）
const TESTNET_CHAINS = [
  { id: 11155111, name: 'Sepolia' },
  { id: 84532, name: 'Base Sepolia' },
  { id: 421614, name: 'Arbitrum Sepolia' },
  { id: 11155420, name: 'Optimism Sepolia' },
  { id: 80002, name: 'Polygon Amoy' },
  { id: 10143, name: 'Monad Testnet' },
] as const;

export default function BridgeDialog({ isOpen, onOpenChange }: BridgeDialogProps) {
  const { address, isConnected } = useAccount();
  const { nexusSDK, isInitialized, initializeSDK } = useNexusSDK();

  // ユニークなIDを生成
  const tokenId = useId();
  const amountId = useId();
  const targetChainId = useId();
  const networkModeId = useId();

  const [token, setToken] = useState<'ETH' | 'USDC' | 'USDT'>('ETH');
  const [amount, setAmount] = useState('');
  const [targetChain, setTargetChain] = useState<SUPPORTED_CHAINS_IDS>(137);
  const [networkMode, setNetworkMode] = useState<'mainnet' | 'testnet'>('mainnet');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // 現在のネットワークモードに応じてチェーンリストとトークンリストを取得
  const currentChains = networkMode === 'mainnet' ? MAINNET_CHAINS : TESTNET_CHAINS;
  const currentTokens = networkMode === 'mainnet' ? MAINNET_TOKENS : TESTNET_TOKENS;

  // SDK初期化処理
  const handleInitializeSDK = useCallback(async () => {
    if (!isConnected || !address) {
      setError('ウォレットが接続されていません。');
      return;
    }

    if (isInitializing) {
      console.log('BridgeDialog: 既に初期化中です。');
      return;
    }

    setIsInitializing(true);
    setError(null);
    setSuccess(null);

    try {
      await initializeSDK();
      setSuccess('Nexus SDKが正常に初期化されました。');
    } catch (err) {
      console.error('SDK initialization error:', err);
      setError(`SDK初期化に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    } finally {
      setIsInitializing(false);
    }
  }, [isConnected, address, isInitializing, initializeSDK]);

  // ダイアログが開かれた時のみSDK初期化を自動実行
  useEffect(() => {
    if (isOpen && isConnected && !isInitialized && !isInitializing) {
      handleInitializeSDK();
    }
  }, [isOpen, isConnected, isInitialized, isInitializing, handleInitializeSDK]);

  const handleBridge = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('有効な数量を入力してください。');
      return;
    }

    if (!isConnected || !address) {
      setError('ウォレットが接続されていません。');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // SDKが初期化されていない場合は自動初期化を実行
      if (!isInitialized) {
        setSuccess('Nexus SDKを初期化中...');
        try {
          await initializeSDK();
          setSuccess('Nexus SDKの初期化が完了しました。ブリッジを開始します...');

          // 初期化完了後、少し待機してからブリッジ処理を続行
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (initError) {
          console.error('SDK初期化エラー:', initError);
          setError(
            `SDK初期化に失敗しました: ${initError instanceof Error ? initError.message : '不明なエラー'}`
          );
          return;
        }
      }

      // ブリッジを実行
      const result = await nexusSDK.bridge({
        token,
        amount: parseFloat(amount),
        chainId: targetChain,
      });

      if (result.success) {
        setSuccess(
          `ブリッジが成功しました！${result.explorerUrl ? `トランザクション: ${result.explorerUrl}` : ''}`
        );
        // 成功後、フォームをリセット
        setAmount('');
      } else {
        setError(`ブリッジが失敗しました: ${result.error || '不明なエラー'}`);
      }
    } catch (err) {
      console.error('Bridge error:', err);
      setError(
        `ブリッジ中にエラーが発生しました: ${err instanceof Error ? err.message : '不明なエラー'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setError(null);
    setSuccess(null);
    setAmount('');
  };

  // ネットワークモードが変更された時にデフォルトチェーンとトークンを設定
  const handleNetworkModeChange = (mode: 'mainnet' | 'testnet') => {
    setNetworkMode(mode);
    // デフォルトチェーンを設定
    const defaultChain = mode === 'mainnet' ? 137 : 11155111; // Polygon or Sepolia
    setTargetChain(defaultChain as SUPPORTED_CHAINS_IDS);
    // テストネットではETHのみ利用可能
    if (mode === 'testnet') {
      setToken('ETH');
    }
    // エラーメッセージのみクリア（成功メッセージは保持）
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">トークンブリッジ</DialogTitle>
          <DialogDescription>
            Nexus SDKを使用してトークンを異なるチェーン間でブリッジします。
          </DialogDescription>
          {/* 成功メッセージを説明文の真下に表示 */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md mt-1">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* ネットワークモード選択 */}
          <div className="space-y-2">
            <Label htmlFor={networkModeId}>ネットワーク</Label>
            <div className="flex gap-2">
              <Button
                variant={networkMode === 'mainnet' ? 'default' : 'outline'}
                onClick={() => handleNetworkModeChange('mainnet')}
                className="flex-1"
              >
                メインネット
              </Button>
              <Button
                variant={networkMode === 'testnet' ? 'default' : 'outline'}
                onClick={() => handleNetworkModeChange('testnet')}
                className="flex-1"
              >
                テストネット
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              {networkMode === 'mainnet'
                ? '本番環境のチェーンでブリッジを実行します'
                : 'テスト環境のチェーンでブリッジを実行します（テスト用トークンが必要）'}
            </p>
            {networkMode === 'testnet' && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-700 text-xs">
                  テストネットではETH、USDC、USDTがブリッジ可能です。
                </p>
              </div>
            )}
          </div>

          {/* トークン選択 */}
          <div className="space-y-2">
            <Label htmlFor={tokenId}>トークン</Label>
            <select
              id={tokenId}
              value={token}
              onChange={(e) => setToken(e.target.value as 'ETH' | 'USDC' | 'USDT')}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {currentTokens.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* 数量入力 */}
          <div className="space-y-2">
            <Label htmlFor={amountId}>数量</Label>
            <Input
              id={amountId}
              type="number"
              step="0.000001"
              placeholder="例: 100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full"
            />
          </div>

          {/* ターゲットチェーン選択 */}
          <div className="space-y-2">
            <Label htmlFor={targetChainId}>送信先チェーン</Label>
            <select
              id={targetChainId}
              value={targetChain}
              onChange={(e) => setTargetChain(Number(e.target.value) as SUPPORTED_CHAINS_IDS)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {currentChains.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.name} (Chain ID: {chain.id})
                </option>
              ))}
            </select>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* SDK初期化状態の表示 */}
          {!isInitialized && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-700 text-xs">
                SDKが未初期化です。ブリッジ実行時に自動初期化されます。
              </p>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleBridge}
              disabled={isLoading || !amount || parseFloat(amount) <= 0 || !isConnected}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isLoading
                ? isInitialized
                  ? 'ブリッジ中...'
                  : 'SDK初期化中...'
                : !isConnected
                  ? 'ウォレット未接続'
                  : !amount || parseFloat(amount) <= 0
                    ? '数量を入力してください'
                    : 'ブリッジ実行'}
            </Button>
            <Button onClick={handleClose} variant="outline" className="flex-1">
              キャンセル
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
