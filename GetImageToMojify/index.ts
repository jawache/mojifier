import * as Twitter from "twitter";

process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
});

let CLIENT = null;

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
function selectMediaFromTweet(context, tweetId) {
  return new Promise((resolve, reject) => {
    CLIENT.get("statuses/show/" + tweetId, (err, res) => {
      if (err) reject(err);

      // Are we replying to a tweet?
      let origTweetId = res.in_reply_to_status_id_str;

      if (origTweetId === null) {
        context.log(`Returning media from this tweet ${tweetId}`);
        // No we are not a reply so return any media from this tweet if there is any
        try {
          let mediaUrl = getMediaFromTweet(context, res);
          resolve(mediaUrl);
        } catch (err) {
          reject(err);
        }
      } else {
        // Yes we are so get the original tweet.
        context.log(`Return original tweet ${origTweetId}`);
        CLIENT.get("statuses/show/" + origTweetId, (err, origRes) => {
          if (err) reject(err);
          try {
            let mediaUrl = getMediaFromTweet(context, origRes);
            resolve(mediaUrl);
          } catch (err) {
            reject(err);
          }
        });
      }
    });
  });
}

export async function index(context, req) {
  context.log("GetImageToMojify HTTP trigger");

  // Environment variables from local.settings.json are not copied over to process.env until the function is actually run
  CLIENT = new Twitter({
    consumer_key: process.env["TWITTER_CONSUMER_KEY"],
    consumer_secret: process.env["TWITTER_CONSUMER_SECRET"],
    access_token_key: process.env["TWITTER_ACCESS_TOKEN_KEY"],
    access_token_secret: process.env["TWITTER_ACCESS_TOKEN_SECRET"]
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
    let mediaUrl = await selectMediaFromTweet(context, req.query.id);
    if (mediaUrl) {
      context.log.verbose(`Found media in tweet ${mediaUrl}`);
      context.done(null, { body: mediaUrl });
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
