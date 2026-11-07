---
source: "If Lisp is So Great"
author: "Paul Graham"
url: "https://paulgraham.com/iflisp.html"
type: "pg-essay"
topics: []
---

May 2003

If Lisp is so great, why don't more people use it? I was asked this question by a student in the audience at a talk I gave recently. Not for the first time, either.

In languages, as in so many things, there's not much correlation between popularity and quality. Why does John Grisham (_King of Torts_ sales rank, 44) outsell Jane Austen (_Pride and Prejudice_ sales rank, 6191)? Would even Grisham claim that it's because he's a better writer?

Here's the first sentence of _Pride and Prejudice:_

> It is a truth universally acknowledged, that a single man in possession of a good fortune must be in want of a wife.

"It is a truth universally acknowledged?" Long words for the first sentence of a love story.

Like Jane Austen, Lisp looks hard. Its syntax, or lack of syntax, makes it look completely [unlike](https://sep.turbifycdn.com/ty/cdn/paulgraham/acl2.lisp?t=1772732230&) the languages most people are used to. Before I learned Lisp, I was afraid of it too. I recently came across a notebook from 1983 in which I'd written:

> I suppose I should learn Lisp, but it seems so foreign.

Fortunately, I was 19 at the time and not too resistant to learning new things. I was so ignorant that learning almost anything meant learning new things.

People frightened by Lisp make up other reasons for not using it. The standard excuse, back when C was the default language, was that Lisp was too slow. Now that Lisp dialects are among the [faster](http://shootout.alioth.debian.org/benchmark.php?test=nestedloop&lang=all&sort=cpu) languages available, that excuse has gone away. Now the standard excuse is openly circular: that other languages are more popular.

(Beware of such reasoning. It gets you Windows.)

Popularity is always self-perpetuating, but it's especially so in programming languages. More libraries get written for popular languages, which makes them still more popular. Programs often have to work with existing programs, and this is easier if they're written in the same language, so languages spread from program to program like a virus. And managers prefer popular languages, because they give them more leverage over developers, who can more easily be replaced.

Indeed, if programming languages were all more or less equivalent, there would be little justification for using any but the most popular. But they [aren't](icad.html) all equivalent, not by a long shot. And that's why less popular languages, like Jane Austen's novels, continue to survive at all. When everyone else is reading the latest John Grisham novel, there will always be a few people reading Jane Austen instead.

[Japanese Translation](http://www.shiro.dreamhost.com/scheme/trans/iflisp-j.html)

[Romanian Translation](http://ro.goobix.com/pg/iflisp/)

[Spanish Translation](http://cibercalli.com/erick/hackingnews/lispnews/si-lisp-es-tan-grandioso)

* * *

csell\_env = 'ue1'; var storeCheckoutDomain = 'order.store.turbify.net'; function toOSTN(node){ if(node.hasAttributes()){ for (const attr of node.attributes) { node.setAttribute(attr.name,attr.value.replace(/(us-dc1-order|us-dc2-order|order)\\.(store|stores)\\.(\[a-z0-9-\]+)\\.(net|com)/g, storeCheckoutDomain)); } } }; document.addEventListener('readystatechange', event => { if(typeof storeCheckoutDomain != 'undefined' && storeCheckoutDomain != "order.store.turbify.net"){ if (event.target.readyState === "interactive") { fromOSYN = document.getElementsByTagName('form'); for (let i = 0; i < fromOSYN.length; i++) { toOSTN(fromOSYN\[i\]); } } } }); // Begin Store Generated Code // Begin Store Generated Code csell\_page\_data = {}; csell\_page\_rec\_data = \[\]; ts='TOK\_STORE\_ID'; // Begin Store Generated Code function csell\_GLOBAL\_INIT\_TAG() { var csell\_token\_map = {}; csell\_token\_map\['TOK\_SPACEID'\] = '2022276099'; csell\_token\_map\['TOK\_URL'\] = ''; csell\_token\_map\['TOK\_STORE\_ID'\] = 'paulgraham'; csell\_token\_map\['TOK\_ITEM\_ID\_LIST'\] = 'iflisp'; csell\_token\_map\['TOK\_ORDER\_HOST'\] = 'order.store.turbify.net'; csell\_token\_map\['TOK\_BEACON\_TYPE'\] = 'prod'; csell\_token\_map\['TOK\_RAND\_KEY'\] = 't'; csell\_token\_map\['TOK\_IS\_ORDERABLE'\] = '2'; c = csell\_page\_data; var x = (typeof storeCheckoutDomain == 'string')?storeCheckoutDomain:'order.store.turbify.net'; var t = csell\_token\_map; c\['s'\] = t\['TOK\_SPACEID'\]; c\['url'\] = t\['TOK\_URL'\]; c\['si'\] = t\[ts\]; c\['ii'\] = t\['TOK\_ITEM\_ID\_LIST'\]; c\['bt'\] = t\['TOK\_BEACON\_TYPE'\]; c\['rnd'\] = t\['TOK\_RAND\_KEY'\]; c\['io'\] = t\['TOK\_IS\_ORDERABLE'\]; YStore.addItemUrl = 'http%s://'+x+'/'+t\[ts\]+'/ymix/MetaController.html?eventName.addEvent&cartDS.shoppingcart\_ROW0\_m\_orderItemVector\_ROW0\_m\_itemId=%s&cartDS.shoppingcart\_ROW0\_m\_orderItemVector\_ROW0\_m\_quantity=1&ysco\_key\_cs\_item=1&sectionId=ysco.cart&ysco\_key\_store\_id='+t\[ts\]; } // Begin Store Generated Code function csell\_REC\_VIEW\_TAG() { var env = (typeof csell\_env == 'string')?csell\_env:'prod'; var p = csell\_page\_data; var a = '/sid='+p\['si'\]+'/io='+p\['io'\]+'/ii='+p\['ii'\]+'/bt='+p\['bt'\]+'-view'+'/en='+env; var r=Math.random(); YStore.CrossSellBeacon.renderBeaconWithRecData(p\['url'\]+'/p/s='+p\['s'\]+'/'+p\['rnd'\]+'='+r+a); } // Begin Store Generated Code var csell\_token\_map = {}; csell\_token\_map\['TOK\_PAGE'\] = 'p'; csell\_token\_map\['TOK\_CURR\_SYM'\] = '$'; csell\_token\_map\['TOK\_WS\_URL'\] = 'https://paulgraham.csell.store.turbify.net/cs/recommend?itemids=iflisp&location=p'; csell\_token\_map\['TOK\_SHOW\_CS\_RECS'\] = 'false'; var t = csell\_token\_map; csell\_GLOBAL\_INIT\_TAG(); YStore.page = t\['TOK\_PAGE'\]; YStore.currencySymbol = t\['TOK\_CURR\_SYM'\]; YStore.crossSellUrl = t\['TOK\_WS\_URL'\]; YStore.showCSRecs = t\['TOK\_SHOW\_CS\_RECS'\];
