
const conkeror_cmdline = {

  /* nsISupports */
 QueryInterface : function (iid)
 {
   if (iid.equals(Components.interfaces.nsICommandLineHandler) ||
       iid.equals(Components.interfaces.nsIFactory) ||
       iid.equals(Components.interfaces.nsISupports))
     return this;

   throw Components.results.NS_ERROR_NO_INTERFACE;
 },

  /* nsICommandLineHandler */
  handle : function (cmdline) {
    cmdline.preventDefault = true;

    var conkeror = Components.classes["@conkeror.mozdev.org/application;1"]
        .getService ()
        .wrappedJSObject;

    var suppress_default = false;
    var suppress_rc = false;

    var i = 0;

    /* -q must be the first argument, if it is given */
    if (cmdline.length > 0 && cmdline.getArgument(0) == "-q")
    {
      suppress_rc = true;
      i++;
    }

    var initial_launch = (cmdline.state == cmdline.STATE_INITIAL_LAUNCH);
    if (! suppress_rc && initial_launch)
    {
        try {
            conkeror.load_rc ();
        } catch (e) { dump (e + "\n"); }
    } else if (suppress_rc && ! initial_launch) {
        dump ("w: attempt to suppress load_rc in remote invocation\n");
    }

      var flags = {
          batch: {
              suppress_default: true
          },
          daemon: {
              suppress_default: true,
              func: function () {
                  conkeror.daemon_mode(1);
                  var frame = conkeror.make_frame();
                  frame.setTimeout(function() { frame.close(); }, 0);
              }
          },
          e: {
              param: true,
              func: function (param) {
                  eval (param);
              }
          },
          chrome: {
              param: true,
              suppress_default: true,
              func: function (param) {
                  try {
                  var result = conkeror.window_watcher.openWindow(null,
                                                              param,
                                                              null,
                                                              "resizable=yes,dialog=no",
                                                              null);
                  } catch (e) { dump("error: " + e + "\n");}
              }
          },
          l: {
              param: true,
              func: function (param) {
                  try {
                      conkeror.load_rc (param);
                  } catch (e) { dump (e + "\n"); }
              }
          },
          q: {
              func: function () {
                  dump ("w: -q may only be used as the first argument.\n");
              }
          }
      };

    for (; i < cmdline.length; ++i)
    {
        var arg = cmdline.getArgument(i);
        if (arg[0] == '-') {
            var arg1 = arg.substring(1);
            if (arg1 in flags) {
                if ('suppress_default' in flags[arg1] && flags[arg1].suppress_default) {
                    suppress_default = true;
                }
                if ('func' in flags[arg1]) {
                    if ('param' in flags[arg1] && flags[arg1].param) {
                        i++; // increment the argument counter to skip the parameter
                        if (i >= cmdline.length) {
                            dump ("w: ignoring command switch `"+arg+"' because no argument was provided.\n");
                            continue;
                        }
                        var param = cmdline.getArgument (i);
                        flags[arg1].func.call (conkeror, param);
                    } else {
                        flags[arg1].func.call (conkeror);
                    }
                }
                continue;
            }
        }

        // something other than a switch was passed on the command
        // line.  suppress the default frame, and call the
        // user-configurable remoting function on it.
        //
        suppress_default = true;
        conkeror.url_remoting_fn (arg);
    }

      // we are greedy and handle all command line arguments.  remove
      // everything from the command line object, so no other
      // components can see them.
      //
      if (cmdline.length > 0) {
          cmdline.removeArguments(0, cmdline.length - 1);
      }

      // no args were found for url_remoting_fn, and no switches
      // explicitly suppressed the creation of a default frame
      // (e.g. -batch or -daemon)
      //
    if (! suppress_default) {
        conkeror.make_frame(conkeror.homepage);
    }
  },

  /* nsIFactory */

  createInstance : function (outer, iid)
  {
    if (outer != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    return this.QueryInterface(iid);
  },

  lockFactory : function (lock) { /* no-op */ }
};


// http://www.xulplanet.com/references/xpcomref/ifaces/nsICommandLine.html
// http://developer.mozilla.org/en/docs/Chrome:_Command_Line
// http://lxr.mozilla.org/mozilla/source/toolkit/components/commandlines/public/nsICommandLineHandler.idl

const clh_contractID = "@mozilla.org/commandlinehandler/general-startup;1?type=conkeror";
const clh_CID = Components.ID('{0f4dd758-b55a-4386-a79c-8698642eac51}');

// category names are sorted alphabetically. Typical command-line handlers use a
// category that begins with the letter "m".
const clh_category = "y-conkeror";

/**
 * The XPCOM glue that implements nsIModule
 */
const conkeror_cmdline_module = {
  /* nsISupports */
  QueryInterface : function (iid)
  {
    if (iid.equals(Components.interfaces.nsIModule) ||
        iid.equals(Components.interfaces.nsISupports))
      return this;

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  /* nsIModule */
  getClassObject : function (compMgr, cid, iid)
  {
    if (cid.equals(clh_CID))
      return conkeror_cmdline.QueryInterface(iid);

    throw Components.results.NS_ERROR_NOT_REGISTERED;
  },

  registerSelf : function (compMgr, fileSpec, location, type)
  {
    compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);

    compMgr.registerFactoryLocation(clh_CID,
                                    "conkeror_cmdline",
                                    clh_contractID,
                                    fileSpec,
                                    location,
                                    type);

    var catMan = Components.classes["@mozilla.org/categorymanager;1"].
      getService(Components.interfaces.nsICategoryManager);
    catMan.addCategoryEntry("command-line-handler",
                            clh_category,
                            clh_contractID, true, true);
  },

  unregisterSelf : function (compMgr, location, type)
  {
    compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    compMgr.unregisterFactoryLocation(clh_CID, location);

    var catMan = Components.classes["@mozilla.org/categorymanager;1"].
      getService(Components.interfaces.nsICategoryManager);
    catMan.deleteCategoryEntry("command-line-handler", clh_category);
  },

  canUnload : function (compMgr)
  {
    return true;
  }
};

/* The NSGetModule function is the magic entry point that XPCOM uses to find what XPCOM objects
 * this component provides
 */
function NSGetModule(comMgr, fileSpec)
{
  return conkeror_cmdline_module;
}

