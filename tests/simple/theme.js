
require('walnut.js');

// get_contents_synchronously
assert(get_contents_synchronously("chrome://conkeror/content/conkeror.js"),
       "get_contents_synchronously 1");
assert_null(get_contents_synchronously("chrome://conkeror/content/non-existent.file"),
            "get_contents_synchronously 2");

// themes
assert(theme_load, "theme module was loaded");
assert_error(function () { theme_load(" nonexistent theme name!"); }, "theme 1");
assert(theme_load_paths, "theme_load_paths exists");
assert(theme_find("default"), "default theme exists");
assert(theme_find("default").location, "(theme).location exists");
assert(theme_find("default").sheets, "(theme).sheets exists");
{ let th1 = theme_find("default");
  let th2 = theme_find("default");
  assert_equals(th1, th2, "theme_find returns already loaded theme when possible");
}
assert_equals(theme_cssfile_module("foo.css"), "foo", "theme_cssfile_module 1");
assert_equals(theme_cssfile_module("foo--bar.css"), "foo", "theme_cssfile_module 2");
assert(theme_find("default").unregister, "theme has unregister method");
assert(theme_find("default").register, "theme has register method");
assert(theme_find("default").registered_p, "theme has registered_p method");

