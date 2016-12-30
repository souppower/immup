import Immup from '../src/immup';
import test from 'ava';

test('merge object without changing the original source', t => {
  let state = { a: 'b', c: { a: 'b' } };
  let result = Immup.merge(state, 'c', { x: 'y' });
  t.deepEqual(result, { a: 'b', c: { a: 'b', x: 'y' } });
  t.not(state, result);
});

test('merge object to the original source', t => {
  let state = { a: 'b' };
  let result = Immup.merge(state, null, { c: 'd' });
  t.deepEqual(result, { a: 'b', c: 'd' });
  t.not(state, result);
});