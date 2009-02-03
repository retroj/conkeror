/**
 * (C) Copyright 2009 Shawn Betts
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
 *
 * This provides support for automatically following Wikipedia's "did you mean"
 * link when searching for an article which doesn't exist.
 *
 * Usage:
 * Put this in your rc file (usually ~/.conkerorrc):
 * require("wikipedia-didyoumean.js");
 *
 * TODO:
 * - With this enabled, each time a buffer has loaded, the function is run,
 *   which is quite unnecessary. Find out a better way to solve this. (Is there
 *   any better way?)
 * - There are no indications to the user that Conkeror is actually following a
 *   link, and following it doesn't happen that fast on most Internet
 *   connections. One alternative is to replace the document with something
 *   completely different telling the user where she is being redirected while
 *   it's taking place, but I'd personally like something which is not as
 *   obtrusive.
 */

require("utils.js");

define_variable("wikipedia_didyoumean_follow_first_hit", false,
		"When non-false, follows the first hit in the result list"
		+ "unless a \"did you mean\" in shown.");

/**
 * Called when the Wikipedia search page regexp matches the current URL.
 *
 * Given the buffer, searches the document for a "did you mean" suggestion box,
 * which suggests some word that the user might have meant. If such a suggestion
 * is found, it immediately follows it. If the new page didn't exist either, and
 * just so happens to have another suggestion, follows that, and so on, until no
 * more suggestions are found.
 *
 * If the user variable "wikipedia_didyoumean_follow_first_hit" is set to
 * anything which is "true" in a JavaScript condition, when no more suggestions
 * are found, follows the first match in the search results, if there are any
 * matches.
 *
 * @param buffer The buffer containing the document.
 */
function wikipedia_didyoumean(buffer) {
    let uri = buffer.current_URI.spec;
    if (uri.match(new RegExp("^http://[a-z]+\.wikipedia\.org/w(iki)?/.+"))) {
	let doc = buffer.document;
	let didyoumean_xpath = '//div[@class="searchdidyoumean"]/a[1]';
	let didyoumean = xpath_lookup(doc, didyoumean_xpath);
	let found;
	if ((found = didyoumean.iterateNext())) {
	    // Did you mean...?
	    doc.location = found.href;
	} else {
	    // Follow the first hit if wikipedia_didyoumean_follow_first_hit is true.
	    if (wikipedia_didyoumean_follow_first_hit) {
		let firsthit_xpath = '//ul[@class="mw-search-results"]/li[1]/a';
		let firsthit = xpath_lookup(doc, firsthit_xpath);
		if ((found = firsthit.iterateNext())) {
		    doc.location = found.href;
		}
	    }
	}
    }
}

add_hook("buffer_loaded_hook", wikipedia_didyoumean);