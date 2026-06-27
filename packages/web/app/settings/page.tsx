'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';

const DEFAULT_SETTINGS = {
  provider: 'openai',
  model: 'gpt-4o',
  reviewMode: 'standard',
  maxFiles: 50,
  excludePatterns: 'package-lock.json,yarn.lock,pnpm-lock.yaml,*.min.js,*.min.css,dist/**,build/**',
  customInstructions: '',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('hawk-settings');
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {}
  }, []);

  function handleSave() {
    localStorage.setItem('hawk-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 min-h-screen flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Configure default review behavior
          </p>
        </div>

        <div className="max-w-2xl space-y-6">
          <div className="card">
            <h2 className="mb-4 text-lg font-semibold">LLM Provider</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Provider</label>
                <select
                  value={settings.provider}
                  onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
                  className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Model</label>
                <input
                  type="text"
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                  placeholder="gpt-4o"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="mb-4 text-lg font-semibold">Review Behavior</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Review Mode</label>
                <select
                  value={settings.reviewMode}
                  onChange={(e) => setSettings({ ...settings, reviewMode: e.target.value })}
                  className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                >
                  <option value="quick">Quick — Large diffs only, fast</option>
                  <option value="standard">Standard — Balanced depth and speed</option>
                  <option value="thorough">Thorough — Deep analysis, slower</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Max Files per PR</label>
                <input
                  type="number"
                  value={settings.maxFiles}
                  onChange={(e) => setSettings({ ...settings, maxFiles: parseInt(e.target.value) })}
                  className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="mb-4 text-lg font-semibold">File Filtering</h2>
            <div>
              <label className="mb-1 block text-sm font-medium">Exclude Patterns</label>
              <textarea
                value={settings.excludePatterns}
                onChange={(e) => setSettings({ ...settings, excludePatterns: e.target.value })}
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                rows={3}
                placeholder="package-lock.json,yarn.lock,..."
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Comma-separated glob patterns
              </p>
            </div>
          </div>

          <div className="card">
            <h2 className="mb-4 text-lg font-semibold">Custom Instructions</h2>
            <textarea
              value={settings.customInstructions}
              onChange={(e) => setSettings({ ...settings, customInstructions: e.target.value })}
              className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
              rows={4}
              placeholder="Additional instructions for the AI reviewer..."
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="btn btn-primary" onClick={handleSave}>
              Save Settings
            </button>
            {saved && (
              <span className="text-sm text-green-500">Settings saved!</span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
