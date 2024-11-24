import { decode, Decoder } from "cbor-x";
import { CarReader } from "@ipld/car";
import { CID } from "multiformats/cid";

// Configuration
const WS_ENDPOINT = "wss://bsky.network/xrpc/com.atproto.sync.subscribeRepos";

// Types of content we're interested in
const POST_TYPE = "app.bsky.feed.post";
const IMAGE_EMBED_TYPE = "app.bsky.embed.images";

// DOM Elements
const imageContainer = document.getElementById("image-container");

// Display functions
const createImageElement = (post) => {
  const { images, text } = post;

  // Create elements for all images in the post
  return images.map((image) => {
    const wrapper = document.createElement("div");
    wrapper.className = "w-64 m-4";

    const link = document.createElement("a");
    link.href = image.fullsize;
    link.target = "_blank";
    link.className = "block";

    const img = document.createElement("img");
    img.src = image.thumbnail;
    img.alt = image.alt || text;
    img.className =
      "w-full h-64 object-cover rounded-lg shadow-lg fade-transition";

    link.appendChild(img);
    wrapper.appendChild(link);

    if (text) {
      const caption = document.createElement("p");
      caption.className = "text-white mt-2 text-sm truncate";
      caption.title = text;
      caption.textContent = text;
      wrapper.appendChild(caption);
    }

    return wrapper;
  });
};

const updateDisplay = (post) => {
  const imageElements = createImageElement(post);
  imageElements.forEach((element) => {
    imageContainer.appendChild(element);
  });
};

// Process posts handler - can be replaced with any handling logic
const handlePost = (post) => {
  updateDisplay(post);
  console.log("Post with images:", post);
};

// Image processing functions
const decodeCID = (bytes) => {
  if (bytes[0] !== 0) {
    throw new Error("Invalid CID for CBOR tag 42; expected leading 0x00");
  }
  return CID.decode(bytes.subarray(1)).toString();
};

const buildImageUrls = (userDid, cid) => ({
  thumbnail: `https://cdn.bsky.app/img/feed_thumbnail/plain/${userDid}/${cid}@jpeg`,
  fullsize: `https://cdn.bsky.app/img/feed_fullsize/plain/${userDid}/${cid}@jpeg`,
});

const processImage = (img, userDid) => {
  try {
    const cid = decodeCID(img.image.ref.value);
    return {
      alt: img.alt,
      ...buildImageUrls(userDid, cid),
      cid,
    };
  } catch (err) {
    console.error("CID decode error:", err);
    return null;
  }
};

// Block processing
const processBlock = async (block, userDid) => {
  const blockData = decode(block.bytes);

  if (
    blockData.$type !== POST_TYPE ||
    blockData.embed?.$type !== IMAGE_EMBED_TYPE
  ) {
    return null;
  }

  const images = blockData.embed.images
    .map((img) => processImage(img, userDid))
    .filter(Boolean);

  if (images.length === 0) {
    return null;
  }

  return {
    text: blockData.text,
    images,
  };
};

// Main WebSocket handler
const initWebSocket = () => {
  const ws = new WebSocket(WS_ENDPOINT);
  ws.binaryType = "arraybuffer";

  ws.onmessage = async (event) => {
    try {
      const data = new Uint8Array(event.data);
      const decoder = new Decoder();
      const [_, commit] = decoder.decodeMultiple(data);

      const blocks = commit.get("blocks");
      if (!blocks?.length) return;

      const reader = await CarReader.fromBytes(blocks);
      const userDid = commit.get("repo");

      for await (const block of reader.blocks()) {
        const post = await processBlock(block, userDid);
        if (post) {
          handlePost(post);
        }
      }
    } catch (err) {
      console.error("Decoding error:", err);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  return ws;
};

// Initialize the connection
const ws = initWebSocket();

// Optional: Add connection management
export const disconnect = () => {
  ws.close();
};
