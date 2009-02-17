-- (C) Copyright 2009 Deniz Dogan

{

module Main where

import System
import Colorize

}

%wrapper "basic"

$atomstart = [a-zA-Z]
@atomend = [a-zA-Z0-9\-]+
@atom = $atomstart @atomend
@keyword = \: @atom
@optional = \& @atom

tokens :-

<0> {

";".*                { Comment }
@keyword             { Keyword }
@atom                { Atom }
@optional            { Optional }
\(                   { const LeftParen }
\)                   { const RightParen }
\'                   { const Quote }
\" ([^\"] | \n )* \" { Str }
\n                   { const NewLine }
\t                   { const Tab }
" "                  { const WhiteSpace }
.                    { Other }

}

{

data Token = LeftParen
           | RightParen
           | Quote
           | WhiteSpace
           | Atom !String
           | Str !String
           | Comment !String
           | Keyword !String
           | NewLine
           | Tab
           | Optional !String
           | Other !String
             deriving Eq

instance Show Token where
    show LeftParen = specialC "("
    show RightParen = specialC ")"
    show Quote = "'"
    show (Atom s) = s
    show (Str s) = s
    show (Comment s) = s
    show (Keyword s) = s
    show NewLine = "<br/>"
    show WhiteSpace = " "
    show Tab = "  "
    show (Optional s) = s
    show (Other s) = s

-- | If the user supplied arguments, takes those arguments as filenames, reads
--   the contents from those files, concatenates them and returns the result.
--   Otherwise, reads from stdin and returns the result.
argsOrContents :: IO String
argsOrContents = do
  args <- getArgs
  if null args
     then getContents
     else do x <- mapM readFile args
             return $ concat x

main = do
  contents <- argsOrContents
  putStrLn "<html><body>"
  mapM_ (putStr . show) $ alexScanTokens contents
  putStrLn "</body></html>"

}
