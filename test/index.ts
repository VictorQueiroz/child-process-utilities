import {describe, it,} from 'node:test';
import { spawn } from '..';
import path from 'node:path';

describe('spawn', () => {
  describe('output', () => {
    describe('stdout', () => {
      describe('json', () => {

        it('should decode stream as a JSON object', async (t) => {
          console.log(await spawn.pipe('sh',[path.resolve(__dirname,'stream-json.sh')]).output().stdout().json())
        });
      })
      describe('split', () => {
        it('should split by line', async (t) => {
          const expectedLines = [
            'Loop 1',
            'Loop 2',
            'Loop 3',
            'Loop 4',
            'Loop 5',
          ];
          for await(const line of spawn.pipe('sh',[path.resolve(__dirname,'stream1.sh')]).output().stdout().split('\n')) {
            t.assert.deepEqual(expectedLines.shift(), line);
          }
        });
      });
    });
  });
});