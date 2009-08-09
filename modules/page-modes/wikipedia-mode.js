/**
 * (C) Copyright 2009 Deniz Dogan
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
 *
 * Main features:
 * - "Did you mean", automatic following of spelling suggestions by MediaWiki.
 * - Changes the behavior of previous-heading and next-heading to better suit
 *   MediaWiki pages. (TODO)
 * - Probably more to come.
 **/

require("utils.js");

/*** DID YOU MEAN ******************/

define_variable("wikipedia_didyoumean_follow_first_hit", false,
		"When true, follows the first hit in the result list"
		+ "unless a \"did you mean\" in shown.");

define_variable("wikipedia_enable_didyoumean", false,
		"When true, enables \"did you mean\".");

/**
 * Given the buffer, searches the document for a "did you mean" suggestion box,
 * which suggests some word that the user might have meant. If such a suggestion
 * is found, it immediately follows it. If the new page didn't exist either, and
 * just so happens to have another suggestion, follows that, and so on, until no
 * more suggestions are found.
 *
 * If the user variable "wikipedia_didyoumean_follow_first_hit" is set to
 * anything which is "true" in a JavaScript condition, when no more suggestions
 * are found, follows the first match in the search results, if there are any.
 *
 * @param buffer The buffer containing the document.
 */
function wikipedia_didyoumean(buffer) {
    let doc = buffer.document;
    let didyoumean_xpath = '//div[@class="searchdidyoumean"]/a[1]';
    let didyoumean = xpath_lookup(doc, didyoumean_xpath);
    let found = didyoumean.iterateNext();
    if (found) {
	// "Did you mean" found.
	doc.location = found.href;
    } else {
	// Follow the first hit if wikipedia_didyoumean_follow_first_hit.
	if (wikipedia_didyoumean_follow_first_hit) {
	    let firsthit_xpath = '//ul[@class="mw-search-results"]/li[1]/a';
	    let firsthit = xpath_lookup(doc, firsthit_xpath);
	    found = firsthit.iterateNext();
	    if (found) {
		doc.location = found.href;
	    }
	}
    }
}

// I.local.headings_xpath = '//h1[@id="firstHeading"] | //span[@class="mw-headline"] | //div[@id="toctitle"]';

/*** MAIN LOADING FUNCTIONALITY ******************/

define_page_mode("wikipedia_mode", "Wikipedia",
    $enable = function (buffer) {
        if (wikipedia_enable_didyoumean) {
	    do_when("buffer_dom_content_loaded_hook", buffer, wikipedia_didyoumean);
        }
    },
    $disable = function (buffer) {
        remove_hook.call(buffer, "buffer_dom_content_loaded_hook", wikipedia_didyoumean);
    });

let (wikipedia_mode_re = /wikipedia/) { // TODO: Better regular expression
    auto_mode_list.push([wikipedia_mode_re, wikipedia_mode]);
}
