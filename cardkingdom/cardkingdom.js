const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');


(async () => {

    // const browser = await puppeteer.launch({ headless: false }); // default is true
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let linksSelector = '.row.anchorList table tbody tr td:first-child a';
    await page.goto('https://www.cardkingdom.com/catalog/magic_the_gathering/by_az',  {waitUntil: 'networkidle2'});
    await page.waitForSelector(linksSelector);

    // Long way to do it
    // let links = await page.evaluate(() => {
    //     let moreLinks = document.querySelectorAll('.row.anchorList table tbody tr td:first-child a');
    //     return Array.from(moreLinks).map((link) => {return link.href});
    // });

    //Short way
    //@Arr of Expansion Name and link to the cards
    let expansionLinks = await page.$$eval(linksSelector,  (el) => el.map((link) => { return [link.innerHTML,link.href]}));

    //Loads Card Object Base
    let cardJSON = fs.readFileSync(path.resolve("", 'cardStructure.json'));
    let card = JSON.parse(cardJSON);

    //Loop over expansions
    for (let i = 0; i < 1; i++) {
        const newTab = await browser.newPage();
        await newTab.goto(expansionLinks[i][1], {waitUntil: 'networkidle2'});
        const expansionName = expansionLinks[i][0].toLocaleLowerCase().replace(" ", "");



        let lastPageInPagination = await newTab.$eval('.pagination li:nth-last-child(2) a', el => el.href);
        lastPageInPagination = lastPageInPagination.split("=")[1];

        //Parses every card on the page and repeats untill end of pagination

        for (let j = 1; j < lastPageInPagination ; j++) {

            //Gets evaluable of selector, AKA All the cards on the current page
            let cardsInPage = await newTab.$$('.productItemWrapper.productCardWrapper',  (el) => el);

            for (let i = 0; i < cardsInPage.length; i++){

                //Name of the card
                let name = await cardsInPage[i].$eval('.productDetailTitle a', el => el.innerHTML);
                //Prices of Nearly Mint and Excellent parsed to only get numeric value
                let priceNM = await cardsInPage[i].$eval('.itemAddToCart.NM .stylePrice', el => el.innerHTML);
                let priceEX = await cardsInPage[i].$eval('.itemAddToCart.EX .stylePrice', el => el.innerHTML);
                priceNM = priceNM.split("$")[1].replace("\n", "");
                priceEX = priceEX.split("$")[1].replace("\n", "");

                //Full link to the card page
                let linkToCardPage = await cardsInPage[i].$eval('.cardLink', el => el.getAttribute('href'));
                linkToCardPage = "https://www.cardkingdom.com" + linkToCardPage;

                //Link to the image art in different sizes
                let cardImageLittle = await cardsInPage[i].$eval('.cardSrc', el => el.getAttribute('src'));
                let cardImageMedium = cardImageLittle.replace("thumb", "medium");




                card.name = name;
                card.price = {nm: priceNM, ex: priceEX};
                card.currency = "$";
                card.link = {normal: linkToCardPage };
                card.img.medium = cardImageMedium;
                card.img.little = cardImageLittle;

                let newJSONCard = JSON.stringify(card, null, 2);
                let filename = name.toLocaleLowerCase().replace(" ", "")+"-"+expansionName+".json";

                fs.writeFileSync("cardkingdom/cards/"+filename, newJSONCard);

                // If I want to make a log when it creates
                // fs.writeFile ("cardkingdom/cards/"+filename, newJSONCard, function(err) {
                //         if (err) throw err;
                //         console.log('complete');
                //     }
                // );

            }

            await newTab.click('.pagination li:last-child a');
            await newTab.waitForTimeout(2000);


        }

        //Now go to the foil section And update card files with foil data
        await newTab.click('li[role=presentation]:nth-child(3) a');
        await newTab.waitForTimeout(2000);

        try {
            let lastPageInPagination = await newTab.$eval('.pagination li:nth-last-child(2) a', el => el.href);
            lastPageInPagination = lastPageInPagination.split("=")[1];


        } catch (error) {
            console.error(error);
        }

        await newTab.close();
    }



    await browser.close();
})();