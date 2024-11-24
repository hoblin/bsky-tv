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
const createImageElement = (postData) => {
  const { blockData, commit, images } = postData;
  const userDid = commit.get("repo");

  // Extract labels
  const labels = blockData.labels?.values?.map((label) => label.val) || [];

  return images.map((image) => {
    const wrapper = document.createElement("div");
    wrapper.className = "w-64 m-4 bg-gray-900 rounded-lg overflow-hidden";

    // Author section
    const authorSection = document.createElement("div");
    authorSection.className = "p-3 flex items-center";

    const authorLink = document.createElement("a");
    authorLink.href = `https://bsky.app/profile/${userDid}`;
    authorLink.target = "_blank";
    authorLink.className = "text-blue-400 hover:text-blue-300";
    authorLink.textContent =
      blockData.author?.displayName || blockData.author?.handle || userDid;
    authorSection.appendChild(authorLink);

    // Timestamp
    const timestamp = document.createElement("span");
    timestamp.className = "text-gray-500 text-xs ml-auto";
    timestamp.textContent = new Date(blockData.createdAt).toLocaleString();
    authorSection.appendChild(timestamp);

    wrapper.appendChild(authorSection);

    // Labels section (if any)
    if (labels.length > 0) {
      console.log("labels", labels);
      const labelsSection = document.createElement("div");
      labelsSection.className = "px-3 -mt-1 mb-2 flex flex-wrap gap-1";

      labels.forEach((label) => {
        const labelElement = document.createElement("span");
        labelElement.className =
          "text-xs px-2 py-1 rounded-full bg-red-500 text-white";
        labelElement.textContent = label;
        labelsSection.appendChild(labelElement);
      });

      wrapper.appendChild(labelsSection);
    }

    // Image section
    const link = document.createElement("a");
    link.href = image.fullsize;
    link.target = "_blank";
    link.className = "block";

    const img = document.createElement("img");
    img.src = image.thumbnail;
    img.alt = image.alt || blockData.text;
    img.className = "w-full h-64 object-cover fade-transition";

    link.appendChild(img);
    wrapper.appendChild(link);

    // Text section
    if (blockData.text) {
      const textSection = document.createElement("div");
      textSection.className = "p-3";

      const caption = document.createElement("p");
      caption.className = "text-white text-sm line-clamp-3";
      caption.title = blockData.text;
      caption.textContent = blockData.text;
      textSection.appendChild(caption);

      wrapper.appendChild(textSection);
    }

    return wrapper;
  });
};

const updateDisplay = (postData) => {
  const imageElements = createImageElement(postData);
  imageElements.forEach((element) => {
    imageContainer.appendChild(element);
  });
};

// Process posts handler - can be replaced with any handling logic
const handlePost = (postData) => {
  updateDisplay(postData);
  // console.log("Post with images:", postData);
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

const processImage = (img, commit) => {
  try {
    const cid = decodeCID(img.image.ref.value);
    const userDid = commit.get("repo");
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
const processBlock = async (block, commit) => {
  const blockData = decode(block.bytes);

  if (
    blockData.$type !== POST_TYPE ||
    blockData.embed?.$type !== IMAGE_EMBED_TYPE
  ) {
    return null;
  }

  const images = blockData.embed.images
    .map((img) => processImage(img, commit))
    .filter(Boolean);

  if (images.length === 0) {
    return null;
  }

  return {
    block,
    blockData,
    commit,
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

      for await (const block of reader.blocks()) {
        const post = await processBlock(block, commit);
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
