
require("walnut");

walnut_run({
    suite_setup: function () {
        this.completer = new all_word_completer(
            $completions = ["the quick brown fox",
                            "jumped over",
                            "the lazy dog's tail"]);
    },
    test_all_word_completer_1: function () {
        var completions = this.completer.complete("he", 2, false);
        assert_equals(completions.count, 2);
        assert_equals(completions.get_value(0), "the quick brown fox");
        assert_equals(completions.get_value(1), "the lazy dog's tail");
    },
    test_all_word_completer_2: function () {
        var completions = this.completer.complete("ic he", 2, false);
        assert_equals(completions.count, 1);
        assert_equals(completions.get_value(0), "the quick brown fox");
    }
});

walnut_run({
    suite_setup: function () {
        this.completer = new prefix_completer(
            $completions = ["the quick brown fox",
                            "jumped over",
                            "the lazy dog's tail"]);
    },
    test_prefix_completer_1: function () {
        var completions = this.completer.complete("the", 2, false);
        assert_equals(completions.count, 2);
        assert_equals(completions.get_value(0), "the lazy dog's tail");
        assert_equals(completions.get_value(1), "the quick brown fox");
    }
});

walnut_run({
    suite_setup: function () {
        var scope = { a: 1,
                      b: 2,
                      c: 3,
                      foo: 4,
                      bar: 5,
                      baz: 6,
                      quux: 7 };
        this.completer = new javascript_completer(scope);
    },
    test_javascript_completer_1: function () {
        var completions = this.completer.complete("a", 1, false);
        assert_equals(completions.count, 1);
    },
    test_javascript_completer_2: function () {
        var completions = this.completer.complete("b", 1, false);
        assert_equals(completions.count, 3);
    },
    test_javascript_completer_3: function () {
        var completions = this.completer.complete("ba", 2, false);
        assert_equals(completions.count, 2);
    }
});
