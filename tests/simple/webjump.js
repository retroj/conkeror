
require('walnut.js');

// webjump tests
{ var real_webjumps = webjumps;
  webjumps = new string_hashmap();

  define_webjump("test1", "http://www.example.com/");
  assert_equals(webjumps.get("test1").handler(), "http://www.example.com/", "webjump 1");
  define_webjump("test2", "http://www.example.com/with/a/path");
  assert_equals(webjumps.get("test2").handler(), "http://www.example.com/with/a/path", "webjump 2");

  webjumps = real_webjumps;
}
