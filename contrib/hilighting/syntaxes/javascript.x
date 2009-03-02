-- (C) Copyright 2009 Deniz Dogan
--
-- TODO: Create a custom wrapper which can handle the internal state, to
-- properly colorize multi-line comments.

{

module Main where

import System
import Colorize

}

%wrapper "basic"

@var = [a-zA-Z0-9\-\_\$]+
@keyword = for | var | let | while | function | with
@operator = "/"   | "+"   | "++"  | "--"  | "-"   | "%"   | "!="  | "=="
          | "===" | "="   | "<"   | ">"   | "<="  | ">="
@special = [\;\(\)\]\[\}\{]

tokens :-

<0> {

"/*".*               { MultiLineComm } -- TODO: See top of this file.
"//".*               { Comment }
@keyword             { Keyword }
@special             { Special }
@var                 { Variable }
@operator            { Operator }
\" ([^\"] | \n )* \" { Str }
\n                   { const NewLine }
\t                   { const Tab }
" "                  { const WhiteSpace }
.                    { Other }

}

{

data Token = WhiteSpace
           | Str !String
           | Comment !String
           | Keyword !String
           | Variable !String
           | Special !String
           | Operator !String
           | MultiLineComm !String
           | NewLine
           | Tab
           | Other !String
             deriving Eq

instance Show Token where
    show (Str s) = stringC s
    show (Comment s) = commentC s
    show (Keyword s) = keywordC s
    show (Operator s) = operatorC s
    show NewLine = "<br/>"
    show WhiteSpace = "&nbsp;"
    show (MultiLineComm s) = s
    show (Variable s) = variableC s
    show (Special s) = specialC s
    show Tab = concat $ replicate 8 "&nbsp;"
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
  putStrLn "<html><body><code>"
  mapM_ (putStr . show) $ alexScanTokens contents
  putStrLn "</code></body></html>"

}
