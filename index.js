var Crawler = require("crawler");
var fs = require('fs');
var fsRead = require('fs');
const puppeteer = require("puppeteer");
const http = require('http'); // or 'https' for https:// URLs
var i = 1;

loadMangaImage();

function loadMangaImage() {
    (async () => {
        try {
          // Initialize Puppeteer
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
      
          // Specify comic issue page url
          await page.goto(
            "http://mangareader.cc/chapter/komi-san-wa-komyushou-desu-chapter-298#1"
          );
          console.log("page has been loaded!");
      
          // While page is waiting for 1s, click on the 'Full Chapter' button and do the rest
        //   await page.waitFor(5000);
          await page.select("select.loadImgType.pull-left", "1");
          await page.waitFor(5000);
          // await page.click("button.button4");
          console.log("'Full Chapter' button has been clicked!");
      
          // Evaluate/Compute the main task:
          // Here, we convert the Nodelist of images returned from the DOM into an array, then map each item and get the src attribute value, and store it in 'src' variable, which is therefore returned to be the value of 'issueSrcs' variable.
          const issueSrcs = await page.evaluate(() => {
            const srcs = Array.from(
              document.querySelectorAll(".lazy")
            ).map((image) => image.getAttribute("src"));
            return srcs;
          });
          // issueSrcs.split();
          // for (let index = 0; index < array.length; index++) {
          //     console.log(issueSrcs[index]);
          // }
          console.log("Page has been evaluated!");
      
          // Persist data into data.json file
        //   fs.writeFileSync("./data.json", JSON.stringify(issueSrcs));
        //   console.log("File is created!");
      
          // End Puppeteer
          await browser.close();
          for (let index = 0; index < issueSrcs.length; index++) {
              crawlImage(issueSrcs[index], index);
          }
        } catch (error) {
          console.log(error);
        }
      })();
}

function crawlImage(urlLink, varSequence) {
    const file = fs.createWriteStream("Manga_Trial" + varSequence + ".png");
    const request = http.get(urlLink, function(response) {
        response.pipe(file);
    });
    // var c = new Crawler({
    //     filename:"Manga_Trial" + varSequence + ".png",
    //     encoding:null,
    //     jQuery:false,// set false to suppress warning message.
    //     callback:function(err, res, done){
    //         if(err){
    //             console.error(err.stack);
    //         }else{
    //             fs.createWriteStream(res.options.filename).write(res.body);
    //         }
    //         done();
    //     }
    // });
    
    // c.queue({
    //     uri:urlLink
    // });
}

// const c = new Crawler({
//     maxConnections : 10,
//     // This will be called for each crawled page
//     callback : function (error, res, done) {
//         if(error){
//             console.log(error);
//         }else{
//             var $ = res.$;
//             // $ is Cheerio by default
//             //a lean implementation of core jQuery designed specifically for the server
//             console.log($("title").text());
//         }
//         done();
//     }
// });
 
// // Queue just one URL, with default callback
// // c.queue('https://code.visualstudio.com/docs/nodejs/debugging-recipes');
 
// // Queue a list of URLs
// c.queue(['http://www.google.com/','http://www.yahoo.com']);
 
// // Queue URLs with custom callbacks & parameters
// // c.queue([{
// //     uri: 'https://mangakakalot.com/chapter/ny922152/chapter_189',
// //     // jQuery: false,
 
// //     // The global callback won't be called
// //     callback: function (error, res, done) {
// //         if(error){
// //             console.log(error);
// //         }else{
// //             console.log('Grabbed', res.body.length, 'bytes');
// //             fs.createWriteStream(res.options.filename).write(res.body);
// //         }
// //         done();
// //     }
// // }]);

// c.queue([{
//     //unit test work with httpbin http2 server. It could be used for test
//     uri: 'https://mangahub.io/chapter/uzaki-chan-wa-asobitai/chapter-65',
//     method: 'GET',
//     http2: true, //set http2 to be true will make a http2 request
//     callback: (error, response, done) => {
//         if (error) {
//             console.error(error);
//             return done();
//         }

//         // console.log(`inside callback`);
//         // console.log(response.body);
//         fs.createWriteStream(response.options.filename).write(response.body);
//         return done();
//     }
// }]);
 
// Queue some HTML code directly without grabbing (mostly for tests)
// c.queue([{
//     html: '<p>This is a <strong>test</strong></p>'
// }])-;