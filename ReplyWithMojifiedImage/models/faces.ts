import { MOJIS } from "../mojis";
import { Rect } from "./rect";

export class Face {
  emotionScores;
  faceRectangle;
  moji;
  mojiIcon;

  constructor(emotionScores, faceRectangle: Rect) {
    this.emotionScores = emotionScores;
    this.faceRectangle = faceRectangle;
    this.moji = this.chooseMoji(emotionScores);
    this.mojiIcon = this.moji.emojiIcon;
  }

  chooseMoji(point) {
    let closestMoji = null;
    let closestDistance = Number.MAX_VALUE;
    for (let moji of MOJIS) {
      let emoPoint = moji.emotiveValues;
      let distance = emoPoint.distance(point);
      if (distance < closestDistance) {
        closestMoji = moji;
        closestDistance = distance;
      }
    }
    return closestMoji;
  }
}
