import handler from "../../libs/handler-lib";
import s3 from "../../libs/s3-lib";
import puppeteer from "puppeteer-core";
import chromium from "chrome-aws-lambda";

export const chrome_args = [ // Prevents detection
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-spki-list',
    '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
];

export const selectors = {
    'notfound_str' : "Page Not Found", // not a DOM selector
    'login_str' : 'Login', // not a DOM selector
    'profilepic' : "header img",
    'followers' : "main header section ul:nth-child(2) li a span",
    'posts' : ".v1Nh3.kIKUG._bz0w",
    'savelogininfo' : ".sqdOP.L3NKy.y3zKF",
    'notnow' : ".aOOlW.HoLwm",
    'post_likes' : ".qn-0x ul li:first-child span:first-child",
    'post_comments' : ".qn-0x ul li:nth-child(2) span:first-child"
};


// HELPER FUNCTIONS

export function buildUrl(username){
    // not sure how to handle the exeption
    // testing online i got a "Missing Authentication Token" not passing the param
    if(typeof username === "undefined")
        throw new Error('need a username');
    return "https://www.instagram.com/" + username/*+ "/?__a=1"*/;
}

// async function getProfileData(username){
//       return await fetch( buildUrl(username) )
//       .then(res => res.json());
// }

async function initChrome(){
    const browser = await puppeteer.launch({
      // headless: false, // debug
      // slowMo: 50, // debug
      args: chrome_args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
    return browser;
}

async function getCookies(){
    const params = {
      Bucket: process.env.bucketName,
      Key: process.env.objectName
    };
    const cookiesString = await s3.getObject(params);
    //const cookiesString = await fs.readFile(process.env.COOKIES_PATH);
    return JSON.parse(cookiesString.Body.toString('utf-8'));
}

export function dePrettify(num){
    num = num.replaceAll(',', '');
    num = num.replaceAll('.', '');
    if(num.endsWith('k'))
        num = num.replace('k', '') + '000';
    else if(num.endsWith('m'))
        num = num.replace('m', '') + '000000';
    return Number(num);
}

async function login(browser){
    browser = typeof browser === "undefined" ? await initChrome() : browser;
    let page = await browser.newPage();
    await page.goto('https://www.instagram.com/accounts/login/');
    await page.waitForSelector('button.bIiDR');
    await page.click('button.bIiDR'); // accept cookies btn
    await page.waitForSelector('input[name="username"]');
    await page.waitForSelector('input[name="password"]');
    await page.waitForSelector('button[type="submit"]');
    await page.click('input[name="username"]');
    await page.type('input[name="username"]', process.env.IG_USER);
    await page.click('input[name="password"]');
    await page.type('input[name="password"]', process.env.IG_PWD);
    await Promise.all([
        page.waitForNavigation(),
        page.click('button[type="submit"]'),
    ]);
    await page.waitForSelector(selectors.savelogininfo);
    await page.click(selectors.savelogininfo);
    await page.waitForSelector(selectors.notnow);
    await page.click(selectors.notnow);
    // storing cookies to skip manual login next time
    const cookies = await page.cookies();
    const writeParams = {
      Bucket: process.env.bucketName,
      Key: process.env.objectName,
      Body: cookies,
      ContentType: "application/json"
    };
    await s3.putObject(writeParams);
    //await fs.writeFile(process.env.COOKIES_PATH, JSON.stringify(cookies, null, 2));
    // TODO: check for exceptions
    console.log('logged');
    return page;
}


// REST API

/**
 * this checks if the given username is existing in Instagram
 */
export const checkUsername = handler(async (event, context) => {
    let title = null;
    let browser = await initChrome();
    // let page = await login(browser); // no need to be logged for this
    let page = await browser.newPage();
    await page.goto(buildUrl(event.pathParameters.id));
    title = await page.title();
    browser.close();
    return !title.includes(selectors.notfound_str);
});

/**
 * returns the profile pic
 */
export const getProfilePic = handler(async (event, context) => {
    let browser = await initChrome();
    let page = await browser.newPage();
    await page.setCookie(...await getCookies());
    await page.goto(buildUrl(event.pathParameters.id));
    let title = await page.title();
    if(title.includes(selectors.login_str)){
        page = await login(browser);
        await page.goto(buildUrl(event.pathParameters.id));
    }
    await page.waitForSelector(selectors.profilepic);
    let link = await page.evaluate('document.querySelector("'+selectors.profilepic+'").getAttribute("src")');
    browser.close();
    return link;
});

/**
 * returns the statistics of a username, i.e. the following:
 *   - Number of followers
 *   - Number of avg comments per post (just use first 12 posts)
 *   - Number of avg likes per post (just use first 2 posts)
 *   - Engagement rate (ER) of the given username. ER is calculated as follows:
 *     - Avg likes from post 4 to post 10: (likes_post_4 + likes_post_5 + ...... + likes_post_10) / 7
 *     - Engagement rate is (avg likes / total followers) * 100
 */
export const userStatistics = handler(async (event, context) => {
    let likes_sum = 0;
    let comments_sum = 0;
    let er_likes_sum = 0;
    let post_map = [];

    let browser = await initChrome();
    let page = await browser.newPage();
    await page.setCookie(...await getCookies());
    await page.goto(buildUrl(event.pathParameters.id));
    let title = await page.title();
    if(title.includes(selectors.login_str)){
        page = await login(browser);
        await page.goto(buildUrl(event.pathParameters.id));
    }

    let followers = await page.evaluate('document.querySelector("'+selectors.followers+'").getAttribute("title")');
    followers = dePrettify(followers);

    let posts = await page.$$(selectors.posts);
    for (let post of posts) {
        let link = await post.$eval('img', (img) => img.src);
        await post.hover();
        let likes = await post.$eval(selectors.post_likes, (likes) => likes.innerText);
        let comments = await post.$eval(selectors.post_comments, (likes) => likes.innerText);
        post_map.push({'img': link, 'likes': dePrettify(likes), 'comments': dePrettify(comments)});
    }
    posts = post_map;
    browser.close();
    Object.keys(posts).forEach(function(key) {
        var post = posts[key];
        if(key < 2)
            likes_sum += post.likes;
        else if(key > 4 && key < 10)
            er_likes_sum += post.likes;
        comments_sum += post.comments;
    });
    return {
        'followers' : followers,
        'avg_comments' : (comments_sum / posts.length),
        'avg_likes' : (likes_sum / 2),
        'er' : (((er_likes_sum / 7) / followers) * 100).toFixed(1)
    };
});

/**
 * request body has the username of the poster and the username
 * of the tagged. Response can be true or false. Checks if in the 12 first published posts of
 * the poster the tagged has been effectively tagged or not
 */
// export const hasBeenTagged = handler(async (event, context) => {
//     const data = await getProfileData(event.poster);
//     var found_flag = false;
//     const posts = data.graphql.user.edge_owner_to_timeline_media.edges;
//     Object.keys(posts).forEach(function(key) {
//         var post = posts[key];
//         var tagged_users = post.node.edge_media_to_tagged_user.edges;
//         if(typeof tagged_users !== 'undefined' && tagged_users.length)
//             Object.keys(tagged_users).forEach(function(key) {
//                 var tagged_user = tagged_users[key].node.user;
//                 if(tagged_user.username == event.tagged)
//                     found_flag = true;
//             });
//     });
//     return found_flag;
// });
