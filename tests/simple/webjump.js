
require('walnut.js');

// webjump tests
{ let suite = {
      suite_setup: function () {
          this.real_webjumps = webjumps;
          conkeror.webjumps = new string_hashmap();
      },
      suite_teardown: function () {
          conkeror.webjumps = this.real_webjumps;
      },
      test_webjump_1: function () {
          define_webjump("test1", "http://www.example.com/");
          assert_equals(webjumps.get("test1").handler(), "http://www.example.com/");
      },
      test_webjump_2: function () {
          define_webjump("test2", "http://www.example.com/with/a/path");
          assert_equals(webjumps.get("test2").handler(), "http://www.example.com/with/a/path");
      }
  };
  walnut_run(suite);
}
