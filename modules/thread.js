
var thread_manager = Cc["@mozilla.org/thread-manager;1"].getService();

function thread_callback(run_function) {
    this.run_function = run_function;
}
thread_callback.prototype = {
    QueryInterface : function (iid) {
        if (iid.equals(Ci.nsIRunnable) ||
            iid.equals(Ci.nsISupports))
            return this;
        return Cr.NS_ERROR_NO_INTERFACE;
    },
    run : function () {
        this.run_function.call(null);
    }
};

function call_in_thread(thread, func) {
    thread.dispatch(new thread_callback(func), Ci.nsIEventTarget.DISPATCH_NORMAL);
}

function call_in_new_thread(func, success_cont, error_cont) {
    var thread = thread_manager.newThread(0);
    var current_thread = thread_manager.currentThread;
    call_in_thread(thread, function () {
            try {
                var result = func();
                call_in_thread(current_thread, function () {
                        if (success_cont)
                            success_cont(result);
                        thread.shutdown();
                    });
            } catch (e) {
                call_in_thread(current_thread, function () {
                        if (error_cont)
                            error_cont(e);
                        thread.shutdown();
                    });
            }
        });
}
