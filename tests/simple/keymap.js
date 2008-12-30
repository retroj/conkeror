
require('walnut.js');

// key combo formatting tests
assert_equals(format_key_combo(unformat_key_combo("a")), "a", "normalize key combo 1");
assert_equals(format_key_combo(unformat_key_combo("C-a")), "C-a", "normalize key combo 2");
assert_equals(format_key_combo(unformat_key_combo("C-M-b")), "C-M-b", "normalize key combo 3");
assert_equals(format_key_combo(unformat_key_combo("M-C-c")), "C-M-c", "normalize key combo 4");
assert_equals(format_key_combo({charCode: 32}), "space", "charCode 32 is space");

// keymap tests
define_keymap("test_keymap");
define_key(test_keymap, "C-a", null);
assert(test_keymap.bindings["C-a"], "define key 1");
define_key(test_keymap, "C-M-b", null);
assert(test_keymap.bindings["C-M-b"], "define key 2");
define_key(test_keymap, "M-C-c", null);
assert(test_keymap.bindings["C-M-c"], "define key 3");
