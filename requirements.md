# What's for Dinner - Requirements

## Backend Requirements

### Node.js Dependencies

```json
{
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "node-fetch": "^3.3.0"
  },
  "type": "module"
}
```

### Environment Setup

1. Create a `.env` file in the root directory with:

```env
PORT=3000
```

### Installation

```bash
npm install
```

### Running the Server

```bash
node server.js
```

## Frontend Requirements

### HTML Structure

- `index.html` with proper meta tags
- Responsive design support
- Modern CSS styling

### JavaScript Features

- ES6+ support
- Async/await functionality
- Fetch API for HTTP requests
- DOM manipulation

### CSS Requirements

- Flexbox/Grid layout
- Mobile-first responsive design
- Modern animations/transitions
- Custom variables for theming

## Project Structure

```
/
├── server.js           # Express server and API endpoints
├── recipeParser.js     # Recipe parsing logic
├── index.html         # Main HTML file
├── styles.css         # CSS styles
├── script.js         # Frontend JavaScript
├── .env              # Environment variables
└── package.json      # Node.js dependencies
```

## API Endpoints

### POST /api/suggest-dish

- Request body: `{ "ingredients": "string" }`
- Response format:

```json
{
  "name": "Vietnamese dish name (e.g., 'Banh Xeo')",
  "ingredients": [
    "2 cups rice flour",
    "1 cup coconut milk",
    "1/2 tsp turmeric powder",
    "..."
  ],
  "instructions": [
    "1. Mix rice flour with coconut milk and turmeric",
    "2. Heat the pan until very hot",
    "3. Pour the batter and spread thinly",
    "4. Add fillings and cook until crispy",
    "5. Fold and serve with herbs"
  ]
}
```

Note:

- Ingredients will be returned as an array of strings, each with measurements
- Instructions will be exactly 5 numbered steps
- Name will always be a Vietnamese dish name

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Tools

- Node.js v14+ required
- npm or yarn for package management
- Modern code editor (VS Code recommended)
- Git for version control

## Error Handling

- Frontend validation for empty inputs
- Backend error handling with proper status codes
- User-friendly error messages
- API retry mechanism for failed requests

## Performance Considerations

- Debounced API calls
- Loading states for better UX
- Proper error handling
- Response caching when appropriate

## Security

- CORS configuration
- Input sanitization
- Rate limiting consideration

## Testing

### Manual Testing Checklist

1. Empty input handling
2. Special character input handling
3. Long input handling
4. API error handling
5. Response parsing verification
6. UI responsiveness
7. Loading state verification
