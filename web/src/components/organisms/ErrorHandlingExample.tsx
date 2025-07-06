// ========================================
// Error Handling Example - RustエラーハンドリングのDemoコンポーネント
// ========================================

import React, { useState } from 'react';
import { 
  testAgentCooperationWithErrorHandling, 
  formatErrorMessage, 
  logStructuredError,
  type RustError 
} from '../../utils/errorHandling';

// WASM関数のインポート（実際のパスに合わせて調整）
// import { test_agent_cooperation_decision } from '../../assets/pkg/prisoners_dilemma_2d';

interface ErrorHandlingExampleProps {
  // WASM関数を props として受け取る（テスト用）
  testAgentCooperationDecision?: (agentJson: string, opponentId: number) => boolean;
}

export const ErrorHandlingExample: React.FC<ErrorHandlingExampleProps> = ({
  testAgentCooperationDecision
}) => {
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<RustError | null>(null);
  const [loading, setLoading] = useState(false);

  // テスト用の無効なエージェントJSON（エラーを発生させるため）
  const invalidAgentJson = JSON.stringify({
    id: { AgentId: 1 },
    position: { x: 5, y: 5 },
    traits: {
      cooperation_tendency: 1.5, // 無効な値（0.0-1.0を超えている）
      aggression: 0.3,
      learning_ability: 0.8,
      movement_tendency: 0.4
    },
    state: {
      score: 0.0,
      energy: 100.0,
      age: 0,
      battles_fought: 0
    },
    strategy: {
      genes: {
        strategy_gene: 0.1,
        memory_gene: 0.9,
        adaptation_gene: 0.5,
        social_gene: 0.6
      }
    }
  });

  // 死亡したエージェントのJSON（エラーを発生させるため）
  const deadAgentJson = JSON.stringify({
    id: { AgentId: 2 },
    position: { x: 5, y: 5 },
    traits: {
      cooperation_tendency: 0.6,
      aggression: 0.3,
      learning_ability: 0.8,
      movement_tendency: 0.4
    },
    state: {
      score: 0.0,
      energy: 0.0, // エネルギー0で死亡状態
      age: 0,
      battles_fought: 0
    },
    strategy: {
      genes: {
        strategy_gene: 0.1,
        memory_gene: 0.9,
        adaptation_gene: 0.5,
        social_gene: 0.6
      }
    }
  });

  const testCooperationDecision = async (agentJson: string, label: string) => {
    if (!testAgentCooperationDecision) {
      setResult('WASM関数が提供されていません');
      return;
    }

    setLoading(true);
    setError(null);
    setResult('');

    try {
      const result = await testAgentCooperationWithErrorHandling(
        agentJson,
        123, // 相手のエージェントID
        testAgentCooperationDecision
      );

      if (result.cooperation !== null) {
        setResult(`${label}: 協力決定 = ${result.cooperation ? '協力する' : '協力しない'}`);
      } else if (result.error) {
        setError(result.error);
        logStructuredError(result.error, `Testing ${label}`);
      }
    } catch (err) {
      setResult(`予期しないエラー: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Rust エラーハンドリング デモ</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">テストケース</h3>
          <div className="space-y-2">
            <button
              onClick={() => testCooperationDecision(invalidAgentJson, '無効な協力傾向値')}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              無効なエージェント（協力傾向 &gt; 1.0）をテスト
            </button>
            
            <button
              onClick={() => testCooperationDecision(deadAgentJson, '死亡エージェント')}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
            >
              死亡エージェントをテスト
            </button>
          </div>
        </div>

        {loading && (
          <div className="p-4 bg-blue-100 rounded">
            <p>処理中...</p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-100 rounded">
            <h4 className="font-semibold">結果:</h4>
            <p>{result}</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-100 rounded">
            <h4 className="font-semibold text-red-800">エラーが発生しました:</h4>
            <p className="text-red-700">{formatErrorMessage(error)}</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-red-600">詳細情報</summary>
              <pre className="mt-2 text-xs bg-red-50 p-2 rounded">
                {JSON.stringify(error, null, 2)}
              </pre>
            </details>
          </div>
        )}

        <div className="mt-6">
          <h4 className="text-md font-semibold mb-2">エラーハンドリングの特徴:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>Rustからの構造化エラー情報をJavaScriptで受け取り</li>
            <li>エラータイプに応じた適切なメッセージ表示</li>
            <li>エラーログの構造化出力</li>
            <li>ユーザーフレンドリーなエラー表示</li>
            <li>非同期エラーハンドリング対応</li>
          </ul>
        </div>
      </div>
    </div>
  );
};