import { TextStyle } from 'react-native';

type FontWeight = TextStyle['fontWeight'];

export const typography = {
  heading: {
    xl: {
      fontSize: 24,
      fontWeight: '700' as FontWeight,
      lineHeight: 32,
      letterSpacing: -0.017,
    },
    lg: {
      fontSize: 20,
      fontWeight: '500' as FontWeight,
      lineHeight: 22,
      letterSpacing: -0.408,
    },
    md: {
      fontSize: 18,
      fontWeight: '600' as FontWeight,
      lineHeight: 28,
      letterSpacing: -0.409,
    },
    sm: {
      fontSize: 16,
      fontWeight: '600' as FontWeight,
      lineHeight: 22,
      letterSpacing: -0.4,
    },
  },
  body: {
    lg: {
      fontSize: 16,
      fontWeight: '500' as FontWeight,
      lineHeight: 22,
      letterSpacing: -0.4,
    },
    md: {
      fontSize: 14,
      fontWeight: '500' as FontWeight,
      lineHeight: 22,
      letterSpacing: -0.406,
    },
    sm: {
      fontSize: 12,
      fontWeight: '500' as FontWeight,
      lineHeight: 16,
    },
    xs: {
      fontSize: 10,
      fontWeight: '500' as FontWeight,
      lineHeight: 14,
      letterSpacing: 1.0,
    },
  },
  button: {
    lg: {
      fontSize: 16,
      fontWeight: '600' as FontWeight,
      lineHeight: 22,
    },
    md: {
      fontSize: 14,
      fontWeight: '600' as FontWeight,
      lineHeight: 20,
    },
    sm: {
      fontSize: 12,
      fontWeight: '600' as FontWeight,
      lineHeight: 16,
    },
  },
};
