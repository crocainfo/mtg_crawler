const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');


(async () => {



    // const browser = await puppeteer.launch({ headless: false }); // default is true
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    //CSS selector where links are stored
    let linksSelector = '.row.anchorList table tbody tr td:first-child a';
    await page.goto('https://www.cardkingdom.com/catalog/magic_the_gathering/by_az',  {waitUntil: 'networkidle2'});
    await page.waitForSelector(linksSelector);

    // Long way to do it
    // let links = await page.evaluate(() => {
    //     let moreLinks = document.querySelectorAll('.row.anchorList table tbody tr td:first-child a');
    //     return Array.from(moreLinks).map((link) => {return link.href});
    // });

    //Short way
    //@Arr of ,Expansion Name and link to the cards
    let expansionLinks = await page.$$eval(linksSelector,  (el) => el.map((link) => { return [link.innerHTML,link.href]}));

    //Loads Card Object Base
    let cardJSON = fs.readFileSync(path.resolve("", 'cardStructure.json'));
    let card = JSON.parse(cardJSON);
    let expansions = {};

    //Loop over expansions
    for (let i = 0; i < expansionLinks.length; i++) {
        //Opens new tab with the expansion
        const newTab = await browser.newPage();
        await newTab.goto(expansionLinks[i][1], {waitUntil: 'networkidle2'});

        //Parses expansion name
        const expansionName = replaceAll(expansionLinks[i][0].toLowerCase()," ", "");

        //Proceeds to evaluate if the page contains cards and parses them into json files
        try {
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



                    //Fills the object template with the information of the card
                    card.name = name.replace("(","").replace(")","");
                    card.price.nm = priceNM;
                    card.price.ex = priceEX;
                    card.currency = "$";
                    card.webLink.normal = linkToCardPage;
                    card.img.medium = cardImageMedium;
                    card.img.little = cardImageLittle;

                    //Tries to input the information to a JSON File , if fails cerates a log
                    try {

                        let newJSONCard = JSON.stringify(card, null, 2);
                        let filename = replaceAll(replaceAll(name.toLowerCase(), "/", "-")," " , "")+"-"+expansionName+".json";

                        fs.writeFileSync(path.resolve("cardkingdom/cards", filename), newJSONCard);
                    }catch (e) {
                        let filename = replaceAll(replaceAll(name.toLowerCase(), "/", "-")," " , "")+"-"+expansionName+".json";


                        fs.appendFile("log.txt",'Problems with card ' + name + " , filename : " + filename + "\n", (err) => {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }



                }

                //proceeds to go to then next page in the pagination
                await newTab.click('.pagination li:last-child a');
                await newTab.waitForTimeout(2000);


            }

        }catch (e) {
            fs.appendFile("log.txt",'Expansion ' + expansionName + ' ddoesn\'t have pagination. \n' , (err) => {
                if (err) {
                    console.log(err);
                }
            })
        }



        //Now go to the foil section And update card files with foil data

        try {

            //Clicks on the Foil section and waits to load
            await newTab.click('li[role=presentation]:nth-child(3) a');
            await newTab.waitForTimeout(2000);

            let lastPageInPagination = await newTab.$eval('.pagination li:nth-last-child(2) a', el => el.href);
            lastPageInPagination = lastPageInPagination.split("=")[1];

            for (let j = 1; j < lastPageInPagination ; j++) {

                //Gets evaluable of selector, AKA All the cards on the current page
                let cardsInPage = await newTab.$$('.productItemWrapper.productCardWrapper',  (el) => el);

                for (let i = 0; i < cardsInPage.length; i++){

                    //Name of the card
                    let name = await cardsInPage[i].$eval('.productDetailTitle a', el => el.innerHTML);
                    //Prices of Nearly Mint and Excellent parsed to only get numeric value
                    let priceFoilNM = await cardsInPage[i].$eval('.itemAddToCart.NM .stylePrice', el => el.innerHTML);
                    let priceFoilEX = await cardsInPage[i].$eval('.itemAddToCart.EX .stylePrice', el => el.innerHTML);
                    priceFoilNM = priceFoilNM.split("$")[1].replace("\n", "");
                    priceFoilEX = priceFoilEX.split("$")[1].replace("\n", "");

                    //Full link to the card page
                    let linkToCardPage = await cardsInPage[i].$eval('.cardLink', el => el.getAttribute('href'));
                    linkToCardPage = "https://www.cardkingdom.com" + linkToCardPage;

                    //Parses String of the json file name
                    let existingCardJSONName = replaceAll(name.toLowerCase().replace("/","-")," " , "")+"-"+expansionName+".json";

                    //Checks if the file of the card to add the foil info exists before trying to open it
                    if(fs.existsSync(path.resolve("cardkingdom/cards/", existingCardJSONName))){

                        //Opens de data of the card and saves it in a temporal variable
                        let editCard = fs.readFileSync(path.resolve("cardkingdom/cards/", existingCardJSONName));
                        let card= JSON.parse(editCard);

                        //Ads foil information
                        card.webLink.foil = linkToCardPage ;
                        card.price.foil_ex = priceFoilEX;
                        card.price.foil_nm = priceFoilNM;

                        //Saves the card again as JSON
                        let newJSONCard = JSON.stringify(card, null, 2);

                        fs.writeFileSync(path.resolve("cardkingdom/cards/"+existingCardJSONName, newJSONCard));

                    }

                }

                //Continues with pagination
                await newTab.click('.pagination li:last-child a');
                await newTab.waitForTimeout(2000);


            }


        } catch (error) {
            console.log("No Foils found in " + expansionName + " expansion" );
        }
        //Adds to the object to keep track of the expansions names
        expansions.expansionName = expansionName;

        console.log("Ended with "+ expansionName);

        //Closes the tab when ends with expansion
        await newTab.close();
    }

    //Saves a log of the expansions intependently
    let allExpansions = JSON.stringify(expansions, null, 2);
    let filename = "expansions.js";
    fs.writeFileSync(path.resolve(filename), allExpansions );

    //Finished so we close the browser
    await browser.close();
})();

//Useful functions
function replaceAll(str, find, replace) {
    var escapedFind=find.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    return str.replace(new RegExp(escapedFind, 'g'), replace);
}
