
require('walnut.js');

{ let suite = {
      test_remove_duplicates_filter_1: function () {
          var ar = [1, 2, 3, 3];
          assert_objects_equal(ar.filter(remove_duplicates_filter()), [1, 2, 3]);
      }
  };
  walnut_run(suite);
}
