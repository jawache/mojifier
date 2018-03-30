import * as redis from "redis";
import * as bluebird from "bluebird";
import * as moment from "moment";

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

let CLIENT = null;
let THROTTLE_RATE = 1000 * 60; // Time between allowed posts in milliseconds

process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
});

async function getUserLast(username: string) {
  let args = ["USERLAST", username];
  let last = await CLIENT.hgetAsync(args);
  return !last ? 0 : parseInt(last);
}

async function setUserLast(username: string) {
  let last = new Date().getTime();
  let args = ["USERLAST", username, last];
  await CLIENT.hsetAsync(args);
}

export async function index(context, req) {
  context.log("IsUserThrottled HTTP trigger");

  let redisHost = process.env["REDIS_HOST"];
  let redisPort = parseInt(process.env["REDIS_PORT"]);
  let redisPass = process.env["REDIS_PASS"];

  THROTTLE_RATE = parseInt(process.env["USER_THROTTLE"]);

  CLIENT = redis.createClient(6380, redisHost, {
    auth_pass: redisPass,
    tls: { servername: redisHost }
  });

  const username = req.query.username;
  context.log.verbose(`Called with the username ${username}`);

  if (!username) {
    let message = `The "username" parameter is required`;
    context.log.error(message);
    context.done(null, { status: 400, body: message });
  }

  let now = new Date().getTime();
  let last = await getUserLast(username);
  let diff = now - last;
  context.log.verbose(
    `now ${now} | last ${last} | diff ${diff} | THROTTLE_RATE ${THROTTLE_RATE}`
  );
  if (diff > THROTTLE_RATE) {
    setUserLast(username);
    context.log.verbose(`${username} OK, not throttled`);
    context.done(null, { status: 200 });
  } else {
    context.log.warn(`${username} BAD, throttled`);
    let message = `User ${username} has already mojified within the last ${diff} milliseconds but the throttle is set to ${THROTTLE_RATE}`;
    context.log.warn(message);
    context.done(null, {
      body: message,
      status: 400
    });
  }
}
