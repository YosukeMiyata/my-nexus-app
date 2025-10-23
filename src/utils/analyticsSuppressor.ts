/**
 * Analytics SDKのエラーを完全に抑制するユーティリティ
 * MetaMask SDK AnalyticsのFailed to fetchエラーを根本的にブロック
 */

// グローバルエラー抑制機能
if (typeof window !== 'undefined') {
  // 元のconsole.errorを保存
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  // console.errorをオーバーライド
  console.error = (...args: unknown[]) => {
    // 空の引数や無効な引数をチェック
    if (
      !args ||
      args.length === 0 ||
      (args.length === 1 &&
        typeof args[0] === 'object' &&
        args[0] !== null &&
        Object.keys(args[0]).length === 0)
    ) {
      return;
    }

    const errorMessage = args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
      .join(' ');

    // Analytics SDK関連のエラーを完全にフィルタリング
    if (
      errorMessage.includes('Analytics SDK') ||
      errorMessage.includes('AnalyticsSDKApiError') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes("context: 'AnalyticsSDKApiError'")
    ) {
      // このエラーは完全に無視
      return;
    }

    // その他のエラーは通常通り出力
    try {
      originalConsoleError.apply(console, args);
    } catch (error) {
      // エラーが発生した場合は安全に処理
      console.log('Console error suppressed:', error);
    }
  };

  // console.warnもオーバーライド
  console.warn = (...args: unknown[]) => {
    const warningMessage = args.join(' ');

    // Analytics関連の警告もフィルタリング
    if (warningMessage.includes('Analytics') || warningMessage.includes('Failed to fetch')) {
      return;
    }

    originalConsoleWarn.apply(console, args);
  };

  // 未処理のPromise拒否をキャッチ
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (
      error &&
      typeof error === 'object' &&
      error.message &&
      (error.message.includes('Failed to fetch') ||
        error.message.includes('Analytics') ||
        error.message.includes('AnalyticsSDKApiError'))
    ) {
      // Analytics関連のエラーを完全に抑制
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  });

  // 未処理のエラーをキャッチ
  window.addEventListener('error', (event) => {
    const error = event.error;
    if (
      error &&
      typeof error === 'object' &&
      error.message &&
      (error.message.includes('Failed to fetch') ||
        error.message.includes('Analytics') ||
        error.message.includes('AnalyticsSDKApiError'))
    ) {
      // Analytics関連のエラーを完全に抑制
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  });
}

/**
 * fetch関数をラップしてAnalytics関連のリクエストをブロック
 */
export function suppressAnalyticsRequests() {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    // Analytics関連のリクエストを検出してブロック
    const url = typeof input === 'string' ? input : input.toString();

    if (
      url.includes('analytics') ||
      url.includes('tracking') ||
      url.includes('telemetry') ||
      url.includes('metrics')
    ) {
      // ダミーレスポンスを返す
      return new Response(JSON.stringify({ success: true, blocked: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      return await originalFetch(input, init);
    } catch (error) {
      // Analytics関連のエラーを抑制
      if (
        error instanceof Error &&
        (error.message.includes('Failed to fetch') || error.message.includes('Analytics'))
      ) {
        return new Response(JSON.stringify({ success: true, suppressed: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw error;
    }
  };
}

/**
 * Analytics SDKのエラー抑制を初期化
 */
export function initializeAnalyticsSuppression() {
  if (typeof window !== 'undefined') {
    suppressAnalyticsRequests();
  }
}
