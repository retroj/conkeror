
require('walnut.js');

{ let suite = {
      test_remove_duplicates_filter_1: function () {
          var ar = [1, 2, 3, 3];
          assert_objects_equal(ar.filter(remove_duplicates_filter()), [1, 2, 3]);
      },
      test_get_home_directory_1: function () {
          assert(get_home_directory() instanceof Ci.nsIFile);
      }
  };
  walnut_run(suite);
}
