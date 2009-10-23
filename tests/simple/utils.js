
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
    }
});
