var Crawler = require("crawler");
var fs = require('fs');
var arrayManga = new Array();
 
var c = new Crawler({
    // encoding:null,
    // jQuery:false,// set false to suppress warning message.
    callback:function(err, res, done){
        if(err){
            console.error(err.stack);
        }else{
            var $ = res.$;
            var tempImg = res.$("img");
            for (let x = 0; x < tempImg.length ; x++) {
                if (tempImg[x]['attribs']['class'] != null) {
                    if (!tempImg[x]['attribs']['class'].includes("logo")) {
                        arrayManga.push(tempImg[x]['attribs']['src']);
                    }
                }
            }
            if (arrayManga.length > 0) {
                for (let index = 0; index < arrayManga.length; index++) {
                    c.queue({
                        uri:arrayManga[index],
                        filename:"Manga_Trial" + index + ".png",
                        encoding:null,
                        jQuery:false,// set false to suppress warning message.
                        callback: function (error, res, done) {
                            if(error){
                                console.log(error);
                            }else{
                                fs.createWriteStream(res.options.filename).write(res.body);
                            }
                            done();
                        }
                    });
                }
            }
            // fs.createWriteStream(res.options.filename).write(res.body);
        }
        done();
    }
});

c.queue({
    uri:"https://mangahub.io/chapter/uzaki-chan-wa-asobitai/chapter-65"
});


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