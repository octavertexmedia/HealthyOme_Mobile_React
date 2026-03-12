// Design tokens matching the Next.js web app
export const colors = {
  primary: '#2C921D',
  primaryLight: '#E8F5E9',
  primaryDark: '#1B6B12',
  primaryGradientStart: '#F9FEF7',
  primaryGradientEnd: '#CDEFC4',

  background: '#FAFFF8',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  text: {
    primary: '#000000',
    secondary: '#6B7280',
    muted: '#7A7A7A',
    disabled: '#B4B4B4',
    placeholder: '#C5C5C5',
    inverse: '#FFFFFF',
  },

  border: '#E6E6E3',
  borderLight: '#F0F0EE',
  divider: '#F3F4F6',

  accent: {
    yellow: '#FCE17B',
    yellowGradientEnd: '#FCE17B',
    gold: '#FFD700',
    orange: '#F97316',
  },

  status: {
    success: '#2C921D',
    successBg: '#ECFCE5',
    warning: '#F59E0B',
    warningBg: '#FEF3C7',
    error: '#EF4444',
    errorBg: '#FEE2E2',
    info: '#3B82F6',
    infoBg: '#DBEAFE',
  },

  overlay: 'rgba(0,0,0,0.5)',
  shadow: 'rgba(0,0,0,0.08)',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
};
