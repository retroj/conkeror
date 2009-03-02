default: dirs elisp javascript

dirs:
	-mkdir bin

elisp:
	alex -g syntaxes/emacs-lisp.x
	ghc -ihaskell --make -O -o bin/emacs-lisp syntaxes/emacs-lisp.hs

javascript:
	alex -g syntaxes/javascript.x
	ghc -ihaskell --make -O -o bin/javascript syntaxes/javascript.hs

clean:
	rm -f elisp.hs
	rm -f *.o *.hi
	rm -f syntaxes/*.hs
	rm -f haskell/*.hi haskell/*.o
	rm -rf bin/*
	rm -f syntaxes/*.hi syntaxes/*.o
