# TheMojifier

The Mojifier is a Twitter bot which replaces peoples faces in images with emojis matching their emotion.

It's built on top of [Azure](https://azure.microsoft.com/free/?WT.mc_id=mojifier-github-ashussai) using various Services like [Logic Apps](https://azure.microsoft.com/services/logic-apps/?WT.mc_id=mojifier-sandbox-ashussai), [Functions](https://azure.microsoft.com/services/functions/?WT.mc_id=mojifier-github-ashussai), [Cognitive Services](https://azure.microsoft.com/services/cognitive-services/?WT.mc_id=mojifier-github-ashussai) and [Redis](https://azure.microsoft.com/services/cache/?WT.mc_id=mojifier-github-ashussai).

You can find out more information about TheMojifier and how it was built [here](https://docs.microsoft.com/en-us/sandbox/demos/mojifier)

## Requirements

This Function app requires an instance of Redis, you can install one locally or use one created on Azure. It will also need to make calls using the Twitter API so you'll need to create a [Twitter App](https://apps.twitter.com/) and create an API key for it.

## Setup

To use this app you'll need to setup some configuration files.

Create a file called `local.settings.json` in the root folder.

You'll need to add to this file the credentials for Twitter and also connection information for Redis.

```json
{
  "IsEncrypted": false,
  "Values": {
    "TWITTER_CONSUMER_KEY": "<access-consumer-key>",
    "TWITTER_CONSUMER_SECRET": "<access-consumer-secret>",
    "TWITTER_ACCESS_TOKEN_KEY": "<access-token-key>",
    "TWITTER_ACCESS_TOKEN_SECRET": "<access-token-secret>",
    "REDIS_HOST": "<redis-host>",
    "REDIS_PORT": "6380",
    "REDIS_PASS": "<redis-password>",
    "USER_THROTTLE": "360"
  }
}
```

## Development

This repo only contains the code for the Azure Functions part of the Mojifier.

To run locally simply run

`npm install`

Then ensure you have the [Azure Functions CLI](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local) installed and run

`func host start`

This will start the function app running on localhost, you can now make HTTP requests against the endpoints.

## Releasing

You can host your own version of this code by:

* Checking out the code in this repo.
* Creating your own Azure Functions App in the Portal.
* Uploading the contents of this folder to your Function App, either by using the Azure Functions CLI tool or by using the VS Code Extension.
