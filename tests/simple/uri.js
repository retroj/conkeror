
require('walnut.js');

walnut_run({
    test_make_uri_1: function () {
        assert(make_uri("chrome://conkeror/content/conkeror.js"));
    },
    test_make_uri_2: function () {
        assert(make_uri("http://www.example.com/"));
    },
    test_make_uri_3: function () {
        assert_error(function () { make_uri("chrome://conkeror"); });
    },
    test_make_uri_4: function () {
        assert(make_uri("http://example.com/") instanceof Ci.nsIURI);
    },
    test_make_uri_5: function () {
        assert(make_uri(make_file("/a/b/c")) instanceof Ci.nsIURI);
    },
    test_make_uri_6: function () {
        assert_equals(make_uri(make_file("/a/b/c")).spec.substr(0,5), "file:");
    }
});

walnut_run({
    test_compute_up_url_1: function () {
        assert_equals(compute_up_url(make_uri("http://example.com/")),
                      "http://example.com/");
    },
    test_compute_up_url_2: function () {
        assert_equals(compute_up_url(make_uri("http://example.com/foo")),
                      "http://example.com/");
    },
    test_compute_up_url_3: function () {
        assert_equals(compute_up_url(make_uri("about:config")),
                      "about:config");
    },
    test_compute_up_url_4: function () {
        assert_equals(compute_up_url(make_uri("http://example.com/foo#bar")),
                      "http://example.com/foo");
    },
    test_compute_up_url_5: function () {
        assert_equals(compute_up_url(make_uri("http://example.com/foo?baz=quux#bar")),
                      "http://example.com/foo?baz=quux");
    },
    test_compute_up_url_6: function () {
        assert_equals(compute_up_url(make_uri("http://example.com/foo?baz=quux")),
                      "http://example.com/foo");
    }
});
