# TicketMint Live

This project is now a serverless, browser-ready frontend.

It runs fully in the browser using:
- Static `index.html`, `styles.css`, and `app.js`
- `localStorage` for demo auth, event state, and booking history
- A small frontend API adapter so a real backend can be connected later without rewriting the UI

## Run the frontend

1. Open `index.html` directly in a browser, or
2. Serve the folder with any static server such as VS Code Live Server, GitHub Pages, Netlify, or Vercel

## Current frontend mode

The app currently uses local browser data through this config in `index.html`:

```html
<script>
  window.TICKETMINT_CONFIG = {
    mode: "local",
    apiBaseUrl: "http://localhost:3000/api"
  };
</script>
```

`mode: "local"` means:
- Login is stored in the browser
- Bookings are stored in the browser
- Event seat counts update in the browser

## How to connect a backend later

1. Build a backend that exposes these endpoints:
   - `GET /api/events`
   - `GET /api/stats`
   - `GET /api/bookings?email=user@example.com`
   - `POST /api/auth/login`
   - `POST /api/bookings`
2. Return JSON in the same shape the frontend already expects:

```json
{
  "events": []
}
```

```json
{
  "eventCount": 6,
  "cityCount": 6,
  "totalBookings": 12,
  "totalRevenue": 25000,
  "featuredEvent": {}
}
```

```json
{
  "bookings": []
}
```

```json
{
  "user": {
    "email": "user@example.com",
    "name": "Sahil"
  },
  "message": "You're all set, Sahil."
}
```

```json
{
  "message": "Your booking is confirmed",
  "booking": {},
  "event": {}
}
```

3. Update the frontend config in `index.html`:

```html
<script>
  window.TICKETMINT_CONFIG = {
    mode: "api",
    apiBaseUrl: "http://localhost:3000/api"
  };
</script>
```

4. Keep CORS enabled on the backend if the frontend and backend run on different origins
5. Deploy the frontend to any static host and point `apiBaseUrl` at the deployed backend

## Notes

- `server.js` has been removed
- The frontend logic is isolated behind `platformApi` inside `app.js`
- You can replace the demo storage layer without changing the UI rendering code

