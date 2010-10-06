
require("walnut.js");

// normal run-until-success hook tests
walnut_run({
    setup: function () {
        define_hook("test_hook", RUN_HOOK_UNTIL_SUCCESS);
    },
    teardown: function () {
        test_hook = undefined;
    },
    test_run_until_success_1: function () {
        add_hook("test_hook", function () { return null; });
        add_hook("test_hook", function () { return 2; });
        add_hook("test_hook", function () { return 3; });
        assert_equals(test_hook.run(), 2);
    }
});

// coroutine hook tests
walnut_run({
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

//coroutine run-until-success hook tests
walnut_run({
    setup: function () {
        define_coroutine_hook("test_hook", RUN_HOOK_UNTIL_SUCCESS);
    },
    teardown: function () {
        test_hook = undefined;
    },
    test_coroutine_run_until_success_1: function () {
        add_hook("test_hook", function () { return null; });
        add_hook("test_hook", function () { return 2; });
        add_hook("test_hook", function () { return 3; });
        var x = 0;
        function doit () {
            x = yield test_hook.run();
        }
        co_call(doit());
        assert_equals(x, 2);
    },
    test_coroutine_run_until_success_2: function () {
        var cont;
        var q = true;
        var x = 0;
        add_hook("test_hook", function () {
            cont = yield CONTINUATION;
            q = yield SUSPEND;
            yield co_return(q);
        });
        add_hook("test_hook", function () { yield co_return(2); });
        add_hook("test_hook", function () { yield co_return(3); });
        function doit () {
            x = yield test_hook.run();
        }
        co_call(doit());
        cont(false);
        assert_equals(q, false);
        assert_equals(x, 2);
    }
});
