
require('walnut.js');

walnut_run({
    test_normalize_key_combo_1: function () {
        assert_equals(format_key_combo(unformat_key_combo("a")), "a");
    },
    test_normalize_key_combo_2: function () {
        assert_equals(format_key_combo(unformat_key_combo("C-a")), "C-a");
    },
    test_normalize_key_combo_3: function () {
        assert_equals(format_key_combo(unformat_key_combo("C-M-b")), "C-M-b");
    },
    test_normalize_key_combo_4: function () {
        assert_equals(format_key_combo(unformat_key_combo("M-C-c")), "C-M-c");
    },
    test_charcode32_is_space: function () {
        assert_equals(format_key_combo({ charCode: 32 }), "space");
    }
});

walnut_run({
    suite_setup: function () {
        define_keymap("test_keymap");
    },
    suite_teardown: function () {
        delete conkeror.test_keymap;
    },
    test_define_key_1: function () {
        define_key(test_keymap, "C-a", "foo");
        assert(test_keymap.bindings["C-a"]);
    },
    test_define_key_2: function () {
        define_key(test_keymap, "C-M-b", "foo");
        assert(test_keymap.bindings["C-M-b"]);
    },
    test_define_key_3: function () {
        define_key(test_keymap, "M-C-c", "foo");
        assert(test_keymap.bindings["C-M-c"]);
    },
    test_define_key_4: function () {
        define_key(test_keymap, "C-a", "foo");
        assert_equals(test_keymap.bindings["C-a"].command, "foo");
    }
});

walnut_run({
    setup: function () {
        define_keymap("test_keymap");
        define_key(test_keymap, "C-a", "foo");
    },
    teardown: function () {
        delete conkeror.test_keymap;
    },
    test_undefine_key_1: function () {
        undefine_key(test_keymap, "C-a");
        assert_not(test_keymap.bindings["C-a"]);
    },
    test_undefine_key_2: function () {
        define_key(test_keymap, "C-a");
        assert_not(test_keymap.bindings["C-a"]);
    }
});

walnut_run({
    setup: function () {
        define_keymap("test_keymap");
        define_key(test_keymap, "C-a", "foo");
    },
    teardown: function () {
        delete conkeror.test_keymap;
    },
    test_keymap_lookup_1: function () {
        assert(keymap_lookup([test_keymap], "C-a"));
    }
});
