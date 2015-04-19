# Options Reference #

|**_Name_**	|**_Default_**	|**_Summary_** |
|:----------|:-------------|:-------------|
|speed	|`70`	| milliseconds between each character's displaying. |
|elemSpeed	|`null`	|milliseconds between each element node's displaying. if `null`, display instantly. |
|forward	|`null`	|a jQuery selector expression. Taken matched element(s) as "FORWARD" button. If not found, create one. |
|back	|`null`	|taken matched element as "BACK" button. |
|next	|`null`	|taken matched element as "NEXT" button. |
|pageExpr	|`null`	|a jQuery selector expression. Each matched element will be taken as a page. Only perform finding from immediate (first level) children. |
|act	|`null`	|an array to set action on specified elements. see OptionAct for more info. |
|onPageStart	|`null`	|callback when start of page (display char by char) |
|onPageDump	|`null`	|callback when start of page (display whole page immediately) |
|onForward	|`null`	|callback when play forward, from char by char playing. |
|dump	|`'back'`	|playing _by char_ or _dump_ whole page at once. Value could be 'back', 'none', 'used', 'all' or `null`. see OptionsDumpmp for more info. |
|removeUnused	|`true`	|`true` to remove elements which can't match `pageExpr`, otherwise they'll be visible and remain untouched. |
|trimText	|`true`	|`true` to remove blank space using `jQuery.trim`, otherwise each space will played as one character. |
|keepInvisible	|`true`	|`true` to keep invisible elements untouched, otherwise they'll be shown. |



※中文說明可以在 [msgPlay 首頁 - 選項](http://www.bootleq.com/item/msgPlay/#option) 找到。