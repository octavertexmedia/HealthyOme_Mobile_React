import React from 'react';
import { Image } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { BrandLockup } from './BrandLockup';

it('uses both original local assets with contain, reference boxes and no tint', () => {
  render(<BrandLockup />);
  expect(screen.getByLabelText('HealthyOme')).toBeTruthy();
  const images = screen.UNSAFE_getAllByType(Image);
  expect(images).toHaveLength(2);
  expect(images[0].props.style).toEqual({ width: 50, height: 50 });
  expect(images[1].props.style).toEqual({ width: 130, height: 30 });
  for (const image of images) {
    expect(image.props.resizeMode).toBe('contain');
    expect(image.props.style.tintColor).toBeUndefined();
  }
});
