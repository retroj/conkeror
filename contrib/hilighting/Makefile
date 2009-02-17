default: dirs elisp

dirs:
	-mkdir bin

elisp: alex
	ghc -ihaskell --make -O -o bin/emacs-lisp syntaxes/emacs-lisp.hs

clean:
	rm -f elisp.hs
	rm -f *.o *.hi
	rm -f syntaxes/*.hs
	rm -f haskell/*.hi haskell/*.o
	rm -rf bin/*
	rm -f syntaxes/*.hi syntaxes/*.o

alex:
	alex -g syntaxes/*.x
