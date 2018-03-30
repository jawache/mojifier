import * as Twitter from "twitter";
import * as Jimp from "jimp";
import * as path from "path";
import { EmotivePoint } from "./models/emotivePoint";
import { Rect } from "./models/rect";
import { Face } from "./models/faces";

let CLIENT = null;

process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
});

function createMojifiedImage(context, imageUrl, faces) {
  return new Promise((resolve, reject) => {
    // read the image which is provided through link in url query
    Jimp.read(imageUrl).then(sourceImage => {
      for (let face of faces) {
        let mojiIcon = face.mojiIcon;
        let faceHeight = face.faceRectangle.height;
        let faceWidth = face.faceRectangle.width;
        let faceTop = face.faceRectangle.top;
        let faceLeft = face.faceRectangle.left;

        // Load the emoji from disk
        let mojiPath = path.resolve(__dirname, "./emojis/" + mojiIcon + ".png");
        Jimp.read(mojiPath).then(emojiImage => {
          emojiImage.resize(faceWidth, faceHeight); // resize the emoji to fit the face
          sourceImage
            .composite(emojiImage, faceLeft, faceTop) // compose the emoji on the image
            .getBuffer(Jimp.MIME_JPEG, (error, buffer) => {
              // get a buffer of the composed image
              if (error) {
                let message =
                  "There was an error adding the emoji to the image";
                context.log.error(error);
                reject(message);
              } else {
                // put the image into the context body
                resolve(buffer);
              }
            });
        });
      }
    });
  });
}

/* Given an image this calls the Emotive API and get a list of faces in the image and for each face the emotions */
function calculateHappiness(resp) {
  if (resp.length === 0) {
    throw "No faces found in image";
  }

  let faces = [];

  // Loop through faces and find an emoji
  for (let f of resp) {
    let scores = new EmotivePoint(f.faceAttributes.emotion);
    let faceRectangle = new Rect(f.faceRectangle);
    let face = new Face(scores, faceRectangle);
    faces.push(face);
  }

  return faces;
}

/*
    Replies to twitter with the mojified image.
  
    imageUrl is the mojified image URL
  */
function postReply(context, imageBuffer, username, tweetId) {
  return new Promise((resolve, reject) => {
    context.log.verbose(`${tweetId}: Uploading image to twitter`);
    CLIENT.post(
      "media/upload",
      { media: imageBuffer },
      (err, media, response) => {
        context.log.verbose(`${tweetId}: Uploaded image to twitter`);
        if (err) reject(err);
        // If successful, a media object will be returned.
        context.log.verbose(
          `${tweetId}: Post image to twitter as reply ${media.media_id_string}`
        );
        CLIENT.post(
          "statuses/update",
          {
            in_reply_to_status_id: tweetId,
            media_ids: media.media_id_string,
            status: `Mojified by @${username}
  
  🛠️ built by @jawache
  ❤️ using @azure
  🤔 here's how https://aka.ms/mojifier`
          },
          (err, tweet, response) => {
            if (err) reject(err);
            let url = `https://twitter.com/${
              tweet.in_reply_to_screen_name
            }/status/${tweet.id_str}`;
            context.log.verbose(`${tweetId}: Posted reply ${url}`);
            resolve(url);
          }
        );
      }
    );
  });
}

export async function index(context, req) {
  context.log("ReplyWithMojifiedImage HTTP trigger");

  // Environment variables from local.settings.json are not copied over to process.env until the function is actually run
  CLIENT = new Twitter({
    consumer_key: process.env["TWITTER_CONSUMER_KEY"],
    consumer_secret: process.env["TWITTER_CONSUMER_SECRET"],
    access_token_key: process.env["TWITTER_ACCESS_TOKEN_KEY"],
    access_token_secret: process.env["TWITTER_ACCESS_TOKEN_SECRET"]
  });

  const { imageUrl, username, tweetId } = req.query;
  const faceApiResponse = req.body;

  context.log(
    `Called with imageUrl: "${imageUrl}" tweetId: "${tweetId}" username: "${username}"`
  );

  if (!imageUrl || !tweetId || !username || !faceApiResponse) {
    let message = `All 4 params must be not-null imageUrl && tweetId && username && faceApiResponse`;
    context.log.error(message);
    context.done(message, { status: 400, body: message });
  }

  try {
    let faces = calculateHappiness(faceApiResponse);
    let buffer = await createMojifiedImage(context, imageUrl, faces);
    let mojifiedTweetUrl = await postReply(context, buffer, username, tweetId);
    context.log(`Posted reply with mojified image ${mojifiedTweetUrl}`);
    context.done(null, {
      body: mojifiedTweetUrl,
      status: 200
    });
  } catch (err) {
    let message =
      "There was an error processing this image: " + JSON.stringify(err);
    context.log.error(message);
    context.done(null, {
      status: 400,
      body: message
    });
  }
}
