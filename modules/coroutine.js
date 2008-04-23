/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

function _return_value(x) {
    this.value = x;
}

function co_return(x) {
    return new _return_value(x);
}

const CONTINUATION = { toString: function () "[object CONTINUATION]" };
const SUSPEND = { toString: function () "[object SUSPEND]" };

function is_coroutine(obj) {
    return obj != null &&
        typeof(obj) == "object" &&
        typeof(obj.next) == "function" &&
        typeof(obj.send) == "function";
}

function _do_call(f) {
    var cc = yield;

    var stack = [];
    var y = undefined;
    var throw_value = false;
    while (true) {
        try {
            let x;
            if (throw_value) {
                throw_value = false;
                x = f.throw(y);
            }
            else
                x = f.send(y);

            if (x == CONTINUATION) {
                y = cc;
                continue;
            }

            if (x === SUSPEND) {
                try {
                    x = yield;
                    y = x;
                } catch (e) {
                    throw_value = true;
                    y = e;
                }
                continue;
            }

            if (is_coroutine(x))
            {
                stack[stack.length] = f;
                f = x;
                y = undefined;
                continue;
            }

            if (x instanceof _return_value) {
                if (stack.length == 0)
                    return;
                f.close();
                f = stack[stack.length - 1];
                stack.length--;
                y = x.value;
                continue;
            }

            // Just return the value back to the function
            y = x;
        } catch (e) {
            if (stack.length == 0)
                return;
            f = stack[stack.length - 1];
            stack.length--;
            if (e instanceof StopIteration)
                y = undefined;
            else {
                y = e;
                throw_value = true;
            }
        }
    }
}

function co_call(f) {
    if (!is_coroutine(f))
        return;
    var g = _do_call(f);
    g.next();
    var cc = function (x) {
        try {
            g.send(x);
        } catch (e if e instanceof StopIteration) {}
        catch (e) {
            // Dump this error, because it indicates a programming error
            dump_error(e);
        }
    };
    cc.throw = function (x) {
        try {
            g.throw(x);
        } catch (e if e instanceof StopIteration) {}
        catch (e) {
            // Dump this error, because it indicates a programming error
            dump_error(e);
        }
    };
    try {
        g.send(cc);
    } catch (e if e instanceof StopIteration) {}
    catch (e) {
        // Dump this error, because it indicates a programming error
        dump_error(e);
    }
    return cc;
}
