# conkeror: a programmable web browser based on Mozilla XULRunner

CFLAGS ?= -O2 -g
PREFIX ?= /usr/local
MANPREFIX ?= $(PREFIX)/share/man
SHELL ?= /bin/sh

tagged_files != find . -name '*.js'
BUILDDIR != pwd
VERSION != grep '^Version=' application.ini | cut -d '=' -f 2

dirs = branding chrome components content defaults help locale modules search-engines style
files = application.ini chrome.manifest content-policy.manifest Info.plist
contrib = contrib/art contrib/list-xulrunner-versions contrib/modules contrib/run-conkeror contrib/xrev
docs = COPYING CREDITS contrib/config

all: conkeror conkeror-bin conkeror-spawn-helper

clean:
	$(RM) conkeror conkeror-bin conkeror-spawn-helper conkeror-$(VERSION).tar.gz TAGS
	$(RM) -r conkeror-$(VERSION)

conkeror: conkeror.in
	sed 's:@datadir@:$(BUILDDIR):g' $? > $@
	chmod +x $@

conkeror-bin: conkeror.in
	sed 's:@datadir@:$(PREFIX)/share/conkeror:g' $? > $@

conkeror-spawn-helper: conkeror-spawn-helper.c

conkeror-$(VERSION).tar.gz:
	mkdir conkeror-$(VERSION)
	cp -a $(dirs) $(files) \
	      conkeror.in conkeror-spawn-helper.c COPYING CREDITS contrib README Makefile tests \
	      conkeror-$(VERSION)
	tar czf conkeror-$(VERSION).tar.gz conkeror-$(VERSION)
	$(RM) -r conkeror-$(VERSION)

dist: conkeror-$(VERSION).tar.gz

etags: TAGS

install: all $(dirs) $(files) $(contrib) $(docs)
	install -D -m644 contrib/man/conkeror.1 \
			 "$(DESTDIR)/$(MANPREFIX)/man1/conkeror.1"
	install -D -m644 contrib/conkeror.desktop \
			 "$(DESTDIR)/$(PREFIX)/share/applications/conkeror.desktop"
	install -D -m755 conkeror-bin "$(DESTDIR)/$(PREFIX)/bin/conkeror"
	install -D -m755 conkeror-spawn-helper \
			 "$(DESTDIR)/$(PREFIX)/bin/conkeror-spawn-helper"
	mkdir -p "$(DESTDIR)/$(PREFIX)/share/conkeror/contrib"
	cp -a $(dirs) $(files) "$(DESTDIR)/$(PREFIX)/share/conkeror"
	cp -a $(contrib) "$(DESTDIR)/$(PREFIX)/share/conkeror/contrib"
	mkdir -p "$(DESTDIR)/$(PREFIX)/share/doc/conkeror"
	cp -a $(docs) "$(DESTDIR)/$(PREFIX)/share/doc/conkeror"

# Don't use this. Learn to use your distribution's packaging tools.
uninstall:
	$(RM) "$(DESTDIR)/$(MANPREFIX)/man1/conkeror.1"
	$(RM) "$(DESTDIR)/$(PREFIX)/share/applications/conkeror.desktop"
	$(RM) "$(DESTDIR)/$(PREFIX)/bin/conkeror"
	$(RM) "$(DESTDIR)/$(PREFIX)/bin/conkeror-spawn-helper"
	$(RM) -r "$(DESTDIR)/$(PREFIX)/share/conkeror/"
	$(RM) -r "$(DESTDIR)/$(PREFIX)/share/doc/conkeror/"

TAGS:
	@etags $(tagged_files)

.PHONY: clean dist etags install uninstall
