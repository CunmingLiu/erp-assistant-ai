import type { SseEvent } from '@erp-assistant/contracts';

export function encodeSse(event: SseEvent): string {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
}
