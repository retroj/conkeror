/**
 * (C) Copyright 2008 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

function assert (got, name) {
    if (name == null) name = "unnamed";
    if (! got)
        throw new Error(name+" failed. got <"+got+">.");
    return true;
}

function assert_equals (got, expect, name) {
    if (name == null) name = "unnamed";
    if (got != expect) {
        throw new Error(name+" failed. expected <"+expect+">, got <"+got+">.");
    }
    return true;
}

function assert_error (fn, name) {
    if (name == null) name = "unnamed";
    var got_error = false;
    try {
        fn();
    } catch (e) {
        got_error = true;
    }
    if (! got_error)
        throw new Error(name+" failed. expected an error calling <"+fn+">.");
    return true;
}

function assert_null (got, name) {
    if (name == null) name = "unnamed";
    if (got !== null)
        throw new Error(name+" failed. got <"+got+">.");
    return true;
}

// sanity checks
{ let failed = false;
  try { assert_equals(1,0); } catch (e) { failed = true; }
  assert_equals(failed, true, "assert_equals: sanity check 1");

  failed = false;
  try { assert_equals(1,1); } catch (e) { failed = true; }
  assert_equals(failed, false, "assert_equals: sanity check 2");

  assert(true, "assert: sanity check 1");
  failed = false;
  try { assert(false); } catch (e) { failed = true; }
  assert(failed, "assert: sanity check 2");

  assert(assert_error(function () { throw new Error("an error"); }),
         "assert_error: sanity check 1");

  failed = false;
  try { assert_error(function () {}); } catch (e) { failed = true; }
  assert(failed, "assert_error: sanity check 2");

  assert_null(null, "assert_null: sanity check 1");
  assert_error(function () { assert_null(false); }, "assert_null: sanity check 2");
}

