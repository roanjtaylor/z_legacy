---
source: "What You (Want to)* Want"
author: "Paul Graham"
url: "https://paulgraham.com/want.html"
type: "pg-essay"
topics: []
---

November 2022

Since I was about 9 I've been puzzled by the apparent contradiction between being made of matter that behaves in a predictable way, and the feeling that I could choose to do whatever I wanted. At the time I had a self-interested motive for exploring the question. At that age (like most succeeding ages) I was always in trouble with the authorities, and it seemed to me that there might possibly be some way to get out of trouble by arguing that I wasn't responsible for my actions. I gradually lost hope of that, but the puzzle remained: How do you reconcile being a machine made of matter with the feeling that you're free to choose what you do? \[[1](#f1n)\]

The best way to explain the answer may be to start with a slightly wrong version, and then fix it. The wrong version is: You can do what you want, but you can't want what you want. Yes, you can control what you do, but you'll do what you want, and you can't control that.

The reason this is mistaken is that people do sometimes change what they want. People who don't want to want something — drug addicts, for example — can sometimes make themselves stop wanting it. And people who want to want something — who want to like classical music, or broccoli — sometimes succeed.

So we modify our initial statement: You can do what you want, but you can't want to want what you want.

That's still not quite true. It's possible to change what you want to want. I can imagine someone saying "I decided to stop wanting to like classical music." But we're getting closer to the truth. It's rare for people to change what they want to want, and the more "want to"s we add, the rarer it gets.

We can get arbitrarily close to a true statement by adding more "want to"s in much the same way we can get arbitrarily close to 1 by adding more 9s to a string of 9s following a decimal point. In practice three or four "want to"s must surely be enough. It's hard even to envision what it would mean to change what you want to want to want to want, let alone actually do it.

So one way to express the correct answer is to use a regular expression. You can do what you want, but there's some statement of the form "you can't (want to)\* want what you want" that's true. Ultimately you get back to a want that you don't control. \[[2](#f2n)\]

**Notes**

\[1\] I didn't know when I was 9 that matter might behave randomly, but I don't think it affects the problem much. Randomness destroys the ghost in the machine as effectively as determinism.

\[2\] If you don't like using an expression, you can make the same point using higher-order desires: There is some n such that you don't control your nth-order desires.

**Thanks** to Trevor Blackwell, Jessica Livingston, Robert Morris, and Michael Nielsen for reading drafts of this.

* * *

csell\_env = 'ue1'; var storeCheckoutDomain = 'order.store.turbify.net'; function toOSTN(node){ if(node.hasAttributes()){ for (const attr of node.attributes) { node.setAttribute(attr.name,attr.value.replace(/(us-dc1-order|us-dc2-order|order)\\.(store|stores)\\.(\[a-z0-9-\]+)\\.(net|com)/g, storeCheckoutDomain)); } } }; document.addEventListener('readystatechange', event => { if(typeof storeCheckoutDomain != 'undefined' && storeCheckoutDomain != "order.store.turbify.net"){ if (event.target.readyState === "interactive") { fromOSYN = document.getElementsByTagName('form'); for (let i = 0; i < fromOSYN.length; i++) { toOSTN(fromOSYN\[i\]); } } } }); // Begin Store Generated Code // Begin Store Generated Code csell\_page\_data = {}; csell\_page\_rec\_data = \[\]; ts='TOK\_STORE\_ID'; // Begin Store Generated Code function csell\_GLOBAL\_INIT\_TAG() { var csell\_token\_map = {}; csell\_token\_map\['TOK\_SPACEID'\] = '2022276099'; csell\_token\_map\['TOK\_URL'\] = ''; csell\_token\_map\['TOK\_STORE\_ID'\] = 'paulgraham'; csell\_token\_map\['TOK\_ITEM\_ID\_LIST'\] = 'want'; csell\_token\_map\['TOK\_ORDER\_HOST'\] = 'order.store.turbify.net'; csell\_token\_map\['TOK\_BEACON\_TYPE'\] = 'prod'; csell\_token\_map\['TOK\_RAND\_KEY'\] = 't'; csell\_token\_map\['TOK\_IS\_ORDERABLE'\] = '2'; c = csell\_page\_data; var x = (typeof storeCheckoutDomain == 'string')?storeCheckoutDomain:'order.store.turbify.net'; var t = csell\_token\_map; c\['s'\] = t\['TOK\_SPACEID'\]; c\['url'\] = t\['TOK\_URL'\]; c\['si'\] = t\[ts\]; c\['ii'\] = t\['TOK\_ITEM\_ID\_LIST'\]; c\['bt'\] = t\['TOK\_BEACON\_TYPE'\]; c\['rnd'\] = t\['TOK\_RAND\_KEY'\]; c\['io'\] = t\['TOK\_IS\_ORDERABLE'\]; YStore.addItemUrl = 'http%s://'+x+'/'+t\[ts\]+'/ymix/MetaController.html?eventName.addEvent&cartDS.shoppingcart\_ROW0\_m\_orderItemVector\_ROW0\_m\_itemId=%s&cartDS.shoppingcart\_ROW0\_m\_orderItemVector\_ROW0\_m\_quantity=1&ysco\_key\_cs\_item=1&sectionId=ysco.cart&ysco\_key\_store\_id='+t\[ts\]; } // Begin Store Generated Code function csell\_REC\_VIEW\_TAG() { var env = (typeof csell\_env == 'string')?csell\_env:'prod'; var p = csell\_page\_data; var a = '/sid='+p\['si'\]+'/io='+p\['io'\]+'/ii='+p\['ii'\]+'/bt='+p\['bt'\]+'-view'+'/en='+env; var r=Math.random(); YStore.CrossSellBeacon.renderBeaconWithRecData(p\['url'\]+'/p/s='+p\['s'\]+'/'+p\['rnd'\]+'='+r+a); } // Begin Store Generated Code var csell\_token\_map = {}; csell\_token\_map\['TOK\_PAGE'\] = 'p'; csell\_token\_map\['TOK\_CURR\_SYM'\] = ''; csell\_token\_map\['TOK\_WS\_URL'\] = 'https://paulgraham.csell.store.turbify.net/cs/recommend?itemids=want&location=p'; csell\_token\_map\['TOK\_SHOW\_CS\_RECS'\] = 'false'; var t = csell\_token\_map; csell\_GLOBAL\_INIT\_TAG(); YStore.page = t\['TOK\_PAGE'\]; YStore.currencySymbol = t\['TOK\_CURR\_SYM'\]; YStore.crossSellUrl = t\['TOK\_WS\_URL'\]; YStore.showCSRecs = t\['TOK\_SHOW\_CS\_RECS'\];
