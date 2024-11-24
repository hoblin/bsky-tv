# BskyTV 📺

A minimal web application that turns Bluesky's image posts into a continuous gallery experience.

## What is it?

BskyTV connects directly to the Bluesky Firehose and displays images from posts in real-time, creating a dynamic, ever-changing gallery of what's being shared on Bluesky right now.

## Features

### Core (MVP) 🚀
- [x] Direct WebSocket connection to Bluesky Firehose
- [x] Image post filtering
- [ ] Full-screen image display
- [ ] Basic transitions between images
- [ ] Minimal UI with play/pause control

### Nice to have 🌟
- [ ] Display post text and author
- [ ] Multiple display modes (single/grid)
- [ ] Transition effects selection
- [ ] Image preloading for smoother experience
- [ ] Display time ago for posts
- [ ] Favorite posts saving (localStorage)
- [ ] Dark/Light theme switch

### Future Ideas 🎯
- [ ] Custom filters (by user, hashtag, etc.)
- [ ] Share button for interesting posts
- [ ] Stats display (images per minute, etc.)
- [ ] PWA support for offline mode
- [ ] Multiple data sources (Firehose/API)

## Technical Stack
- Vite for development and building
- CBOR-X for data decoding
- IPLD CAR for block reading
- Tailwind CSS for styling

## Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Architecture

The application uses a simple event-driven architecture:

1. WebSocket connection to Bluesky Firehose
2. CBOR decoding of incoming messages
3. CAR block processing for image extraction
4. DOM manipulation for display

## Contributing
Feel free to submit issues and enhancement requests!

## License
MIT

## Authors
- [hoblin](https://github.com/hoblin)
- [Claude AI](https://anthropic.com/claude)
