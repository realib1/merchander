export const SOCIAL_INTELLIGENCE_STATUS = 'beta' as const;
export const SOCIAL_INTELLIGENCE_LABEL = 'Beta testing' as const;

export function isSocialIntelligenceAllowed(): boolean {
  return true;
}

export function getSocialIntelligenceStatusLabel(): string {
  return SOCIAL_INTELLIGENCE_LABEL;
}
