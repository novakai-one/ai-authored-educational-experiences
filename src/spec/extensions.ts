import type { ComponentType } from 'react';
import type { z } from 'zod';
import type { Step } from './schema';
import { EigenMission } from '../components/EigenMission';
import { missionConfigSchema, missionCopySchema, validateMissionStep } from './eigenMission';
import type { MissionAssessment } from '../engine/eigen';

export type CustomStep = Extract<Step, { kind: 'custom' }>;
export interface Extension {
  version: number;
  configSchema: z.ZodType;
  // Must be strict: reject missing AND unrecognised copy keys.
  copySchema: z.ZodType;
  validateStep?: (step: CustomStep) => void;
  Component: ComponentType<{ step: CustomStep; navigate: (target: string) => void; recordAssessment?: (assessment: MissionAssessment) => void }>;
}

// Add only reviewed implementations with strict contracts and fidelity tests.
// The initial architecture intentionally ships no universal plugin engine.
export const extensions: Readonly<Record<string, Extension>> = Object.freeze({
  'eigen-mission': { version: 1, configSchema: missionConfigSchema, copySchema: missionCopySchema, validateStep: validateMissionStep, Component: EigenMission },
});
