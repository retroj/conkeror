// -*- mode: java -*-

// This was taken from BookmarksHome. The code is disgusting. When I
// figure out what the hell it does I'll make it understandable.
function Folder( node, ancestors ) {
    this.node = node;
    // ancestors include name of folder
    this.ancestors = ancestors;
}

function get_bm_strings()
{
    try {
	var ret_strings = [];
    // RDF variables
    var NC_NS = "http://home.netscape.com/NC-rdf#";

    var kRDFContractID = "@mozilla.org/rdf/rdf-service;1";
    var kRDFSVCIID = Components.interfaces.nsIRDFService;
    var kRDFRSCIID = Components.interfaces.nsIRDFResource;
    var kRDFLITIID = Components.interfaces.nsIRDFLiteral;
    var RDF = Components.classes[kRDFContractID].getService( kRDFSVCIID );

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

    // initialize preferences
//     bMHPrefs.init();

    // bookmarks collection variables
    var curNameNode = BMDS.GetTarget( root, NameArc, true );
    // necessary typecast
    if( curNameNode instanceof kRDFLITIID );
    var curFolder = new Folder( root, [curNameNode.Value] );
    var folderStack = new Array( curFolder );
//     var inOrExcludedFolders = bMHPrefs.getPref( "inOrExcludedFolders" ).split( "|" );
    var enumerator, tempFolders, curNode, curUrlNode;
    var curDescriptionNode, desc, curNodeAncestors;

    // html variables
    //     var doc = new Doc();
    //     var searchDiv = new SearchDiv();
    //     var columns = bMHPrefs.getPref( "nrOfColumns" ); 
    //     var mainTable = new MainTable( columns ); 
    //     var columnTDs = new Array( columns );
    //     for( i = 0; i < columnTDs.length; i++ ) {
    // 	columnTDs[i] = new ColumnTD();
    //     }
    //     var folderDiv;

    var isExcluded, i;
    // make page
    while( folderStack.length > 0 ) {
	curFolder = folderStack.pop();
// 	folderDiv = new FolderDiv( curFolder.ancestors );
	RDFC.Init( BMDS, curFolder.node );
	enumerator = RDFC.GetElements();
	tempFolders = new Array();
	while( enumerator.hasMoreElements() ) {
	    curNode = enumerator.getNext();
	    curNameNode = BMDS.GetTarget( curNode, NameArc, true );
	    curUrlNode = BMDS.GetTarget( curNode, URLArc, true );
	    if( curNameNode instanceof kRDFLITIID ) { 
		if( curUrlNode instanceof kRDFLITIID ) { 
		    // curNameNode is bookmark
		    curDescriptionNode = BMDS.GetTarget( curNode, DescriptionArc, true );
		    desc = ( curDescriptionNode instanceof kRDFLITIID 
			     ? curDescriptionNode.Value : "" );
		    // 		    folderDiv.add( curNameNode.Value, curUrlNode.Value, desc );
// 		    alert("BOOKMARK: " + curNameNode.Value + " " + curUrlNode.Value + " " + desc);
		    ret_strings.push([curNameNode.Value, curUrlNode.Value]);
		}
		else if( RDFCU.IsSeq( BMDS, curNode )) {
		    // curNameNode is folder
		    curNodeAncestors = curFolder.ancestors.concat( [curNameNode.Value] );
		    tempFolders.push( new Folder( curNode, curNodeAncestors ));
		}
	    }
	}
	// 	folderDiv.close();
// 	isExcluded = false;
// 	isExcluded = bMHPrefs.isExcludedFolder( curFolder.ancestors.toString(),
// 						bMHPrefs.getPref( "excludeIndex" ), inOrExcludedFolders );
	// check if folder contains bookmarks and is not excluded
	// 	if( folderDiv.depth > folderDiv.startDepth && ! isExcluded ) {
	// 	    i = bookmarksHome.smallestColumn( columnTDs );
	// 	    columnTDs[i].add( folderDiv );
    }
    // reverse to match order in bookmarks tree
//     folderStack = folderStack.concat( tempFolders.reverse() );
    } catch (e) {alert(e);}

    return ret_strings;
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
