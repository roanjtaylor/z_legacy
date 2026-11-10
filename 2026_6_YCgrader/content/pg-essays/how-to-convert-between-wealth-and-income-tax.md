---
source: "How to Convert Between Wealth and Income Tax"
author: "Paul Graham"
url: "https://paulgraham.com/winc.html"
type: "pg-essay"
topics: []
---

May 2026

How do you convert between wealth and income tax? If a government imposes a wealth tax of 1%, what's the equivalent in income tax?

It's clear from the way most politicians talk about the subject that they not only don't know the answer, but don't even realize there's such a question.

In fact the conversion rate between them is about 20. A wealth tax of 1% is equivalent to an income tax of 20%.

To convert between wealth and income tax rates, you have to divide by the rate of return on capital. The conversion rate of 20 comes from assuming that the risk-free rate of return is 5%. Historically that's an optimistic assumption. 4% might be more realistic. But 5% will do. \[[1](#f1n)\]

If we run through an example it will be clear how this works. Suppose you have $100, you're getting a 5% rate of return on this capital, and there's a 20% income tax. The 5% rate of return means at the end of one year your $100 has made you another $5. But you have to pay 20% of that, or $1, in income tax, so your after-tax income is $4. At the end of the year, after paying taxes, you have $100 + $4 = $104.

Now suppose instead of a 20% income tax, there's a 1% wealth tax. At the end of the year your $100 has made you another $5, as before. But that year you had to pay 1% of your $100, or $1, in wealth tax. So at the end of the year you have $99 + $5 = $104.

Each 1% of wealth tax is equivalent to 20% of income tax.

It's clear that politicians don't get this from the way they talk about a "mere 1%" wealth tax. None of them would speak of adding a "mere 20%" to the income tax rate, even though that's mathematically the same thing. \[[2](#f2n)\]

Politicians understand that an additional 20% income tax would be a lot. And indeed a US state that added 20% to its top income tax rate would have extraordinarily high taxes.

Currently the country with the highest marginal income tax rate is Denmark, at 60.5%. The top US federal tax rate is 37%, and the median state income tax rate is Oklahoma's, which is 4.75%. So in the median case, a state adding an additional 20% in income tax would have a total marginal tax rate of 37% + 4.75% + 20%, or 61.75%. \[[3](#f3n)\]

In the median case, US state politicians talking about adding a "mere 1%" wealth tax are talking about causing the residents of their state to have the highest taxes in the world. That's not the sort of decision you make lightly.

That's why I think few politicians currently understand how to convert between wealth and income taxes. You can tell from the way they talk about the subject that they don't understand the momentousness of what they're proposing. But I'm optimistic that we can teach them. The answer's not hard to understand, once you realize the question exists.

**Notes**

\[1\] It's possible to get a higher rate of return if you're willing to risk losing your capital. But to convert between tax rates you should use the risk-free rate of return, because considered as an anti-investment, a wealth tax is absolutely risk-free: you will absolutely owe the government that money. And while you do have to put "risk-free" in scare quotes when talking about returns, the kind of risks you're talking about now are the almost apocalyptic kind that would make tax rates a moot point.

\[2\] The same conversion rate applies to capital gains. The source of the multiple is whether the money is taxed every year or just once. Indeed it's the same math you'd use to calculate the value of any income-generating asset.

\[3\] You can deduct some state tax from your federal income taxes, but there's a cap on how much you can deduct, which means in the marginal case we simply add the two rates.

**Thanks** to Trevor Blackwell, Jessica Livingston, Carolynn Levy, Jon Levy, Alex Tabarrok, and Harj Taggar for reading drafts of this.

* * *

csell\_env = 'ue1'; var storeCheckoutDomain = 'order.store.turbify.net'; function toOSTN(node){ if(node.hasAttributes()){ for (const attr of node.attributes) { node.setAttribute(attr.name,attr.value.replace(/(us-dc1-order|us-dc2-order|order)\\.(store|stores)\\.(\[a-z0-9-\]+)\\.(net|com)/g, storeCheckoutDomain)); } } }; document.addEventListener('readystatechange', event => { if(typeof storeCheckoutDomain != 'undefined' && storeCheckoutDomain != "order.store.turbify.net"){ if (event.target.readyState === "interactive") { fromOSYN = document.getElementsByTagName('form'); for (let i = 0; i < fromOSYN.length; i++) { toOSTN(fromOSYN\[i\]); } } } }); // Begin Store Generated Code // Begin Store Generated Code csell\_page\_data = {}; csell\_page\_rec\_data = \[\]; ts='TOK\_STORE\_ID'; // Begin Store Generated Code function csell\_GLOBAL\_INIT\_TAG() { var csell\_token\_map = {}; csell\_token\_map\['TOK\_SPACEID'\] = '2022276099'; csell\_token\_map\['TOK\_URL'\] = ''; csell\_token\_map\['TOK\_STORE\_ID'\] = 'paulgraham'; csell\_token\_map\['TOK\_ITEM\_ID\_LIST'\] = 'winc'; csell\_token\_map\['TOK\_ORDER\_HOST'\] = 'order.store.turbify.net'; csell\_token\_map\['TOK\_BEACON\_TYPE'\] = 'prod'; csell\_token\_map\['TOK\_RAND\_KEY'\] = 't'; csell\_token\_map\['TOK\_IS\_ORDERABLE'\] = '2'; c = csell\_page\_data; var x = (typeof storeCheckoutDomain == 'string')?storeCheckoutDomain:'order.store.turbify.net'; var t = csell\_token\_map; c\['s'\] = t\['TOK\_SPACEID'\]; c\['url'\] = t\['TOK\_URL'\]; c\['si'\] = t\[ts\]; c\['ii'\] = t\['TOK\_ITEM\_ID\_LIST'\]; c\['bt'\] = t\['TOK\_BEACON\_TYPE'\]; c\['rnd'\] = t\['TOK\_RAND\_KEY'\]; c\['io'\] = t\['TOK\_IS\_ORDERABLE'\]; YStore.addItemUrl = 'http%s://'+x+'/'+t\[ts\]+'/ymix/MetaController.html?eventName.addEvent&cartDS.shoppingcart\_ROW0\_m\_orderItemVector\_ROW0\_m\_itemId=%s&cartDS.shoppingcart\_ROW0\_m\_orderItemVector\_ROW0\_m\_quantity=1&ysco\_key\_cs\_item=1&sectionId=ysco.cart&ysco\_key\_store\_id='+t\[ts\]; } // Begin Store Generated Code function csell\_REC\_VIEW\_TAG() { var env = (typeof csell\_env == 'string')?csell\_env:'prod'; var p = csell\_page\_data; var a = '/sid='+p\['si'\]+'/io='+p\['io'\]+'/ii='+p\['ii'\]+'/bt='+p\['bt'\]+'-view'+'/en='+env; var r=Math.random(); YStore.CrossSellBeacon.renderBeaconWithRecData(p\['url'\]+'/p/s='+p\['s'\]+'/'+p\['rnd'\]+'='+r+a); } // Begin Store Generated Code var csell\_token\_map = {}; csell\_token\_map\['TOK\_PAGE'\] = 'p'; csell\_token\_map\['TOK\_CURR\_SYM'\] = '$'; csell\_token\_map\['TOK\_WS\_URL'\] = 'https://paulgraham.csell.store.turbify.net/cs/recommend?itemids=winc&location=p'; csell\_token\_map\['TOK\_SHOW\_CS\_RECS'\] = 'false'; var t = csell\_token\_map; csell\_GLOBAL\_INIT\_TAG(); YStore.page = t\['TOK\_PAGE'\]; YStore.currencySymbol = t\['TOK\_CURR\_SYM'\]; YStore.crossSellUrl = t\['TOK\_WS\_URL'\]; YStore.showCSRecs = t\['TOK\_SHOW\_CS\_RECS'\];
