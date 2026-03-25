import { useState, useCallback } from 'react';

/**
 * Mock hook — Autopilot will be implemented in a future phase.
 */
export function useAutopilot() {
  const [activeAutopilots] = useState<string[]>([]);
  const [isProcessing] = useState<Record<string, boolean>>({});

  const enableAutopilot = useCallback((_conversationId: string) => {
    console.warn('[MOCK] enableAutopilot — not yet integrated');
  }, []);

  const disableAutopilot = useCallback((_conversationId: string) => {
    console.warn('[MOCK] disableAutopilot — not yet integrated');
  }, []);

  const isAutopilotActive = useCallback((_conversationId: string) => {
    return false;
  }, []);

  return {
    enableAutopilot,
    disableAutopilot,
    isAutopilotActive,
    isProcessing,
    activeAutopilots,
  };
}
