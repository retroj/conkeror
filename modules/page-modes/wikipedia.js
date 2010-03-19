/**
 * (C) Copyright 2009 Deniz Dogan
 * (C) Copyright 2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
 *
 * Main features:
 * - "Did you mean", automatic following of spelling suggestions by MediaWiki.
 * - Changes the behavior of previous-heading and next-heading to better suit
 *   MediaWiki pages.
 * - Quick moving between different language versions of the same article using
 *   `wikipedia-other-language' (C-c C-o by default).
 * - Probably more to come.
 **/

in_module(null);

require("minibuffer-completion.js");


/*** VARIABLES ***/

define_variable("wikipedia_didyoumean_follow_first_hit", false,
		"When true, follows the first hit in the result list"
		+ "unless a \"did you mean\" in shown.");

define_variable("wikipedia_enable_didyoumean", false,
		"When true, enables \"did you mean\".");

define_variable('wikipedia_webjumps_format', 'wikipedia-%s',
                "This variable controls the names of the webjumps defined "+
                "by the wikipedia-webjumps module.  It is a simple string "+
                "format spec.  The format code `%s' will be replaced by the "+
                "language code for the webjump.");

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

/**
 * define_wikipedia_webjumps defines webjumps for wikipedia in various
 * languages.  If called with no args, it will define webjumps for all
 * known languages.  When called with any number of language codes, it
 * will define webjumps for those language.  The language codes
 * correspond to the subdomains of wikipedia.com for each language.
 *
 * Examples:
 * define_wikipedia_webjumps("en"); // Makes a webjump to the English WP.
 * define_wikipedia_webjumps("en", "de", "fr"); // English, German and French
 * define_wikipedia_webjumps(); // All of the available Wikipedias.
 */
function define_wikipedia_webjumps() {
    var prefixes;
    if (arguments.length == 0)
        prefixes = [i for (i in wikipedia_versions)];
    else
        prefixes = Array.slice(arguments);
    for each (let i in prefixes) {
        let (rest = wikipedia_versions[i],
             name = string_format(wikipedia_webjumps_format, {s: i})) {
            define_webjump(name, "http://" + i + ".wikipedia.org/wiki/" + rest.search);
        };
    }
}


function wikipedia_other_language(I) {
    var doc = I.buffer.document;
    var links = doc.querySelectorAll('#p-lang li a');
    
    // Extract which language each link corresponds to...
    var regexp = new RegExp("http://([^\.]+)\.wikipedia.org");
    var options = {};
    for each (link in links) {
        let (matched = link.href.match(regexp)) {
            // TODO: Check for errors
            if (wikipedia_versions[matched[1]] != undefined)
                options[wikipedia_versions[matched[1]]["language"]] = link.href;
            else
                dumpln("Found unknown language: " + matched[1] + "... Please, report a bug.");
        }
    }
    return options;
}


interactive("wikipedia-other-language",
            "Queries the user for another language to view the current article in.",
            function (I) {
                var options = wikipedia_other_language(I);
                var chosen = yield completer_with_mappings(options, "Languages:");
                I.buffer.document.location = options[chosen];
            });


define_keymap("wikipedia_keymap");
define_key(wikipedia_keymap, "C-c C-o", "wikipedia-other-language");


function wikipedia_modality (buffer, element) {
    if (! buffer.input_mode)
        buffer.keymaps.push(wikipedia_keymap);
}


/*** MAIN LOADING FUNCTIONALITY ***/

define_page_mode("wikipedia_mode",
    $display_name = "Wikipedia",
    $enable = function (buffer) {
        if (wikipedia_enable_didyoumean) {
	    do_when("buffer_dom_content_loaded_hook", buffer, wikipedia_didyoumean);
        }
        buffer.page.local.headings_xpath = '//h1[@id="firstHeading"] | //span[@class="mw-headline"] | //div[@id="toctitle"]';
        buffer.modalities.push(wikipedia_modality);
    },
    $disable = function (buffer) {
        remove_hook.call(buffer, "buffer_dom_content_loaded_hook", wikipedia_didyoumean);
        var i = buffer.modalities.indexOf(wikipedia_modality);
        if (i > -1)
            buffer.modalities.splice(i, 1);
    }
);

let (wikipedia_mode_re = /wikipedia/) { // TODO: Better regular expression
    auto_mode_list.push([wikipedia_mode_re, wikipedia_mode]);
}


/*** HERE BE DRAGONS ***/
/* No, here is really just "data" which is cumbersome to scroll through. */

define_variable("wikipedia_versions", {
    "aa" : { language: "Afar", search: "Special:Search?search=%s&go=Go" },
    "ab" : { language: "Abkhazian", search: "%D0%A1%D0%BB%D1%83%D0%B6%D0%B5%D0%B1%D0%BD%D0%B0%D1%8F:Search?search=%s&go=%D0%9F%D0%B5%D1%80%D0%B5%D0%B9%D1%82%D0%B8" },
    "af" : { language: "Afrikaans", search: "Spesiaal:Soek?search=%s&go=Wys" },
    "ak" : { language: "Akan", search: "Special:Search?search=%s&go=K%C9%94" },
    "als" : { language: "Alemannic", search: "Spezial:Suche?search=%s&go=Artikel" },
    "am" : { language: "Amharic", search: "%E1%88%8D%E1%8B%A9:Search?search=%s&go=%E1%8A%A5%E1%8A%95%E1%88%82%E1%8B%B5%21" },
    "an" : { language: "Aragonese", search: "Espezial:Mirar?search=%s&go=Ir-ie" },
    "ang" : { language: "Anglo-Saxon", search: "Special:Search?search=%s&go=G%C4%81n" },
    "ar" : { language: "Arabic", search: "%D8%AE%D8%A7%D8%B5:%D8%A8%D8%AD%D8%AB?search=%s&go=%D8%A7%D8%B0%D9%87%D8%A8" },
    // TODO: arz - Egyptian Arabic
    "arc" : { language: "Assyrian Neo-Aramaic", search: "Special:Search?search=%s&go=%DC%99%DC%A0" },
    "as" : { language: "Assamese", search: "%E0%A6%AC%E0%A6%BF%E0%A6%B6%E0%A7%87%E0%A6%B7:Search?search=%s&go=%E0%A6%AF%E0%A6%BE%E0%A6%93%E0%A6%81%E0%A6%95" },
    "ast" : { language: "Asturian", search: "Especial:Search?search=%s&go=Dir" },
    "av" : { language: "Avar", search: "%D0%A1%D0%BB%D1%83%D0%B6%D0%B5%D0%B1%D0%BD%D0%B0%D1%8F:Search?search=%s&go=%D0%9F%D0%B5%D1%80%D0%B5%D0%B9%D1%82%D0%B8" },
    "ay" : { language: "Aymara", search: "Especial:Buscar?search=%s&go=Sara%C3%B1a" },
    "az" : { language: "Azeri", search: "X%C3%BCsusi:Search?search=%s&go=G%C9%99tir" },
    "ba" : { language: "Bashkir", search: "%D0%AF%D1%80%D2%99%D0%B0%D0%BC%D1%81%D1%8B:Search?search=%s&go=%D0%9A%D2%AF%D1%81%D0%B5%D2%AF" },
    "bar" : { language: "Bavarian", search: "Spezial:Suche?search=%s&go=Artikl" },
    // TODO:t-smg - Samogitian
    "bcl" : { language: "Central Bicolano", search: "Espesyal:Hanapon?search=%s&go=Duman%C3%A1n" },
    "be" : { language: "Belarusian", search: "%D0%90%D0%B4%D0%BC%D1%8B%D1%81%D0%BB%D0%BE%D0%B2%D0%B0%D0%B5:Search?search=%s&go=%D0%90%D1%80%D1%82%D1%8B%D0%BA%D1%83%D0%BB" },
    // TODO: be-x-old - Belarusian (Tarashkevitsa)
    "bg" : { language: "Bulgarian", search: "%D0%A1%D0%BF%D0%B5%D1%86%D0%B8%D0%B0%D0%BB%D0%BD%D0%B8:%D0%A2%D1%8A%D1%80%D1%81%D0%B5%D0%BD%D0%B5?search=%s&go=%D0%9E%D1%82%D0%B2%D0%B0%D1%80%D1%8F%D0%BD%D0%B5" },
    "bh" : { language: "Bihari", search: "Special:Search?search=%s&go=Go" },
    "bi" : { language: "Bislama", search: "Special:Search?search=%s&go=Go" },
    "bm" : { language: "Bambara", search: "Special:Recherche?search=%s&go=Taa" },
    "bn" : { language: "Bengali", search: "%E0%A6%AC%E0%A6%BF%E0%A6%B6%E0%A7%87%E0%A6%B7:Search?search=%s&go=%E0%A6%9A%E0%A6%B2%E0%A7%8B" },
    "bo" : { language: "Tibetan", search: "Special:Search?search=%s&go=%E0%BD%A6%E0%BD%BC%E0%BD%84%E0%BC%8B%E0%BC%8D" },
    "bpy" : { language: "Bishnupriya Manipuri", search: "%E0%A6%AC%E0%A6%BF%E0%A6%B6%E0%A7%87%E0%A6%B7:Search?search=%s&go=%E0%A6%B9%E0%A6%BE%E0%A6%A4" },
    "br" : { language: "Breton", search: "Dibar:Klask?search=%s&go=Mont" },
    "bs" : { language: "Bosnian", search: "Posebno:Pretraga?search=%s&go=Idi" },
    "bug" : { language: "Buginese", search: "Istimewa:Pencarian?search=%s&go=%E1%A8%92%E1%A8%95%E1%A8%9A" },
    "bxr" : { language: "Buryat (Russia)", search: "Special:Search?search=%s&go=Go" },
    "ca" : { language: "Catalan", search: "Especial:Cerca?search=%s&go=V%C3%A9s-hi" },
    "cdo" : { language: "Min Dong", search: "Special:Search?search=%s&go=K%C3%B3%CC%A4" },
    "ce" : { language: "Chechen", search: "%D0%91%D0%B0%D1%88%D1%85%D0%BE:Search?search=%s&go=%D0%94%D0%B5%D1%85%D1%8C%D0%B0%D0%B4%D0%BE%D1%85%D1%83" },
    "ceb" : { language: "Cebuano", search: "Special:Pangita?search=%s&go=Sige%21" },
    "ch" : { language: "Chamorro", search: "Special:Search?search=%s&go=H%C3%A5nao" },
    "cho" : { language: "Choctaw", search: "Special:Search?search=%s&go=Go" },
    "chr" : { language: "Cherokee", search: "Special:Search?search=%s&go=Go" },
    "chy" : { language: "Cheyenne", search: "Special:Search?search=%s&go=Go" },
    "co" : { language: "Corsican", search: "Special:Search?search=%s&go=And%C3%A0" },
    "cr" : { language: "Cree", search: "Special:Search?search=%s&go=Go" },
    "crh" : { language: "Crimean Tatar", search: "Mahsus:Search?search=%s&go=Bar" },
    "cs" : { language: "Czech", search: "Speci%C3%A1ln%C3%AD:Search?search=%s&go=J%C3%ADt+na" },
    "csb" : { language: "Kashubian", search: "Specjaln%C3%B4:Search?search=%s&go=Bi%C3%B4j%21" },
    "cu" : { language: "Old Church Slavonic", search: "%D0%9D%D0%B0%D1%80%D0%BE%CC%81%D1%87%D1%8C%D0%BD%D0%B0:Search?search=%s&go=%D0%BF%D1%80%D1%A3%D0%B8%D0%B4%D0%B8%CC%81" },
    "cv" : { language: "Chuvash", search: "%D0%AF%D1%82%D0%B0%D1%80%D0%BB%C4%83:Search?search=%s&go=%D0%9A%D1%83%C3%A7" },
    "cy" : { language: "Welsh", search: "Arbennig:Search?search=%s&go=Mynd" },
    "da" : { language: "Danish", search: "Speciel:S%C3%B8gning?search=%s&go=G%C3%A5+til" },
    "de" : { language: "German", search: "Spezial:Suche?search=%s&go=Artikel" },
    "diq" : { language: "Zazaki", search: "Special:Search?search=%s&go=%C5%9Eo" },
    "dsb" : { language: "Lower Sorbian", search: "Specialne:Pyta%C5%9B?search=%s&go=Nastawk" },
    "dv" : { language: "Divehi", search: "Special:Search?search=%s&go=Go" },
    "dz" : { language: "Dzongkha", search: "Special:Search?search=%s&go=%E0%BD%A0%E0%BD%82%E0%BE%B1%E0%BD%BC%E0%BC%8D" },
    "ee" : { language: "Ewe", search: "Special:Search?search=%s&go=Yi" },
    "el" : { language: "Greek", search: "%CE%95%CE%B9%CE%B4%CE%B9%CE%BA%CF%8C:%CE%91%CE%BD%CE%B1%CE%B6%CE%AE%CF%84%CE%B7%CF%83%CE%B7?search=%s&go=%CE%9C%CE%B5%CF%84%CE%AC%CE%B2%CE%B1%CF%83%CE%B7" },
    "eml" : { language: "Emilian-Romagnol", search: "Speciale:Ricerca?search=%s&go=Vai" },
    "en" : { language: "English", search: "Special:Search?search=%s&go=Go" },
    "eo" : { language: "Esperanto", search: "Speciala:Ser%C4%89i?search=%s&go=Ek%21" },
    "es" : { language: "Spanish", search: "Especial:Buscar?search=%s&go=Ir" },
    "et" : { language: "Estonian", search: "Eri:Search?search=%s&go=Mine" },
    "eu" : { language: "Basque", search: "Berezi:Search?search=%s&go=Joan" },
    "fa" : { language: "Farsi", search: "%D9%88%DB%8C%DA%98%D9%87:%D8%AC%D8%B3%D8%AA%D8%AC%D9%88?search=%s&go=%D8%A8%D8%B1%D9%88" },
    "ff" : { language: "Fula", search: "Special:Recherche?search=%s&go=Consulter" },
    "fi" : { language: "Finnish", search: "Toiminnot:Haku?search=%s&go=Siirry" },
    // TODO: fiu-vro - Võro
    "fj" : { language: "Fijian", search: "Special:Search?search=%s&go=Lako" },
    "fo" : { language: "Faroese", search: "Serstakur:Leita?search=%s&go=Far" },
    "fr" : { language: "French", search: "Special:Recherche?search=%s&go=Consulter" },
    "frp" : { language: "Franco-Provençal/Arpitan", search: "Sp%C3%A8ci%C3%A2l:Recherche?search=%s&go=Alar" },
    "fur" : { language: "Friulian", search: "Speci%C3%A2l:Ricercje?search=%s&go=Va" },
    "fy" : { language: "West Frisian", search: "Wiki:Sykje?search=%s&go=Side" },
    "ga" : { language: "Irish", search: "Speisialta:Search?search=%s&go=Gabh" },
    "gd" : { language: "Scottish Gaelic", search: "Special:Search?search=%s&go=Go" },
    "gl" : { language: "Galician", search: "Especial:Procurar?search=%s&go=Artigo" },
    "glk" : { language: "Gilaki", search: "%D9%88%DB%8C%DA%98%D9%87:%D8%AC%D8%B3%D8%AA%D8%AC%D9%88?search=%s&go=%D8%A8%D9%88%D8%B4%D9%88" },
    "gn" : { language: "Guarani", search: "Mba%27ech%C4%A9ch%C4%A9:Buscar?search=%s&go=Ha" },
    "got" : { language: "Gothic", search: "Special:Search?search=%s&go=%F0%90%8C%B0%F0%90%8D%86%F0%90%8C%B2%F0%90%8C%B0%F0%90%8C%B2%F0%90%8C%B2%F0%90%8C%B0%F0%90%8C%BD" },
    "gu" : { language: "Gujarati", search: "Special:Search?search=%s&go=%E0%AA%9C%E0%AA%BE%E0%AA%93" },
    "gv" : { language: "Manx", search: "Special:Search?search=%s&go=Gow" },
    "ha" : { language: "Hausa", search: "Special:Search?search=%s&go=Go" },
    "hak" : { language: "Hakka", search: "Special:Search?search=%s&go=Chin-ngi%CC%8Dp" },
    "haw" : { language: "Hawaiian", search: "Special:Search?search=%s&go=Hele" },
    "he" : { language: "Hebrew", search: "%D7%9E%D7%99%D7%95%D7%97%D7%93:%D7%97%D7%99%D7%A4%D7%95%D7%A9?search=%s&go=%D7%9C%D7%A2%D7%A8%D7%9A" },
    "hi" : { language: "Hindi", search: "%E0%A4%B5%E0%A4%BF%E0%A4%B6%E0%A5%87%E0%A4%B7:Search?search=%s&go=%E0%A4%9C%E0%A4%BE%E0%A4%8F%E0%A4%81" },
    "ho" : { language: "Hiri Motu", search: "Special:Search?search=%s&go=Go" },
    "hr" : { language: "Croatian", search: "Posebno:Tra%C5%BEi?search=%s&go=Kreni" },
    "hsb" : { language: "Upper Sorbian", search: "Specialnje:Pyta%C4%87?search=%s&go=Nastawk" },
    "ht" : { language: "Haitian", search: "Espesyal:Chache?search=%s&go=Ale" },
    "hu" : { language: "Hungarian", search: "Speci%C3%A1lis:Keres%C3%A9s?search=%s&go=Menj" },
    "hy" : { language: "Armenian", search: "%D5%8D%D5%BA%D5%A1%D5%BD%D5%A1%D6%80%D5%AF%D5%B8%D5%B2:%D5%88%D6%80%D5%B8%D5%B6%D5%A5%D5%AC?search=%s&go=%D4%B1%D5%B6%D6%81%D5%B6%D5%A5%D5%AC" },
    "hz" : { language: "Herero", search: "Special:Search?search=%s&go=Go" },
    "ia" : { language: "Interlingua", search: "Special:Cercar?search=%s&go=Ir" },
    "id" : { language: "Indonesian", search: "Istimewa:Pencarian?search=%s&go=Tuju+ke" },
    "ie" : { language: "Interlingue", search: "Special:Search?search=%s&go=Vade" },
    "ig" : { language: "Igbo", search: "Special:Search?search=%s&go=Go" },
    "ii" : { language: "Sichuan Yi", search: "Special:Search?search=%s&go=%E8%BF%9B%E5%85%A5" },
    "ik" : { language: "Inupiak", search: "Special:Search?search=%s&go=Go" },
    "ilo" : { language: "Ilokano", search: "Special:Search?search=%s&go=Inkan" },
    "io" : { language: "Ido", search: "Specala:Search?search=%s&go=Irez" },
    "is" : { language: "Icelandic", search: "Kerfiss%C3%AD%C3%B0a:Leit?search=%s&go=%C3%81fram" },
    "it" : { language: "Italian", search: "Speciale:Ricerca?search=%s&go=Vai" },
    "iu" : { language: "Inuktitut", search: "Special:Search?search=%s&go=%E1%90%8A%E1%90%83%E1%95%97%E1%96%85" },
    "ja" : { language: "Japanese", search: "%E7%89%B9%E5%88%A5:%E6%A4%9C%E7%B4%A2?search=%s&go=%E8%A1%A8%E7%A4%BA" },
    "jbo" : { language: "Lojban", search: "Special:Search?search=%s&go=jarco" },
    "jv" : { language: "Javanese", search: "Astamiwa:Pencarian?search=%s&go=Tumuju" },
    "ka" : { language: "Georgian", search: "%E1%83%A1%E1%83%9E%E1%83%94%E1%83%AA%E1%83%98%E1%83%90%E1%83%9A%E1%83%A3%E1%83%A0%E1%83%98:%E1%83%AB%E1%83%98%E1%83%94%E1%83%91%E1%83%90?search=%s&go=%E1%83%A1%E1%83%A2%E1%83%90%E1%83%A2%E1%83%98%E1%83%90" },
    "kab" : { language: "Kabyle", search: "Uslig:Search?search=%s&go=%E1%BA%92er" },
    "kg" : { language: "Kongo", search: "Special:Search?search=%s&go=Kuenda" },
    "ki" : { language: "Kikuyu", search: "Special:Search?search=%s&go=Go" },
    "kj" : { language: "Kuanyama", search: "Special:Search?search=%s&go=Go" },
    "kk" : { language: "Kazakh", search: "%D0%90%D1%80%D0%BD%D0%B0%D0%B9%D1%8B:%D0%86%D0%B7%D0%B4%D0%B5%D1%83?search=%s&go=%D3%A8%D1%82%21" },
    "kl" : { language: "Greenlandic", search: "Speciel:S%C3%B8gning?search=%s&go=Pisuppoq" },
    "km" : { language: "Khmer", search: "%E1%9E%96%E1%9E%B7%E1%9E%9F%E1%9F%81%E1%9E%9F:%E1%9E%9F%E1%9F%92%E1%9E%9C%E1%9F%82%E1%9E%84%E1%9E%9A%E1%9E%80?search=%s&go=%E1%9E%91%E1%9F%85" },
    "kn" : { language: "Kannada", search: "%E0%B2%B5%E0%B2%BF%E0%B2%B6%E0%B3%87%E0%B2%B7:Search?search=%s&go=%E0%B2%B9%E0%B3%8B%E0%B2%97%E0%B3%81" },
    "ko" : { language: "Korean", search: "%ED%8A%B9%EC%88%98%EA%B8%B0%EB%8A%A5:%EC%B0%BE%EA%B8%B0?search=%s&go=%EA%B0%80%EA%B8%B0" },
    "kr" : { language: "Kanuri", search: "Special:Search?search=%s&go=Go" },
    "ks" : { language: "Kashmiri", search: "Special:Search?search=%s&go=Go" },
    "ksh" : { language: "Riuparian", search: "Spezial:S%C3%B6k?search=%s&go=Sigg" },
    "ku" : { language: "Kurdish", search: "Taybet:Search?search=%s&go=Gotar" },
    "kv" : { language: "Komi", search: "%D0%A1%D0%BB%D1%83%D0%B6%D0%B5%D0%B1%D0%BD%D0%B0%D1%8F:Search?search=%s&go=%D0%92%D1%83%D0%B4%D0%B6%D0%BD%D1%8B" },
    "kw" : { language: "Cornish", search: "Special:Search?search=%s&go=Ke" },
    "ky" : { language: "Kirghiz", search: "Special:Search?search=%s&go=Go" },
    "la" : { language: "Latin", search: "Specialis:Quaerere?search=%s&go=Ire" },
    "lad" : { language: "Ladino", search: "Especial:Buscar?search=%s&go=Yir" },
    "lb" : { language: "Luxembourgish", search: "Spezial:Sichen?search=%s&go=S%C3%A4it" },
    "lbe" : { language: "Lak", search: "%D0%9A%D1%8A%D1%83%D0%BB%D0%BB%D1%83%D0%B3%D1%8A%D0%B8%D1%80%D0%B0%D0%BB_%D0%BB%D0%B0%D0%B6%D0%B8%D0%BD:Search?search=%s&go=%D0%9F%D0%B5%D1%80%D0%B5%D0%B9%D1%82%D0%B8" },
    "lg" : { language: "Luganda", search: "Special:Search?search=%s&go=Nona" },
    "li" : { language: "Limburgish", search: "Speciaal:Zeuke?search=%s&go=Artikel" },
    "lij" : { language: "Ligurian", search: "Speciale:Ri%C3%A7erca?search=%s&go=Vanni" },
    "lmo" : { language: "Lombard", search: "Speciale:Ricerca?search=%s&go=V%C3%A0" },
    "ln" : { language: "Lingala", search: "Special:Recherche?search=%s&go=K%C9%9Bnd%C9%9B%CC%81" },
    "lo" : { language: "Lao", search: "%E0%BA%9E%E0%BA%B4%E0%BB%80%E0%BA%AA%E0%BA%94:%E0%BA%8A%E0%BA%AD%E0%BA%81%E0%BA%AB%E0%BA%B2?search=%s&go=%E0%BB%84%E0%BA%9B" },
    "lt" : { language: "Lithuanian", search: "Specialus:Paie%C5%A1ka?search=%s&go=Rodyti" },
    "lv" : { language: "Latvian", search: "Special:Search?search=%s&go=Aiziet%21" },
    // TODO: map-bms - Banyumasan
    "mg" : { language: "Malagasy", search: "Special:Recherche?search=%s&go=Tsidiho" },
    "mh" : { language: "Marshallese", search: "Special:Search?search=%s&go=Go" },
    "mi" : { language: "Maori", search: "Special:Search?search=%s&go=Haere" },
    "mk" : { language: "Macedonian", search: "%D0%A1%D0%BF%D0%B5%D1%86%D0%B8%D1%98%D0%B0%D0%BB%D0%BD%D0%B8:%D0%91%D0%B0%D1%80%D0%B0%D1%98?search=%s&go=%D0%9E%D0%B4%D0%B8" },
    "ml" : { language: "Malayalam", search: "%E0%B4%AA%E0%B5%8D%E0%B4%B0%E0%B4%A4%E0%B5%8D%E0%B4%AF%E0%B5%87%E0%B4%95%E0%B4%82:Search?search=%s&go=%E0%B4%AA%E0%B5%8B%E0%B4%95%E0%B5%82" },
    "mn" : { language: "Mongolian", search: "Special:Search?search=%s&go=%D0%AF%D0%B2%D0%B0%D1%85" },
    "mo" : { language: "Moldovan", search: "Special:C%C4%83utare?search=%s&go=%D0%94%D1%83%D1%87%D0%B5" },
    "mr" : { language: "Marathi", search: "%E0%A4%B5%E0%A4%BF%E0%A4%B6%E0%A5%87%E0%A4%B7:%E0%A4%B6%E0%A5%8B%E0%A4%A7%E0%A4%BE?search=%s&go=%E0%A4%B2%E0%A5%87%E0%A4%96" },
    "ms" : { language: "Malay", search: "Khas:Gelintar?search=%s&go=Pergi" },
    "mt" : { language: "Maltese", search: "Special:Fittex?search=%s&go=Mur" },
    "mus" : { language: "Muscogee", search: "Special:Search?search=%s&go=Go" },
    "my" : { language: "Burmese", search: "Special:Search?search=%s&go=%E1%80%9E%E1%80%BD%E1%80%AC%E1%80%B8%E2%80%8B%E1%80%95%E1%80%AB%E2%80%8B" },
    "mzn" : { language: "Mazandarani", search: "%D9%88%DB%8C%DA%98%D9%87:%D8%AC%D8%B3%D8%AA%D8%AC%D9%88?search=%s&go=%D8%A8%D9%88%D8%B1" },
    "na" : { language: "Nauruan", search: "Special:Search?search=%s&go=Go" },
    "nah" : { language: "Nahuatl", search: "N%C5%8Dncuahqu%C4%ABzqui:Tlat%C4%93m%C5%8Dz?search=%s&go=Y%C4%81uh" },
    "nap" : { language: "Neapolitan", search: "Speci%C3%A0le:Ricerca?search=%s&go=Vaje" },
    "nds" : { language: "Low Saxon", search: "Spezial:S%C3%B6%C3%B6k?search=%s&go=Los" },
    "ne" : { language: "Nepali", search: "Special:Search?search=%s&go=%E0%A4%9C%E0%A4%BE%E0%A4%89" },
    "new" : { language: "Newar/Nepal Bhasa", search: "%E0%A4%B5%E0%A4%BF%E0%A4%B6%E0%A5%87%E0%A4%B7:Search?search=%s&go=%E0%A4%A5%E0%A5%8D%E0%A4%B5+%E0%A4%9A%E0%A5%8D%E0%A4%B5%E0%A4%B8%E0%A5%81" },
    "ng" : { language: "Ndonga", search: "Special:Search?search=%s&go=Go" },
    "nl" : { language: "Dutch", search: "Speciaal:Zoeken?search=%s&go=Artikel" },
    "nn" : { language: "Norwegian (nynorsk)", search: "Spesial:S%C3%B8k?search=%s&go=Vis" },
    "no" : { language: "Norwegian (bokmål)", search: "Spesial:S%C3%B8k?search=%s&go=G%C3%A5" },
    "nov" : { language: "Novial", search: "Special:Search?search=%s&go=Vada" },
    "nrm" : { language: "Norman", search: "Special:Search?search=%s&go=Lanchiz" },
    "nv" : { language: "Navajo", search: "Special:Search?search=%s&go=Go" },
    "ny" : { language: "Chichewa", search: "Special:Search?search=%s&go=Pitani" },
    "oc" : { language: "Occitan", search: "Especial:Rec%C3%A8rca?search=%s&go=Consultar" },
    "om" : { language: "Oromo", search: "Special:Search?search=%s&go=Fufi" },
    "or" : { language: "Oriya", search: "Special:Search?search=%s&go=Go" },
    "os" : { language: "Ossetian", search: "%D0%A1%C3%A6%D1%80%D0%BC%D0%B0%D0%B3%D0%BE%D0%BD%D0%B4:Search?search=%s&go=%D0%A1%D1%82%D0%B0%D1%82%D1%8C%D1%8F%D0%BC%C3%A6" },
    "pa" : { language: "Punjabi", search: "%E0%A8%96%E0%A8%BE%E0%A8%B8:Search?search=%s&go=%E0%A8%9C%E0%A8%BE%E0%A8%93" },
    "pag" : { language: "Pangasinan", search: "Special:Search?search=%s&go=Ula" },
    "pam" : { language: "Kapampangan", search: "Special:Search?search=%s&go=Sulung" },
    "pap" : { language: "Papiamentu", search: "Special:Search?search=%s&go=Go" },
    "pdc" : { language: "Pennsylvania German", search: "Spezial:Suche?search=%s&go=Seite" },
    "pi" : { language: "Pali", search: "Special:Search?search=%s&go=%E0%A4%97%E0%A4%9A%E0%A5%8D%E0%A4%9B%E0%A4%BE%E0%A4%AE%E0%A4%BF" },
    "pih" : { language: "Norfolk", search: "Special:Search?search=%s&go=Go" },
    "pl" : { language: "Polish", search: "Specjalna:Szukaj?search=%s&go=Przejd%C5%BA" },
    "pms" : { language: "Piedmontese", search: "Special:Ricerca?search=%s&go=Va" },
    "ps" : { language: "Pashto", search: "%DA%81%D8%A7%D9%86%DA%AB%DA%93%DB%8C:%D9%84%D9%BC%D9%88%D9%86?search=%s&go=%D9%88%D8%B1%DA%81%D9%87" },
    "pt" : { language: "Portuguese", search: "Especial:Busca?search=%s&go=Ir" },
    "qu" : { language: "Quechua", search: "Sapaq:Maskay?search=%s&go=Riy" },
    "rm" : { language: "Romansh", search: "Special:Search?search=%s&go=dai%21" },
    "rmy" : { language: "Vlax Romani", search: "Uzalutno:C%C4%83utare?search=%s&go=Ja" },
    "rn" : { language: "Kirundi", search: "Special:Search?search=%s&go=Go" },
    "ro" : { language: "Romanian", search: "Special:C%C4%83utare?search=%s&go=Salt" },
    // TODO: roa-rup - Aromanian
    // TODO: roa-tara - Tarantino
    "ru" : { language: "Russian", search: "%D0%A1%D0%BB%D1%83%D0%B6%D0%B5%D0%B1%D0%BD%D0%B0%D1%8F:Search?search=%s&go=%D0%9F%D0%B5%D1%80%D0%B5%D0%B9%D1%82%D0%B8" },
    "rw" : { language: "Kinyarwanda", search: "Special:Search?search=%s&go=Go" },
    "sa" : { language: "Sanskrit", search: "Special:Search?search=%s&go=%E0%A4%9C%E0%A4%BE%E0%A4%AF%E0%A5%87%E0%A4%82" },
    "sah" : { language: "Sakha", search: "%D0%90%D0%BD%D0%B0%D0%BB%D0%BB%D0%B0%D0%B0%D1%85:Search?search=%s&go=%D0%9A%D3%A9%D1%80%D0%B4%D3%A9%D1%80" },
    "sc" : { language: "Sardinian", search: "Speciale:Search?search=%s&go=Bae" },
    "scn" : { language: "Sicilian", search: "Spiciali:Ricerca?search=%s&go=Vai" },
    "sco" : { language: "Scots", search: "Special:Search?search=%s&go=Gang" },
    "sd" : { language: "Sindhi", search: "Special:%DA%B3%D9%88%D9%84%D8%A7?search=%s&go=%DA%A9%D9%88%D9%84%D9%8A%D9%88" },
    "se" : { language: "Nortern Sami", search: "Special:Search?search=%s&go=Mana" },
    "sg" : { language: "Sango", search: "Special:Search?search=%s&go=Go" },
    "sh" : { language: "Serbo-Croatian", search: "Special:Search?search=%s&go=Go" },
    "si" : { language: "Sinhalese", search: "%E0%B7%80%E0%B7%92%E0%B7%81%E0%B7%9A%E0%B7%82:%E0%B6%9C%E0%B7%80%E0%B7%9A%E0%B7%82%E0%B6%AB%E0%B6%BA?search=%s&go=%E0%B6%BA%E0%B6%B1%E0%B7%8A%E0%B6%B1" },
    "simple" : { language: "Simple English", search: "Special:Search?search=%s&go=Go" },
    "sk" : { language: "Slovak", search: "%C5%A0peci%C3%A1lne:Search?search=%s&go=%C3%8Ds%C5%A5+na" },
    "sl" : { language: "Slovenian", search: "Posebno:Search?search=%s&go=Pojdi+na" },
    "sm" : { language: "Samoan", search: "Special:Search?search=%s&go=Alu" },
    "sn" : { language: "Shona", search: "Special:Search?search=%s&go=Enda" },
    "so" : { language: "Somali", search: "Special:Search?search=%s&go=Soco" },
    "sq" : { language: "Albanian", search: "Speciale:K%C3%ABrkim?search=%s&go=Shko" },
    "sr" : { language: "Serbian", search: "%D0%9F%D0%BE%D1%81%D0%B5%D0%B1%D0%BD%D0%BE:Search?search=%s&go=%D0%98%D0%B4%D0%B8" },
    "ss" : { language: "Swati", search: "Special:Search?search=%s&go=K%C3%BAh%C3%A1mba" },
    "st" : { language: "Sesotho", search: "Special:Search?search=%s&go=Go" },
    "stq" : { language: "Saterland Frisian", search: "Spezial:Suche?search=%s&go=Siede" },
    "su" : { language: "Sundanese", search: "Husus:Sungsi?search=%s&go=Jung" },
    "sv" : { language: "Swedish", search: "Special:S%C3%B6k?search=%s&go=G%C3%A5+till" },
    "sw" : { language: "Swahili", search: "Special:Search?search=%s&go=Nenda" },
    "szl" : { language: "Silesian", search: "Specjalna:Szukaj?search=%s&go=P%C5%99y%C5%84d%C5%BA" },
    "ta" : { language: "Tamil", search: "%E0%AE%9A%E0%AE%BF%E0%AE%B1%E0%AE%AA%E0%AF%8D%E0%AE%AA%E0%AF%81:Search?search=%s&go=%E0%AE%9A%E0%AF%86%E0%AE%B2%E0%AF%8D" },
    "te" : { language: "Telugu", search: "%E0%B0%AA%E0%B1%8D%E0%B0%B0%E0%B0%A4%E0%B1%8D%E0%B0%AF%E0%B1%87%E0%B0%95:%E0%B0%85%E0%B0%A8%E0%B1%8D%E0%B0%B5%E0%B1%87%E0%B0%B7%E0%B0%A3?search=%s&go=%E0%B0%B5%E0%B1%86%E0%B0%B3%E0%B1%8D%E0%B0%B2%E0%B1%81" },
    "tet" : { language: "Tetum", search: "Espesi%C3%A1l:Buka?search=%s&go=P%C3%A1jina" },
    "tg" : { language: "Tajik", search: "%D0%92%D0%B8%D0%B6%D0%B0:Search?search=%s&go=%D0%91%D0%B8%D1%80%D0%B0%D0%B2" },
    "th" : { language: "Thai", search: "%E0%B8%9E%E0%B8%B4%E0%B9%80%E0%B8%A8%E0%B8%A9:%E0%B8%84%E0%B9%89%E0%B8%99%E0%B8%AB%E0%B8%B2?search=%s&go=%E0%B9%84%E0%B8%9B" },
    "ti" : { language: "Tigrinya", search: "Special:Search?search=%s&go=Go" },
    "tk" : { language: "Turkmen", search: "Special:Search?search=%s&go=Git" },
    "tl" : { language: "Tagalog", search: "Natatangi:Search?search=%s&go=Punta" },
    "tn" : { language: "Tswana", search: "Special:Search?search=%s&go=Tsamaya" },
    "to" : { language: "Tongan", search: "Special:Search?search=%s&go=Fai+%C4%81" },
    "tokipona" : { language: "Tokipona", search: "Special:Search?search=%s&go=Go" },
    "tpi" : { language: "Tok Pisin", search: "Special:Search?search=%s&go=Go" },
    "tr" : { language: "Turkish", search: "%C3%96zel:Ara?search=%s&go=Git" },
    "ts" : { language: "Tsonga", search: "Special:Search?search=%s&go=Nghena" },
    "tt" : { language: "Tatar", search: "Maxsus:Search?search=%s&go=K%C3%BC%C3%A7" },
    "tum" : { language: "Tumbuka", search: "Special:Search?search=%s&go=Go" },
    "tw" : { language: "Twi", search: "Special:Search?search=%s&go=Go" },
    "ty" : { language: "Tahitian", search: "Special:Recherche?search=%s&go=Haere" },
    "udm" : { language: "Udmurt", search: "%D0%9F%D0%B0%D0%BD%D0%B5%D0%BB%D1%8C:Search?search=%s&go=%D0%9F%D0%B5%D1%80%D0%B5%D0%B9%D1%82%D0%B8" },
    "ug" : { language: "Uyghur", search: "Special:Search?search=%s&go=Kuchush" },
    "uk" : { language: "Ukranian", search: "%D0%A1%D0%BF%D0%B5%D1%86%D1%96%D0%B0%D0%BB%D1%8C%D0%BD%D0%B0:Search?search=%s&go=%D0%9F%D0%B5%D1%80%D0%B5%D0%B9%D1%82%D0%B8" },
    "ur" : { language: "Urdu", search: "%D8%AE%D8%A7%D8%B5:Search?search=%s&go=%D8%AD%D8%B1%DA%A9%D8%AA" },
    "uz" : { language: "Uzbek", search: "Maxsus:Search?search=%s&go=O%27tish" },
    "ve" : { language: "Venda", search: "Special:Search?search=%s&go=Go" },
    "vec" : { language: "Venetian", search: "Speciale:Serca?search=%s&go=V%C3%A0" },
    "vi" : { language: "Vietnamese", search: "%C4%90%E1%BA%B7c_bi%E1%BB%87t:T%C3%ACm_ki%E1%BA%BFm?search=%s&go=Xem" },
    "vls" : { language: "West Flemish", search: "Specioal:Zoeken?search=%s&go=OK" },
    "vo" : { language: "Volapük", search: "Patikos:Suk?search=%s&go=Getol%C3%B6d" },
    "wa" : { language: "Walloon", search: "Sipeci%C3%A5s:Recherche?search=%s&go=Potch%C3%AE" },
    "war" : { language: "Waray-Waray", search: "Special:Bilnga?search=%s&go=Kadto-a" },
    "wo" : { language: "Wolof", search: "Special:Ceet?search=%s&go=Ayca" },
    "wuu" : { language: "Wu", search: "Special:Search?search=%s&go=%E8%BF%9B%E5%85%A5" },
    "xal" : { language: "Kalmyk", search: "%D0%9A%D3%A9%D0%B4%D0%BB%D1%85%D0%BD%C9%99:Search?search=%s&go=Go" },
    "xh" : { language: "Xhosa", search: "Special:Search?search=%s&go=Hamba" },
    "yi" : { language: "Yiddish", search: "%D7%91%D7%90%D6%B7%D7%96%D7%95%D7%A0%D7%93%D7%A2%D7%A8:%D7%96%D7%95%D7%9B%D7%9F?search=%s&go=%D7%92%D7%99%D7%99" },
    "yo" : { language: "Yoruba", search: "P%C3%A0t%C3%A0k%C3%AC:Search?search=%s&go=%C3%93+y%C3%A1%21" },
    "za" : { language: "Zhuang", search: "Special:Search?search=%s&go=Bei" },
    "zea" : { language: "Zealandic", search: "Speciaol:Zoeken?search=%s&go=Bladzie" },
    "zh" : { language: "Chinese", search: "Special:Search?search=%s&go=%E8%BF%9B%E5%85%A5" },
    // TODO: zh-classical - Classical Chinese
    // TODO: zh-min-nan - Min Nan
    "zu" : { language: "Zulu", search: "Special:Search?search=%s&go=Go" }
}, "Wikipedia version information. The key is the language code for the Wikipedia.");

provide("wikipedia");
