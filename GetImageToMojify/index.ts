import * as Twitter from "twitter";
import * as util from "util";

process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
});

let CLIENT = null;

function getTweet(tweetId): Promise<any> {
  return new Promise((resolve, reject) => {
    CLIENT.get(
      `statuses/show/${tweetId}`,
      {
        tweet_mode: "extended"
      },
      (err, res) => {
        if (err) reject(err);
        resolve(res);
      }
    );
  });
}

/*
    If the tweet has some media returns the first image, else returns null
*/
function getMediaFromTweet(context, tweet): string | null {
  let media = tweet.extended_entities ? tweet.extended_entities.media : [];
  if (media && media.length > 0) {
    // Return the first media item

    let { media_url_https, type } = media[0];
    if (type === "photo") {
      return media_url_https;
    } else {
      throw "No photos found in tweet";
    }
  } else {
    throw "No media found in tweet";
  }
}

/*
    Figures out the image that the user wants to mojify
    - If the user replied to a tweet with an image then it will mojify that image.
    - if the user tweeted and image and tagged it at the same time it will mojify that image.
*/
async function selectMediaFromTweet(context, tweetId) {
  // Get information about the original tweet
  let res = await getTweet(tweetId);

  // Are we replying to a tweet?
  let origTweetId = res.in_reply_to_status_id_str;

  // If there is media in this tweet then use it
  try {
    let mediaUrl = getMediaFromTweet(context, res);
    return { mediaUrl, tweetId, author: res.user.screen_name };
  } catch (err) {
    // If we are in response to another tweet then use that
    if (origTweetId) {
      // Yes we are so get the original tweet.
      context.log(`Return original tweet ${origTweetId}`);
      let origRes = await getTweet(origTweetId);
      let mediaUrl = getMediaFromTweet(context, origRes);
      return {
        mediaUrl,
        tweetId: origTweetId,
        author: origRes.user.screen_name
      };
    }
    // Or rethrow the error
    throw err;
  }

  // if (origTweetId === null) {
  //   context.log(`Returning media from this tweet ${tweetId}`);
  //   // No we are not a reply so return any media from this tweet if there is any
  //   let mediaUrl = getMediaFromTweet(context, res);
  //   return { mediaUrl, tweetId };
  // } else {
  //   // Yes we are so get the original tweet.
  //   context.log(`Return original tweet ${origTweetId}`);
  //   let origRes = await getTweet(origTweetId);
  //   let mediaUrl = getMediaFromTweet(context, origRes);
  //   return { mediaUrl, tweetId: origTweetId };
  // }
}

export async function index(context, req) {
  context.log("GetImageToMojify HTTP trigger");

  // Environment variables from local.settings.json are not copied over to process.env until the function is actually run
  CLIENT = new Twitter({
    consumer_key: process.env["TWITTER_CONSUMER_KEY"],
    consumer_secret: process.env["TWITTER_CONSUMER_SECRET"],
    bearer_token: process.env["TWITTER_BEARER_TOKEN"]
  });

  if (!req.query.id) {
    const message = "Please pass the tweet id as id on the query string";
    context.log.warn(message);
    return context.done(null, {
      status: 400,
      body: message
    });
  }

  try {
    let { mediaUrl, tweetId, author } = await selectMediaFromTweet(
      context,
      req.query.id
    );
    if (mediaUrl) {
      context.log.verbose(`Found media in tweet ${mediaUrl}`);
      context.done(null, { body: { mediaUrl, tweetId, author } });
    } else {
      const message = "No media was found for this tweet";
      context.log.warn(message);
      context.done(null, {
        status: 400,
        body: message
      });
    }
  } catch (err) {
    const message = `Error getting media for the tweet with id ${req.query.id}
    ${JSON.stringify(err)}`;
    context.log.error(message);
    context.done(null, { status: 400, body: message });
  }
}
