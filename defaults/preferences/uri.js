/**
 * (C) Copyright 2007f Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

// 0=default window, 1=current window/tab, 2=new window, 3=new tab in most recent window

pref("browser.link.open_external", 3); // open externally-launched links in a new window

// handle links targeting new windows

pref("browser.link.open_newwindow", 3);


// 0: no restrictions - divert everything
// 1: don't divert window.open at all
// 2: don't divert window.open with features
pref("browser.link.open_newwindow.restriction", 0);
