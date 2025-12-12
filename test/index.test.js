const config = require('config');

describe('index / spawn', () => {
  let rootDbg, hookStderr;

  describe('namespacing', () => {
    beforeEach(async () => {
      const origDebug = require('../lib')();
      const hooklib = await import('hook-std');
      hookStderr = hooklib.hookStderr;
      
      origDebug.save('root*');
      origDebug.enable(origDebug.load());

      rootDbg = require('../lib').spawnable('root', origDebug);
      // console.log(rootDbg);
    });

    it('handles functions', () => {
      const promise = hookStderr((str, unhook) => {
        expect(str).toBeDefined();
        expect(str.match(/crap/)).toBeTruthy();
        expect(str.match(/root/)).toBeTruthy();
        unhook();
      });
      rootDbg(() => {
        return 'crap';
      });
      return promise;
    });

    it('normal', () => {
      const promise = hookStderr((str, unhook) => {
        expect(str).toBeTruthy();
        expect(str.match(/crap/)).toBeTruthy();
        expect(str.match(/root/)).toBeTruthy();
        unhook();
      });
      rootDbg('crap');
      return promise;
    });

    describe('child1', () => {
      let child1Dbg;

      beforeEach(() => {
        child1Dbg = rootDbg.spawn('child1');
      });

      it('handles functions', () => {
        const promise = hookStderr((str, unhook) => {
          expect(str).toBeTruthy();
          expect(str.match(/crap/)).toBeTruthy();
          expect(str.match(/root:child1/)).toBeTruthy();
          unhook();
        });
        child1Dbg(() => {
          return 'crap';
        });
        return promise;
      });

      it('normal', () => {
        const promise = hookStderr((str, unhook) => {
          expect(str).toBeTruthy();
          expect(str.match(/crap/)).toBeTruthy();
          expect(str.match(/root:child1/)).toBeTruthy();
          unhook();
        });
        child1Dbg('crap');
        return promise;
      });

      it('leak', () => {
        // memory leak attempt
        for (let i = 0; i < config.get('tests.leak.iterations'); i++) {
          child1Dbg = rootDbg.spawn('child1');
          leakTest(`leakTest${i}`);
        }
      });

      function leakTest(testName) {
        child1Dbg(() => {
          return testName;
        });
      }

      describe('grandChild1', () => {
        let grandChild1;

        beforeEach(() => {
          grandChild1 = child1Dbg.spawn('grandChild1');
        });

        it('handles functions', () => {
          const promise = hookStderr((str, unhook) => {
            expect(str).toBeTruthy();
            expect(str.match(/crap/)).toBeTruthy();
            expect(str.match(/root:child1:grandChild1/)).toBeTruthy();
            unhook();
          });
          grandChild1(() => {
            return 'crap';
          });
          return promise;
        });

        it('normal', () => {
          const promise = hookStderr((str, unhook) => {
            expect(str).toBeTruthy();
            expect(str.match(/crap/)).toBeTruthy();
            expect(str.match(/root:child1:grandChild1/)).toBeTruthy();
            unhook();
          });
          grandChild1('crap');
          return promise;
        });

        describe('greatGrandChild1', () => {
          let greatGrandChild1;

          beforeEach(() => {
            greatGrandChild1 = grandChild1.spawn('greatGrandChild1');
            // console.log(greatGrandChild1)
          });

          it('handles functions', () => {
            const promise = hookStderr((str, unhook) => {
              expect(str).toBeTruthy();
              expect(str.match(/crap/)).toBeTruthy();
              expect(str.match(/root:child1:grandChild1:greatGrandChild1/)).toBeTruthy();
              unhook();
            });
            greatGrandChild1(() => {
              return 'crap';
            });
            return promise;
          });

          it('normal', () => {
            const promise = hookStderr((str, unhook) => {
              expect(str).toBeTruthy();
              expect(str.match(/crap/)).toBeTruthy();
              expect(str.match(/root:child1:grandChild1:greatGrandChild1/)).toBeTruthy();
              unhook();
            });
            greatGrandChild1('crap');
            return promise;
          });
        });
      });
    });
  });
});
