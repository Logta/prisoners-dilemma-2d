// ========================================
// Error Handling Utilities - エラーハンドリングユーティリティ
// ========================================

/**
 * WASM Rustエラーのタイプ定義
 */
export interface RustError {
  message: string;
  type: string;
  agentId?: number;
}

/**
 * WASM関数からのエラーかどうかを判定
 */
export function isRustError(error: unknown): error is RustError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'type' in error &&
    typeof (error as any).message === 'string' &&
    typeof (error as any).type === 'string'
  );
}

/**
 * WASM関数を安全に実行し、エラーハンドリングを行う
 */
export async function safeWasmCall<T>(
  wasmFunction: () => T | Promise<T>,
  errorContext?: string
): Promise<{ success: true; data: T } | { success: false; error: RustError }> {
  try {
    const result = await wasmFunction();
    return { success: true, data: result };
  } catch (error) {
    console.error(`WASM Error${errorContext ? ` in ${errorContext}` : ''}:`, error);
    
    if (isRustError(error)) {
      return { success: false, error };
    }
    
    // Rustエラーでない場合はJavaScriptエラーとして扱う
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : String(error),
        type: 'JavaScriptError',
      },
    };
  }
}

/**
 * エージェント協力決定のエラーハンドリング例
 */
export async function testAgentCooperationWithErrorHandling(
  agentJson: string,
  opponentId: number,
  testAgentCooperationDecision: (agentJson: string, opponentId: number) => boolean
): Promise<{ cooperation: boolean; error: null } | { cooperation: null; error: RustError }> {
  const result = await safeWasmCall(
    () => testAgentCooperationDecision(agentJson, opponentId),
    'agent cooperation decision'
  );
  
  if (result.success) {
    return { cooperation: result.data, error: null };
  } else {
    return { cooperation: null, error: result.error };
  }
}

/**
 * エラーメッセージをユーザーフレンドリーな形式に変換
 */
export function formatErrorMessage(error: RustError): string {
  switch (error.type) {
    case 'AgentCooperationError':
      return `エージェント${error.agentId || 'unknown'}の協力決定でエラーが発生しました: ${error.message}`;
    case 'JavaScriptError':
      return `JavaScript実行エラー: ${error.message}`;
    default:
      return `予期しないエラー: ${error.message}`;
  }
}

/**
 * エラーログを構造化して出力
 */
export function logStructuredError(error: RustError, context?: string) {
  const logData = {
    timestamp: new Date().toISOString(),
    errorType: error.type,
    message: error.message,
    agentId: error.agentId,
    context,
  };
  
  console.error('Structured Error Log:', logData);
  
  // 本番環境では、ここで外部のログサービスに送信することも可能
  // if (process.env.NODE_ENV === 'production') {
  //   sendToLogService(logData);
  // }
}