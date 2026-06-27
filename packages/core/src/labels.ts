import { ReviewResult } from './types';
import { LabelConfig } from './config';

export interface Label {
  name: string;
  color: string;
  description: string;
}

const LABEL_COLORS: Record<string, string> = {
  'hawk:critical': 'd73a4a',
  'hawk:warning': 'e99695',
  'hawk:info': '0075ca',
  'hawk:suggestion': 'bfdadc',
  'hawk:security': 'd73a4a',
  'hawk:bug': 'd73a4a',
  'hawk:style': 'bfdadc',
  'hawk:performance': 'f9d0c4',
  'hawk:test': 'bfd4f2',
  'hawk:pass': '0e8a16',
  'hawk:fail': 'd73a4a',
};

export function generateLabels(result: ReviewResult, config: LabelConfig): Label[] {
  if (!config.enabled) return [];

  const labels: Set<string> = new Set();

  if (result.score >= 90) {
    labels.add(`${config.prefix}:pass`);
  } else if (result.score < 70) {
    labels.add(`${config.prefix}:fail`);
  }

  for (const comment of result.comments) {
    const severityLabel = config.severityLabels[comment.severity];
    if (severityLabel) labels.add(severityLabel);

    const categoryLabel = config.categoryLabels[comment.category];
    if (categoryLabel) labels.add(categoryLabel);
  }

  return Array.from(labels).map((name) => ({
    name,
    color: LABEL_COLORS[name] || 'ededed',
    description: `Hawk: ${name.replace(`${config.prefix}:`, '')}`,
  }));
}

export function generateLabelSummary(labels: Label[]): string {
  if (labels.length === 0) return '';
  return labels.map((l) => `\`${l.name}\``).join(' ');
}
