
require('walnut.js');
require('mime.js');

walnut_run({
    setup: function () {
        define_mime_type_table("test_mime_table",
                               {},
                               "blah blah blah");
    },
    teardown: function () {
        delete conkeror.test_mime_table;
    },
    test_mime_type_parse_1: function () {
        assert_equals(mime_type_parse("image"), "image");
    },
    test_mime_type_parse_2: function () {
        assert_equals(mime_type_parse("*"), "*");
    },
    test_mime_type_parse_3: function () {
        assert_objects_equal(mime_type_parse("image/jpeg"), ["image", "jpeg"]);
    },
    test_mime_type_parse_4: function () {
        assert_objects_equal(mime_type_parse("image/*"), ["image", "*"]);
    },
    test_mime_table_1: function () {
        assert(test_mime_table instanceof mime_type_table);
    },
    test_mime_table_2: function () {
        test_mime_table = {};
        assert(test_mime_table instanceof mime_type_table);
    },
    test_mime_table_3: function () {
        test_mime_table.set("image/jpeg", "foo");
        assert_equals(test_mime_table.get("image/jpeg"), "foo");
    },
    test_mime_table_4: function () {
        test_mime_table.set("image/*", "foo");
        assert_equals(test_mime_table.get("image/jpeg"), "foo");
    },
    test_mime_table_5: function () {
        test_mime_table.set("*", "foo");
        assert_equals(test_mime_table.get("image/jpeg"), "foo");
    },
    test_mime_table_6: function () {
        test_mime_table.set("*", "foo");
        test_mime_table.set("image/*", "bar");
        assert_equals(test_mime_table.get("image/jpeg"), "bar");
    },
    test_mime_table_7: function () {
        test_mime_table.set("image/*", "foo");
        test_mime_table.set("image", null);
        assert_not(test_mime_table.get("image/jpeg"));
    },
    test_mime_table_8: function () {
        assert_not(test_mime_table.get("image/jpeg"));
    }
});
