// -*- mode: java -*-
/***** BEGIN LICENSE BLOCK *****
Version: MPL 1.1/GPL 2.0/LGPL 2.1

The contents of this file are subject to the Mozilla Public License Version
1.1 (the "License"); you may not use this file except in compliance with
the License. You may obtain a copy of the License at
http://www.mozilla.org/MPL/

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
for the specific language governing rights and limitations under the
License.

The Initial Developer of the Original Code is Shawn Betts.
Portions created by the Initial Developer are Copyright (C) 2004,2005
by the Initial Developer. All Rights Reserved.

Alternatively, the contents of this file may be used under the terms of
either the GNU General Public License Version 2 or later (the "GPL"), or
the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
in which case the provisions of the GPL or the LGPL are applicable instead
of those above. If you wish to allow use of your version of this file only
under the terms of either the GPL or the LGPL, and not to allow others to
use your version of this file under the terms of the MPL, indicate your
decision by deleting the provisions above and replace them with the notice
and other provisions required by the GPL or the LGPL. If you do not delete
the provisions above, a recipient may use your version of this file under
the terms of any one of the MPL, the GPL or the LGPL.
***** END LICENSE BLOCK *****/

// our bookmarks array
var bookmarks = [];

// RDF variables
var NC_NS = "http://home.netscape.com/NC-rdf#";

var kRDFContractID = "@mozilla.org/rdf/rdf-service;1";
var kRDFSVCIID = Components.interfaces.nsIRDFService;
var kRDFRSCIID = Components.interfaces.nsIRDFResource;
var kRDFLITIID = Components.interfaces.nsIRDFLiteral;
var RDF = Components.classes[kRDFContractID].getService( kRDFSVCIID );
var RDF_NS     = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";

var kRDFCContractID = "@mozilla.org/rdf/container;1";
var kRDFCIID = Components.interfaces.nsIRDFContainer;
var RDFC = Components.classes[kRDFCContractID].createInstance( kRDFCIID );
var kRDFCUContractID = "@mozilla.org/rdf/container-utils;1";
var kRDFCUIID = Components.interfaces.nsIRDFContainerUtils;
var RDFCU = Components.classes[kRDFCUContractID].getService(kRDFCUIID);

var kBMSVCIID = Components.interfaces.nsIBookmarksService;
var BMDS  = RDF.GetDataSource("rdf:bookmarks");
var root = RDF.GetResource( "NC:BookmarksRoot" );
var BMSVC = BMDS.QueryInterface( kBMSVCIID );
BMSVC.readBookmarks();
var NameArc = RDF.GetResource( NC_NS+"Name" );
var URLArc =  RDF.GetResource( NC_NS+"URL" );
var DescriptionArc = RDF.GetResource( NC_NS+"Description" );

function getAllChildren(folder, propArray)
{
    var container = Components.classes[kRDFCContractID].createInstance(kRDFCIID);
    container.Init(BMDS, folder);
    var children = container.GetElements();
    while (children.hasMoreElements()){
	var child = children.getNext() ;
	if (child instanceof Components.interfaces.nsIRDFResource){
	    var aType = resolveType(child);
	    /*var childResource = child.QueryInterface(kRDFRSCIID);
	      var props = [childResource, null, null, null, null, null, null];*/
	    if (aType == "Folder" || aType == "Livemark" || aType == "PersonalToolbarFolder")
		getAllChildren(child, propArray);
	    else {
		var title =  getProperty(child, NC_NS+"Name");
		var url =  getProperty(child, NC_NS+"URL");
		propArray.push([title, url]);
	    }
	}
    }
}

function resolveType(aResource, aDS)
{
    var type = this.getProperty(aResource, RDF_NS+"type", aDS);
    if (type != "")
	type = type.split("#")[1];
    if (type == "Folder") {
	if (aResource == BMSVC.getBookmarksToolbarFolder())
	    type = "PersonalToolbarFolder";
    }

    if (type == "") {
	// we're not sure what type it is.  figure out if it's a container.
	var child = getProperty(aResource, NC_NS+"child", aDS);
	if (child || RDFCU.IsContainer(aDS?aDS:BMDS, RDF.GetResource(aResource)))
	    return "ImmutableFolder";

	// not a container; make sure it has at least a URL
	if (getProperty(aResource, NC_NS+"URL") != null)
	    return "ImmutableBookmark";
    }

    return type;
}

function getProperty(aInput, aArcURI, aDS)
{
    var node;
    var arc  = RDF.GetResource(aArcURI);
    if (typeof(aInput) == "string") 
	aInput = RDF.GetResource(aInput);
    if (!aDS)
	node = BMDS.GetTarget(aInput, arc, true);
    else
	node = aDS .GetTarget(aInput, arc, true);
    try {
	return node.QueryInterface(kRDFRSCIID).Value;
    }
    catch (e) {
	return node? node.QueryInterface(kRDFLITIID).Value : "";
    }    
}

function get_bm_strings()
{
    try {
	// only update our bookmarks array if it is empty (==simple cache)
	if (bookmarks.length == 0)
	    getAllChildren(root, bookmarks);

    } catch (e) {alert(e);}

    return bookmarks;
}

function genBookmarks()
{
    try {
	var bms = get_bm_strings();
	document.write("<h1>Bookmarks</h1>")

	    if (bms.length) {
		// newer bookmarks should be at the top
		bms.reverse();
		document.write("<table>");
		for (var i=0; i<bms.length; i++) {
		    document.write("<TR>");
		    document.write("<TD><a href=\"" + bms[i][1] + "\">" + bms[i][0] + "</TD>");
		    document.write("</TR>");
		}
		document.write("</table>");
	    } else {
		document.write("<p>No bookmarks.</p>");
	    }

    } catch(e) {alert(e);}
}
