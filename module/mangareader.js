const puppeteer = require("puppeteer");
var fs = require('fs');
const downloadsFolder = require('downloads-folder');
const constFile = require('../const.json');
const https = require('https'); // or 'https' for https:// URLs

/*
    @Author Shiro
 */

/*
 * @Purpose this method is for searching manga in mangareader
 * @param manga title
 * @return result of manga in mangareader (map list)
 * @throws timeout error 
 */
async function searchManga(mangaTitle) {
    console.log("START::mangareader search Manga");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    try {
        console.log("Search manga:" + mangaTitle + " in mangareader");
        console.log("url timeout:" + constFile.urlTimeout);
        await page.goto('http://mangareader.cc/search?s=' + mangaTitle + '&post_type=manga', {waitUntil: 'load', timeout: constFile.urlTimeout});//set timeout to 60000
    } catch (error) {
        console.error(error);
    }
    
    var mangaResultsLists = [];
    //get class left, consist of manga card, details of manga
    const mangaResults = await page.$$('.left');

    //if manga not found
    if (mangaResults.length < 1) {
        console.log("Manga " + mangaTitle + " not found in mangareader!");
        await browser.close();
        return null;
    }

    console.log("Manga " + mangaTitle + " found in mangareader");
    for (let i = 0; i < mangaResults.length; i++) {
        var mapIn = new Map();
        //get href of a children
        const url = await mangaResults[i].$eval('a', el => el.getAttribute('href'));
        //get title of manga, h3 child of a tag above
        const title = await mangaResults[i].$eval('h3', el => el.innerText);
        console.log("manga url" + url);
        console.log("manga title" + title);
        mapIn.set("title", title);
        mapIn.set("url", url);
        
        mangaResultsLists.push(mapIn);
    }
    await browser.close();
    console.log("Puppetter closed");
    console.log("END::mangareader search Manga");
    return mangaResultsLists;
}

/*
 * @Purpose this method is for get URL of the selected manga, this method called after searchManga method above
 * @param manga chapters URL
 * @return result of manga chapters in mangareader (map list)
 * @throws timeout error 
 */
async function selectManga(url) {
    console.log("START::mangareader select Manga");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    try {
        console.log("Manga url: " + url);
        console.log("Timeout:" + constFile.urlTimeout);
        await page.goto(url, 
            {waitUntil: 'load', timeout: constFile.urlTimeout});
    } catch (error) {
        console.error(error);
    }
    

    //leftoff in this page used other than list of chapters but only need list of chapter in tag <li>
    const mangaChapters = await page.$$('.leftoff');

    var mangaChapterLists = [];
    for (let i = 0; i < mangaChapters.length; i++) {
        var mapIn = new Map();
        //get chapters of selected manga inside tag <li> 
        if (await mangaChapters[i].$('a') != null) {
            //get manga chapters inside a href
            const mangaTitleChapter = await mangaChapters[i].$eval('a', el => el.getAttribute('title'));
            //get url of the chapters
            const urlChapter = await mangaChapters[i].$eval('a', el => el.getAttribute('href'));
            console.log("Manga title chapter: " + mangaTitleChapter);
            console.log("Manga URL chapter: " + urlChapter);
            mapIn.set("titleChapter", mangaTitleChapter);
            mapIn.set("urlChapter", urlChapter);
            mangaChapterLists.push(mapIn);
        }
    }
    await browser.close();
    console.log("Puppetter closed");
    console.log("END::mangareader select Manga");
    return mangaChapterLists;
}


/*
 * @Purpose this method is to get manga images
 * @param manga chapters URL
 * @param typeLoadImage => directURL(if user provide direct URL of manga) / searchURL(URL provided from selectManga method)
 * @return -, link not valid/chapter not found
 * @throws timeout error 
 */
async function loadMangaImage(mangaUrl, typeLoadImage) {
    console.log("START::mangareader loadMangaImage Manga");
    try {
        // Initialize Puppeteer
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
    
        console.log("Manga URL:" + mangaUrl);
        console.log("URL timeout: " + constFile.urlTimeout);
        // Specify manga issue page url
        try {
            await page.goto(
                mangaUrl, {waitUntil: 'load', timeout: constFile.urlTimeout}
            );
        } catch (error) {
            console.error(error); 
        }
        
        console.log("page has been loaded!");
    
        // While page is waiting for 1s, click on the 'Full Chapter' button and do the rest
        //in manga reader has selection box of chapter and all chapters
        try {
            console.log("Trying to select full chapter in the dropdown list");
            await page.select("select.loadImgType.pull-left", "1");
            await page.waitFor(5000);
        } catch (error) {
            await browser.close();
            if (error == "Error: No node found for selector: select.loadImgType.pull-left" && typeLoadImage == "directURL") {
                console.warn("Link not valid or chapter not found");
                // throw 'Link not valid or chapter not found';
                return 'Link not valid or chapter not found';
            } else if (error == "Error: No node found for selector: select.loadImgType.pull-left" && typeLoadImage == "searchURL") {
                console.warn("Chapter not found");
                // throw new Error('Chapter Not Found');
                return 'Chapter Not Found';
            } else {
                console.error("ERROR console :" + error);
                throw error;
            }
        }
        
        // await page.click("button.button4");
        console.log("'Full Chapter' has been selected!");

        //get manga title
        await page.waitForSelector('h1.chapter-title');
        let element = await page.$('h1.chapter-title');
        var titleChapterManga = await page.evaluate(el => el.textContent, element)
        console.log("Title chapter manga:" + titleChapterManga);

        // Evaluate/Compute the main task:
        // Here, we convert the Nodelist of images returned from the DOM into an array, then map each item and get the src attribute value, and store it in 'src' variable, which is therefore returned to be the value of 'issueSrcs' variable.
        const issueSrcs = await page.evaluate(() => {
        const srcs = Array.from(
            document.querySelectorAll(".lazy")//image element has lazy class attribute
        ).map((image) => image.getAttribute("src"));//get src value
        return srcs;
        });
        console.log("Page has been evaluated!");
    
        // End Puppeteer
        await browser.close();
        console.log("End Puppeteer");

        fs.promises.mkdir(downloadsFolder() + "\\" + titleChapterManga + "\\", { recursive: true }).catch(console.error);
        console.log("Create folder finished!");
        for (let index = 0; index < issueSrcs.length; index++) {
            console.log("URL Image manga-" + index + ":" + issueSrcs[index]);
            crawlImage(issueSrcs[index], index, titleChapterManga);
        }
        console.log("Download manga successful!");
        console.log("END::mangareader loadMangaImage Manga");
    } catch (error) {
        console.log(error);
    }
}

/*
 * @Purpose this method is used to download image
 * @param url image link
 * @param sequence
 * @param title chapter
 * @return -
 * @throws -
 */
function crawlImage(urlLink, varSequence, titleChapterManga) {
    console.log("START::mangareader crawlImage Manga");
    //inside parameter of createWriteStream is path+filename   
    const file = fs.createWriteStream(downloadsFolder() + "\\" + titleChapterManga + "\\"  + titleChapterManga + " page-" + varSequence + ".png");
    console.log("Prepare the image file");
    const request = https.get(urlLink, function(response) {
        //prevent memory leak with response.statusCode and setTimeout
        if (response.statusCode === 200) {
            response.pipe(file);
            console.log("Pipe the file");
            file.on('finish', function() {
                file.close();  // close() is async, call cb after close completes.
                console.log("Finish creating the file for " + titleChapterManga + " page-" + varSequence + ".png");
            });
        }
        request.setTimeout(60000, function() { // if after 60s file not downlaoded, we abort a request 
            request.abort();
        });
    });
    console.log("END::mangareader crawlImage Manga");
}

/*
 * @Purpose this method is used to get all latest manga release in mangareader
 * @param -
 * @return latest manga (map list)
 * @throws timeout
 */
async function latestMangaRelease() {
    console.log("START::mangareader get latest manga release");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    try {
        console.log("timeout:" + constFile.urlTimeout);
        await page.goto('http://mangareader.cc/', 
            {waitUntil: 'load', timeout: constFile.urlTimeout});
    } catch (error) {
        console.error(error);
    }
    
    var latestMangaLists = [];

    //class mng is the latest manga cards
    const latestMangas = await page.$$('.mng');
    console.log("Latest manga fetched");

    for (let i = 0; i < latestMangas.length; i++) {
        var mapIn = new Map();

        //class title_mg is the link of the manga title
        const titleMangasParents = await latestMangas[i].$$('.title_mg');
        for (let a = 0; a < titleMangasParents.length; a++) {
            var titleManga = await titleMangasParents[a].$eval('a', el => el.getAttribute("title"));
            var urlManga = await titleMangasParents[a].$eval('a', el => el.getAttribute("href"));
            console.log("titleManga:" + titleManga);
            console.log("urlManga:" + urlManga);
            mapIn.set("titleManga", titleManga);
            mapIn.set("urlManga", urlManga);
        }

        //latest chapters of each manga
        var latestMangaChapters = await latestMangas[i].$$('li');
        console.log("Get latest chapter of each manga");
        
        //in here, only get the latest chapter
        var latestMangaChapter = await latestMangaChapters[0].$eval('a', el => el.getAttribute("title"));
        var urlLatestMangaChapter = await latestMangaChapters[0].$eval('a', el => el.getAttribute("href"));
        console.log("latestMangaChapter:" + latestMangaChapter);
        console.log("urlLatestMangaChapter:" + urlLatestMangaChapter);
        mapIn.set("latestMangaChapter", latestMangaChapter);
        mapIn.set("urlLatestMangaChapter", urlLatestMangaChapter);
        latestMangaLists.push(mapIn);
    }
    await browser.close();
    console.log("Close pupeeteer");
    console.log("END::mangareader get latest manga release");
    return latestMangaLists;
}

module.exports = {
    searchManga,
    selectManga,
    loadMangaImage,
    crawlImage,
    latestMangaRelease
};

