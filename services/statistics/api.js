import fetch from 'node-fetch';
import handler from "../../libs/handler-lib";
import HttpsProxyAgent from "https-proxy-agent";
import * as fs from 'fs'; // to get cookie jar from fs
import { v4 as uuidv4 } from 'uuid';
import s3 from "../../libs/s3-lib";

const agents = [
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 11.3; rv:88.0) Gecko/20100101 Firefox/88.0"
];

// HELPER FUNCTIONS

async function storeProfilePic(image_url){
    let fileKey = uuidv4();
    // not using global fetch args as the profile pic url should be public
    const response = await fetch(image_url);
    if(response.ok){
        const buffer = await response.buffer();
        const s3Resp = await s3.put({
            Bucket: process.env.bucketName,
            Key: 'public/' + fileKey,
            Body: buffer,
        });
        if(s3Resp.ETag !== 'undefined'){
            return fileKey;
        }
        else{
            console.log('Error storing pic to bucket');
            return;
        }
    }else{
        return Promise.reject(new Error(
            `Failed to fetch ${response.url}: ${response.status} ${response.statusText}`));
    }
}

export function buildFetchArgs(randomAgent = true){

    let fetch_args = { headers : {} };

    if( typeof process.env.USER_AGENT !== 'undefined' )
        fetch_args.headers = Object.assign(fetch_args.headers, {'User-Agent' : process.env.USER_AGENT} );
    else if(randomAgent)
        fetch_args.headers = Object.assign(fetch_args.headers, {'User-Agent' : agents[ Math.floor(Math.random() * agents.length) ]} );


    if( typeof process.env.COOKIE_JAR_PATH !== 'undefined' )
        fetch_args.headers = Object.assign( fetch_args.headers, {'Cookie' : getCookies()} );
    else if( typeof process.env.RAW_COOKIE_STR !== 'undefined' )
        fetch_args.headers = Object.assign( fetch_args.headers, {'Cookie' : process.env.RAW_COOKIE_STR} );

    if( typeof process.env.HTTP_PROXY !== 'undefined' )
        fetch_args = Object.assign(fetch_args, { agent: new HttpsProxyAgent(process.env.HTTP_PROXY) });

    return fetch_args;
}

export function getCookies(){
    // This is compatible with the json cookie jar saved by the puppeteer scraper
    // you can otherwise use the Cookie string of the req headers grabbed from the chrome devTools of a logged session
    let raw_header_cookie = '';
    const cookiesString = fs.readFileSync(process.env.COOKIE_JAR_PATH);
    let cookie_jar = JSON.parse(cookiesString);
    Object.keys(cookie_jar).forEach(function(key) {
        var cookie = cookie_jar[key];
        raw_header_cookie += cookie.name + '=' + cookie.value + '; ';
    });
    return raw_header_cookie;
}

export function buildUrl(username, unapi = true){
    // not sure how to handle the exeption
    // testing online i got a "Missing Authentication Token" not passing the param
    if(typeof username === "undefined")
        throw new Error('need a username');
    return "https://www.instagram.com/" + username + ( unapi ? "/?__a=1" : "" );
    // return 'https://httpbin.org/ip?json';
    // return 'https://httpbin.org/user-agent?json';
    // return 'https://httpbin.org/cookies?json';
}

async function getProfileData(username){
    return await fetch( buildUrl( username ), buildFetchArgs() )
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
    if(event.queryStringParameters && event.queryStringParameters.email)
        console.log(event.queryStringParameters.email);
    // Not using the unofficial endpoit nor the global fetch args
    return await fetch( buildUrl(event.pathParameters.id, false) )
        .then( res => res.status ).then( status => {
            return status != 404;
        });
});

/**
 * returns the profile pic
 */
export const getProfilePic = handler(async (event, context) => {
    const data = await getProfileData(event.pathParameters.id);
    if( typeof data === 'undefined' || ! Object.keys(data).length )
        return;
    const res = await storeProfilePic(data.graphql.user.profile_pic_url_hd);
    return res;
});


/**
 * request body has the username of the poster and the username
 * of the tagged. Response can be true or false. Checks if in the 12 first published posts of
 * the poster the tagged has been effectively tagged or not
 */
export const hasBeenTagged = handler(async (event, context) => {
    const body = JSON.parse(event.body);
    const data = await getProfileData(body.poster);
    if( typeof data === 'undefined' || ! Object.keys(data).length )
        return;
    var found_flag = false;
    const posts = data.graphql.user.edge_owner_to_timeline_media.edges;
    Object.keys(posts).forEach(function(key) {
        var post = posts[key];
        var tagged_users = post.node.edge_media_to_tagged_user.edges;
        if(typeof tagged_users !== 'undefined' && tagged_users.length)
            Object.keys(tagged_users).forEach(function(key) {
                var tagged_user = tagged_users[key].node.user;
                if(tagged_user.username == body.tagged)
                    found_flag = true;
            });
    });
    return found_flag;
});

/**
 * return the statistics for a posted collaboration.
 * First checks if tag for remark is in the Instagram posts.
 * If yes, will take:
 * - number of likes
 * - number of comments
 * - images
 * - caption
 * - hashtags
 */
 export const collabStatistics = handler(async (event, context) => {
    var data = event.body;
    if(isJson(data)){
        data = JSON.parse(event.body);
    }
    if(!data.accountIG || typeof data.accountIG === "undefined")
        throw new Error("Cannot proceed without accountIG");
    if(!data.tags || typeof data.tags === "undefined")
        throw new Error("Cannot proceed without tags requested");
    const instagramData = await getProfileData(data.accountIG);
    if( typeof instagramData === 'undefined' || !instagramData)
        throw new Error("No instagram data have been found for username " + data.accountIG);
    const usernamesToTag = data.tags;
    const posts = instagramData.graphql.user.edge_owner_to_timeline_media.edges;
    var tag = false;
    var collabStats = {};
    const regexp = /#[\w]+(?=\s|$)/g;
    for(let key of posts){
        const node = key.node;
        const taggedUsers = node.edge_media_to_tagged_user.edges;
        if(!taggedUsers || typeof taggedUsers === "undefined" || ! Object.keys(taggedUsers).length){
            console.log("No tagged users for this post ");
        }else{
            var usernamesTagged = [];
            for(let taggedUser of taggedUsers){
                const username = taggedUser.node.user.username;
                usernamesTagged.push(username);
            }
            const usernamesLeftToTag = usernamesToTag.filter(u => !usernamesTagged.includes(u));
            if(Array.isArray(usernamesLeftToTag) && usernamesLeftToTag.length === 0){
                tag = true;
            }
        }
        if(tag){
            const images = [];
            const edgeSidecarToChildren = node.edge_sidecar_to_children;
            if(!edgeSidecarToChildren || typeof edgeSidecarToChildren === "undefined"){
                images.push(node.display_url);
            }else{
                const edges = edgeSidecarToChildren.edges;
                if(Array.isArray(edges)){
                    for(let key of edges){
                        images.push(key.node.display_url);
                    }
                }else{
                    console.log("Edges in edge sidecar to children are not an array");
                }
            }
            const likes = node.edge_liked_by;
            const comments = node.edge_media_to_comment;
            var hashtags = [];
            var caption = "";
            var captionEdges = node.edge_media_to_caption.edges;
            if(!captionEdges || typeof captionEdges === "undefined" || !Object.keys(captionEdges).length){
                console.log("No caption defined for this post");
            }else{
                caption = captionEdges[0].node.text;
                hashtags = caption.match(regexp);
            }
            const imageKeys = [];
            for(let image of images){
                const imageKey = await storeProfilePic(image);
                imageKeys.push(imageKey);
            }
            collabStats = {
                'likes' : likes,
                'comments' : comments,
                'caption' : caption,
                'hashtags' : hashtags,
                'images' : imageKeys
            };
            break;
        }
    }
    return collabStats;
});

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

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
    if( typeof data === 'undefined' || ! Object.keys(data).length )
        return;
    const followers = data.graphql.user.edge_followed_by.count;
    const posts = data.graphql.user.edge_owner_to_timeline_media.edges;
    const website = data.graphql.user.external_url;
    Object.keys(posts).forEach(function(key) {
        var post = posts[key];
        if(key < 2)
            likes_sum += post.node.edge_liked_by.count;
        else if(key > 4 && key < 10)
            er_likes_sum += post.node.edge_liked_by.count;
        comments_sum += post.node.edge_media_to_comment.count;
    });
    const statistics = {
        'followers' : followers,
        'avg_comments' : comments_sum / posts.length,
        'avg_likes' : likes_sum / 2,
        'er' : (((er_likes_sum / 7) / followers) * 100).toFixed(1),
        'website' : website
    };
    return statistics;
});
