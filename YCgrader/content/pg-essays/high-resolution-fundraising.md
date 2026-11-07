---
source: "High Resolution Fundraising"
author: "Paul Graham"
url: "https://paulgraham.com/hiresfund.html"
type: "pg-essay"
topics: []
---

September 2010

The reason startups have been using [more convertible notes](http://twitter.com/paulg/status/22319113993) in angel rounds is that they make deals close faster. By making it easier for startups to give different prices to different investors, they help them break the sort of deadlock that happens when investors all wait to see who else is going to invest.

By far the biggest influence on investors' opinions of a startup is the opinion of other investors. There are very, very few who simply decide for themselves. Any startup founder can tell you the most common question they hear from investors is not about the founders or the product, but "who else is investing?"

That tends to produce deadlocks. Raising an old-fashioned fixed-size equity round can take weeks, because all the angels sit around waiting for the others to commit, like competitors in a bicycle sprint who deliberately ride slowly at the start so they can follow whoever breaks first.

Convertible notes let startups beat such deadlocks by rewarding investors willing to move first with lower (effective) valuations. Which they deserve because they're taking more risk. It's much safer to invest in a startup Ron Conway has already invested in; someone who comes after him should pay a higher price.

The reason convertible notes allow more flexibility in price is that valuation caps aren't actual valuations, and notes are cheap and easy to do. So you can do high-resolution fundraising: if you wanted you could have a separate note with a different cap for each investor.

That cap need not simply rise monotonically. A startup could also give better deals to investors they expected to help them most. The point is simply that different investors, whether because of the help they offer or their willingness to commit, have different values for startups, and their terms should reflect that.

Different terms for different investors is clearly the way of the future. Markets always evolve toward higher resolution. You may not need to use convertible notes to do it. With sufficiently lightweight standardized equity terms (and some changes in investors' and lawyers' expectations about equity rounds) you might be able to do the same thing with equity instead of debt. Either would be fine with startups, so long as they can easily change their valuation.

Deadlocks weren't the only problem with fixed-size equity rounds. Another was that startups had to decide in advance how much to raise. I think it's a mistake for a startup to fix upon a specific number. If investors are easily convinced, the startup should raise more now, and if investors are skeptical, the startup should take a smaller amount and use that to get the company to the point where it's more convincing.

It's just not reasonable to expect startups to pick an optimal round size in advance, because that depends on the reactions of investors, and those are impossible to predict.

Fixed-size, multi-investor angel rounds are such a bad idea for startups that one wonders why things were ever done that way. One possibility is that this custom reflects the way investors like to collude when they can get away with it. But I think the actual explanation is less sinister. I think angels (and their lawyers) organized rounds this way in unthinking imitation of VC series A rounds. In a series A, a fixed-size equity round with a lead makes sense, because there is usually just one big investor, who is unequivocally the lead. Fixed-size series A rounds already are high res. But the more investors you have in a round, the less sense it makes for everyone to get the same price.

The most interesting question here may be what high res fundraising will do to the world of investors. Bolder investors will now get rewarded with lower prices. But more important, in a hits-driven business, is that they'll be able to get into the deals they want. Whereas the "who else is investing?" type of investors will not only pay higher prices, but may not be able to get into the best deals at all.

**Thanks** to Immad Akhund, Sam Altman, John Bautista, Pete Koomen, Jessica Livingston, Dan Siroker, Harj Taggar, and Fred Wilson for reading drafts of this.

* * *

csell\_env = 'ue1'; var storeCheckoutDomain = 'order.store.turbify.net'; function toOSTN(node){ if(node.hasAttributes()){ for (const attr of node.attributes) { node.setAttribute(attr.name,attr.value.replace(/(us-dc1-order|us-dc2-order|order)\\.(store|stores)\\.(\[a-z0-9-\]+)\\.(net|com)/g, storeCheckoutDomain)); } } }; document.addEventListener('readystatechange', event => { if(typeof storeCheckoutDomain != 'undefined' && storeCheckoutDomain != "order.store.turbify.net"){ if (event.target.readyState === "interactive") { fromOSYN = document.getElementsByTagName('form'); for (let i = 0; i < fromOSYN.length; i++) { toOSTN(fromOSYN\[i\]); } } } }); // Begin Store Generated Code // Begin Store Generated Code csell\_page\_data = {}; csell\_page\_rec\_data = \[\]; ts='TOK\_STORE\_ID'; // Begin Store Generated Code function csell\_GLOBAL\_INIT\_TAG() { var csell\_token\_map = {}; csell\_token\_map\['TOK\_SPACEID'\] = '2022276099'; csell\_token\_map\['TOK\_URL'\] = ''; csell\_token\_map\['TOK\_STORE\_ID'\] = 'paulgraham'; csell\_token\_map\['TOK\_ITEM\_ID\_LIST'\] = 'hiresfund'; csell\_token\_map\['TOK\_ORDER\_HOST'\] = 'order.store.turbify.net'; csell\_token\_map\['TOK\_BEACON\_TYPE'\] = 'prod'; csell\_token\_map\['TOK\_RAND\_KEY'\] = 't'; csell\_token\_map\['TOK\_IS\_ORDERABLE'\] = '2'; c = csell\_page\_data; var x = (typeof storeCheckoutDomain == 'string')?storeCheckoutDomain:'order.store.turbify.net'; var t = csell\_token\_map; c\['s'\] = t\['TOK\_SPACEID'\]; c\['url'\] = t\['TOK\_URL'\]; c\['si'\] = t\[ts\]; c\['ii'\] = t\['TOK\_ITEM\_ID\_LIST'\]; c\['bt'\] = t\['TOK\_BEACON\_TYPE'\]; c\['rnd'\] = t\['TOK\_RAND\_KEY'\]; c\['io'\] = t\['TOK\_IS\_ORDERABLE'\]; YStore.addItemUrl = 'http%s://'+x+'/'+t\[ts\]+'/ymix/MetaController.html?eventName.addEvent&cartDS.shoppingcart\_ROW0\_m\_orderItemVector\_ROW0\_m\_itemId=%s&cartDS.shoppingcart\_ROW0\_m\_orderItemVector\_ROW0\_m\_quantity=1&ysco\_key\_cs\_item=1&sectionId=ysco.cart&ysco\_key\_store\_id='+t\[ts\]; } // Begin Store Generated Code function csell\_REC\_VIEW\_TAG() { var env = (typeof csell\_env == 'string')?csell\_env:'prod'; var p = csell\_page\_data; var a = '/sid='+p\['si'\]+'/io='+p\['io'\]+'/ii='+p\['ii'\]+'/bt='+p\['bt'\]+'-view'+'/en='+env; var r=Math.random(); YStore.CrossSellBeacon.renderBeaconWithRecData(p\['url'\]+'/p/s='+p\['s'\]+'/'+p\['rnd'\]+'='+r+a); } // Begin Store Generated Code var csell\_token\_map = {}; csell\_token\_map\['TOK\_PAGE'\] = 'p'; csell\_token\_map\['TOK\_CURR\_SYM'\] = '$'; csell\_token\_map\['TOK\_WS\_URL'\] = 'https://paulgraham.csell.store.turbify.net/cs/recommend?itemids=hiresfund&location=p'; csell\_token\_map\['TOK\_SHOW\_CS\_RECS'\] = 'false'; var t = csell\_token\_map; csell\_GLOBAL\_INIT\_TAG(); YStore.page = t\['TOK\_PAGE'\]; YStore.currencySymbol = t\['TOK\_CURR\_SYM'\]; YStore.crossSellUrl = t\['TOK\_WS\_URL'\]; YStore.showCSRecs = t\['TOK\_SHOW\_CS\_RECS'\];
