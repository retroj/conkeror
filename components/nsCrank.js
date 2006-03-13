// this was stolen from adblock. No idea how they figured all this out.

const _CRANK_CONTRACTID = "@mozilla.org/crank;1";
const _CRANK_CID = Components.ID('{a79fe89b-6662-4ff4-8e88-09950ad4dfde}');

const CATMAN_CONTRACTID = "@mozilla.org/categorymanager;1";
const JSLOADER_CONTRACTID = "@mozilla.org/moz/jssubscript-loader;1";

/*
 * Module object
 */

var module =
{
	factoryLoaded: false,

	registerSelf: function(compMgr, fileSpec, location, type)
	{
		compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		compMgr.registerFactoryLocation(_CRANK_CID, 
										"Conkeror crank content policy",
										_CRANK_CONTRACTID,
										fileSpec, location, type);

		var catman = Components.classes[CATMAN_CONTRACTID].getService(Components.interfaces.nsICategoryManager);
		catman.addCategoryEntry("content-policy", _CRANK_CONTRACTID,
							_CRANK_CONTRACTID, true, true);
	},

	unregisterSelf: function(compMgr, fileSpec, location)
	{
		compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);

		compMgr.unregisterFactoryLocation(_CRANK_CID, fileSpec);
		var catman = Components.classes[CATMAN_CONTRACTID].getService(Components.interfaces.nsICategoryManager);
		catman.deleteCategoryEntry("content-policy", _CRANK_CONTRACTID, true);
	},

	getClassObject: function(compMgr, cid, iid)
	{
		if (!cid.equals(_CRANK_CID))
			throw Components.results.NS_ERROR_NO_INTERFACE;

		if (!iid.equals(Components.interfaces.nsIFactory))
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

		if (!this.factoryLoaded)
		{
			var loader = Components.classes[JSLOADER_CONTRACTID].getService(Components.interfaces.mozIJSSubScriptLoader);
			loader.loadSubScript('chrome://conkeror/content/adblock.js');
			this.factoryLoaded = factory;
		}

		return factory;
	},

	canUnload: function(compMgr)
	{
		return true;
	}
};

// module initialisation
function NSGetModule(comMgr, fileSpec)
{
	return module;
}
