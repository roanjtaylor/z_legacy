---
source: "Modeling a Wealth Tax"
author: "Paul Graham"
url: "https://paulgraham.com/wtax.html"
type: "pg-essay"
topics: []
---

August 2020

Some politicians are proposing to introduce wealth taxes in addition to income and capital gains taxes. Let's try modeling the effects of various levels of wealth tax to see what they would mean in practice for a startup founder.

Suppose you start a successful startup in your twenties, and then live for another 60 years. How much of your stock will a wealth tax consume?

If the wealth tax applies to all your assets, it's easy to calculate its effect. A wealth tax of 1% means you get to keep 99% of your stock each year. After 60 years the proportion of stock you'll have left will be .99^60, or .547. So a straight 1% wealth tax means the government will over the course of your life take 45% of your stock.

(Losing shares does not, obviously, mean becoming _net_ poorer unless the value per share is increasing by less than the wealth tax rate.)

Here's how much stock the government would take over 60 years at various levels of wealth tax:

wealth tax

government takes

0.1%

6%

0.5%

26%

1.0%

45%

2.0%

70%

3.0%

84%

4.0%

91%

5.0%

95%

A wealth tax will usually have a threshold at which it starts. How much difference would a high threshold make? To model that, we need to make some assumptions about the initial value of your stock and the growth rate.

Suppose your stock is initially worth $2 million, and the company's trajectory is as follows: the value of your stock grows 3x for 2 years, then 2x for 2 years, then 50% for 2 years, after which you just get a typical public company growth rate, which we'll call 8%. \[[1](#f1n)\] Suppose the wealth tax threshold is $50 million. How much stock does the government take now?

wealth tax

government takes

0.1%

5%

0.5%

23%

1.0%

41%

2.0%

65%

3.0%

79%

4.0%

88%

5.0%

93%

It may at first seem surprising that such apparently small tax rates produce such dramatic effects. A 2% wealth tax with a $50 million threshold takes about two thirds of a successful founder's stock.

The reason wealth taxes have such dramatic effects is that they're applied over and over to the same money. Income tax happens every year, but only to that year's income. Whereas if you live for 60 years after acquiring some asset, a wealth tax will tax that same asset 60 times. A wealth tax compounds.

**Note**

\[1\] In practice, eventually some of this 8% would come in the form of dividends, which are taxed as income at issue, so this model actually represents the most optimistic case for the founder.

* * *

csell\_env = 'ue1'; var storeCheckoutDomain = 'order.store.turbify.net'; function toOSTN(node){ if(node.hasAttributes()){ for (const attr of node.attributes) { node.setAttribute(attr.name,attr.value.replace(/(us-dc1-order|us-dc2-order|order)\\.(store|stores)\\.(\[a-z0-9-\]+)\\.(net|com)/g, storeCheckoutDomain)); } } }; document.addEventListener('readystatechange', event => { if(typeof storeCheckoutDomain != 'undefined' && storeCheckoutDomain != "order.store.turbify.net"){ if (event.target.readyState === "interactive") { fromOSYN = document.getElementsByTagName('form'); for (let i = 0; i < fromOSYN.length; i++) { toOSTN(fromOSYN\[i\]); } } } }); // Begin Store Generated Code // Begin Store Generated Code csell\_page\_data = {}; csell\_page\_rec\_data = \[\]; ts='TOK\_STORE\_ID'; // Begin Store Generated Code function csell\_GLOBAL\_INIT\_TAG() { var csell\_token\_map = {}; csell\_token\_map\['TOK\_SPACEID'\] = '2022276099'; csell\_token\_map\['TOK\_URL'\] = ''; csell\_token\_map\['TOK\_STORE\_ID'\] = 'paulgraham'; csell\_token\_map\['TOK\_ITEM\_ID\_LIST'\] = 'wtax'; csell\_token\_map\['TOK\_ORDER\_HOST'\] = 'order.store.turbify.net'; csell\_token\_map\['TOK\_BEACON\_TYPE'\] = 'prod'; csell\_token\_map\['TOK\_RAND\_KEY'\] = 't'; csell\_token\_map\['TOK\_IS\_ORDERABLE'\] = '2'; c = csell\_page\_data; var x = (typeof storeCheckoutDomain == 'string')?storeCheckoutDomain:'order.store.turbify.net'; var t = csell\_token\_map; c\['s'\] = t\['TOK\_SPACEID'\]; c\['url'\] = t\['TOK\_URL'\]; c\['si'\] = t\[ts\]; c\['ii'\] = t\['TOK\_ITEM\_ID\_LIST'\]; c\['bt'\] = t\['TOK\_BEACON\_TYPE'\]; c\['rnd'\] = t\['TOK\_RAND\_KEY'\]; c\['io'\] = t\['TOK\_IS\_ORDERABLE'\]; YStore.addItemUrl = 'http%s://'+x+'/'+t\[ts\]+'/ymix/MetaController.html?eventName.addEvent&cartDS.shoppingcart\_ROW0\_m\_orderItemVector\_ROW0\_m\_itemId=%s&cartDS.shoppingcart\_ROW0\_m\_orderItemVector\_ROW0\_m\_quantity=1&ysco\_key\_cs\_item=1&sectionId=ysco.cart&ysco\_key\_store\_id='+t\[ts\]; } // Begin Store Generated Code function csell\_REC\_VIEW\_TAG() { var env = (typeof csell\_env == 'string')?csell\_env:'prod'; var p = csell\_page\_data; var a = '/sid='+p\['si'\]+'/io='+p\['io'\]+'/ii='+p\['ii'\]+'/bt='+p\['bt'\]+'-view'+'/en='+env; var r=Math.random(); YStore.CrossSellBeacon.renderBeaconWithRecData(p\['url'\]+'/p/s='+p\['s'\]+'/'+p\['rnd'\]+'='+r+a); } // Begin Store Generated Code var csell\_token\_map = {}; csell\_token\_map\['TOK\_PAGE'\] = 'p'; csell\_token\_map\['TOK\_CURR\_SYM'\] = '$'; csell\_token\_map\['TOK\_WS\_URL'\] = 'https://paulgraham.csell.store.turbify.net/cs/recommend?itemids=wtax&location=p'; csell\_token\_map\['TOK\_SHOW\_CS\_RECS'\] = 'false'; var t = csell\_token\_map; csell\_GLOBAL\_INIT\_TAG(); YStore.page = t\['TOK\_PAGE'\]; YStore.currencySymbol = t\['TOK\_CURR\_SYM'\]; YStore.crossSellUrl = t\['TOK\_WS\_URL'\]; YStore.showCSRecs = t\['TOK\_SHOW\_CS\_RECS'\];
