import { useState, useEffect } from 'react';
import { PromptInput } from './components/PromptInput';
import { ComponentCard } from './components/ComponentCard';
import { useComponentGenerator } from './hooks/useComponentGenerator';
import { usePersistedState } from './hooks/usePersistedState';
import {
  STORAGE_KEYS,
  addPromptToHistory,
  parseApiKey,
  parseHistory,
  parseProvider,
} from './utils/storage';
import type { Provider } from './types';
import './App.css';

const PROVIDER_CONFIG = {
  anthropic: { label: 'Anthropic', placeholder: 'sk-ant-...' },
  google: { label: 'Google', placeholder: 'AIza...' },
} as const;

function App() {
  const [apiKey, setApiKey] = usePersistedState(STORAGE_KEYS.apiKey, parseApiKey);
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = usePersistedState<Provider>(
    STORAGE_KEYS.provider,
    parseProvider,
  );
  const [history, setHistory] = usePersistedState(STORAGE_KEYS.history, parseHistory);
  const [envKeys, setEnvKeys] = useState<Record<Provider, boolean>>({
    anthropic: false,
    google: false,
  });
  const { components, isLoading, error, generate, removeComponent, clearAll } =
    useComponentGenerator();

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setEnvKeys(data.envKeys))
      .catch(() => {});
  }, []);

  const hasEnvKey = envKeys[provider];

  const handleGenerate = async (prompt: string) => {
    if (!apiKey.trim() && !hasEnvKey) {
      alert(`${PROVIDER_CONFIG[provider].label} API 키를 입력하거나 .env에 설정해주세요.`);
      return;
    }
    const succeeded = await generate(prompt, apiKey || undefined, provider);
    if (succeeded) {
      setHistory((prev) => addPromptToHistory(prev, prompt));
    }
  };

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
    setApiKey('');
  };

  const activeProvider = PROVIDER_CONFIG[provider].label;

  return (
    <div className="app">
      <div className="menubar">
        <span className="menubar-logo" aria-hidden="true">
          RC
        </span>
        <span className="menubar-name">React 컴포넌트 생성기</span>
        <div className="menubar-status" aria-label="현재 작업 상태">
          <span>모델 {activeProvider}</span>
          <span>컴포넌트 {components.length}개</span>
        </div>
      </div>

      <header className="hero">
        <h1>
          프롬프트로 만드는
          <br />
          UI 워크벤치<span className="caret" aria-hidden="true" />
        </h1>
        <p>요청을 입력하면 React 컴포넌트가 새 창으로 열리고, 바로 미리보고 코드까지 확인할 수 있어요.</p>
      </header>

      <main className="workspace">
        <section className="win composer-panel" aria-labelledby="composer-title">
          <div className="win-title">
            <h2 id="composer-title">새 컴포넌트</h2>
          </div>
          <div className="win-body">
            <PromptInput onGenerate={handleGenerate} isLoading={isLoading} history={history} />
          </div>
        </section>

        <aside className="win settings-panel" aria-labelledby="settings-title">
          <div className="win-title">
            <h2 id="settings-title">실행 설정</h2>
          </div>
          <div className="win-body">
            <div className="provider-select">
              <label htmlFor="provider">모델 제공사</label>
              <select
                id="provider"
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as Provider)}
              >
                {Object.entries(PROVIDER_CONFIG).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="api-key-input">
              <label htmlFor="api-key">API 키</label>
              <div className="api-key-field">
                <input
                  id="api-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    hasEnvKey
                      ? '서버 키 사용 중 (직접 입력으로 덮어쓰기 가능)'
                      : PROVIDER_CONFIG[provider].placeholder
                  }
                />
                <button
                  className="btn-toggle-key"
                  onClick={() => setShowKey(!showKey)}
                  type="button"
                >
                  {showKey ? '숨기기' : '보기'}
                </button>
              </div>
              <p className={`key-status ${hasEnvKey ? 'key-status--ready' : ''}`}>
                {hasEnvKey
                  ? '.env 키가 연결되어 있습니다.'
                  : '직접 입력하거나 서버 환경변수를 설정하세요.'}
              </p>
            </div>
          </div>
        </aside>
      </main>

      {error && (
        <div className="error-banner" role="alert">
          <p>{error}</p>
        </div>
      )}

      <section className="results-section" aria-label="생성 결과">
        {components.length > 0 && (
          <div className="results-header">
            <h2>생성된 컴포넌트 {components.length}개</h2>
            <button className="btn-clear" onClick={clearAll}>
              전체 삭제
            </button>
          </div>
        )}

        {components.length === 0 && !isLoading && (
          <div className="win empty-state">
            <div className="win-title">
              <h2>빈 폴더</h2>
            </div>
            <div className="win-body empty-body">
              <div className="empty-canvas" aria-hidden="true">
                <div className="empty-card empty-card--primary" />
                <div className="empty-card" />
                <div className="empty-card empty-card--wide" />
              </div>
              <div className="empty-copy">
                <h2>새 컴포넌트를 생성해보세요.</h2>
                <p>위 입력창에 만들 UI를 설명하면 이곳에 결과 창이 열립니다.</p>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="win loading-card" role="status">
            <div className="win-title">
              <h2>생성 중</h2>
            </div>
            <div className="win-body">
              <p>컴포넌트를 생성하고 있습니다...</p>
              <div className="progress" aria-hidden="true">
                <span />
              </div>
            </div>
          </div>
        )}

        <div className="results-grid">
          {components.map((component) => (
            <ComponentCard
              key={component.id}
              component={component}
              onRemove={removeComponent}
              onRegenerate={handleGenerate}
              isLoading={isLoading}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
