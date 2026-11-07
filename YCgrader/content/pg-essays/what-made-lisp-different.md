---
source: "What Made Lisp Different"
author: "Paul Graham"
url: "https://paulgraham.com/diff.html"
type: "pg-essay"
topics: []
---

December 2001 (rev. May 2002)

_(This article came about in response to some questions on the [LL1](http://ll1.mit.edu) mailing list. It is now incorporated in [Revenge of the Nerds](icad.html).)_

When McCarthy designed Lisp in the late 1950s, it was a radical departure from existing languages, the most important of which was [Fortran](history.html).

Lisp embodied nine new ideas:

* * *

**1\. Conditionals.** A conditional is an if-then-else construct. We take these for granted now. They were [invented](http://www-formal.stanford.edu/jmc/history/lisp/node2.html) by McCarthy in the course of developing Lisp. (Fortran at that time only had a conditional goto, closely based on the branch instruction in the underlying hardware.) McCarthy, who was on the Algol committee, got conditionals into Algol, whence they spread to most other languages.

**2\. A function type.** In Lisp, functions are first class objects-- they're a data type just like integers, strings, etc, and have a literal representation, can be stored in variables, can be passed as arguments, and so on.

**3\. Recursion.** Recursion existed as a mathematical concept before Lisp of course, but Lisp was the first programming language to support it. (It's arguably implicit in making functions first class objects.)

**4\. A new concept of variables.** In Lisp, all variables are effectively pointers. Values are what have types, not variables, and assigning or binding variables means copying pointers, not what they point to.

**5\. Garbage-collection.**

**6\. Programs composed of expressions.** Lisp programs are trees of expressions, each of which returns a value. (In some Lisps expressions can return multiple values.) This is in contrast to Fortran and most succeeding languages, which distinguish between expressions and statements.

It was natural to have this distinction in Fortran because (not surprisingly in a language where the input format was punched cards) the language was line-oriented. You could not nest statements. And so while you needed expressions for math to work, there was no point in making anything else return a value, because there could not be anything waiting for it.

This limitation went away with the arrival of block-structured languages, but by then it was too late. The distinction between expressions and statements was entrenched. It spread from Fortran into Algol and thence to both their descendants.

When a language is made entirely of expressions, you can compose expressions however you want. You can say either (using [Arc](arc.html) syntax)

(if foo (= x 1) (= x 2))

or

(= x (if foo 1 2))

**7\. A symbol type.** Symbols differ from strings in that you can test equality by comparing a pointer.

**8\. A notation for code** using trees of symbols.

**9\. The whole language always available.** There is no real distinction between read-time, compile-time, and runtime. You can compile or run code while reading, read or run code while compiling, and read or compile code at runtime.

Running code at read-time lets users reprogram Lisp's syntax; running code at compile-time is the basis of macros; compiling at runtime is the basis of Lisp's use as an extension language in programs like Emacs; and reading at runtime enables programs to communicate using s-expressions, an idea recently reinvented as XML.

* * *

When Lisp was first invented, all these ideas were far removed from ordinary programming practice, which was dictated largely by the hardware available in the late 1950s.

Over time, the default language, embodied in a succession of popular languages, has gradually evolved toward Lisp. 1-5 are now widespread. 6 is starting to appear in the mainstream. Python has a form of 7, though there doesn't seem to be any syntax for it. 8, which (with 9) is what makes Lisp macros possible, is so far still unique to Lisp, perhaps because (a) it requires those parens, or something just as bad, and (b) if you add that final increment of power, you can no longer claim to have invented a new language, but only to have designed a new dialect of Lisp ; -)

Though useful to present-day programmers, it's strange to describe Lisp in terms of its variation from the random expedients other languages adopted. That was not, probably, how McCarthy thought of it. Lisp wasn't designed to fix the mistakes in Fortran; it came about more as the byproduct of an attempt to [axiomatize computation](rootsoflisp.html).

[Japanese Translation](http://d.hatena.ne.jp/lionfan/20070217)

* * *

csell\_env = 'ue1'; var storeCheckoutDomain = 'order.store.turbify.net'; function toOSTN(node){ if(node.hasAttributes()){ for (const attr of node.attributes) { node.setAttribute(attr.name,attr.value.replace(/(us-dc1-order|us-dc2-order|order)\\.(store|stores)\\.(\[a-z0-9-\]+)\\.(net|com)/g, storeCheckoutDomain)); } } }; document.addEventListener('readystatechange', event => { if(typeof storeCheckoutDomain != 'undefined' && storeCheckoutDomain != "order.store.turbify.net"){ if (event.target.readyState === "interactive") { fromOSYN = document.getElementsByTagName('form'); for (let i = 0; i < fromOSYN.length; i++) { toOSTN(fromOSYN\[i\]); } } } }); // Begin Store Generated Code // Begin Store Generated Code csell\_page\_data = {}; csell\_page\_rec\_data = \[\]; ts='TOK\_STORE\_ID'; // Begin Store Generated Code function csell\_GLOBAL\_INIT\_TAG() { var csell\_token\_map = {}; csell\_token\_map\['TOK\_SPACEID'\] = '2022276099'; csell\_token\_map\['TOK\_URL'\] = ''; csell\_token\_map\['TOK\_STORE\_ID'\] = 'paulgraham'; csell\_token\_map\['TOK\_ITEM\_ID\_LIST'\] = 'diff'; csell\_token\_map\['TOK\_ORDER\_HOST'\] = 'order.store.turbify.net'; csell\_token\_map\['TOK\_BEACON\_TYPE'\] = 'prod'; csell\_token\_map\['TOK\_RAND\_KEY'\] = 't'; csell\_token\_map\['TOK\_IS\_ORDERABLE'\] = '2'; c = csell\_page\_data; var x = (typeof storeCheckoutDomain == 'string')?storeCheckoutDomain:'order.store.turbify.net'; var t = csell\_token\_map; c\['s'\] = t\['TOK\_SPACEID'\]; c\['url'\] = t\['TOK\_URL'\]; c\['si'\] = t\[ts\]; c\['ii'\] = t\['TOK\_ITEM\_ID\_LIST'\]; c\['bt'\] = t\['TOK\_BEACON\_TYPE'\]; c\['rnd'\] = t\['TOK\_RAND\_KEY'\]; c\['io'\] = t\['TOK\_IS\_ORDERABLE'\]; YStore.addItemUrl = 'http%s://'+x+'/'+t\[ts\]+'/ymix/MetaController.html?eventName.addEvent&cartDS.shoppingcart\_ROW0\_m\_orderItemVector\_ROW0\_m\_itemId=%s&cartDS.shoppingcart\_ROW0\_m\_orderItemVector\_ROW0\_m\_quantity=1&ysco\_key\_cs\_item=1&sectionId=ysco.cart&ysco\_key\_store\_id='+t\[ts\]; } // Begin Store Generated Code function csell\_REC\_VIEW\_TAG() { var env = (typeof csell\_env == 'string')?csell\_env:'prod'; var p = csell\_page\_data; var a = '/sid='+p\['si'\]+'/io='+p\['io'\]+'/ii='+p\['ii'\]+'/bt='+p\['bt'\]+'-view'+'/en='+env; var r=Math.random(); YStore.CrossSellBeacon.renderBeaconWithRecData(p\['url'\]+'/p/s='+p\['s'\]+'/'+p\['rnd'\]+'='+r+a); } // Begin Store Generated Code var csell\_token\_map = {}; csell\_token\_map\['TOK\_PAGE'\] = 'p'; csell\_token\_map\['TOK\_CURR\_SYM'\] = '$'; csell\_token\_map\['TOK\_WS\_URL'\] = 'https://paulgraham.csell.store.turbify.net/cs/recommend?itemids=diff&location=p'; csell\_token\_map\['TOK\_SHOW\_CS\_RECS'\] = 'false'; var t = csell\_token\_map; csell\_GLOBAL\_INIT\_TAG(); YStore.page = t\['TOK\_PAGE'\]; YStore.currencySymbol = t\['TOK\_CURR\_SYM'\]; YStore.crossSellUrl = t\['TOK\_WS\_URL'\]; YStore.showCSRecs = t\['TOK\_SHOW\_CS\_RECS'\];
