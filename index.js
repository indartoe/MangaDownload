var mangareader = require('./module/mangareader.js');
const { prefix, answerPrefix, token } = require("./config.json");
const constFile = require('./const.json');
const { Client } = require("discord.js");
const Discord = require("discord.js");
const bot = new Client();
//store all result search of manga
var mangaLists = [];
var mangaResultsLists = [];
var mangaChapterLists = [];
var latestMangaLists = [];

bot.once("ready", () => {
    console.log("Ready!");
    bot.user.setActivity("use !help for help"); 
  });
  
bot.once("reconnecting", () => {
    console.log("Reconnecting!");
});

bot.once("disconnect", () => {
    console.log("Disconnect!");
});

bot.on("message", async message => {
    //check whether the message is from our own bot. IMPORTANT!!
    if (message.author.bot) return;

    //check whether the message is start with prefix command
    if (!message.content.startsWith(prefix)) return;

    if (!message.guild.me.hasPermission(['SEND_MESSAGES','EMBED_LINKS','ADD_REACTIONS'])) {
        console.log("I dont have permission");
        return;
    }
    
    if (message.content.startsWith(`${prefix}dm`)) {
        downloadManga(message);
    } else if (message.content.startsWith(`${prefix}sm`)) {
        searchManga(message);
    } else if (message.content.startsWith(`${prefix}sd`)) {
        searchDownload(message);
    } else if (message.content.startsWith(`${prefix}help`)) {
        helpManga(message);
    } else {
        message.channel.send("Please input a valid command!");
    }
});

async function downloadManga(message) {
    console.log("START::Download Manga command");
    console.log("user want to download manga");
    const args = message.content.split(" ");

    if (!args[1]) {
        message.channel.send("You need to provide a link");
        console.log("END::Download Manga command");
        return;
    }
    console.log("URL provided:" + args[1]);
    try {
        message.channel.send("Generating and downloading manga files from " + args[1] + ".Loading :zzz:")
        .then(async msg => {
            //have return value whether have error or not
            var feedback = await mangareader.loadMangaImage(args[1], "directURL");  
            msg.delete();
            if (feedback == "Link not valid or chapter not found") {
                message.channel.send("Link " + args[1] + " not valid for downloading manga!");
            } else if (feedback == null) {
                message.channel.send("Download manga from " + args[1] + " finished!");
            }
            console.log("END::Download Manga command");
        });
    } catch (error) {
        message.channel.send(error);
        console.error(error);
        return;
    }
}

async function searchManga(message) {
    console.log("START::Search Manga command");
    console.log("user want to search manga");
    if (message.content.startsWith(`${prefix}sm `)) {
        var mangaTitleString = message.content.substr(`${prefix}sm `.length);
        mangaChapterLists = await waitMangaChapter(message, mangaTitleString);
        console.log("END::Search Manga command");
    } else {
        message.channel.send('You need to provide manga title');
        console.log("END::Search Manga command");
    }
}

async function searchDownload(message) {
    console.log("START::Search Download Manga command");
    console.log("user want to search manga and download");
    if (message.content.startsWith(`${prefix}sd `)) {
        var mangaTitleChapterString = message.content.substr(`${prefix}sd `.length);
        
        /*
         *  split manga title and chapter (; separated) because the format is <title>;<chapters>
         *  chapters format using comma(,) or and dash (-) for continous chapters
         */
        var mangaChapterSplit = mangaTitleChapterString.split(";");
        var reqMangaChapters = String(mangaChapterSplit[1]).split(/[,-]+/);
        console.log("User want to find " + mangaChapterSplit[0] + ", chapter(s): " + reqMangaChapters);
        for (let b = 0; b < reqMangaChapters.length; b++) {
            //check if the input has non-number value
            if (isNaN(reqMangaChapters[b])) {
                console.log(reqMangaChapters[b] + " is not a number");
                message.channel.send(reqMangaChapters[b] + " is not a number. Please provide number between " + 1 + " to " + mangaChapterLists.length + ".Cancelling operation!");
                console.log("END::Search Download Manga command");
                return;
            } 
        }
        
        const mangaChapters = processChapters(mangaChapterSplit[1]);

        if (mangaChapters == 'Range Chapter invalid.') {
            message.channel.send("Range Chapter invalid. Aborting command");
            return;
        }

        //after find all the manga results, immediately fetch the first manga from the result
        console.log("user want to find manga " + mangaChapterSplit[0]);
        mangaResultsLists = await mangareader.searchManga(mangaChapterSplit[0]);
        
        for (let i = 0; i < mangaChapters.length; i++) {
            //get the first manga title result and replace the space with - to generate the chapter manga url
                message.channel.send("Generating and downloading manga files " + mangaResultsLists[0].get("title") + " chapter " + mangaChapters[i] + ". Now loading :zzz:")
                    .then(async msg => {
                        try {
                            let mangaTitle = mangaResultsLists[0].get("title").split(" ").join("-");
                            var urlManga = "http://mangareader.cc/chapter/"+mangaTitle+"-chapter-" + mangaChapters[i];
                            message.channel.send("Trying to download " + mangaResultsLists[0].get("title") + " chapter " + mangaChapters[i]);
                            var feedback = await mangareader.loadMangaImage(urlManga, "searchURL");
                            console.log("feedback " +feedback);
                            if (feedback == "Chapter Not Found") {
                                message.channel.send("Chapter " + mangaResultsLists[0].get("title") + " chapter " + mangaChapters[i] + " not found!");
                                console.log("END::Search Download Manga command");
                            } else if (feedback == null){
                                message.channel.send("Download manga " + mangaResultsLists[0].get("title") + " chapter " + mangaChapters[i] + " has been finished!");
                                console.log("END::Search Download Manga command");
                            }
                            msg.delete();
                        } catch (error) {
                            console.log("search download error occured");
                            if (error.message == "Chapter Not Found") {
                                message.channel.send("Chapter " + mangaResultsLists[0].get("title") + " chapter " + mangaChapters[i] + " not found!");
                            } else {
                                message.channel.send(error);
                            }
                        }
                });
        }
    } else {
        message.channel.send(`You need to provide manga title and chapters. The format is ${prefix}sd <manga title>;<chapter(s), if many comma separated`);
        console.log("END::Search Download Manga command");
    }
}

async function helpManga(message) {
    message.channel.send("Only mangareader.cc supported \n " +
        "List of commands: \n " +
        "-!dm <url link manga chapters> => download manga directly through link eg. !dm http://mangareader.cc/chapter/Arifureta-Shokugyou-De-Sekai-Saikyou-chapter-34\n" +
        "-!sm <manga title> => search for manga \n" +
        "-!sd <manga title>;<chapter(s), if many chapters comma(,) separated and dash(-) for range> => search and download manga \n " +
        "nb::this command take first manga title from the results.");
}

function processChapters(parameterChapter) {
    var chapters = [];
    let chaptersSplit = parameterChapter.split(",");
    for (let i = 0; i < chaptersSplit.length; i++) {
        //handling the range chapters
        const rangeChapters = chaptersSplit[i].split("-");
       
        console.log("chapter range: " + rangeChapters[0] + "-" + rangeChapters[1]);
        //if user doesn't put range chapters
        if (rangeChapters.length < 2) {
            console.log("Pushed chapter: " + rangeChapters[0]);
            chapters.push(rangeChapters[0]);
        } else {
            console.log("chapter range: " + rangeChapters[0] + "-" + rangeChapters[1]);
            if (parseInt(rangeChapters[0]) > parseInt(rangeChapters[1])) {
                return "Range Chapter invalid."
            }

            for (let a = rangeChapters[0]; a <= rangeChapters[1]; a++) {
                chapters.push(a);
                console.log("Pushed chapter: " + a);
            }
        }
    }
    return chapters;
}

//method used after selecting manga
async function waitMangaChapter(message, mangaTitleString) {
    message.channel.send("Fetching all results of " + mangaTitleString +". Now loading :zzz:")
            .then(async msg => {
                //searching manga
                mangaResultsLists = await mangareader.searchManga(mangaTitleString);
                let mangaResultString = "Results of " + mangaTitleString + ":";
                if (mangaResultsLists == null) {
                    message.channel.send("Manga " + mangaTitleString + " not found.");
                    return;
                }
                for (let i = 0; i < mangaResultsLists.length; i++) {
                    mangaResultString = mangaResultString + "\n" + (i + 1) + " - " + mangaResultsLists[i].get("title");
                }
                mangaResultString = mangaResultString + "\n" + "Please type number on the left side of the manga title to select the manga.";
                
                //send message result of manga based on user keyword
                message.channel.send(mangaResultString);
                msg.delete();

                //wait user to select result of searched manga
                message.channel.awaitMessages(m => m.author.id == message.author.id,
                    {max: 1, time: 300000}).then(async collected => {
                        //check if user feedback is number
                        if (isNaN(collected.first().content)) {
                            message.channel.send("Need to provide number between " + 1 + " to " + mangaResultsLists.length + ".Cancelling operation!");
                        } else {
                            var indexContent = (parseInt(collected.first().content) - 1);
                            if (indexContent > mangaResultsLists.length) {
                                message.channel.send("Need to provide number between " + 1 + " to " + mangaResultsLists.length + ". Cancelling operation!");
                            } else {
                                console.log(mangaResultsLists[indexContent]);
                                console.log(mangaResultsLists[indexContent].get("url"));
                                message.channel.send("Fetching chapters of " + mangaResultsLists[indexContent].get("title") + ". Now loading :zzz:");

                                //put chapters result of selected manga
                                let mangaChapterResultString = "Results of " + mangaResultsLists[indexContent].get("title") + ":";
                                //fetching all chapters of selected manga
                                mangaChapterLists = await mangareader.selectManga(mangaResultsLists[indexContent].get("url"));
                                let page = 1;
                                let pages = Math.trunc(mangaChapterLists.length/20);

                                for (let a = (0+(20*(page-1))); a < (1*20); a++) {
                                    mangaChapterResultString = mangaChapterResultString + "\n" + (a + 1) + " - " + mangaChapterLists[a].get("titleChapter");
                                }

                                //create message with pagination
                                const embed = new Discord.MessageEmbed() // Define a new embed
                                .setColor(0xffffff) // Set the color
                                .setFooter(`Page ${page} of ${pages}, ${mangaChapterLists.length} chapters\nThe Format are &rd <chapter> for read and &dl <chapters> for downloading manga.\nPlease type number on the left side of the manga title to select the manga. Can input multiple chapters with comma(,) or dash(-) separated. Eg. 1,3,5,8-10(only applies to download manga)`)
                                .setDescription(mangaChapterResultString);

                                message.channel.send(embed).then(msg => {

                                    msg.react('⬅').then( r => {
                                        msg.react('➡')
                                
                                        // Filters
                                        const backwardsFilter = (reaction, user) => reaction.emoji.name === '⬅' && user.id === message.author.id;
                                        const forwardsFilter = (reaction, user) => reaction.emoji.name === '➡' && user.id === message.author.id;
                                
                                        const backwards = msg.createReactionCollector(backwardsFilter, {timer: 6000});
                                        const forwards = msg.createReactionCollector(forwardsFilter, {timer: 6000});
                                
                                        //when click previous
                                        backwards.on('collect', r => {
                                            console.log("user click previous page");
                                            if (page === 1) return;
                                            page--;

                                            mangaChapterResultString = "Results of " + mangaResultsLists[indexContent].get("title") + ":";
                                            for (let a = (0+(20*(page-1))); a < (page*20); a++) {
                                                mangaChapterResultString = mangaChapterResultString + "\n" + (a + 1) + " - " + mangaChapterLists[a].get("titleChapter");
                                            }
                                            console.log(mangaChapterResultString);
                                            embed.setDescription(mangaChapterResultString);
                                            embed.setFooter(`Page ${page} of ${pages}, ${mangaChapterLists.length} chapters\nThe Format are &rd <chapter> for read and &dl <chapters> for downloading manga.\nPlease type number on the left side of the manga title to select the manga. Can input multiple chapters with comma(,) or dash(-) separated. Eg. 1,3,5,8-10(only applies to download manga)`)
                                            msg.edit(embed)
                                        })
                                
                                        //when click next page
                                        forwards.on('collect', r => {
                                            console.log("user click next page");
                                            if (page === pages.length) return;
                                            page++;
                                            mangaChapterResultString = "Results of " + mangaResultsLists[indexContent].get("title") + ":";
                                            for (let a = (0+(20*(page-1))); a < (page*20); a++) {
                                                mangaChapterResultString = mangaChapterResultString + "\n" + (a + 1) + " - " + mangaChapterLists[a].get("titleChapter");
                                            }
                                            console.log(mangaChapterResultString);
                                            embed.setDescription(mangaChapterResultString);
                                            embed.setFooter(`Page ${page} of ${pages}, ${mangaChapterLists.length} chapters\nThe Format are &rd <chapter> for read and &dl <chapters> for downloading manga.\nPlease type number on the left side of the manga title to select the manga. Can input multiple chapters with comma(,) or dash(-) separated. Eg. 1,3,5,8-10(only applies to download manga)`);
                                            msg.edit(embed)
                                        })
                                    })
                                });
                                
                                await chapterSelected(message);
                            }
                        }   
                }).catch((error) => {
                    console.log(error);
                    message.reply('No answer after 5 minutes, operation canceled.');
                });
        });
}

//method used after selecting chapter 
async function chapterSelected(message) {
    message.channel.awaitMessages(m => m.author.id == message.author.id,
        {max: 1, time: 300000}).then(async collected => {
            console.log("Start::Select chapter manga");
            //check if the command is &dl for download or &rd for read manga
            if (collected.first().content.startsWith(`${answerPrefix}rd `)) {
                //in read manga case, only valid for 1 chapter
                var commandChapters = collected.first().content.substr(`${answerPrefix}rd `.length);

                //check if the input has non-number value
                if (isNaN(commandChapters)) {
                    message.channel.send(commandChapters + " is not a number. Please provide number between " + 1 + " to " + mangaChapterLists.length + ".Cancelling operation!");
                    return;
                } else {
                    //check if the input has number that out of range
                    var indexContent = (parseInt(commandChapters) - 1);
                    if (indexContent > mangaChapterLists.length) {
                        message.channel.send(inputChapter + " out of index range. Please provide number between " + 1 + " to " + mangaChapterLists.length + ".Cancelling operation!");
                        return;
                    } 
                }

                let inputChapter1 = (parseInt(commandChapters) - 1);
                //Read manga based on selected manga and chapters
                message.channel.send("Trying to load manga " + mangaChapterLists[inputChapter1].get("urlChapter"));
                message.channel.send("Buffering manga files " + mangaChapterLists[inputChapter1].get("titleChapter") + ". Now loading :zzz:")
                        .then(async msg => {
                            var mangaImageURL = await mangareader.loadMangaImageLink(mangaChapterLists[inputChapter1].get("urlChapter"), "searchURL");
                            msg.delete();

                            if (mangaImageURL == null) {
                                message.channel.send("Timeout when fetching manga. Aborting");
                                return;
                            }
                            let page = 1;
                            let pages = mangaImageURL.length;
                            //create message with pagination
                            const embed = new Discord.MessageEmbed() // Define a new embed
                            .setColor(0xffffff) // Set the color
                            .setFooter(`Page ${page} of ${pages}, ${mangaImageURL.length} `)
	                        .setImage(mangaImageURL[parseInt(page)])
                            .setDescription(mangaChapterLists[inputChapter1].get("titleChapter") + "Page: " + page);

                            message.channel.send(embed).then(msg => {
                                msg.react('⬅').then( r => {
                                    msg.react('➡')
                            
                                    // Filters
                                    const backwardsFilter = (reaction, user) => reaction.emoji.name === '⬅' && user.id === message.author.id;
                                    const forwardsFilter = (reaction, user) => reaction.emoji.name === '➡' && user.id === message.author.id;
                            
                                    const backwards = msg.createReactionCollector(backwardsFilter, {timer: 6000});
                                    const forwards = msg.createReactionCollector(forwardsFilter, {timer: 6000});
                            
                                    //when click previous
                                    backwards.on('collect', r => {
                                        console.log("user click previous page");
                                        if (page === 1) return;
                                        page--;

                                        console.log("URL manga: " + mangaImageURL[parseInt(page)]);
                                        
	                                    embed.setImage(mangaImageURL[parseInt(page)]);
                                        embed.setDescription(mangaChapterLists[inputChapter1].get("titleChapter") + "Page: " + page);
                                        embed.setFooter(`Page ${page} of ${pages}, ${mangaImageURL.length}`);
                                        msg.edit(embed)
                                    })
                            
                                    //when click next page
                                    forwards.on('collect', r => {
                                        console.log("user click next page");
                                        if (page === pages.length) return;
                                        page++;

                                        console.log("URL manga: " + mangaImageURL[parseInt(page)]);
	                                    embed.setImage(mangaImageURL[parseInt(page)]);
                                        embed.setDescription(mangaChapterLists[inputChapter1].get("titleChapter") + "Page: " + page);
                                        embed.setFooter(`Page ${page} of ${pages}, ${mangaImageURL.length}`);
                                        msg.edit(embed)
                                    })
                                })
                            });
                            
                    });
                
                console.log("END::Manga download command");
            } else if(collected.first().content.startsWith(`${answerPrefix}dl `)) {
                var commandChapters = collected.first().content.substr(`${answerPrefix}dl `.length);

                //split user input based on ','/and '-'
                let chapterArr = commandChapters.split(/[,-]+/);
                for (let b = 0; b < chapterArr.length; b++) {
                    console.log("Chapter of user input: " + chapterArr[b]);
                    const inputChapter = chapterArr[b];
                    //check if the input has non-number value
                    if (isNaN(inputChapter)) {
                        message.channel.send(inputChapter + " is not a number. Please provide number between " + 1 + " to " + mangaChapterLists.length + ".Cancelling operation!");
                        return;
                    } else {
                        //check if the input has number that out of range
                        var indexContent = (parseInt(inputChapter) - 1);
                        if (indexContent > mangaChapterLists.length) {
                            message.channel.send(inputChapter + " out of index range. Please provide number between " + 1 + " to " + mangaChapterLists.length + ".Cancelling operation!");
                            return;
                        } 
                    }  
                }

                chapterArr = processChapters(collected.first().content);

                console.log("Array length of chapters: " + chapterArr.length);
                if (chapterArr == 'Range Chapter invalid.') {
                    message.channel.send("Range Chapter invalid. Aborting command");
                    return;
                }
                //split from above because there's problem when downloading batch manga
                //download manga based on selected manga and chapters
                for (let c = 0; c < chapterArr.length; c++) {
                    let inputChapter1 = (parseInt(chapterArr[c]) - 1);
                    message.channel.send("Trying to download " + mangaChapterLists[inputChapter1].get("urlChapter"));
                    message.channel.send("Generating and downloading manga files " + mangaChapterLists[inputChapter1].get("titleChapter") + ". Now loading :zzz:")
                        .then(async msg => {
                            await mangareader.loadMangaImage(mangaChapterLists[inputChapter1].get("urlChapter"), "searchURL");
                            msg.delete();
                            message.channel.send("Download manga " + mangaChapterLists[inputChapter1].get("titleChapter") + " has been finished!");
                    });
                }
                console.log("END::Manga download command");
            } else {
                message.channel.send('You need to provide valid command');
                console.log("END::Search Manga command");
            }
    }).catch((error) => {
        console.log(error);
        message.reply('No answer after 5 minutes, operation canceled.');
    });
}

bot.login(token);
