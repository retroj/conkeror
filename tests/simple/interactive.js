
require('walnut.js');

walnut_run({
    test_call_interactively_1: function () {
        let a = 0;
        interactive('test1', null, function () { a = 1; });
        co_call(call_interactively({}, 'test1'));
        assert_equals(a, 1);
    }
});
