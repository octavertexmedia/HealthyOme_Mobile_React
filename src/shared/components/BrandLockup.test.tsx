import React from 'react';
import { Image } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { BrandLockup, brandLayout } from './BrandLockup';

it('uses the exact supplied composite once on auth, without cropping, tint or a white container', () => {
  render(<BrandLockup />);
  expect(screen.getByLabelText('HealthyOme')).toBeTruthy();
  const images = screen.UNSAFE_getAllByType(Image);
  expect(images).toHaveLength(1);
  expect(images[0].props.source).toEqual(require('../../../assets/images/branding/healthyome-login.png'));
  expect(images[0].props.resizeMode).toBe('contain');
  expect(images[0].props.style.width).toBe(images[0].props.style.height);
  expect(images[0].props.style.width).toBeLessThanOrEqual(300);
  expect(images[0].props.style.backgroundColor).toBe('transparent');
  expect(images[0].props.style.tintColor).toBeUndefined();
});
it('preserves both original assets unchanged on compact browsing headers', () => {
  render(<BrandLockup compact />);
  const images = screen.UNSAFE_getAllByType(Image);
  expect(images).toHaveLength(2);
  expect(images[0].props.style).toEqual({ width: 51, height: 51, backgroundColor: 'transparent' });
  expect(images[1].props.style).toEqual({ width: 168, height: 42, backgroundColor: 'transparent' });
  for (const image of images) {
    expect(image.props.resizeMode).toBe('contain');
    expect(image.props.style.tintColor).toBeUndefined();
  }
});

it('targets 1.5× and clamps narrow top bars without changing aspect ratios', () => {
  expect(brandLayout(true).icon).toBe(51);
  expect(brandLayout(true).word).toBe(168);
  for (const width of [320, 375, 393, 411, 430]) {
    const box = brandLayout(true, width - 192);
    expect(box.icon + box.word + box.gap).toBeLessThanOrEqual(width - 192 + 0.001);
    expect(box.icon / box.word).toBeCloseTo(34 / 112);
  }
});
