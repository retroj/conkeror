.PHONY: clean

CFLAGS = -O2 -g

spawn-process-helper: spawn-process-helper.c

clean:
	rm -f spawn-process-helper
