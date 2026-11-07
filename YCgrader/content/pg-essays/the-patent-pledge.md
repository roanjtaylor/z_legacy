---
source: "The Patent Pledge"
author: "Paul Graham"
url: "https://paulgraham.com/patentpledge.html"
type: "pg-essay"
topics: []
---

August 2011

I realized recently that we may be able to solve part of the patent problem without waiting for the government.

I've never been 100% sure whether patents help or hinder technological progress. When I was a kid I thought they helped. I thought they protected inventors from having their ideas stolen by big companies. Maybe that was truer in the past, when more things were physical. But regardless of whether patents are in general a good thing, there do seem to be bad ways of using them. And since bad uses of patents seem to be increasing, there is an increasing call for patent reform.

The problem with patent reform is that it has to go through the government. That tends to be slow. But recently I realized we can also attack the problem downstream. As well as pinching off the stream of patents at the point where they're issued, we may in some cases be able to pinch it off at the point where they're used.

One way of using patents that clearly does not encourage innovation is when established companies with bad products use patents to suppress small competitors with good products. This is the type of abuse we may be able to decrease without having to go through the government.

The way to do it is to get the companies that are above pulling this sort of trick to pledge publicly not to. Then the ones that won't make such a pledge will be very conspicuous. Potential employees won't want to work for them. And investors, too, will be able to see that they're the sort of company that competes by litigation rather than by making good products.

Here's the pledge:

> No first use of software patents against companies with less than 25 people.

I've deliberately traded precision for brevity. The patent pledge is not legally binding. It's like Google's "Don't be evil." They don't define what evil is, but by publicly saying that, they're saying they're willing to be held to a standard that, say, Altria is not. And though constraining, "Don't be evil" has been good for Google. Technology companies win by attracting the most productive people, and the most productive people are attracted to employers who hold themselves to a higher standard than the law requires. \[[1](#f1n)\]

The patent pledge is in effect a narrower but open source "Don't be evil." I encourage every technology company to adopt it. If you want to help fix patents, encourage your employer to.

Already most technology companies wouldn't sink to using patents on startups. You don't see Google or Facebook suing startups for patent infringement. They don't need to. So for the better technology companies, the patent pledge requires no change in behavior. They're just promising to do what they'd do anyway. And when all the companies that won't use patents on startups have said so, the holdouts will be very conspicuous.

The patent pledge doesn't fix every problem with patents. It won't stop patent trolls, for example; they're already pariahs. But the problem the patent pledge does fix may be more serious than the problem of patent trolls. Patent trolls are just parasites. A clumsy parasite may occasionally kill the host, but that's not its goal. Whereas companies that sue startups for patent infringement generally do it with explicit goal of keeping their product off the market.

Companies that use patents on startups are attacking innovation at the root. Now there's something any individual can do about this problem, without waiting for the government: ask companies where they stand.

[Patent Pledge Site](http://thepatentpledge.org)

**Notes:**

\[1\] Because the pledge is deliberately vague, we're going to need common sense when intepreting it. And even more vice versa: the pledge is vague in order to make people use common sense when interpreting it.

So for example I've deliberately avoided saying whether the 25 people have to be employees, or whether contractors count too. If a company has to split hairs that fine about whether a suit would violate the patent pledge, it's probably still a dick move.

* * *

csell\_env = 'ue1'; var storeCheckoutDomain = 'order.store.turbify.net'; function toOSTN(node){ if(node.hasAttributes()){ for (const attr of node.attributes) { node.setAttribute(attr.name,attr.value.replace(/(us-dc1-order|us-dc2-order|order)\\.(store|stores)\\.(\[a-z0-9-\]+)\\.(net|com)/g, storeCheckoutDomain)); } } }; document.addEventListener('readystatechange', event => { if(typeof storeCheckoutDomain != 'undefined' && storeCheckoutDomain != "order.store.turbify.net"){ if (event.target.readyState === "interactive") { fromOSYN = document.getElementsByTagName('form'); for (let i = 0; i < fromOSYN.length; i++) { toOSTN(fromOSYN\[i\]); } } } }); // Begin Store Generated Code // Begin Store Generated Code csell\_page\_data = {}; csell\_page\_rec\_data = \[\]; ts='TOK\_STORE\_ID'; // Begin Store Generated Code function csell\_GLOBAL\_INIT\_TAG() { var csell\_token\_map = {}; csell\_token\_map\['TOK\_SPACEID'\] = '2022276099'; csell\_token\_map\['TOK\_URL'\] = ''; csell\_token\_map\['TOK\_STORE\_ID'\] = 'paulgraham'; csell\_token\_map\['TOK\_ITEM\_ID\_LIST'\] = 'patentpledge'; csell\_token\_map\['TOK\_ORDER\_HOST'\] = 'order.store.turbify.net'; csell\_token\_map\['TOK\_BEACON\_TYPE'\] = 'prod'; csell\_token\_map\['TOK\_RAND\_KEY'\] = 't'; csell\_token\_map\['TOK\_IS\_ORDERABLE'\] = '2'; c = csell\_page\_data; var x = (typeof storeCheckoutDomain == 'string')?storeCheckoutDomain:'order.store.turbify.net'; var t = csell\_token\_map; c\['s'\] = t\['TOK\_SPACEID'\]; c\['url'\] = t\['TOK\_URL'\]; c\['si'\] = t\[ts\]; c\['ii'\] = t\['TOK\_ITEM\_ID\_LIST'\]; c\['bt'\] = t\['TOK\_BEACON\_TYPE'\]; c\['rnd'\] = t\['TOK\_RAND\_KEY'\]; c\['io'\] = t\['TOK\_IS\_ORDERABLE'\]; YStore.addItemUrl = 'http%s://'+x+'/'+t\[ts\]+'/ymix/MetaController.html?eventName.addEvent&cartDS.shoppingcart\_ROW0\_m\_orderItemVector\_ROW0\_m\_itemId=%s&cartDS.shoppingcart\_ROW0\_m\_orderItemVector\_ROW0\_m\_quantity=1&ysco\_key\_cs\_item=1&sectionId=ysco.cart&ysco\_key\_store\_id='+t\[ts\]; } // Begin Store Generated Code function csell\_REC\_VIEW\_TAG() { var env = (typeof csell\_env == 'string')?csell\_env:'prod'; var p = csell\_page\_data; var a = '/sid='+p\['si'\]+'/io='+p\['io'\]+'/ii='+p\['ii'\]+'/bt='+p\['bt'\]+'-view'+'/en='+env; var r=Math.random(); YStore.CrossSellBeacon.renderBeaconWithRecData(p\['url'\]+'/p/s='+p\['s'\]+'/'+p\['rnd'\]+'='+r+a); } // Begin Store Generated Code var csell\_token\_map = {}; csell\_token\_map\['TOK\_PAGE'\] = 'p'; csell\_token\_map\['TOK\_CURR\_SYM'\] = '$'; csell\_token\_map\['TOK\_WS\_URL'\] = 'https://paulgraham.csell.store.turbify.net/cs/recommend?itemids=patentpledge&location=p'; csell\_token\_map\['TOK\_SHOW\_CS\_RECS'\] = 'false'; var t = csell\_token\_map; csell\_GLOBAL\_INIT\_TAG(); YStore.page = t\['TOK\_PAGE'\]; YStore.currencySymbol = t\['TOK\_CURR\_SYM'\]; YStore.crossSellUrl = t\['TOK\_WS\_URL'\]; YStore.showCSRecs = t\['TOK\_SHOW\_CS\_RECS'\];
