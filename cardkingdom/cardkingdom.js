const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');


(async () => {
    const browser = await puppeteer.launch({ headless: false }); // default is true
    // const browser = await puppeteer.launch();
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


    for (let i = 0; i < 5; i++) {
        const newTab = await browser.newPage();
        await newTab.goto(expansionLinks[i][1]);
        await newTab.close();
    }



    await browser.close();
})();