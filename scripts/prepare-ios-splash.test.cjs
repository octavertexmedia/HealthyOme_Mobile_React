const test = require('node:test');
const assert = require('node:assert/strict');
const { boundSplashStoryboard } = require('./prepare-ios-splash.cjs');
const template = '<imageView id="EXPO-SplashScreen" image="SplashScreenLogo" contentMode="scaleAspectFit"><rect key="frame" width="200" height="200"/></imageView>';
test('bounds the original PNG through layout without changing aspect mode', () => {
  const result = boundSplashStoryboard(template);
  assert.match(result, /firstAttribute="width" constant="200"/);
  assert.match(result, /firstAttribute="height" constant="200"/);
  assert.match(result, /contentMode="scaleAspectFit"/);
  assert.equal(boundSplashStoryboard(result), result);
});
test('refuses an unknown native splash layout', () => {
  assert.throws(() => boundSplashStoryboard('<imageView id="CustomImage"/>'), /Unknown storyboard/);
});
