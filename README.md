# MTG Crawler
Crawler for major Magic The Gathering cardshops.

It's done using Puppeteer a Node.js library.


## Installation
You need to have Node.js installed previously in your computer. Go to [Node.js](https://nodejs.org/es/) 
website for details.

Then run on the project
```bash
npm install
```
To install dependencies. 

Then you also will need Puppeteer, to install you just need to run
```bash
npm i puppeteer
# or "yarn add puppeteer"
```

## Files And Usage

There is a directory foreach Magic The Gathering online shop crawled.

Every directory contains a main crawler script ad a cards directory (where crawled data is stored in JSON files). The main script name is the same as the directory name.

In the root of the project there's also a JSON file of the object structure used to save card data.

To execute a script you will need to use node <mark>directory/script.js</mark>


So for example if i want to execute the CardKindom.com crawler I will have to execute the following command on the terminal.

```bash
node cardkingdom/cardkingdom.js
```

                    