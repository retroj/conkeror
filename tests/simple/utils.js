
require('walnut.js');

walnut_run({
    test_remove_duplicates_filter_1: function () {
        var ar = [1, 2, 3, 3];
        assert_objects_equal(ar.filter(remove_duplicates_filter()), [1, 2, 3]);
    },
    test_get_home_directory_1: function () {
        assert(get_home_directory() instanceof Ci.nsIFile);
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


walnut_run({
    test_possibly_valid_url_1: function () {
        assert_not(possibly_valid_url(""));
    },
    test_possibly_valid_url_2: function () {
        assert_not(possibly_valid_url("         "));
    },
    test_possibly_valid_url_3: function () {
        assert(possibly_valid_url("example"));
    },
    test_possibly_valid_url_4: function () {
        assert(possibly_valid_url("  example  "));
    },
    test_possibly_valid_url_5: function () {
        assert_not(possibly_valid_url("example foo"));
    },
    test_possibly_valid_url_6: function () {
        assert(possibly_valid_url("example/ foo"));
    },
    test_possibly_valid_url_7: function () {
        assert_not(possibly_valid_url("example /foo"));
    },
    test_possibly_valid_url_8: function () {
        assert(possibly_valid_url("/example foo"));
    },
    test_possibly_valid_url_9: function () {
        assert(possibly_valid_url(" /example foo"));
    },
    test_possibly_valid_url_10: function () {
        assert(possibly_valid_url(" ex/ample foo"));
    },
    test_possibly_valid_url_11: function () {
        assert(possibly_valid_url("/"));
    }
});


walnut_run({
    test_position_in_strings_1: function () {
        assert_equals(position_in_strings([null], 0), -1);
    },
    test_position_in_strings_2: function () {
        assert_equals(position_in_strings([], 0), -1);
    },
    test_position_in_strings_3: function () {
        assert_equals(position_in_strings(["a"], 0), -1);
    },
    test_position_in_strings_4: function () {
        assert_equals(position_in_strings(["a"], 1), 0);
    },
    test_position_in_strings_5: function () {
        assert_equals(position_in_strings(["a"], 2), 0);
    },
    test_position_in_strings_6: function () {
        assert_equals(position_in_strings(["a", "b"], 1), 0);
    },
    test_position_in_strings_7: function () {
        assert_equals(position_in_strings(["a", "b"], 2), 1);
    },
    test_position_in_strings_8: function () {
        assert_equals(position_in_strings(["a", "b"], 3), 1);
    },
    test_position_in_strings_9: function () {
        assert_equals(position_in_strings(["a", "b", "c"], 3), 2);
    },
    test_position_in_strings_10: function () {
        assert_equals(position_in_strings([""], 1), 0);
    },
    test_position_in_strings_11: function () {
        assert_equals(position_in_strings(["foo", " ", "bar"], 0), -1);
    },
    test_position_in_strings_12: function () {
        assert_equals(position_in_strings(["foo", " ", "bar"], 1), 0);
    },
    test_position_in_strings_13: function () {
        assert_equals(position_in_strings(["foo", " ", "bar"], 2), 0);
    },
    test_position_in_strings_14: function () {
        assert_equals(position_in_strings(["foo", " ", "bar"], 3), 0);
    },
    test_position_in_strings_15: function () {
        assert_equals(position_in_strings(["foo", " ", "bar"], 4), 1);
    },
    test_position_in_strings_16: function () {
        assert_equals(position_in_strings(["foo", " ", "bar"], 5), 2);
    },
    test_position_in_strings_17: function () {
        assert_equals(position_in_strings(["foo", " ", "bar"], 6), 2);
    },
    test_position_in_strings_18: function () {
        assert_equals(position_in_strings(["foo", " ", "bar"], 7), 2);
    },
    test_position_in_strings_19: function () {
        assert_equals(position_in_strings(["foo", " ", "bar"], 8), 2);
    }
});
