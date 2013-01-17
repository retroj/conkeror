.PHONY: clean

CFLAGS ?= -O2 -g

conkeror-spawn-helper: conkeror-spawn-helper.c

clean:
	rm -f conkeror-spawn-helper
