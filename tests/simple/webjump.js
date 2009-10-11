
require('walnut.js');

{ let suite1 = {
      suite_setup: function () {
          this.real_webjumps = webjumps;
          conkeror.webjumps = {};
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
      }
  };
  let suite2 = {
      suite_setup: function () {
          this.real_webjumps = webjumps;
          conkeror.webjumps = {};
          define_webjump("test1", "http://www.example.com/search?term=%s");
      },
      suite_teardown: function () {
          conkeror.webjumps = this.real_webjumps;
      },
      test_alternative_was_set: function () {
          assert_equals(webjumps["test1"].alternative,
                        "http://www.example.com/");
      },
      test_string_webjump_optional_arg_1: function () {
          assert_equals(webjumps["test1"].handler("foo"),
                        "http://www.example.com/search?term=foo");
      },
      test_string_webjump_optional_arg_2: function () {
          assert_equals(get_url_or_webjump("test1"),
                        "http://www.example.com/");
      },
      test_string_webjump_optional_arg_3: function () {
          assert_equals(webjumps["test1"].argument, "optional");
      }
  };
  walnut_run(suite1);
  walnut_run(suite2);
}

/*
require('wikipedia-webjumps.js');

{ let suite = {
      suite_setup: function () {
          this.real_webjumps = webjumps;
          this.real_format = wikipedia_webjumps_format;
          wikipedia_webjumps_format = "wkp-%s";
      },
      suite_teardown: function () {
          webjumps = this.real_webjumps;
          wikipedia_webjumps_format = this.real_format;
      },
      setup: function () {
          webjumps = {};
      },
      test_wikipedia_webjumps_1: function () {
          define_wikipedia_webjumps('de');
          assert(webjumps['wkp-de']);
      },
      test_wikipedia_all_webjumps_count: function () {
          var j = [i for (i in wikipedia_webjumps)].length;
          define_wikipedia_webjumps();
          var k = [i for (i in conkeror.webjumps)].length;
          assert_equals(k, j);
      }
  };
  walnut_run(suite);
}
*/
