import type { ComponentType } from 'react';
import type { z } from 'zod';
import type { Step } from './schema';

export type CustomStep = Extract<Step, { kind: 'custom' }>;
export interface Extension {
  version: number;
  configSchema: z.ZodType;
  // Must be strict: reject missing AND unrecognised copy keys.
  copySchema: z.ZodType;
  Component: ComponentType<{ step: CustomStep; navigate: (target: string) => void }>;
}

// Add only reviewed implementations with strict contracts and fidelity tests.
// The initial architecture intentionally ships no universal plugin engine.
export const extensions: Readonly<Record<string, Extension>> = Object.freeze({});
