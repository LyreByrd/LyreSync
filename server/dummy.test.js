import dummy from './dummy.js';

test('dummy test exists', () => {
  //console.log(dummy);
  expect(typeof dummy()).toBe('string');
});