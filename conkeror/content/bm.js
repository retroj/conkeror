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

// This was taken from BookmarksHome. The code is disgusting. When I
// figure out what the hell it does I'll make it understandable.
function Folder( node, ancestors ) {
    this.node = node;
    // ancestors include name of folder
    this.ancestors = ancestors;
}

// function get_bm_strings()
// {
//     try {
// 	var ret_strings = [];
//     // RDF variables
//     var NC_NS = "http://home.netscape.com/NC-rdf#";

//     var kRDFContractID = "@mozilla.org/rdf/rdf-service;1";
//     var kRDFSVCIID = Components.interfaces.nsIRDFService;
//     var kRDFRSCIID = Components.interfaces.nsIRDFResource;
//     var kRDFLITIID = Components.interfaces.nsIRDFLiteral;
//     var RDF = Components.classes[kRDFContractID].getService( kRDFSVCIID );

//     var kRDFCContractID = "@mozilla.org/rdf/container;1";
//     var kRDFCIID = Components.interfaces.nsIRDFContainer;
//     var RDFC = Components.classes[kRDFCContractID].createInstance( kRDFCIID );
//     var kRDFCUContractID = "@mozilla.org/rdf/container-utils;1";
//     var kRDFCUIID = Components.interfaces.nsIRDFContainerUtils;
//     var RDFCU = Components.classes[kRDFCUContractID].getService(kRDFCUIID);

//     var kBMSVCIID = Components.interfaces.nsIBookmarksService;
//     var BMDS  = RDF.GetDataSource("rdf:bookmarks");
//     var root = RDF.GetResource( "NC:BookmarksRoot" );
//     var BMSVC = BMDS.QueryInterface( kBMSVCIID );
//     BMSVC.readBookmarks();
//     var NameArc = RDF.GetResource( NC_NS+"Name" );
//     var URLArc =  RDF.GetResource( NC_NS+"URL" );
//     var DescriptionArc = RDF.GetResource( NC_NS+"Description" );

//     // initialize preferences
// //     bMHPrefs.init();

//     // bookmarks collection variables
//     var curNameNode = BMDS.GetTarget( root, NameArc, true );
//     // necessary typecast
//     if( curNameNode instanceof kRDFLITIID );
//     var curFolder = new Folder( root, [curNameNode.Value] );
//     var folderStack = new Array( curFolder );
// //     var inOrExcludedFolders = bMHPrefs.getPref( "inOrExcludedFolders" ).split( "|" );
//     var enumerator, tempFolders, curNode, curUrlNode;
//     var curDescriptionNode, desc, curNodeAncestors;

//     // html variables
//     //     var doc = new Doc();
//     //     var searchDiv = new SearchDiv();
//     //     var columns = bMHPrefs.getPref( "nrOfColumns" ); 
//     //     var mainTable = new MainTable( columns ); 
//     //     var columnTDs = new Array( columns );
//     //     for( i = 0; i < columnTDs.length; i++ ) {
//     // 	columnTDs[i] = new ColumnTD();
//     //     }
//     //     var folderDiv;

//     var isExcluded, i;
//     // make page
//     while( folderStack.length > 0 ) {
// 	curFolder = folderStack.pop();
// // 	folderDiv = new FolderDiv( curFolder.ancestors );
// 	RDFC.Init( BMDS, curFolder.node );
// 	enumerator = RDFC.GetElements();
// 	tempFolders = new Array();
// 	while( enumerator.hasMoreElements() ) {
// 	    curNode = enumerator.getNext();
// 	    curNameNode = BMDS.GetTarget( curNode, NameArc, true );
// 	    curUrlNode = BMDS.GetTarget( curNode, URLArc, true );
// 	    if( curNameNode instanceof kRDFLITIID ) { 
// 		if( curUrlNode instanceof kRDFLITIID ) { 
// 		    // curNameNode is bookmark
// 		    curDescriptionNode = BMDS.GetTarget( curNode, DescriptionArc, true );
// 		    desc = ( curDescriptionNode instanceof kRDFLITIID 
// 			     ? curDescriptionNode.Value : "" );
// 		    // 		    folderDiv.add( curNameNode.Value, curUrlNode.Value, desc );
// // 		    alert("BOOKMARK: " + curNameNode.Value + " " + curUrlNode.Value + " " + desc);
// 		    ret_strings.push([curNameNode.Value, curUrlNode.Value]);
// 		}
// 		else if( RDFCU.IsSeq( BMDS, curNode )) {
// 		    // curNameNode is folder
// 		    curNodeAncestors = curFolder.ancestors.concat( [curNameNode.Value] );
// 		    tempFolders.push( new Folder( curNode, curNodeAncestors ));
// 		}
// 	    }
// 	}
// 	// 	folderDiv.close();
// // 	isExcluded = false;
// // 	isExcluded = bMHPrefs.isExcludedFolder( curFolder.ancestors.toString(),
// // 						bMHPrefs.getPref( "excludeIndex" ), inOrExcludedFolders );
// 	// check if folder contains bookmarks and is not excluded
// 	// 	if( folderDiv.depth > folderDiv.startDepth && ! isExcluded ) {
// 	// 	    i = bookmarksHome.smallestColumn( columnTDs );
// 	// 	    columnTDs[i].add( folderDiv );
//     }
//     // reverse to match order in bookmarks tree
// //     folderStack = folderStack.concat( tempFolders.reverse() );
//     } catch (e) {alert(e);}

//     return ret_strings;
// }

  resolveType: function (aResource, aDS)
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
      var child = this.getProperty(aResource, NC_NS+"child", aDS);
      if (child || RDFCU.IsContainer(aDS?aDS:BMDS, RDF.GetResource(aResource)))
        return "ImmutableFolder";

      // not a container; make sure it has at least a URL
      if (this.getProperty(aResource, NC_NS+"URL") != null)
        return "ImmutableBookmark";
    }

    return type;
  }

function get_bm_strings ()
{
    var strings = [];

    var kRDFSVCIID = Components.interfaces.nsIRDFService;
    var kRDFCIID = Components.interfaces.nsIRDFContainer;
    var kRDFRSCIID = Components.interfaces.nsIRDFResource;
    var kBMSVCIID = Components.interfaces.nsIBookmarksService;
    var kRDFContractID = "@mozilla.org/rdf/rdf-service;1";
    var kRDFCContractID = "@mozilla.org/rdf/container;1";
    var RDF = Components.classes[kRDFContractID].getService(kRDFSVCIID);
    var RDFC = Components.classes[kRDFCContractID].createInstance(kRDFCIID);
  
    var BMDS = RDF.GetDataSource("rdf:bookmarks");
    var BMSVC = BMDS.QueryInterface(kBMSVCIID);
    var root = RDF.GetResource("NC:BookmarksRoot");
    var NC_NS = "http://home.netscape.com/NC-rdf#";
    const kName = RDF.GetResource(NC_NS+"Name");
    BMSVC.readBookmarks();
    RDFC.Init(BMDS, root);
    var folderContents = RDFC.GetElements();
    alert(folderContents.hasMoreElements());
    while (folderContents.hasMoreElements()) {
        var rsrc = folderContents.getNext().QueryInterface(kRDFRSCIID);
//         var rtype = BookmarksUtils.resolveType(rsrc);
//         if (rtype == "BookmarkSeparator")
//           continue;
	var aname = BMDS.GetTarget(a, kName, true).QueryInterface(kRDFLITIID).Value;
	alert(rsrc);
    }
    return strings;
}

function genBookmarks()
{
    try {
	var bms = get_bm_strings();
	document.write("<h1>Bookmarks</h1>")

	if (bms.length) {
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
