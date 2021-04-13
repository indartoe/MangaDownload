var Crawler = require("crawler");
var fs = require('fs');
var arrayManga = new Array();
const https = require('https'); // or 'https' for https:// URLs
const downloadsFolder = require('downloads-folder');
//store all result search of manga
var mangaLists = [];

let c = new Crawler();

c.queue({
    uri: "https://mangahub.io/search?q=maousama",
    callback: function (err, res, done) {
        if (err) console.error(err.stack);
        let $ = res.$;
        try {
            $(".media-heading").each(function(i, mangaCard) {
                var tempMap = new Map();
                tempMap.set("title", $(mangaCard).find('a').text());
                tempMap.set("url", $(mangaCard).find('a').attr('href'));
                // tempMap.set($(mangaCard).find('a').text(), $(mangaCard).find('a').attr('href'));
                mangaLists.push(tempMap);
                // mangas[i] = [$(mangaCard).find('a').text(), $(mangaCard).find('a').attr('href')];
            });

            $(".media-body").each(function(i, mangaChapter) {
                var tempMap = new Map();
                let chaptersSplit = $(mangaChapter).find('p').text().split(" ");
                tempMap = mangaLists[i];
                tempMap.set("totalChapter", chaptersSplit[0] + " Chapters");
                mangaLists[i] = tempMap;
                // tempMap.set("title", $(mangaCard).find('p').text());
                // tempMap.set("url", $(mangaCard).find('a').attr('href'));
                // mangaLists.push(tempMap);
            });
            // $ is Cheerio by default 
            //a lean implementation of core jQuery designed specifically for the server 
            if (mangaLists.length > 0 ) {
                console.log(mangaLists);
            } else {
                console.log("No result!");
            }

            var urlChapter = mangaLists[1].get("url") + "/chapter-1";
            c.queue({
                uri: urlChapter,
                encoding:null,
                jQuery:false,// set false to suppress warning message.
                rateLimit: 2000,
                maxConnections: 1,
                callback: function (err, res, done) {
                    console.log("URL " + mangaLists[1].get("url"));
                    if (err) console.error(err.stack);
                    let $ = res.$;
                    try {
                        $(".img").each(function(i, mangaChapter) {
                            var tempMap = new Map();
                            let chaptersSplit = $(mangaChapter).find('p').text().split(" ");
                            tempMap = mangaLists[i];
                            tempMap.set("totalChapter", chaptersSplit[0] + " Chapters");
                            mangaLists[i] = tempMap;
                            // tempMap.set("title", $(mangaCard).find('p').text());
                            // tempMap.set("url", $(mangaCard).find('a').attr('href'));
                            // mangaLists.push(tempMap);
                        });
                        // var tempImg = res.$("img");
                        // for (let x = 0; x < tempImg.length ; x++) {
                        //     if (tempImg[x]['attribs']['class'] != null) {
                        //         if (!tempImg[x]['attribs']['class'].includes("logo")) {
                        //             arrayManga.push(tempImg[x]['attribs']['src']);
                        //         }
                        //     }
                        // }
                        // if (arrayManga.length > 0) {
                        //     for (let index = 0; index < arrayManga.length; index++) {
                        //         const file = fs.createWriteStream(downloadsFolder() + "\\"  + "Manga_Trial" + index + ".png");
                        //         const request = https.get(arrayManga[index], function(response) {
                        //             //prevent memory leak with response.statusCode and setTimeout
                        //             if (response.statusCode === 200) {
                        //                 response.pipe(file);
                        //                 file.on('finish', function() {
                        //                     file.close();  // close() is async, call cb after close completes.
                        //                 });
                        //             }
                        //             request.setTimeout(60000, function() { // if after 60s file not downlaoded, we abort a request 
                        //                 request.abort();
                        //             });
                        //         });
                        //     }
                        // }
                    } catch (e) {
                        console.error(`Encountered an error crawling. Aborting crawl.`);
                        done()
            
                    }
                    done();
                }
            });
        } catch (e) {
            console.error(`Encountered an error crawling. Aborting crawl.`);
            done()

        }
        done();
    }
});



// var c = new Crawler({
//     // encoding:null,
//     // jQuery:false,// set false to suppress warning message.
//     callback:function(err, res, done){
//         if(err){
//             console.error(err.stack);
//         }else{
//             var $ = res.$;
//             var tempImg = res.$("img");
//             for (let x = 0; x < tempImg.length ; x++) {
//                 if (tempImg[x]['attribs']['class'] != null) {
//                     if (!tempImg[x]['attribs']['class'].includes("logo")) {
//                         arrayManga.push(tempImg[x]['attribs']['src']);
//                     }
//                 }
//             }
//             if (arrayManga.length > 0) {
//                 for (let index = 0; index < arrayManga.length; index++) {
//                     const file = fs.createWriteStream(downloadsFolder() + "\\"  + "Manga_Trial" + index + ".png");
//                     const request = https.get(arrayManga[index], function(response) {
//                         //prevent memory leak with response.statusCode and setTimeout
//                         if (response.statusCode === 200) {
//                             response.pipe(file);
//                             file.on('finish', function() {
//                                 file.close();  // close() is async, call cb after close completes.
//                             });
//                         }
//                         request.setTimeout(60000, function() { // if after 60s file not downlaoded, we abort a request 
//                             request.abort();
//                         });
//                     });
//                     // c.queue({
//                     //     uri:arrayManga[index],
//                     //     filename:"Manga_Trial" + index + ".png",
//                     //     encoding:null,
//                     //     jQuery:false,// set false to suppress warning message.
//                     //     callback: function (error, res, done) {
//                     //         if(error){
//                     //             console.log(error);
//                     //         }else{
//                     //             fs.createWriteStream(res.options.filename).write(res.body);
//                     //         }
//                     //         done();
//                     //     }
//                     // });
//                 }
//             }
//             // fs.createWriteStream(res.options.filename).write(res.body);
//         }
//         done();
//     }
// });

//download the file
// c.queue({
//     uri:"https://mangahub.io/chapter/uzaki-chan-wa-asobitai/chapter-65"
// });

// var c2 = new Crawler({
//     maxConnections: 10,
//     // This will be called for each crawled page 
//     callback: function(error, res, done) {
//         if (error) {
//             console.log(error);
//         } else {
//             var $ = res.$;
//             $(".media-heading").each(function(i, mangaCard) {
//                 var tempMap = new Map();
//                 tempMap.set($(mangaCard).find('a').text(), $(mangaCard).find('a').attr('href'));
//                 mangaLists.push(tempMap);
//                 // mangas[i] = [$(mangaCard).find('a').text(), $(mangaCard).find('a').attr('href')];
//             });
//             // $ is Cheerio by default 
//             //a lean implementation of core jQuery designed specifically for the server 
//             if (mangaLists.length > 0 ) {
//                 console.log(mangaLists);
//                 console.log(mangaLists[1]);
//             } else {
//                 console.log("No result!");
//             }
//         }
//         done();
//     }
// });

// c2.queue("https://mangahub.io/search?q=maousama");
// console.log(mangaLists[1]);
// c.queue({
//     uri:mangaLists[1]
// });


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
// }]);