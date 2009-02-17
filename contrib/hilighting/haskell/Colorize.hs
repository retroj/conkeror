-- (C) Copyright 2009 Deniz Dogan

module Colorize (keywordC,
                 variableC,
                 specialC,
                 stringC,
                 commentC)
    where

stringC s = "<span class=\"string\">" ++ s ++ "</span>"
commentC s = "<span class=\"comment\">" ++ s ++ "</span>"
keywordC s = "<span class=\"keyword\">" ++ s ++ "</span>"
variableC s = "<span class=\"variable\">" ++ s ++ "</span>"
specialC s = "<span class=\"special\">" ++ s ++ "</span>"
