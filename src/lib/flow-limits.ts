// Shared by the Create Flow form (client-side hints) and the flow routes (enforcement).
export const FLOW_LIMITS = {
  minStack: 2,
  maxStack: 12,
  minSteps: 2,
  maxSteps: 20,
  title: [3, 80],
  summary: [20, 200],
  stepTitle: [3, 80],
  stepDescription: [10, 600],
} as const;

export type FlowStepInput = { toolId: string; title: string; description: string };
