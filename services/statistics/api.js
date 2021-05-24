import fetch from 'node-fetch';
import handler from "../../libs/handler-lib";
import HttpsProxyAgent from "https-proxy-agent";
import * as fs from 'fs'; // to get cookies from fs

const agents = [
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 11.3; rv:88.0) Gecko/20100101 Firefox/88.0"
];

let fetch_args = {
    headers : {
        'User-Agent' : agents[ Math.floor(Math.random() * agents.length) ],
        'Cookie' : getCookies()
    },
    agent : new HttpsProxyAgent(process.env.HTTP_PROXY)
};

// HELPER FUNCTIONS

export function getCookies(){
    // This is compatible with the json cookie jar saved by the puppeteer scraper
    // you can otherwise use the Cookie string of the req headers grabbed from the chrome devTools of a logged session
    let raw_header_cookie = '';
    const cookiesString = fs.readFileSync(process.env.COOKIES_PATH);
    let cookie_jar = JSON.parse(cookiesString);
    Object.keys(cookie_jar).forEach(function(key) {
        var cookie = cookie_jar[key];
        raw_header_cookie += cookie.name + '=' + cookie.value + '; ';
    });
    return raw_header_cookie;
}

export function buildUrl(username){
    // not sure how to handle the exeption
    // testing online i got a "Missing Authentication Token" not passing the param
    if(typeof username === "undefined")
        throw new Error('need a username');
    return "https://www.instagram.com/" + username + "/?__a=1";
    // return 'https://httpbin.org/ip?json';
    // return 'https://httpbin.org/user-agent?json';
    // return 'https://httpbin.org/cookies?json';
}

async function getProfileData(username){
    return await fetch( buildUrl( username ), fetch_args )
        .then( res => Promise.all([ res.status, res.redirected, res.url, res.text() ]) )
        .then( ([ status, redirected, url, textResponse ]) => {
            if( redirected && url.includes('login') ){
                // log the exeption and inject cookies or change ip
                console.log('asking to log in');
                return -1;
            } if(status == 404) {
                // user not found
                console.log('user not found');
                return false;
            } else {
                try {
                    return JSON.parse(textResponse);
                } catch (e) {
                    // cannot json parse, likely got an html response. TODO: log it out.
                    console.log('error parsing');
                    return -1;
                }
            }
        });
}


// REST API

/**
 * this checks if the given username is existing in Instagram
 */
export const checkUsername = handler(async (event, context) => {
    const data = await getProfileData(event.pathParameters.id);
    return (data !== false && data != -1); // !! misleading false return !!
});

/**
 * returns the profile pic
 */
export const getProfilePic = handler(async (event, context) => {
    const data = await getProfileData(event.pathParameters.id);
    return data.graphql.user.profile_pic_url;
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
    var likes_sum = 0;
    var comments_sum = 0;
    var er_likes_sum = 0;
    const data = await getProfileData(event.pathParameters.id);
    const followers = data.graphql.user.edge_followed_by.count;
    const posts = data.graphql.user.edge_owner_to_timeline_media.edges;
    Object.keys(posts).forEach(function(key) {
        var post = posts[key];
        if(key < 2)
            likes_sum += post.node.edge_liked_by.count;
        else if(key > 4 && key < 10)
            er_likes_sum += post.node.edge_liked_by.count;
        comments_sum += post.node.edge_media_to_comment.count;
    });
    return {
        'followers' : followers,
        'avg_comments' : comments_sum / posts.length,
        'avg_likes' : likes_sum / 2,
        'er' : (((er_likes_sum / 7) / followers) * 100).toFixed(1)
    };
});

/**
 * request body has the username of the poster and the username
 * of the tagged. Response can be true or false. Checks if in the 12 first published posts of
 * the poster the tagged has been effectively tagged or not
 */
export const hasBeenTagged = handler(async (event, context) => {
    const data = await getProfileData(event.poster);
    var found_flag = false;
    const posts = data.graphql.user.edge_owner_to_timeline_media.edges;
    Object.keys(posts).forEach(function(key) {
        var post = posts[key];
        var tagged_users = post.node.edge_media_to_tagged_user.edges;
        if(typeof tagged_users !== 'undefined' && tagged_users.length)
            Object.keys(tagged_users).forEach(function(key) {
                var tagged_user = tagged_users[key].node.user;
                if(tagged_user.username == event.tagged)
                    found_flag = true;
            });
    });
    return found_flag;
});
