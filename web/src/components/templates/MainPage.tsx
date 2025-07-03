// ========================================
// MainPage Template Component - メインページのテンプレート
// ========================================

import React from 'react';
import { ApplicationProvider } from '../../contexts/ApplicationContext';
import { SimulationProvider } from '../../contexts/SimulationContext';
import { ErrorType } from '../../utils/error-handler';
import { ErrorBoundary } from '../molecules/ErrorBoundary';
import { AppLayout, DefaultFooter, DefaultHeader } from '../organisms/AppLayout';
import { ControlPanel } from '../organisms/ControlPanel';
import { SimulationGrid } from '../organisms/SimulationGrid';
import { StatisticsPanel } from '../organisms/StatisticsPanel';

export interface MainPageProps {
  className?: string;
  'data-testid'?: string;
}

export function MainPage({ className = '', 'data-testid': testId }: MainPageProps) {
  const mainContentStyle: React.CSSProperties = {
    display: 'grid',
    gap: '1rem',
    gridTemplateAreas: `
      "control simulation statistics"
      "control simulation statistics"
    `,
    gridTemplateColumns: '350px 1fr 300px',
    gridTemplateRows: '1fr auto',
    height: '100%',
    overflow: 'hidden',
    padding: '1rem',
  };

  const controlAreaStyle: React.CSSProperties = {
    gridArea: 'control',
    overflow: 'auto',
  };

  const simulationAreaStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gridArea: 'simulation',
    overflow: 'hidden',
  };

  const statisticsAreaStyle: React.CSSProperties = {
    gridArea: 'statistics',
    overflow: 'auto',
  };

  // レスポンシブ対応
  const responsiveStyle = `
    @media (max-width: 1200px) {
      .main-content {
        grid-template-columns: 300px 1fr !important;
        grid-template-areas: 
          "control simulation"
          "statistics statistics" !important;
      }
    }
    
    @media (max-width: 768px) {
      .main-content {
        grid-template-columns: 1fr !important;
        grid-template-areas: 
          "control"
          "simulation"
          "statistics" !important;
      }
    }
  `;

  return (
    <ApplicationProvider>
      <SimulationProvider>
        <div className={className} data-testid={testId}>
          <style>{responsiveStyle}</style>

          <AppLayout footer={<DefaultFooter />} header={<DefaultHeader />}>
            <div className="main-content" style={mainContentStyle}>
              {/* コントロールパネル */}
              <div style={controlAreaStyle}>
                <ErrorBoundary
                  component="ControlPanel"
                  errorType={ErrorType.UI}
                  fallback={(error, retry) => (
                    <div
                      style={{
                        backgroundColor: '#fff5f5',
                        border: '1px solid #fed7d7',
                        borderRadius: '8px',
                        color: '#e53e3e',
                        padding: '2rem',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎮</div>
                      <h3>コントロールパネルエラー</h3>
                      <p style={{ color: '#744210', margin: '1rem 0' }}>
                        シミュレーション制御パネルの読み込みに失敗しました
                      </p>
                      <button
                        onClick={retry}
                        style={{
                          backgroundColor: '#e53e3e',
                          border: 'none',
                          borderRadius: '4px',
                          color: 'white',
                          cursor: 'pointer',
                          padding: '0.75rem 1.5rem',
                        }}
                      >
                        再読み込み
                      </button>
                    </div>
                  )}
                >
                  <ControlPanel />
                </ErrorBoundary>
              </div>

              {/* シミュレーショングリッド */}
              <div style={simulationAreaStyle}>
                <ErrorBoundary
                  component="SimulationGrid"
                  errorType={ErrorType.SIMULATION}
                  fallback={(error, retry) => (
                    <div
                      style={{
                        alignItems: 'center',
                        backgroundColor: '#fff5f5',
                        border: '1px solid #fed7d7',
                        borderRadius: '8px',
                        display: 'flex',
                        flex: 1,
                        justifyContent: 'center',
                        margin: '1rem',
                      }}
                    >
                      <div style={{ color: '#e53e3e', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔬</div>
                        <h3>シミュレーションエラー</h3>
                        <p style={{ color: '#744210', margin: '1rem 0', maxWidth: '400px' }}>
                          シミュレーショングリッドの表示中にエラーが発生しました。
                          WASMエンジンの初期化に問題がある可能性があります。
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                          <button
                            onClick={retry}
                            style={{
                              backgroundColor: '#e53e3e',
                              border: 'none',
                              borderRadius: '4px',
                              color: 'white',
                              cursor: 'pointer',
                              padding: '0.75rem 1.5rem',
                            }}
                          >
                            再試行
                          </button>
                          <button
                            onClick={() => window.location.reload()}
                            style={{
                              backgroundColor: 'transparent',
                              border: '1px solid #e53e3e',
                              borderRadius: '4px',
                              color: '#e53e3e',
                              cursor: 'pointer',
                              padding: '0.75rem 1.5rem',
                            }}
                          >
                            ページ再読み込み
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                >
                  <SimulationGrid
                    cellSize={8}
                    colorMode="cooperation"
                    height={600}
                    showGrid={true}
                    width={800}
                  />
                </ErrorBoundary>
              </div>

              {/* 統計パネル */}
              <div style={statisticsAreaStyle}>
                <ErrorBoundary
                  component="StatisticsPanel"
                  errorType={ErrorType.UI}
                  fallback={(error, retry) => (
                    <div
                      style={{
                        backgroundColor: '#fff5f5',
                        border: '1px solid #fed7d7',
                        borderRadius: '8px',
                        color: '#e53e3e',
                        padding: '2rem',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
                      <h3>統計パネルエラー</h3>
                      <p style={{ color: '#744210', margin: '1rem 0' }}>
                        統計情報の表示中にエラーが発生しました
                      </p>
                      <button
                        onClick={retry}
                        style={{
                          backgroundColor: '#e53e3e',
                          border: 'none',
                          borderRadius: '4px',
                          color: 'white',
                          cursor: 'pointer',
                          padding: '0.75rem 1.5rem',
                        }}
                      >
                        再読み込み
                      </button>
                    </div>
                  )}
                >
                  <StatisticsPanel />
                </ErrorBoundary>
              </div>
            </div>
          </AppLayout>
        </div>
      </SimulationProvider>
    </ApplicationProvider>
  );
}

// ========================================
// 開発者向けデバッグページテンプレート
// ========================================

export function DebugPage() {
  const [showLogs, setShowLogs] = React.useState(false);
  const [showErrors, setShowErrors] = React.useState(false);

  return (
    <ApplicationProvider>
      <AppLayout
        footer={<DefaultFooter />}
        header={
          <div
            style={{
              backgroundColor: '#1a202c',
              borderBottom: '1px solid #4a5568',
              color: '#e2e8f0',
              padding: '1rem',
            }}
          >
            <h1 style={{ fontSize: '1.5rem', margin: 0 }}>🛠️ デバッグ・開発者ツール</h1>
          </div>
        }
      >
        <div
          style={{
            display: 'grid',
            gap: '2rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            padding: '2rem',
          }}
        >
          {/* ログビューア */}
          <div
            style={{
              backgroundColor: '#f7fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1.5rem',
            }}
          >
            <h2 style={{ color: '#2d3748', marginTop: 0 }}>📋 ログビューア</h2>
            <button
              onClick={() => setShowLogs(!showLogs)}
              style={{
                backgroundColor: '#4299e1',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                marginBottom: '1rem',
                padding: '0.5rem 1rem',
              }}
            >
              {showLogs ? 'ログを非表示' : 'ログを表示'}
            </button>

            {showLogs && (
              <div
                style={{
                  backgroundColor: '#1a202c',
                  borderRadius: '4px',
                  color: '#e2e8f0',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  maxHeight: '400px',
                  overflow: 'auto',
                  padding: '1rem',
                }}
              >
                <div>[DEBUG] ログシステム初期化完了</div>
                <div>[INFO] アプリケーション開始</div>
                <div>[WARN] WASMモジュール未初期化</div>
                <div>[ERROR] シミュレーション作成失敗</div>
              </div>
            )}
          </div>

          {/* エラー統計 */}
          <div
            style={{
              backgroundColor: '#fff5f5',
              border: '1px solid #fed7d7',
              borderRadius: '8px',
              padding: '1.5rem',
            }}
          >
            <h2 style={{ color: '#e53e3e', marginTop: 0 }}>⚠️ エラー統計</h2>
            <button
              onClick={() => setShowErrors(!showErrors)}
              style={{
                backgroundColor: '#e53e3e',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                marginBottom: '1rem',
                padding: '0.5rem 1rem',
              }}
            >
              {showErrors ? 'エラーを非表示' : 'エラーを表示'}
            </button>

            {showErrors && (
              <div style={{ fontSize: '0.875rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>総エラー数:</strong> 0
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>WASM エラー:</strong> 0
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>ネットワークエラー:</strong> 0
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>UI エラー:</strong> 0
                </div>
              </div>
            )}
          </div>

          {/* パフォーマンス監視 */}
          <div
            style={{
              backgroundColor: '#f0fff4',
              border: '1px solid #9ae6b4',
              borderRadius: '8px',
              padding: '1.5rem',
            }}
          >
            <h2 style={{ color: '#276749', marginTop: 0 }}>⚡ パフォーマンス</h2>
            <div style={{ fontSize: '0.875rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>メモリ使用量:</strong> 計算中...
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>FPS:</strong> 0
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>世代処理時間:</strong> 0ms
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>レンダリング時間:</strong> 0ms
              </div>
            </div>
          </div>

          {/* システム情報 */}
          <div
            style={{
              backgroundColor: '#ebf8ff',
              border: '1px solid #90cdf4',
              borderRadius: '8px',
              padding: '1.5rem',
            }}
          >
            <h2 style={{ color: '#2c5282', marginTop: 0 }}>ℹ️ システム情報</h2>
            <div style={{ fontSize: '0.875rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>ブラウザ:</strong> {navigator.userAgent.split(' ')[0]}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>WebAssembly:</strong>{' '}
                {typeof WebAssembly !== 'undefined' ? '対応' : '非対応'}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>ローカルストレージ:</strong>{' '}
                {typeof Storage !== 'undefined' ? '対応' : '非対応'}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>オンライン状態:</strong> {navigator.onLine ? 'オンライン' : 'オフライン'}
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ApplicationProvider>
  );
}
