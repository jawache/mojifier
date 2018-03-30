import { MOJIS } from "./mojis";
import * as dotenv from "dotenv";
import * as request from "request";
import fetch from "node-fetch";
import * as fs from "fs";
import * as path from "path";
dotenv.config();
import "dotenv/config";
import { EmotivePoint } from "./models/emotivePoint";
import { Face } from "./models/faces";

const API_URL = process.env["FACE_API_URL"];
const API_KEY = process.env["FACE_API_KEY"];

async function getEmotion(emoji) {
  let trainEmojiFileName = path.resolve(
    __dirname,
    "./emojitrainings/" + emoji + ".jpg"
  );

  const buffer = fs.readFileSync(trainEmojiFileName);

  let response = await fetch(API_URL, {
    headers: {
      "Ocp-Apim-Subscription-Key": API_KEY,
      "Content-Type": "application/octet-stream"
    },
    method: "POST",
    body: buffer
  });
  let data = await response.json();
  if (data.length > 0) {
    return data[0].faceAttributes.emotion;
  }
}

const EMOJIS_TO_TRAIN = [
  "☺️",
  "💩",
  "🤓",
  "🤔",
  "🦄",
  "😃",
  "😆",
  "😉",
  "😍",
  "😎",
  "😐",
  "😕",
  "😖",
  "😘",
  "😜",
  "😝",
  "😠",
  "😧",
  "😩",
  "😬",
  "😭",
  "😱",
  "😳",
  "😴"
];

async function main() {
  let str = "";

  for (let emoji of EMOJIS_TO_TRAIN) {
    console.log(`Processing ${emoji}`);
    let emotion = await getEmotion(emoji);
    let point = new EmotivePoint(emotion);
    let face = new Face(point, null);
    console.log(`Existing emojis is ${face.mojiIcon}`);
    str += `{
        emotiveValues: new EmotivePoint({
            anger: ${emotion.anger},
            contempt: ${emotion.contempt},
            disgust: ${emotion.disgust},
            fear: ${emotion.fear},
            happiness: ${emotion.happiness},
            neutral: ${emotion.neutral},
            sadness: ${emotion.sadness},
            surprise: ${emotion.surprise}
        }),
        emojiIcon: "${emoji}"
      },`;
  }
  console.log(str);
}

main();
