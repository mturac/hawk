import fs from 'fs';
import path from 'path';
import { parse as parseYAML } from 'yaml';

export interface HawkConfig {
  provider: 'openai' | 'anthropic' | 'deepseek' | 'ollama';
  model: string;
  reviewMode: 'quick' | 'standard' | 'thorough';
  maxFiles: number;
  excludePatterns: string[];
  customInstructions: string;
  rules: ReviewRules;
  labels: LabelConfig;
  notifications: NotificationConfig;
}

export interface ReviewRules {
  security: RuleConfig;
  bugs: RuleConfig;
  style: RuleConfig;
  performance: RuleConfig;
  tests: RuleConfig;
}

export interface RuleConfig {
  enabled: boolean;
  severity: 'error' | 'warning' | 'info';
  maxFindings?: number;
}

export interface LabelConfig {
  enabled: boolean;
  prefix: string;
  severityLabels: Record<string, string>;
  categoryLabels: Record<string, string>;
}

export interface NotificationConfig {
  slack?: {
    webhookUrl?: string;
    channel?: string;
    onFailure?: boolean;
    onSuccess?: boolean;
    minScore?: number;
  };
  discord?: {
    webhookUrl?: string;
    onFailure?: boolean;
    onSuccess?: boolean;
    minScore?: number;
  };
}

const DEFAULT_CONFIG: HawkConfig = {
  provider: 'openai',
  model: 'gpt-4o',
  reviewMode: 'standard',
  maxFiles: 50,
  excludePatterns: [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '*.min.js',
    '*.min.css',
    'dist/**',
    'build/**',
    'node_modules/**',
  ],
  customInstructions: '',
  rules: {
    security: { enabled: true, severity: 'error' },
    bugs: { enabled: true, severity: 'error' },
    style: { enabled: true, severity: 'warning' },
    performance: { enabled: true, severity: 'warning' },
    tests: { enabled: true, severity: 'info' },
  },
  labels: {
    enabled: true,
    prefix: 'hawk',
    severityLabels: {
      error: 'hawk:critical',
      warning: 'hawk:warning',
      info: 'hawk:info',
      suggestion: 'hawk:suggestion',
    },
    categoryLabels: {
      security: 'hawk:security',
      bug: 'hawk:bug',
      style: 'hawk:style',
      performance: 'hawk:performance',
      test: 'hawk:test',
    },
  },
  notifications: {},
};

export function loadHawkConfig(repoRoot: string): HawkConfig {
  const configPaths = [
    path.join(repoRoot, '.hawk.yml'),
    path.join(repoRoot, '.hawk.yaml'),
    path.join(repoRoot, '.hawk/config.yml'),
    path.join(repoRoot, '.hawk/config.yaml'),
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      const parsed = parseYAML(content);
      return mergeConfig(DEFAULT_CONFIG, parsed);
    }
  }

  return DEFAULT_CONFIG;
}

function mergeConfig(defaults: HawkConfig, overrides: Partial<HawkConfig>): HawkConfig {
  return {
    ...defaults,
    ...overrides,
    rules: {
      security: { ...defaults.rules.security, ...overrides.rules?.security },
      bugs: { ...defaults.rules.bugs, ...overrides.rules?.bugs },
      style: { ...defaults.rules.style, ...overrides.rules?.style },
      performance: { ...defaults.rules.performance, ...overrides.rules?.performance },
      tests: { ...defaults.rules.tests, ...overrides.rules?.tests },
    },
    labels: { ...defaults.labels, ...overrides.labels, severityLabels: { ...defaults.labels.severityLabels, ...overrides.labels?.severityLabels }, categoryLabels: { ...defaults.labels.categoryLabels, ...overrides.labels?.categoryLabels } },
    notifications: {
      slack: { ...defaults.notifications.slack, ...overrides.notifications?.slack },
      discord: { ...defaults.notifications.discord, ...overrides.notifications?.discord },
    },
    excludePatterns: overrides.excludePatterns || defaults.excludePatterns,
  };
}

export function buildCustomInstructions(config: HawkConfig): string {
  const parts: string[] = [];

  if (!config.rules.security.enabled) parts.push('Skip security analysis.');
  if (!config.rules.bugs.enabled) parts.push('Skip bug detection.');
  if (!config.rules.style.enabled) parts.push('Skip style analysis.');
  if (!config.rules.performance.enabled) parts.push('Skip performance analysis.');
  if (!config.rules.tests.enabled) parts.push('Skip test coverage analysis.');

  if (config.rules.security.maxFindings) parts.push(`Maximum ${config.rules.security.maxFindings} security findings.`);
  if (config.rules.bugs.maxFindings) parts.push(`Maximum ${config.rules.bugs.maxFindings} bug findings.`);

  if (config.customInstructions) {
    parts.push(config.customInstructions);
  }

  return parts.join(' ');
}
