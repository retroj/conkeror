
require("walnut.js");

// coroutine hook tests
walnut_run ({
    suite_setup: function () {},
    suite_teardown: function () {},
    setup: function () {
        define_coroutine_hook("test_hook");
    },
    teardown: function () {
        test_hook = undefined;
    },
    test_synchronous_coroutine_hook: function () {
        var a = 0;
        function inc_a () { a += 1; }
        add_hook("test_hook", inc_a);
        co_call(test_hook.run());
        assert_equals(a, 1);
    },
    test_asynchronous_coroutine_hook: function () {
        var cont;
        var str = "";
        add_hook("test_hook",
                 function () {
                     str += "a";
                     cont = yield CONTINUATION;
                     str += (yield SUSPEND);
                 });
        add_hook("test_hook",
                 function () str += "b");
        co_call(test_hook.run());
        cont("c");
        assert_equals(str, "acb");
    }
});
