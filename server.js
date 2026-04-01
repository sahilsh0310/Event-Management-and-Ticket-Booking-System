const express = require("express");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("."));

const eventRepository = (() => {
  const events = [
    {
      id: 1,
      name: "Skyline Soundstorm",
      image: "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2",
      category: "Music",
      city: "Mumbai",
      venue: "NSCI Dome, Worli",
      date: "2026-04-19",
      time: "7:30 PM",
      price: 1899,
      capacity: 320,
      booked: 214,
      featured: true,
      description: "An electric night under the city lights with headline DJs, immersive visuals, and room to dance till late.",
      perks: ["Express entry lane", "VIP viewing deck", "Complimentary mocktail"]
    },
    {
      id: 2,
      name: "CodeWave India Summit",
      image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df",
      category: "Tech",
      city: "Bengaluru",
      venue: "BIEC Convention Hall",
      date: "2026-04-12",
      time: "9:30 AM",
      price: 2499,
      capacity: 450,
      booked: 286,
      featured: true,
      description: "A full-day gathering for builders, founders, and curious minds with keynotes, deep-dive sessions, and great hallway conversations.",
      perks: ["Conference pass", "Lunch buffet", "Startup networking zone"]
    },
    {
      id: 3,
      name: "Midnight Laugh Arena",
      image: "https://images.unsplash.com/photo-1511578314322-379afb476865",
      category: "Comedy",
      city: "Delhi",
      venue: "Talkatora Indoor Arena",
      date: "2026-04-26",
      time: "8:00 PM",
      price: 1199,
      capacity: 280,
      booked: 167,
      featured: false,
      description: "A feel-good stand-up night packed with touring comics, crowd work, and the kind of jokes people keep repeating on the ride home.",
      perks: ["Reserved seating", "Merchandise voucher", "Priority gate access"]
    },
    {
      id: 4,
      name: "Royal Street Food Fest",
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
      category: "Food",
      city: "Pune",
      venue: "Raja Bahadur Grounds",
      date: "2026-04-14",
      time: "1:00 PM",
      price: 699,
      capacity: 520,
      booked: 318,
      featured: false,
      description: "A lively day out for food lovers with signature stalls, dessert corners, chef pop-ups, and music in the background.",
      perks: ["Tasting credits", "Fast-track wristband", "Chef stage access"]
    },
    {
      id: 5,
      name: "Monsoon Derby Finale",
      image: "https://images.unsplash.com/photo-1547347298-4074fc3086f0",
      category: "Sports",
      city: "Hyderabad",
      venue: "Gachibowli Stadium",
      date: "2026-04-22",
      time: "6:30 PM",
      price: 1599,
      capacity: 600,
      booked: 471,
      featured: false,
      description: "A big match-night atmosphere with loud crowds, floodlights, fan zones, and the kind of finish everyone talks about after.",
      perks: ["Stadium access", "Team fan kit", "Premium concourse entry"]
    },
    {
      id: 6,
      name: "Moonlit Cinema Concert",
      image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
      category: "Entertainment",
      city: "Jaipur",
      venue: "Amber Open Air Theatre",
      date: "2026-04-30",
      time: "7:15 PM",
      price: 1399,
      capacity: 260,
      booked: 148,
      featured: false,
      description: "A beautiful open-air evening where a live orchestra, cinema moments, and a heritage venue come together in one memorable show.",
      perks: ["Assigned seats", "Souvenir pass", "Early gate access"]
    }
  ];

  function toView(event) {
    return {
      ...event,
      seatsLeft: Math.max(event.capacity - event.booked, 0),
      soldPercent: Math.round((event.booked / event.capacity) * 100)
    };
  }

  return {
    getAll() {
      return events.map(toView);
    },
    getById(id) {
      const event = events.find(item => item.id === id);
      return event ? toView(event) : null;
    },
    reserveSeats(id, quantity) {
      const event = events.find(item => item.id === id);
      if (!event) {
        return { error: "We couldn't find that event." };
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        return { error: "Choose at least one ticket to continue." };
      }

      const seatsLeft = event.capacity - event.booked;
      if (quantity > seatsLeft) {
        return { error: `Only ${seatsLeft} seats are left for ${event.name} right now.` };
      }

      event.booked += quantity;
      return { event: toView(event) };
    }
  };
})();

const bookingRepository = (() => {
  const bookings = [];
  let bookingSequence = 1001;

  return {
    create({ event, user, quantity }) {
      const subtotal = event.price * quantity;
      const fees = quantity * 49;
      const booking = {
        id: bookingSequence++,
        eventId: event.id,
        eventName: event.name,
        city: event.city,
        venue: event.venue,
        date: event.date,
        time: event.time,
        quantity,
        email: user.email,
        name: user.name,
        subtotal,
        fees,
        total: subtotal + fees,
        createdAt: new Date().toISOString()
      };
      bookings.unshift(booking);
      return booking;
    },
    getByEmail(email) {
      return bookings.filter(item => item.email === email);
    },
    getAll() {
      return bookings;
    }
  };
})();

function getPlatformStats() {
  const events = eventRepository.getAll();
  const bookings = bookingRepository.getAll();

  return {
    eventCount: events.length,
    cityCount: new Set(events.map(event => event.city)).size,
    totalBookings: bookings.reduce((total, booking) => total + booking.quantity, 0),
    totalRevenue: bookings.reduce((total, booking) => total + booking.total, 0),
    featuredEvent: events.find(event => event.featured) || events[0]
  };
}

app.get("/api/events", (req, res) => {
  res.json({ events: eventRepository.getAll() });
});

app.get("/api/stats", (req, res) => {
  res.json(getPlatformStats());
});

app.get("/api/bookings", (req, res) => {
  const email = `${req.query.email || ""}`.trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ message: "Please share an email so we can load your bookings." });
  }

  return res.json({ bookings: bookingRepository.getByEmail(email) });
});

app.post("/api/auth/login", (req, res) => {
  const email = `${req.body.email || ""}`.trim().toLowerCase();
  const name = `${req.body.name || ""}`.trim();

  if (!email || !name) {
    return res.status(400).json({ message: "Please enter both your name and email." });
  }

  return res.json({
    user: { email, name },
    message: `You're all set, ${name}.`
  });
});

app.post("/api/bookings", (req, res) => {
  const eventId = Number(req.body.eventId);
  const quantity = Number(req.body.quantity);
  const email = `${req.body.email || ""}`.trim().toLowerCase();
  const name = `${req.body.name || ""}`.trim();

  if (!email || !name) {
    return res.status(400).json({ message: "We need your name and email before we can reserve tickets." });
  }

  const reservation = eventRepository.reserveSeats(eventId, quantity);
  if (reservation.error) {
    return res.status(400).json({ message: reservation.error });
  }

  const booking = bookingRepository.create({
    event: reservation.event,
    user: { email, name },
    quantity
  });

  return res.status(201).json({
    message: "Your booking is confirmed",
    booking,
    event: reservation.event
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
