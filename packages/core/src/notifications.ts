import { ReviewResult } from './types';
import { NotificationConfig } from './config';

interface NotificationPayload {
  title: string;
  score: number;
  issuesFound: number;
  prUrl: string;
  prTitle: string;
  repo: string;
  summary: string;
}

export async function sendNotifications(
  result: ReviewResult,
  config: NotificationConfig,
  payload: NotificationPayload
): Promise<void> {
  const promises: Promise<void>[] = [];

  if (config.slack?.webhookUrl) {
    const shouldSend =
      (result.issuesFound > 0 && config.slack.onFailure !== false) ||
      (result.issuesFound === 0 && config.slack.onSuccess) ||
      (config.slack.minScore && result.score <= config.slack.minScore);

    if (shouldSend) {
      promises.push(sendSlackNotification(config.slack.webhookUrl, payload, config.slack.channel));
    }
  }

  if (config.discord?.webhookUrl) {
    const shouldSend =
      (result.issuesFound > 0 && config.discord.onFailure !== false) ||
      (result.issuesFound === 0 && config.discord.onSuccess) ||
      (config.discord.minScore && result.score <= config.discord.minScore);

    if (shouldSend) {
      promises.push(sendDiscordNotification(config.discord.webhookUrl, payload));
    }
  }

  await Promise.allSettled(promises);
}

async function sendSlackNotification(
  webhookUrl: string,
  payload: NotificationPayload,
  channel?: string
): Promise<void> {
  const color = payload.score >= 90 ? '#0e8a16' : payload.score >= 70 ? '#f9d0c4' : '#d73a4a';
  const emoji = payload.score >= 90 ? ':white_check_mark:' : payload.score >= 70 ? ':warning:' : ':x:';

  const body: Record<string, unknown> = {
    text: `${emoji} Hawk Review: ${payload.prTitle}`,
    attachments: [
      {
        color,
        fields: [
          { title: 'Repository', value: payload.repo, short: true },
          { title: 'Score', value: `${payload.score}/100`, short: true },
          { title: 'Issues', value: payload.issuesFound.toString(), short: true },
          { title: 'PR', value: `<${payload.prUrl}|${payload.prTitle}>`, short: false },
        ],
        footer: 'Hawk Code Review',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  if (channel) {
    (body as Record<string, unknown>).channel = channel;
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function sendDiscordNotification(
  webhookUrl: string,
  payload: NotificationPayload
): Promise<void> {
  const color = payload.score >= 90 ? 0x0e8a16 : payload.score >= 70 ? 0xf9d0c4 : 0xd73a4a;
  const emoji = payload.score >= 90 ? '✅' : payload.score >= 70 ? '⚠️' : '❌';

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [
        {
          title: `${emoji} Hawk Review: ${payload.prTitle}`,
          url: payload.prUrl,
          color,
          fields: [
            { name: 'Repository', value: payload.repo, inline: true },
            { name: 'Score', value: `${payload.score}/100`, inline: true },
            { name: 'Issues', value: payload.issuesFound.toString(), inline: true },
          ],
          footer: { text: 'Hawk Code Review' },
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });
}
