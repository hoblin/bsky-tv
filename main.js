import { Subscription } from "@atproto/xrpc-server";
import { cborToLexRecord, readCar } from "@atproto/repo";

const COLLECTION = "app.bsky.feed.post";
const CREATE_ACTION = "create";

// Create subscription to the firehose
const subscription = new Subscription({
  service: "wss://bsky.network",
  method: "com.atproto.sync.subscribeRepos",
  getState: () => ({}),
  validate: (value) => value,
});

let messageCount = 0;

const handleEvent = async (event) => {
  try {
    const car = await readCar(event.blocks);

    for (const op of event.ops) {
      if (op.action !== CREATE_ACTION) continue;

      const recBytes = car.blocks.get(op.cid);
      if (!recBytes) continue;

      const record = cborToLexRecord(recBytes);
      console.log("Found post:", record);

      messageCount++;
      if (messageCount >= 5) {
        console.log("Received 5 messages, closing connection");
        subscription.close();
      }
    }
  } catch (e) {
    console.error("Error processing event:", e);
    subscription.close();
  }
};

// Start processing the subscription stream
(async () => {
  console.log("Starting Bluesky Firehose connection...");
  try {
    for await (const event of subscription) {
      await handleEvent(event);
    }
  } catch (e) {
    console.error("Subscription error:", e);
  }
})();
