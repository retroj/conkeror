
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
          assert_equals(webjumps["test1"].handler(), "http://www.example.com/");
      },
      test_webjump_2: function () {
          define_webjump("test2", "http://www.example.com/with/a/path");
          assert_equals(webjumps["test2"].handler(), "http://www.example.com/with/a/path");
      },
      test_string_webjump_optional_arg_3: function () {
          define_webjump("test1", "http://www.example.com/search?term=%s");
          assert_equals(webjumps["test1"].handler("foo"),
                        "http://www.example.com/search?term=foo");
          assert_equals(webjumps["test1"].handler(),
                        "http://www.example.com/");
          assert_equals(webjumps["test1"].no_argument, "maybe");
      }
  };
  walnut_run(suite);
}
