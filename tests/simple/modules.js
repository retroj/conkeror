
require('walnut.js');

// modules
assert(! loaded("non-existent module"), "module loaded 1");
assert(loaded("buffer.js"), "module loaded 2");
{ let a = 0;
  call_after_load("buffer.js", function () { a = 1; });
  assert_equals(a, 1, "call_after_load 1");
}

