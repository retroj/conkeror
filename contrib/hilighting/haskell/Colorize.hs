-- (C) Copyright 2009 Deniz Dogan

module Colorize where

stringC s   = "<span style=\"color: yellow\">" ++ s ++ "</span>"
commentC s  = "<span style=\"color: orange\">" ++ s ++ "</span>"
keywordC s  = "<span style=\"color: green\">"  ++ s ++ "</span>"
variableC s = "<span style=\"color: red\">"    ++ s ++ "</span>"
specialC s  = "<span style=\"color: blue\">"   ++ s ++ "</span>"
operatorC s = "<span style=\"color: purple\">" ++ s ++ "</span>"
