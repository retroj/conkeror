/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2009 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

const PREFIX_ITEM_URI = "urn:mozilla:item:";
const PREFIX_NS_EM = "http://www.mozilla.org/2004/em-rdf#";

var extension_manager = Cc["@mozilla.org/extensions/manager;1"]
    .getService(Ci.nsIExtensionManager);

function get_extension_rdf_property (id, name, type) {
    const rdf_service = Cc["@mozilla.org/rdf/rdf-service;1"]
        .getService(Ci.nsIRDFService);
    var value = extension_manager.datasource.GetTarget(
        rdf_service.GetResource(PREFIX_ITEM_URI + id),
        rdf_service.GetResource(PREFIX_NS_EM + name),
        true);
    if (value == null)
        return null;
    return value.QueryInterface(type || Ci.nsIRDFLiteral).Value;
}

function get_extension_update_item (id) {
    return extension_manager.getItemForID(id);
}

function extension_info (id) {
    this.id = id;
}
extension_info.prototype = {
    // Returns the nsIUpdateItem object associated with this extension
    get update_item () { return get_extension_update_item(this.id); },

    get_rdf_property : function (name, type) {
        return get_extension_rdf_property(this.id, name, type);
    },

    // RDF properties
    get isDisabled () { return this.get_rdf_property("isDisabled"); },
    get aboutURL () { return this.get_rdf_property("aboutURL"); },
    get addonID () { return this.get_rdf_property("addonID"); },
    get availableUpdateURL () { return this.get_rdf_property("availableUpdateURL"); },
    get availableUpdateVersion () { return this.get_rdf_property("availableUpdateVersion"); },
    get blocklisted () { return this.get_rdf_property("blocklisted"); },
    get compatible () { return this.get_rdf_property("compatible"); },
    get description () { return this.get_rdf_property("description"); },
    get downloadURL () { return this.get_rdf_property("downloadURL"); },
    get isDisabled () { return this.get_rdf_property("isDisabled"); },
    get hidden () { return this.get_rdf_property("hidden"); },
    get homepageURL () { return this.get_rdf_property("homepageURL"); },
    get iconURL () { return this.get_rdf_property("iconURL"); },
    get internalName () { return this.get_rdf_property("internalName"); },
    get locked () { return this.get_rdf_property("locked"); },
    get name () { return this.get_rdf_property("name"); },
    get optionsURL () { return this.get_rdf_property("optionsURL"); },
    get opType () { return this.get_rdf_property("opType"); },
    get plugin () { return this.get_rdf_property("plugin"); },
    get previewImage () { return this.get_rdf_property("previewImage"); },
    get satisfiesDependencies () { return this.get_rdf_property("satisfiesDependencies"); },
    get providesUpdatesSecurely () { return this.get_rdf_property("providesUpdatesSecurely"); },
    get type () { return this.get_rdf_property("type", Ci.nsIRDFInt); },
    get updateable () { return this.get_rdf_property("updateable"); },
    get updateURL () { return this.get_rdf_property("updateURL"); },
    get version () { return this.get_rdf_property("version"); }
};

function extension_is_enabled (id) {
    var info = new extension_info(id);
    return info.update_item && (info.isDisabled == "false");
}
