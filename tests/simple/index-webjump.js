require('walnut.js');
require('index-webjump.js');

{ let suite = {
      suite_setup: function () {
          this.real_webjumps = webjumps;
          conkeror.webjumps = {};
      },
      suite_teardown: function () {
          conkeror.webjumps = this.real_webjumps;
      },
      path: make_file_from_chrome("chrome://conkeror-test/content/simple").path,
      test_xpath_webjump: function () {
          define_xpath_webjump(
              "xpath", "http://dummy/xpath", '//xhtml:a[@class="index"]',
              $index_file = this.path + '/xpath-webjump-test.xhtml');
          var w = webjumps.xpath;
          w.extract_completions();
          assert_equals(get_webjump("xpath foo"), "foo");
          assert_equals(w.completions.length, 2);
          assert_equals(w.completions[0][1], "The bar");
          assert_equals(w.completions[0][0], "http://dummy/xpath/bar");
          assert_equals(w.completions[1][1], "The foo");
          assert_equals(w.completions[1][0], "http://dummy/foo");
      },
      test_gitweb_webjump: function() {
          define_gitweb_summary_webjump(
              "gitweb", "http://dummy/gitweb", $default = "bar",
              $opml_file = this.path + '/gitweb-webjump-test.opml');
          assert_equals(get_webjump("gitweb"),
                        "http://dummy/gitweb/gitweb.cgi?p=bar.git;a=summary");
          assert_equals(get_webjump("gitweb foo"),
                        "http://dummy/gitweb/gitweb.cgi?p=foo.git;a=summary");
          var w = webjumps.gitweb;
          w.extract_completions();
          assert_equals(w.completions.length, 2);
          assert_equals(w.completions[0][0], "bar");
          assert_equals(w.completions[1][0], "foo");
      },
  };
  walnut_run(suite);
}
