
require('walnut.js');

// interactive
{ let a = 0;
  interactive('test1', null, function () { a = 1; });
  call_interactively({}, 'test1');
  assert_equals(a, 1, "call_interactively 1");
}
