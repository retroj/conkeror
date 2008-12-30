
require('walnut.js');

// make_uri
assert(make_uri("chrome://conkeror/content/conkeror.js"));
assert(make_uri("http://www.example.com/"));
assert_error(function () { make_uri("chrome://conkeror"); });
