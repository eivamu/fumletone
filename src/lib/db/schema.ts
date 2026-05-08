export type Language = 'nb' | 'en';
export type Instrument = 'violin' | 'cello';
export type FumlingColor = 'sage' | 'rose' | 'sand' | 'sky';
export type FumlingFeature = 'hat' | 'stripedSock' | 'roundEyes' | 'longEars';

export interface KidProfile {
  id: 1;
  kidName: string;
  language: Language;
  fumlingName: string;
  fumlingColor: FumlingColor;
  fumlingFeatures: FumlingFeature[];
  instrument: Instrument;
  onboardingCompletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_PROFILE: KidProfile = {
  id: 1,
  kidName: '',
  language: 'nb',
  fumlingName: 'Fumly',
  fumlingColor: 'sage',
  fumlingFeatures: [],
  instrument: 'violin',
  onboardingCompletedAt: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};
