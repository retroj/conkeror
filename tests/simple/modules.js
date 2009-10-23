
require('walnut.js');

walnut_run({
    test_module_loaded_1: function () {
        assert(! loaded("non-existent module"));
    },
    test_module_loaded_2: function () {
        assert(loaded("buffer.js"));
    },
    test_call_after_load_1: function () {
        let a = 0;
        call_after_load("buffer.js", function () { a = 1; });
        assert_equals(a, 1, "call_after_load 1");
    }
});
