
require("walnut.js");
require("casual-spelling.js");

walnut_run({
    test_translate_1: function () {
        assert_equals(casual_spelling.translate("\u00e1"), "a");
    },
    test_text_match_1: function () {
        assert_objects_equal(casual_spelling.hints_text_match("", ""),
                             [0,0]);
    },
    test_text_match_2: function () {
        assert_objects_equal(casual_spelling.hints_text_match("a", "a"),
                             [0,1]);
    },
    test_text_match_3: function () {
        assert_objects_equal(casual_spelling.hints_text_match("a", "b"),
                             false);
    },
    test_text_match_4: function () {
        assert_objects_equal(casual_spelling.hints_text_match("\u00e1", "a"),
                             [0,1]);
    },
    test_text_match_5: function () {
        assert_objects_equal(casual_spelling.hints_text_match("aa", "aa"),
                             [0,2]);
    }
});
