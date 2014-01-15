/**
 * (C) Copyright 2008, 2014 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/**
 * Coroutine (i.e. cooperative multithreading) implementation in
 * JavaScript based on Mozilla JavaScript 1.7 generators.
 *
 * This is very similar to the Task mechanism implemented in Task.jsm:
 * https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Task.jsm
 *
 * Like Task.jsm, Conkeror's coroutines integrate with Promises:
 * https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Promise.jsm
 *
 * Conkeror uses resource://gre/modules/Promise.jsm if it is available (Gecko >=
 * 25); otherwise, a copy of Gecko 26 Promise.jsm file in
 * modules/compat/Promise.jsm is used.
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
 *   foo(a,b,c)
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
 *   yield co_return(<expr>);
 *
 * must be used in place of the normal syntax:
 *
 *   return <expr>;
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
 *   yield <prepared-coroutine-expr>
 *
 * where <prepared-coroutine-expr> is some expression that evaluates to
 * a generator object, most typically a direct call to a coroutine
 * function in the form of
 *
 *   yield foo(a,b,c)
 *
 * or
 *
 *   yield obj.foo(a,b,c)
 *
 * in the case that "foo" is a coroutine method of some object
 * `obj'.
 *
 * If the specified coroutine returns a value normally, the yield
 * expression evaluates to that value. That is, using the the syntax
 *
 *   var x = yield foo(a,b,c);
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
 *   yield foo(a,b,c)
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
 * --- Integration with Promise API ---
 *
 * Promises provide a simple, standard interface for asynchronous operations.
 * Coroutines can wait synchronously for the result of a Promise by using yield:
 *
 *   yield <promise>
 *
 * Promises are detected by presence of a `then' member of type function.  If
 * the Promise is resolved, the yield expression will evaluate to the resolved
 * value.  Otherwise, if the Promise is rejected, the yield expression will
 * cause the rejection exception to be thrown.
 *
 * In effect, a function that starts an asyncronous operation and returns a
 * Promise can be called synchronously from a coroutine, in the same way that
 * another coroutine can be called synchronously, by using:
 *
 *   yield function_that_returns_a_promise()
 *
 * --- [[deprecated]] Current continutation/"thread" handle ---
 *
 * Note: This API is deprecated because it is error-prone.  Instead, use the
 * Promise integration.
 *
 * The special syntax
 *
 *   var cc = yield CONTINUATION;
 *
 * can be used to obtain a special "continuation" object that serves
 * as a sort of "handle" to the current thread. Note that while in a
 * single "thread", even if not in the same coroutine function, the
 * exact same "continuation" object will always be returned.
 *
 * The continuation object is used in conjuction with another special
 * operation:
 *
 *   yield SUSPEND;
 *
 * This operation suspends execution of the current "thread" until it
 * is resumed using a reference to the continuation object for the
 * "thread". There are two ways to resume executation. To resume
 * execution normally, the syntax:
 *
 *   cc(value)
 *
 * or
 *
 *   cc() (equivalent to cc(undefined))
 *
 * can be used. This resumes execution and causes the yield SUSPEND
 * expression to evaluate to the specified value. Alternatively, the
 * syntax:
 *
 *   cc.throw(e)
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
 * coroutine function. This operation is done using the spawn
 * function as follows:
 *
 *   spawn(<prepared-coroutine-expr>)
 *
 * or, for example,
 *
 *   spawn(foo(a,b,c))
 *
 * or
 *
 *   spawn(function (){ yield foo(a,b,c); }())
 *
 * The `spawn' function returns a Promise representing the result of the
 * asyncronous call.
 *
 * As a convenience, if the argument to `spawn' is a Promise instead of a
 * prepared coroutine (i.e. a generator), it is returned as is, such that
 * spawn can be used transparently with both generator functions and functions
 * returning Promises.
 *
 * === Cancelation ===
 *
 * Conkeror's coroutines support an extension to the Promise API for
 * cancelation: a Promise may have a `cancel' member of type function, which
 * attempts to cancel the corresponding asynchronous operation.
 *
 * The `cancel' function should not make use of the implicit `this' argument.
 * The `cancel' function takes one optional argument (defaults to
 * task_canceled()), which specifies the exception with which the Promise should
 * be rejected if the cancelation is successful.
 *
 * The `cancel' function is asynchronous and returns without providing any
 * indication of whether the cancelation was successful.  There is no guarantee
 * that cancelation will be possible or even successful, for instance the
 * Promise may have already been resolved or rejected, or the asynchronous
 * operation may not be in a cancelable state, or the cancelation notification
 * may be ignored for some reason.  However, if the cancelation is successful,
 * this should be indicated by rejecting the Promise with the specified
 * exception.
 *
 * The helper functions `make_cancelable' and `make_simple_cancelable' are
 * useful for creating Promises that support the cancelation API.
 *
 * The Promise returned by `spawn' supports cancelation, and works as follows:
 *
 * The `cancel' function in the returned Promise marks the "thread" for
 * cancelation.  While a "thread" is marked for cancelation, any Promise the
 * thread waits on synchronously (including one in progress when `cancel' is
 * called) will be immediately canceled if it supports cancelation.  The
 * "thread" will remain marked for cancelation until one of the cancelation
 * requests is successful, i.e. one of the canceled Promises is rejected with
 * the cancelation exception.
 **/

try {
    Components.utils.import("resource://gre/modules/Promise.jsm");
} catch (e) {
    // Gecko < 25
    Components.utils.import("chrome://conkeror/content/compat/Promise.jsm");
}

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

/**
 * Returns an object that behaves like a Promise but also has a
 * `cancel` method, which invokes the specified `canceler` function.
 * The returned object has the specified promise as its prototype.
 * Note that we have to create a new object to add the `cancel` method
 * because Promise objects are sealed.
 *
 * The canceler function must take one argument `e`, a cancelation
 * exception.  The canceler function should arrange so that the
 * promise is rejected with `e` if the cancelation is successful.  Any
 * other result of the promise indicates that the cancelation was not
 * successfully delivered.  If `e` is undefined, it defaults to
 * task_canceled().
 *
 * This protocol is important for coroutines as it makes it possible
 * to retry delivering the cancelation notification until it is
 * delivered successfully at least once.
 **/
function make_cancelable (promise, canceler) {
    return { __proto__: promise,
             cancel: function (e) {
                 if (e === undefined)
                     e = task_canceled();
                 canceler(e);
             }
           };
}

/**
 * Returns a Promise that supports cancelation by simply rejecting the specified
 * `deferred` object with the cancelation exception.
 *
 * This will likely leave the asynchronous operation running, and a proper
 * cancelation function that actually stops the asynchronous operation should be
 * used instead when possible.
 **/
function make_simple_cancelable(deferred) {
    return make_cancelable(deferred.promise, deferred.reject);
}

function task_canceled () {
    let e = new Error("task_canceled");
    e.__proto__ = task_canceled.prototype;
    return e;
}
task_canceled.prototype.__proto__ = Error.prototype;

function _co_impl (f) {

    // Current generator function currently at top of call stack
    this.f = f;
    /**
     * Stack of (partially-run) prepared coroutines/generator objects
     * that specifies the call-chain of the current coroutine function
     * `f'.  Conceptually, `f' is at the top of the stack.
     **/
    this.stack = [];

    /**
     * Deferred object used to return the result of the coroutine.
     **/
    this.deferred = Promise.defer();

    /**
     * The current canceler function, used to interrupt this coroutine.  If null, then any cancelation will be delayed.
     **/
    this.canceler = null;

    /**
     * A pending cancelation.
     **/
    this.pending_cancelation = undefined;
}

_co_impl.prototype = {
    constructor: _co_impl,
    cancel: function _co_impl__cancel (e) {
        this.pending_cancelation = e;
        if (this.canceler) {
            this.canceler(e);
        }
    },
    send: function _co_impl__send(throw_value, y) {
        if (this.canceler === undefined) {
            let e = new Error("Programming error: _co_impl.send called on already-running coroutine.");
            dump_error(e);
            throw e;
        }
        this.canceler = undefined;

        // Cancelation has been successfully delivered, remove pending cancelation
        if (throw_value && this.pending_cancelation == y && y !== undefined)
            this.pending_cancelation = undefined;
        
        while (true) {
            try { // We must capture any exception thrown by `f'

                /**
                 * If `f' yields again after being resumed, the value
                 * passed to yield will be stored in `x'.
                 **/
                let x;
                if (throw_value) {
                    throw_value = false;
                    x = this.f.throw(y); // f.throw returns the next value passed to yield
                } else
                    x = this.f.send(y); // f.send also returns the next value passed to yield

                // [[Deprecated]]
                // The promise API should be used instead.
                if (x === CONTINUATION) {
                    /**
                     * The coroutine (`f') asked us to pass it a reference
                     * to the current continuation.  We don't need to make
                     * any adjustments to the call stack.
                     **/
                    let cc = this.send.bind(this, false);
                    cc.throw = this.send.bind(this, true);

                    y = cc;
                    continue;
                }

                // [[Deprecated]]
                // The promise API should be used instead.
                if (x === SUSPEND) {
                    this.canceler = null;
                    return;
                }

                if (is_coroutine(x)) {
                    // `f' wants to synchronously call the coroutine `x'
                    this.stack[this.stack.length] = this.f; // push the current coroutine `f' onto the call stack
                    this.f = x; // make `x' the new top of the stack
                    y = undefined; // `x` is a new coroutine so we must start it by passing `undefined'
                    continue;
                }

                if (x && typeof(x.then) == "function") {
                    // x is assumed to be a Promise
                    // Wait for result before returning to caller
                    if (typeof(x.cancel) == "function") {
                        if (this.pending_cancelation !== undefined)
                            x.cancel(this.pending_cancelation);
                        this.canceler = x.cancel;
                    } else
                        this.canceler = null;

                    x.then(this.send.bind(this, false), this.send.bind(this, true));
                    return;
                }

                if (x instanceof _return_value) {
                    // `f' wants to return a value
                    this.f.close();
                    if (this.stack.length == 0) {
                        /**
                         * `f' doesn't have a caller, so we resolve
                         * this.deferred with the return value and
                         * terminate the coroutine.
                         */
                        this.deferred.resolve(x.value);
                        return;
                    }
                    // Pop the caller of `f' off the top of the stack
                    this.f = this.stack[this.stack.length - 1];
                    this.stack.length--;
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
                if (this.stack.length == 0) {
                    /**
                     * `f' doesn't have a caller, so we resolve/reject
                     * this.deferred and terminate the coroutine.
                     */
                    if (e instanceof StopIteration)
                        this.deferred.resolve(undefined);
                    else
                        this.deferred.reject(e);
                    return;
                }
                // Pop the caller of `f' off the top of the stack
                this.f = this.stack[this.stack.length - 1];
                this.stack.length--;
                if (e instanceof StopIteration)
                    y = undefined; // propagate a return value of `undefined' to the caller
                else {
                    // propagate the exception to the caller
                    y = e;
                    throw_value = true;
                }
            }
        }
    },
};

/**
 * Runs the specified coroutine asynchronously.  Returns a potentially-cancelable
 * Promise representing the result.
 *
 * In the normal case, the `f` is a prepared coroutine (i.e. generator).
 *
 * If `f` is instead a Promise, it is returned as is, with a no-op canceler.
 *
 * If `f` is some other value, this returns `Promise.resolve(f)` with a no-op canceler.
 **/
function spawn (f) {
    if (!is_coroutine(f)) {
        if (f && typeof(f.then) == "function") {
            // f is a Promise, just return as is
            if (typeof(f.cancel) != "function")
                return make_cancelable(f, function () {} );
            return f;
        }
        return make_cancelable(Promise.resolve(f), function () {});
    }

    let x = new _co_impl(f);
    x.send(false, undefined); // initialize

    return make_cancelable(x.deferred.promise, x.cancel.bind(x));
}

/**
 * [[deprecated]] Runs the specified coroutine asynchronously.
 * Returns the corresponding continuation object.
 *
 * Use `spawn' instead, which returns a Promise rather than a continuation object.
 **/
function co_call (f) {
    if (!is_coroutine(f))
        return;

    let x = new _co_impl(f);
    x.send(false, undefined); // initialize

    let cc = x.send.bind(this, false);
    cc.throw = x.send.bind(this, true);
    return cc;
}

provide("coroutine");
