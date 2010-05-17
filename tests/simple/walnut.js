
require('walnut.js');

// sanity checks
{ let failed = false;
  try { assert_equals(1,0); } catch (e) { failed = true; }
  assert_equals(failed, true);

  failed = false;
  try { assert_equals(1,1); } catch (e) { failed = true; }
  assert_equals(failed, false);

  assert(true, "assert: sanity check 1");
  failed = false;
  try { assert(false); } catch (e) { failed = true; }
  assert(failed);

  assert(assert_error(function () { throw new Error("an error"); }));

  failed = false;
  try { assert_error(function () {}); } catch (e) { failed = true; }
  assert(failed);

  assert_null(null);
  assert_error(function () { assert_null(false); });
}

{ let suite = {
      did_setup: 0,
      did_teardown: 0,
      setup: function () {
          this.did_setup++;
      },
      teardown: function () {
          this.did_teardown++;
      },
      test_was_run: function () {
          this.was_run = true;
      }
  };
  let results = walnut_run(suite);
  assert(suite.was_run);
  assert_equals(suite.did_setup, results.run);
  assert_equals(suite.did_teardown, results.run);
}

walnut_run({
    test_assert_objects_equal_1: function () {
        assert_error(function () { assert_objects_equal([1], []); });
    },
    test_assert_objects_equal_2: function () {
        assert_error(function () { assert_objects_equal([1], {0: 1}); });
    },
    test_assert_objects_equal_3: function () {
        assert_error(function () { assert_objects_equal([1], [2]); });
    },
    test_assert_objects_equal_4: function () {
        assert_objects_equal([null], [null]);
    },
    test_assert_objects_equal_5: function () {
        assert_objects_equal(1, 1);
    },
    test_assert_objects_equal_6: function () {
        assert_error(function () { assert_objects_equal(1, 2); });
    },
    test_assert_objects_equal_7: function () {
        assert_objects_equal([[1]],[[1]]);
    }
});
