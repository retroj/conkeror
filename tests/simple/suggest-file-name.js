
require("walnut.js");

/*
 * Tests for string urls
 */
walnut_run({
    test_suggest_filename_str_1: function () {
        assert_equals(suggest_file_name("http://example.com/"),
                      "example.com.html");
    },
    test_suggest_filename_str_2: function () {
        assert_equals(suggest_file_name("http://www.example.com/"),
                      "www.example.com.html");
    },
    test_suggest_filename_str_3: function () {
        assert_equals(suggest_file_name("http://example.com/foo.html"),
                      "foo.html");
    },
    test_suggest_filename_str_4: function () {
        assert_equals(suggest_file_name("http://example.com/a/b/c/foo.html"),
                      "foo.html");
    },
    test_suggest_filename_str_5: function () {
        assert_equals(suggest_file_name("http://example.com/a/b/c/"),
                      "c.html");
    },
    test_suggest_filename_str_6: function () {
        assert_equals(suggest_file_name("http://example.com/foo.bar/"),
                      "foo.bar.html");
    },
    test_suggest_filename_str_7: function () {
        assert_equals(suggest_file_name("http://example.com/foo.bar.baz"),
                      "foo.bar.html");
    }
});

/*
 * Tests for load_specs
 */
walnut_run({
    test_suggest_filename_ls_1: function () {
        var spec = { uri: "http://example.com/", title: "foo" };
        assert_equals(suggest_file_name(load_spec(spec)), "foo.html");
    },
    test_suggest_filename_ls_2: function () {
        var spec = { uri: "http://example.com/", title: "foo.bar" };
        assert_equals(suggest_file_name(load_spec(spec)), "foo.bar.html");
    }
});
