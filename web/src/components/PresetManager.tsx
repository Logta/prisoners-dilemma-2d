import { useEffect, useState } from 'react';
import type { GridSize } from '../types';

interface PresetData {
  name: string;
  gridSize: GridSize;
  agentDensity: number;
  battleRadius: number;
  speed: number;
  selectionMethod: string;
  selectionParam: number;
  crossoverMethod: string;
  crossoverParam: number;
  mutationRate: number;
  mutationStrength: number;
}

interface PresetManagerProps {
  currentPreset: PresetData;
  onLoadPreset: (preset: PresetData) => void;
}

const DEFAULT_PRESETS: PresetData[] = [
  {
    agentDensity: 0.3,
    battleRadius: 2,
    crossoverMethod: 'one_point',
    crossoverParam: 0.5,
    gridSize: { height: 100, width: 100 },
    mutationRate: 0.1,
    mutationStrength: 0.05,
    name: '標準設定',
    selectionMethod: 'top_percent',
    selectionParam: 0.5,
    speed: 100,
  },
  {
    agentDensity: 0.6,
    battleRadius: 3,
    crossoverMethod: 'uniform',
    crossoverParam: 0.7,
    gridSize: { height: 80, width: 80 },
    mutationRate: 0.15,
    mutationStrength: 0.08,
    name: '高密度競争',
    selectionMethod: 'tournament',
    selectionParam: 5,
    speed: 50,
  },
  {
    agentDensity: 0.2,
    battleRadius: 4,
    crossoverMethod: 'two_point',
    crossoverParam: 0.5,
    gridSize: { height: 200, width: 200 },
    mutationRate: 0.05,
    mutationStrength: 0.03,
    name: '大規模進化',
    selectionMethod: 'roulette',
    selectionParam: 0.3,
    speed: 200,
  },
  {
    agentDensity: 0.4,
    battleRadius: 2,
    crossoverMethod: 'uniform',
    crossoverParam: 0.6,
    gridSize: { height: 120, width: 120 },
    mutationRate: 0.25,
    mutationStrength: 0.12,
    name: '高変異実験',
    selectionMethod: 'top_percent',
    selectionParam: 0.3,
    speed: 80,
  },
];

export default function PresetManager(props: PresetManagerProps) {
  const [savedPresets, setSavedPresets] = useState<PresetData[]>([]);
  const [presetName, setPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // ローカルストレージからプリセットを読み込み
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pd2d-presets');
      if (stored) {
        setSavedPresets(JSON.parse(stored));
      }
    } catch (error) {
      console.error('プリセットの読み込みに失敗:', error);
    }
  }, []);

  // プリセットを保存
  const savePreset = () => {
    const name = presetName.trim();
    if (!name) return;

    const newPreset = { ...props.currentPreset, name };
    const presets = savedPresets;
    const existingIndex = presets.findIndex((p) => p.name === name);

    let updatedPresets: PresetData[];
    if (existingIndex >= 0) {
      updatedPresets = [...presets];
      updatedPresets[existingIndex] = newPreset;
    } else {
      updatedPresets = [...presets, newPreset];
    }

    setSavedPresets(updatedPresets);

    try {
      localStorage.setItem('pd2d-presets', JSON.stringify(updatedPresets));
    } catch (error) {
      console.error('プリセットの保存に失敗:', error);
    }

    setPresetName('');
    setShowSaveDialog(false);
  };

  // プリセットを削除
  const deletePreset = (name: string) => {
    const updatedPresets = savedPresets.filter((p) => p.name !== name);
    setSavedPresets(updatedPresets);

    try {
      localStorage.setItem('pd2d-presets', JSON.stringify(updatedPresets));
    } catch (error) {
      console.error('プリセットの削除に失敗:', error);
    }
  };

  // プリセットをエクスポート
  const exportPresets = () => {
    const allPresets = [...DEFAULT_PRESETS, ...savedPresets];
    const dataStr = JSON.stringify(allPresets, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pd2d-presets.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // プリセットをインポート
  const importPresets = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as PresetData[];
        const customPresets = imported.filter(
          (p) => !DEFAULT_PRESETS.some((dp) => dp.name === p.name)
        );

        setSavedPresets(customPresets);
        localStorage.setItem('pd2d-presets', JSON.stringify(customPresets));
      } catch (error) {
        console.error('プリセットのインポートに失敗:', error);
        alert('プリセットファイルの形式が正しくありません。');
      }
    };
    reader.readAsText(file);

    // ファイル入力をリセット
    input.value = '';
  };

  return (
    <div className="preset-manager">
      <h3>プリセット管理</h3>

      <div className="preset-actions">
        <button className="button" onClick={() => setShowSaveDialog(true)}>
          現在の設定を保存
        </button>
        <button className="button" onClick={exportPresets}>
          エクスポート
        </button>
        <label className="button file-input-label">
          インポート
          <input accept=".json" onChange={importPresets} style={{ display: 'none' }} type="file" />
        </label>
      </div>

      {showSaveDialog && (
        <div className="save-dialog">
          <h4>プリセット保存</h4>
          <input
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') savePreset();
              if (e.key === 'Escape') setShowSaveDialog(false);
            }}
            placeholder="プリセット名を入力"
            type="text"
            value={presetName}
          />
          <div className="dialog-buttons">
            <button className="button" disabled={!presetName.trim()} onClick={savePreset}>
              保存
            </button>
            <button className="button" onClick={() => setShowSaveDialog(false)}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      <div className="preset-sections">
        <div className="preset-section">
          <h4>デフォルトプリセット</h4>
          <div className="preset-list">
            {DEFAULT_PRESETS.map((preset) => (
              <div className="preset-item" key={preset.name}>
                <span className="preset-name">{preset.name}</span>
                <button
                  className="button preset-load-btn"
                  onClick={() => props.onLoadPreset(preset)}
                >
                  読み込み
                </button>
              </div>
            ))}
          </div>
        </div>

        {savedPresets.length > 0 && (
          <div className="preset-section">
            <h4>カスタムプリセット</h4>
            <div className="preset-list">
              {savedPresets.map((preset) => (
                <div className="preset-item" key={preset.name}>
                  <span className="preset-name">{preset.name}</span>
                  <div className="preset-buttons">
                    <button
                      className="button preset-load-btn"
                      onClick={() => props.onLoadPreset(preset)}
                    >
                      読み込み
                    </button>
                    <button
                      className="button danger preset-delete-btn"
                      onClick={() => deletePreset(preset.name)}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
