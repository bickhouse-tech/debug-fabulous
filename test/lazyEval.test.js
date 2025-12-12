const config = require('config');
const debugFact = require('../lib')();
const { setTimeout } = require('node:timers/promises');

describe('lazyEval', () => {
  let debug, hookStderr;
  beforeEach(async () => {
      const hooklib = await import('hook-std');
      hookStderr = hooklib.hookStderr;
  });

  describe('enabled', () => {
    beforeEach(async () => {
      debugFact.save('enabled');
      debugFact.enable(debugFact.load());
      debug = debugFact('enabled');
      // console.log(debug);
    });

    it('handles functions', () => {
      const promise = hookStderr((str, unhook) => {
        expect(str.match(/crap/)).toBeTruthy();
        expect(str.match(/enabled/)).toBeTruthy();
        unhook();
      });
      debug(() => {
        return 'crap';
      });
      return promise;
    });

    it('leak', () => {
      // memory leak attempt
      for (let i = 0; i < config.get('tests.leak.iterations'); i++) {
        debug = debugFact('enabled');
        leakTest(`leak${i}`);
      }

      function leakTest(name) {
        debug(() => {
          return name;
        });
      }
    });

    describe('normal', () => {
      it('basic', () => {
        const promise = hookStderr((str, unhook) => {
          expect(str).toMatch(/crap/);
          expect(str).toMatch(/enabled/);
          unhook();
        });
        debug('crap');
        return promise;
      });

      it('formatter / multi arg', () => {
        const promise = hookStderr((str, unhook) => {
          expect(str).toMatch(/test hi/);
          expect(str).toMatch(/enabled/);
          unhook();
        });
        debug('test %s', 'hi');
        return promise;
      });
    });

    describe('lazy', () => {
      it('basic', () => {
        const promise = hookStderr((str, unhook) => {
          expect(str).toMatch(/crap/);
          expect(str).toMatch(/enabled/);
          unhook();
        });
        debug(() => 'crap');
        return promise;
      });

      it('formatter / multi arg', () => {
        const promise = hookStderr((str, unhook) => {
          expect(str).toMatch(/test hi/);
          expect(str).toMatch(/enabled/);
          unhook();
        });
        debug(() => ['test %s', 'hi']);
        return promise;
      });
    });
  });

  describe('disabled', () => {
    beforeEach(() => {
      debugFact.save(null);
      debugFact.enable(debugFact.load());
      debug = debugFact('disabled');
    });

    it('handles functions', async () => {
      let called = false;

      hookStderr((out, unhook) => {
        if(!out.match(/crap/)) return;
        called = true;
        unhook();
      });

      debug(() => {
        return 'crap';
      });
      await setTimeout(50);
      expect(called).toEqual(false);
    });

    it('normal', async () => {
      let called = false;

      hookStderr((out,unhook) => {
        if(!out.match(/crap/)) return;
        called = true;
        unhook();
      });

      debug('crap');
      await setTimeout(50)
      expect(called).toEqual(false);
    });
  });
});
