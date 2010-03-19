/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/**
 * Coroutine (i.e. cooperative multithreading) implementation in
 * JavaScript based on Mozilla JavaScript 1.7 generators.
 *
 * Before trying to understand this file, first read about generators
 * as described here:
 * https://developer.mozilla.org/en/New_in_JavaScript_1.7
 *
 * Additionally, here is a document describing another implementation
 * of coroutines/cooperative multithreading in JavaScript based on
 * generators that may be of interest:
 * http://www.neilmix.com/2007/02/07/threading-in-javascript-17/
 *
 * === Introduction ===
 *
 * For the purposes of Conkeror, a coroutine is a generator function
 * (i.e. a function that uses the yield keyword) that adheres to
 * certain practices (described later in this file).
 *
 * As described in the "New in JavaScript 1.7" document, although a
 * generator function `foo' can be invoked using the same syntax as
 * any other function, i.e.:
 *
 * foo(a,b,c)
 *
 * this "function call" merely serves to bind the arguments (including
 * the special `this' argument) without actually running any of the
 * code specified in the defintion of foo, and return a special
 * generator object. The generator object has three methods, `next',
 * 'send', and 'close', that can be called to actually run code
 * specified in the definition of the generator function.
 *
 * In Conkeror, a `coroutine' refers to a generator function that
 * adheres to the practices described later in this file. In a
 * JavaScript program, a coroutine (or any generator function)
 * unfortunately cannot be distinguished from a normal function
 * without actually invoking it. A `prepared coroutine' refers to a
 * generator object obtained from calling a coroutine
 * function. Generally when using this coroutine library, none of the
 * methods of these generator objects should be called directly. The
 * `is_coroutine' function can be used to check whether a given value
 * is a generator object (not a generator function). This library
 * generally assumes that any generator objects it is passed are
 * proper prepared coroutines. If a generator function that does not
 * adhere to the practices required of a coroutine is used with this
 * library as a coroutine, undefined (and generally undesirable)
 * behavior may occur.
 *
 * === Requirements for a coroutine ===
 *
 * In most ways, a coroutine function can be written like a normal
 * function. Arbitrary computation can be done, including arbitrary
 * calls to normal functions, exceptions can be thrown, and exceptions
 * can be handled using try-catch-finally blocks.
 *
 * --- Return values ---
 *
 * One of the main differences from a normal function is that the
 * `return' keyword cannot be used to return a value to the caller
 * (which is necessarily either another coroutine function, or the
 * coroutine was itself started in a new "thread" in which case the
 * return value is ignored). The `return' keyword can still be used to
 * return `undefined' to the caller. In order to return a value,
 * though, the special syntax:
 *
 * yield co_return(<expr>);
 *
 * must be used in place of the normal syntax:
 *
 * return <expr>;
 *
 * --- Invoking another coroutine function synchronously ---
 *
 * Another very important operation is calling another coroutine
 * function synchronously, meaning that control will not return to the
 * caller (the current coroutine) until the specified coroutine has
 * either returned or thrown an exception. Conceptually, the specified
 * coroutine is run in the same "thread" as the current coroutine, as
 * opposed to being invoked asynchronously, in which case it would be
 * run in a new "thread". This is done using the syntax:
 *
 * yield <prepared-coroutine-expr>
 *
 * where <prepared-coroutine-expr> is some expression that evaluates to
 * a generator object, most typically a direct call to a coroutine
 * function in the form of
 *
 * yield foo(a,b,c)
 *
 * or
 *
 * yield obj.foo(a,b,c)
 *
 * in the case that "foo" is a coroutine method of some object
 * `obj'.
 *
 * If the specified coroutine returns a value normally, the yield
 * expression evaluates to that value. That is, using the the syntax
 *
 * var x = yield foo(a,b,c);
 *
 * if foo is a coroutine and returns a normal value, that value will
 * be stored in `x'.
 *
 * Alternatively, if the specified coroutine throws an exception, the
 * exception will be propagated out of the yield expression, and can
 * optionally be handled using a try-catch-finally block. If it is not
 * handled, it will be propagated to the caller of the current
 * coroutine in the same way.
 *
 * Note that it is safe to invoke a normal function using `yield' as
 * well as if it were a coroutine. That is, the syntax
 *
 * yield foo(a,b,c)
 *
 * can likewise be used if foo is a normal function, and the same
 * return value and exception propagation semantics
 * apply. (Technically, what is actually happenining is that if yield
 * is passed a value that is not a generator object or one of the
 * several other types of values that are handled specially like the
 * return value of co_return, it simply returns the value back
 * untouched to the coroutine function. Thus, if foo is a normal
 * function and returns a value, the return value is passed to yield,
 * which immediately passes it back. If it throws an exception, then
 * due to the normal exception propagation, yield is never even
 * called.)
 *
 * --- Current continutation/"thread" handle ---
 *
 * The special syntax
 *
 * var cc = yield CONTINUATION;
 *
 * can be used to obtain a special "continuation" object that serves
 * as a sort of "handle" to the current thread. Note that while in a
 * single "thread", even if not in the same coroutine function, the
 * exact same "continuation" object will always be returned.
 *
 * The continuation object is used in conjuction with another special
 * operation:
 *
 * yield SUSPEND;
 *
 * This operation suspends execution of the current "thread" until it
 * is resumed using a reference to the continuation object for the
 * "thread". There are two ways to resume executation. To resume
 * execution normally, the syntax:
 *
 * cc(value)
 *
 * or
 *
 * cc() (equivalent to cc(undefined))
 *
 * can be used. This resumes execution and causes the yield SUSPEND
 * expression to evaluate to the specified value. Alternatively, the
 * syntax:
 *
 * cc.throw(e)
 *
 * can be used. This causes the specified exception `e' to be thrown
 * from the yield SUSPEND expression.
 *
 * It is not valid to use either of these two operations on a
 * continutation corresponding to a thread that is either currently
 * running or has already terminated.
 *
 * Generally, any coroutine function that suspends the current
 * "thread" should also arrange using some other asynchronous
 * facility, such as a timer with a callback or an event handler, to
 * resume the "thread" later. It should also arrange to resume the
 * "thread" with an exception if an error of some sort occurs in lieu
 * of simply not resuming the "thread" at all.
 *
 * It is not technically necessary to resume a "thread" after
 * suspending it, but it generally should always be done, as otherwise
 * important error handling code, including code in `finally' blocks,
 * may not be run.
 *
 * === Invoking a coroutine asynchronously/spawning a new thread ===
 *
 * A coroutine function can be called asynchronously from either a
 * normal function or a coroutine function. Conceptually, this is
 * equivalent to spawning a new "thread" to run the specified
 * coroutine function. This operation is done using the co_call
 * function as follows:
 *
 * co_call(<prepared-coroutine-expr>)
 *
 * or, for example,
 *
 * co_call(foo(a,b,c))
 *
 * or
 *
 * co_call(function (){ yield foo(a,b,c); }())
 *
 * In the last example, by modifying the anonymous coroutine function,
 * the return value of the coroutine foo, or an exception it throws,
 * could be processed, which is not possible in the case that foo is
 * called directly by co_call.
 *
 * The function co_call returns the continuation for the new "thread"
 * created. The return value of the specified continuation is ignored,
 * as are any exceptions it throws. The call to co_call returns as
 * soon as the specified coroutine suspends execution for the first
 * time, or completes.
 **/

in_module(null);

function _return_value (x) {
    this.value = x;
}

function co_return (x) {
    return new _return_value(x);
}

const CONTINUATION = { toString: function () "[object CONTINUATION]" };
const SUSPEND = { toString: function () "[object SUSPEND]" };

/**
 * Returns true if the `obj' is a generator object. Returns false
 * otherwise. It is assumed that only generator objects that are
 * actually `prepared coroutines' (see above) will be used with this
 * library.
 **/
function is_coroutine (obj) {
    return obj != null &&
        typeof(obj) == "object" &&
        typeof(obj.next) == "function" &&
        typeof(obj.send) == "function";
}

function _do_call (f) {

    /* Suspend immediately so that co_call can pass us the continuation object. */
    var cc = yield;

    /**
     * Stack of (partially-run) prepared coroutines/generator objects
     * that specifies the call-chain of the current coroutine function
     * `f'.  Conceptually, `f' is at the top of the stack.
     **/
    var stack = [];

    /**
     * `y' and `throw_value' together specify how execution of `f' will be resumed.
     * If `throw_value' is false, f.send(y) is called to resume execution normally.
     * If `throw_value' is true, f.throw(y) is called to throw the exception `y' in `f'.
     *
     * Because `f' is initially a just-created prepared coroutine that has not run any
     * code yet, we must start it by calling f.send(undefined) (which is equivalent to
     * calling f.next()).
     **/
    var y = undefined;
    var throw_value = false;
    while (true) {
        try { // We must capture any exception thrown by `f'

            /**
             * If `f' yields again after being resumed, the value
             * passed to yield will be stored in `x'.
             **/
            let x;

            if (throw_value) {
                throw_value = false;
                x = f.throw(y); // f.throw returns the next value passed to yield
            } else
                x = f.send(y); // f.send also returns the next value passed to yield

            if (x === CONTINUATION) {
                /**
                 * The coroutine (`f') asked us to pass it a reference
                 * to the current continuation.  We don't need to make
                 * any adjustments to the call stack.
                 **/
                y = cc;
                continue;
            }

            if (x === SUSPEND) {
                /**
                 * The coroutine `f' asked us to suspend execution of
                 * the current thread.  We do this by calling yield ourself.
                 **/
                try {
                    /* our execution will be suspended until send or throw is called on our generator object */
                    x = yield;

                    /**
                     * Since no exception was thrown, user must have requested that we resume
                     * normally using cc(value); we simply pass that value back to `f', which
                     * asked us to suspend in the first place.
                     **/
                    y = x;
                } catch (e) {
                    /**
                     * User requested that we resume by throwing an exception, so we re-throw
                     * the exception in `f'.
                     **/
                    throw_value = true;
                    y = e;
                }
                continue;
            }

            if (is_coroutine(x)) {
                // `f' wants to synchronously call the coroutine `x'
                stack[stack.length] = f; // push the current coroutine `f' onto the call stack
                f = x; // make `x' the new top of the stack
                y = undefined; // `x` is a new coroutine so we must start it by passing `undefined'
                continue;
            }

            if (x instanceof _return_value) {
                // `f' wants to return a value
                f.close();
                if (stack.length == 0) {
                    /**
                     * `f' doesn't have a caller, so we simply ignore
                     * the return value and terminate the thread.
                     */
                    return;
                }
                // Pop the caller of `f' off the top of the stack
                f = stack[stack.length - 1];
                stack.length--;
                // Pass the return value to the caller, which is now the current coroutine
                y = x.value;
                continue;
            }

            /**
             * `f' yielded to us a value without any special
             * interpretation. Most likely, this is due to `f' calling
             * a normal function as if it were a coroutine, in which
             * case `x' simply contains the return value of that
             * normal function. Just return the value back to `f'.
             **/
            y = x;
        } catch (e) {
            /**
             * `f' threw an exception. If `e' is a StopIteration
             * exception, then `f' exited without returning a value
             * (equivalent to returning a value of
             * `undefined'). Otherwise, `f' threw or propagted a real
             * exception.
             **/
            if (stack.length == 0) {
                /**
                 * `f' doesn't have a caller, so regardless of whether
                 * `f' exited normally or threw an exception, we
                 * simply terminate the thread.
                 */
                return;
            }
            // Pop the caller of `f' off the top of the stack
            f = stack[stack.length - 1];
            stack.length--;
            if (e instanceof StopIteration)
                y = undefined; // propagate a return value of `undefined' to the caller
            else {
                // propagate the exception to the caller
                y = e;
                throw_value = true;
            }
        }
    }
}

/**
 * Invokes the specified coroutine. If the argument is not a (already
 * prepared) coroutine, this function simply returns, doing
 * nothing. Thus, the syntax:
 *
 * co_call(foo(a,b,c))
 *
 * can be used to call the function foo with the arguments [a,b,c]
 * regardless of whether foo is a normal function or a coroutine
 * function. Note, though, that using this syntax, if foo is a normal
 * function and throws an exception, it will be propagated, while if
 * foo is a coroutine, any exceptions it throws will be ignored.
 *
 **/
function co_call (f) {
    if (!is_coroutine(f))
        return;

    /** The _do_call helper function is called to actually do all of
     * the work.  `_do_call' is written as a generator function for
     * implementation convenience.
     **/
    var g = _do_call(f);
    g.next();
    var cc = function (x) {
        try {
            // We resume execution of the thread by calling send on
            // the generator object corresponding to our invocation of
            // _do_call.
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

provide("coroutine");
