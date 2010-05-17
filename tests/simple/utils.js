
require('walnut.js');

walnut_run({
    test_remove_duplicates_filter_1: function () {
        var ar = [1, 2, 3, 3];
        assert_objects_equal(ar.filter(remove_duplicates_filter()), [1, 2, 3]);
    },
    test_get_home_directory_1: function () {
        assert(get_home_directory() instanceof Ci.nsIFile);
    },
    test_make_uri_1: function () {
        assert(make_uri("http://example.com/") instanceof Ci.nsIURI);
    },
    test_make_uri_2: function () {
        assert(make_uri(make_file("/a/b/c")) instanceof Ci.nsIURI);
    },
    test_make_uri_3: function () {
        assert_equals(make_uri(make_file("/a/b/c")).spec.substr(0,5), "file:");
    },
    test_splice_range_1: function () {
        assert_objects_equal(splice_range([[1,3],[4,6],[7,10]], 2, 8),
                             [[1,10]]);
    }
});

walnut_run({
    test_string_format_1: function () {
        assert_equals(string_format("", {}),
                      "");
    },
    test_string_format_2: function () {
        assert_equals(string_format("%a", {a: 'hello'}),
                      "hello");
    },
    test_string_format_3: function () {
        assert_equals(string_format("%a%a", {a: 'hello'}),
                      "hellohello");
    }
});


walnut_run({
    test_array_p_1: function () {
        assert(array_p([]));
    },
    test_array_p_2: function () {
        assert(array_p(Array()));
    },
    test_make_array_1: function () {
        assert_objects_equal(make_array(undefined), []);
    },
    test_make_array_2: function () {
        assert_objects_equal(make_array(null), [null]);
    }
});
