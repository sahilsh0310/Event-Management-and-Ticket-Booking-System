import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

const APP_CONFIG = {
  mode: window.TICKETMINT_CONFIG?.mode || "local",
  apiBaseUrl: (window.TICKETMINT_CONFIG?.apiBaseUrl || "/api").replace(/\/$/, "")
};

const STORAGE_KEYS = {
  events: "ticketmint.events",
  bookings: "ticketmint.bookings",
  currentUser: "ticketmint.currentUser"
};

const SEED_EVENTS = [
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

const state = {
  events: [],
  selectedCategory: "All",
  selectedCity: "all",
  searchTerm: "",
  sortBy: "featured",
  currentUser: null,
  selectedEventId: null,
  stats: null,
  bookings: []
};

const elements = {
  eventList: document.getElementById("eventList"),
  categoryChips: document.getElementById("categoryChips"),
  cityFilter: document.getElementById("cityFilter"),
  sortFilter: document.getElementById("sortFilter"),
  searchInput: document.getElementById("searchInput"),
  resetBtn: document.getElementById("resetBtn"),
  loginBtn: document.getElementById("loginBtn"),
  loginModal: document.getElementById("loginModal"),
  submitLoginBtn: document.getElementById("submitLoginBtn"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  toast: document.getElementById("toast"),
  ticketQuantity: document.getElementById("ticketQuantity"),
  confirmBookingBtn: document.getElementById("confirmBookingBtn"),
  selectedEventName: document.getElementById("selectedEventName"),
  selectedEventMeta: document.getElementById("selectedEventMeta"),
  selectedSeatsInfo: document.getElementById("selectedSeatsInfo"),
  selectedPriceInfo: document.getElementById("selectedPriceInfo"),
  subtotalValue: document.getElementById("subtotalValue"),
  feesValue: document.getElementById("feesValue"),
  totalValue: document.getElementById("totalValue"),
  bookingHistory: document.getElementById("bookingHistory"),
  statEvents: document.getElementById("statEvents"),
  statBookings: document.getElementById("statBookings"),
  statCities: document.getElementById("statCities"),
  featuredName: document.getElementById("featuredName"),
  featuredLocation: document.getElementById("featuredLocation"),
  featuredSeats: document.getElementById("featuredSeats"),
  featuredPrice: document.getElementById("featuredPrice")
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toView(event) {
  return {
    ...event,
    seatsLeft: Math.max(event.capacity - event.booked, 0),
    soldPercent: Math.round((event.booked / event.capacity) * 100)
  };
}

function getStoredJson(key, fallbackValue) {
  const rawValue = localStorage.getItem(key);
  if (!rawValue) {
    return clone(fallbackValue);
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    return clone(fallbackValue);
  }
}

function setStoredJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureLocalStore() {
  if (!localStorage.getItem(STORAGE_KEYS.events)) {
    setStoredJson(STORAGE_KEYS.events, SEED_EVENTS);
  }

  if (!localStorage.getItem(STORAGE_KEYS.bookings)) {
    setStoredJson(STORAGE_KEYS.bookings, []);
  }
}

function getLocalEvents() {
  ensureLocalStore();
  return getStoredJson(STORAGE_KEYS.events, SEED_EVENTS);
}

function saveLocalEvents(events) {
  setStoredJson(STORAGE_KEYS.events, events);
}

function getLocalBookings() {
  ensureLocalStore();
  return getStoredJson(STORAGE_KEYS.bookings, []);
}

function saveLocalBookings(bookings) {
  setStoredJson(STORAGE_KEYS.bookings, bookings);
}

function getStoredCurrentUser() {
  const user = getStoredJson(STORAGE_KEYS.currentUser, null);
  return user && user.email && user.name ? user : null;
}

function setStoredCurrentUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    return;
  }

  setStoredJson(STORAGE_KEYS.currentUser, user);
}

function computeStats(events, bookings) {
  return {
    eventCount: events.length,
    cityCount: new Set(events.map(event => event.city)).size,
    totalBookings: bookings.reduce((total, booking) => total + booking.quantity, 0),
    totalRevenue: bookings.reduce((total, booking) => total + booking.total, 0),
    featuredEvent: events.find(event => event.featured) || events[0] || null
  };
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${APP_CONFIG.apiBaseUrl}${path}`, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

const localApi = {
  async getEvents() {
    return { events: getLocalEvents().map(toView) };
  },
  async getStats() {
    return computeStats(getLocalEvents().map(toView), getLocalBookings());
  },
  async getBookings(email) {
    if (!email) {
      throw new Error("Please share an email so we can load your bookings.");
    }

    const bookings = getLocalBookings().filter(item => item.email === email.toLowerCase());
    return { bookings };
  },
  async login({ email, name }) {
    const normalizedEmail = `${email || ""}`.trim().toLowerCase();
    const normalizedName = `${name || ""}`.trim();

    if (!normalizedEmail || !normalizedName) {
      throw new Error("Please enter both your name and email.");
    }

    const user = { email: normalizedEmail, name: normalizedName };
    setStoredCurrentUser(user);

    return {
      user,
      message: `You're all set, ${normalizedName}.`
    };
  },
  async createBooking({ eventId, quantity, email, name }) {
    const normalizedEmail = `${email || ""}`.trim().toLowerCase();
    const normalizedName = `${name || ""}`.trim();
    const ticketCount = Number(quantity);

    if (!normalizedEmail || !normalizedName) {
      throw new Error("We need your name and email before we can reserve tickets.");
    }

    if (!Number.isInteger(ticketCount) || ticketCount < 1) {
      throw new Error("Choose at least one ticket to continue.");
    }

    const events = getLocalEvents();
    const eventIndex = events.findIndex(item => item.id === Number(eventId));

    if (eventIndex === -1) {
      throw new Error("We couldn't find that event.");
    }

    const targetEvent = events[eventIndex];
    const seatsLeft = targetEvent.capacity - targetEvent.booked;

    if (ticketCount > seatsLeft) {
      throw new Error(`Only ${seatsLeft} seats are left for ${targetEvent.name} right now.`);
    }

    targetEvent.booked += ticketCount;
    saveLocalEvents(events);

    const bookings = getLocalBookings();
    const subtotal = targetEvent.price * ticketCount;
    const fees = ticketCount * 49;
    const nextId = bookings.length
      ? Math.max(...bookings.map(item => item.id)) + 1
      : 1001;

    const booking = {
      id: nextId,
      eventId: targetEvent.id,
      eventName: targetEvent.name,
      city: targetEvent.city,
      venue: targetEvent.venue,
      date: targetEvent.date,
      time: targetEvent.time,
      quantity: ticketCount,
      email: normalizedEmail,
      name: normalizedName,
      subtotal,
      fees,
      total: subtotal + fees,
      createdAt: new Date().toISOString()
    };

    bookings.unshift(booking);
    saveLocalBookings(bookings);

    return {
      message: "Your booking is confirmed",
      booking,
      event: toView(targetEvent)
    };
  }
};

const serverApi = {
  async getEvents() {
    return requestJson("/events");
  },
  async getStats() {
    return requestJson("/stats");
  },
  async getBookings(email) {
    return requestJson(`/bookings?email=${encodeURIComponent(email)}`);
  },
  async login(payload) {
    return requestJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },
  async createBooking(payload) {
    return requestJson("/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }
};

const platformApi = APP_CONFIG.mode === "api" ? serverApi : localApi;

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2400);
}

function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getSelectedEvent() {
  return state.events.find(event => event.id === state.selectedEventId) || null;
}

function updateLoginButton() {
  elements.loginBtn.lastElementChild.textContent = state.currentUser
    ? state.currentUser.name.split(" ")[0]
    : "Sign In";
}

function buildFilters() {
  const categories = ["All", ...new Set(state.events.map(event => event.category))];
  const cities = [...new Set(state.events.map(event => event.city))];

  elements.categoryChips.innerHTML = categories.map(category => `
    <button class="chip ${state.selectedCategory === category ? "active" : ""}" data-category="${category}">
      ${category}
    </button>
  `).join("");

  elements.cityFilter.innerHTML = `
    <option value="all">All cities</option>
    ${cities.map(city => `<option value="${city}" ${state.selectedCity === city ? "selected" : ""}>${city}</option>`).join("")}
  `;
}

function getFilteredEvents() {
  const term = state.searchTerm.trim().toLowerCase();
  let filtered = state.events.filter(event => {
    const matchesCategory = state.selectedCategory === "All" || event.category === state.selectedCategory;
    const matchesCity = state.selectedCity === "all" || event.city === state.selectedCity;
    const matchesSearch = !term
      || event.name.toLowerCase().includes(term)
      || event.category.toLowerCase().includes(term)
      || event.city.toLowerCase().includes(term);
    return matchesCategory && matchesCity && matchesSearch;
  });

  if (state.sortBy === "price-low") {
    filtered = [...filtered].sort((a, b) => a.price - b.price);
  } else if (state.sortBy === "price-high") {
    filtered = [...filtered].sort((a, b) => b.price - a.price);
  } else if (state.sortBy === "date") {
    filtered = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (state.sortBy === "availability") {
    filtered = [...filtered].sort((a, b) => b.seatsLeft - a.seatsLeft);
  } else {
    filtered = [...filtered].sort((a, b) => Number(b.featured) - Number(a.featured));
  }

  return filtered;
}

function renderEvents() {
  const events = getFilteredEvents();

  if (!events.length) {
    elements.eventList.innerHTML = "<div class=\"empty-state\">Nothing matches that search just yet. Try a different city, category, or keyword.</div>";
    refreshThreeButtons();
    return;
  }

  elements.eventList.innerHTML = events.map(event => {
    const lowSeats = event.seatsLeft <= 25;
    const soldWidth = Math.max(6, Math.min(event.soldPercent, 100));
    return `
      <article class="event-card">
        <img src="${event.image}" alt="${event.name}" />
        <div class="event-meta">
          <span class="event-tag">${event.category}</span>
          <span class="availability ${lowSeats ? "low" : ""}">
            ${event.seatsLeft} seats left
          </span>
        </div>
        <h4>${event.name}</h4>
        <p>${event.description}</p>
        <div class="event-submeta">
          <span>${event.city}</span>
          <span>${event.venue}</span>
          <span>${formatDate(event.date)}</span>
          <span>${event.time}</span>
        </div>
        <div class="seat-meter">
          <div class="seat-meter-fill" style="width: ${soldWidth}%"></div>
        </div>
        <div class="event-meta">
          <span class="price-tag">${formatCurrency(event.price)}</span>
          <span>${event.booked}/${event.capacity} reserved</span>
        </div>
        <div class="event-actions">
          <button class="button-3d hero-button" onclick="selectEvent(${event.id})">
            <span class="button-scene" data-scene="button"></span>
            <span>Select Event</span>
          </button>
          <button class="button-3d ghost-button" onclick="quickBook(${event.id})">Quick Book</button>
        </div>
      </article>
    `;
  }).join("");

  refreshThreeButtons();
}

function updateSummary() {
  const event = getSelectedEvent();
  const quantity = Number(elements.ticketQuantity.value);

  if (!event) {
    elements.selectedEventName.textContent = "Choose an event";
    elements.selectedEventMeta.textContent = "Pick an event card and we'll fill in the details here.";
    elements.selectedSeatsInfo.textContent = "Seats remaining: --";
    elements.selectedPriceInfo.textContent = "Ticket price: --";
    elements.subtotalValue.textContent = formatCurrency(0);
    elements.feesValue.textContent = formatCurrency(0);
    elements.totalValue.textContent = formatCurrency(0);
    return;
  }

  const subtotal = event.price * quantity;
  const fees = quantity * 49;
  const total = subtotal + fees;

  elements.selectedEventName.textContent = event.name;
  elements.selectedEventMeta.textContent = `${event.city} • ${event.venue} • ${formatDate(event.date)} • ${event.time}`;
  elements.selectedSeatsInfo.textContent = `Seats remaining: ${event.seatsLeft}`;
  elements.selectedPriceInfo.textContent = `Ticket price: ${formatCurrency(event.price)}`;
  elements.subtotalValue.textContent = formatCurrency(subtotal);
  elements.feesValue.textContent = formatCurrency(fees);
  elements.totalValue.textContent = formatCurrency(total);
}

function renderFeaturedEvent() {
  const featured = state.stats?.featuredEvent || state.events.find(event => event.featured) || state.events[0];
  if (!featured) return;

  elements.featuredName.textContent = featured.name;
  elements.featuredLocation.textContent = `${featured.city} • ${featured.venue}`;
  elements.featuredSeats.textContent = `${featured.seatsLeft} seats left`;
  elements.featuredPrice.textContent = `${formatCurrency(featured.price)} per ticket`;
}

function renderStats() {
  if (!state.stats) return;
  elements.statEvents.textContent = state.stats.eventCount;
  elements.statBookings.textContent = state.stats.totalBookings;
  elements.statCities.textContent = state.stats.cityCount;
  renderFeaturedEvent();
}

function renderBookingHistory() {
  if (!state.currentUser) {
    elements.bookingHistory.innerHTML = `
      <div class="booking-history-item">
        <strong>Sign in to see your bookings</strong>
        <span>Your recent reservations will show up here once you're signed in.</span>
      </div>
    `;
    return;
  }

  if (!state.bookings.length) {
    elements.bookingHistory.innerHTML = `
      <div class="booking-history-item">
        <strong>No bookings yet</strong>
        <span>Once you reserve your first event, it will appear here for easy reference.</span>
      </div>
    `;
    return;
  }

  elements.bookingHistory.innerHTML = state.bookings.slice(0, 4).map(booking => `
    <div class="booking-history-item">
      <strong>${booking.eventName}</strong>
      <p>${booking.city} • ${booking.venue}</p>
      <div class="booking-row">
        <span>${booking.quantity} tickets</span>
        <span>${formatCurrency(booking.total)}</span>
      </div>
    </div>
  `).join("");
}

function openLoginModal() {
  elements.loginModal.classList.add("show");
  elements.loginModal.setAttribute("aria-hidden", "false");
}

function closeLoginModal() {
  elements.loginModal.classList.remove("show");
  elements.loginModal.setAttribute("aria-hidden", "true");
}

async function handleLogin() {
  const email = document.getElementById("emailInput").value.trim();
  const name = document.getElementById("nameInput").value.trim();

  if (!email || !name) {
    showToast("Please add your name and email.");
    return;
  }

  try {
    const data = await platformApi.login({ email, name });
    state.currentUser = data.user;
    setStoredCurrentUser(state.currentUser);
    updateLoginButton();
    closeLoginModal();
    await loadBookings();
    showToast(data.message);
  } catch (error) {
    showToast(error.message);
  }
}

async function loadEventsAndStats() {
  const [eventsData, statsData] = await Promise.all([
    platformApi.getEvents(),
    platformApi.getStats()
  ]);

  state.events = eventsData.events;
  state.stats = statsData;
  if (!state.selectedEventId && state.events.length) {
    state.selectedEventId = state.events[0].id;
  }
}

async function loadBookings() {
  if (!state.currentUser) {
    state.bookings = [];
    renderBookingHistory();
    return;
  }

  try {
    const data = await platformApi.getBookings(state.currentUser.email);
    state.bookings = data.bookings;
    renderBookingHistory();
  } catch (error) {
    showToast(error.message);
  }
}

async function confirmBooking() {
  if (!state.currentUser) {
    openLoginModal();
    showToast("Sign in first and we'll help you finish the booking.");
    return;
  }

  const event = getSelectedEvent();
  if (!event) {
    showToast("Choose an event first so we know what you'd like to book.");
    return;
  }

  const quantity = Number(elements.ticketQuantity.value);

  try {
    const data = await platformApi.createBooking({
      eventId: event.id,
      quantity,
      email: state.currentUser.email,
      name: state.currentUser.name
    });

    state.events = state.events.map(item => item.id === data.event.id ? data.event : item);
    await Promise.all([loadBookings(), refreshStats()]);
    updateSummary();
    renderEvents();
    showToast(`${data.message}: ${data.booking.eventName}`);
  } catch (error) {
    showToast(error.message);
  }
}

async function refreshStats() {
  state.stats = await platformApi.getStats();
  renderStats();
}

function attachEvents() {
  elements.categoryChips.addEventListener("click", event => {
    const chip = event.target.closest("[data-category]");
    if (!chip) return;
    state.selectedCategory = chip.dataset.category;
    buildFilters();
    renderEvents();
  });

  elements.searchInput.addEventListener("input", event => {
    state.searchTerm = event.target.value;
    renderEvents();
  });

  elements.cityFilter.addEventListener("change", event => {
    state.selectedCity = event.target.value;
    renderEvents();
  });

  elements.sortFilter.addEventListener("change", event => {
    state.sortBy = event.target.value;
    renderEvents();
  });

  elements.ticketQuantity.addEventListener("change", updateSummary);
  elements.confirmBookingBtn.addEventListener("click", confirmBooking);
  elements.loginBtn.addEventListener("click", () => {
    if (state.currentUser) {
      showToast(`Signed in as ${state.currentUser.name}.`);
      return;
    }
    openLoginModal();
  });
  elements.closeModalBtn.addEventListener("click", closeLoginModal);
  elements.submitLoginBtn.addEventListener("click", handleLogin);

  elements.resetBtn.addEventListener("click", () => {
    state.selectedCategory = "All";
    state.selectedCity = "all";
    state.searchTerm = "";
    state.sortBy = "featured";
    elements.searchInput.value = "";
    elements.sortFilter.value = "featured";
    buildFilters();
    renderEvents();
    showToast("Filters cleared. You're back to the full lineup.");
  });

  elements.loginModal.addEventListener("click", event => {
    if (event.target === elements.loginModal) {
      closeLoginModal();
    }
  });

  window.addEventListener("scroll", () => {
    const sections = [...document.querySelectorAll("section[id], .cta-band[id]")];
    const current = sections.findLast(section => window.scrollY >= section.offsetTop - 120);
    if (!current) return;
    document.querySelectorAll(".nav-link").forEach(link => {
      link.classList.toggle("active", link.getAttribute("href") === `#${current.id}`);
    });
  });
}

function selectEvent(id) {
  state.selectedEventId = id;
  updateSummary();
  scrollToSection("dashboard");
  showToast("Nice choice. We added it to your ticket cart.");
}

function quickBook(id) {
  selectEvent(id);
  confirmBooking();
}

async function bootstrap() {
  try {
    state.currentUser = getStoredCurrentUser();
    updateLoginButton();
    await loadEventsAndStats();
    buildFilters();
    renderEvents();
    renderStats();
    await loadBookings();
    updateSummary();
  } catch (error) {
    showToast("We couldn't load the events right now. Please try again in a moment.");
  }
}

function mountThreeScene(target, options = {}) {
  if (target.dataset.threeMounted === "true") {
    return;
  }

  target.dataset.threeMounted = "true";
  const width = target.clientWidth || options.fallbackWidth || 56;
  const height = target.clientHeight || options.fallbackHeight || 56;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  target.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = options.cameraZ || 3.2;

  const ambient = new THREE.AmbientLight(0xffffff, 1.6);
  const point = new THREE.PointLight(options.lightColor || 0xff725c, 2.4);
  point.position.set(2, 2, 3);
  scene.add(ambient, point);

  const geometry = options.geometry === "torus"
    ? new THREE.TorusKnotGeometry(0.64, 0.18, 110, 18)
    : options.geometry === "orb"
      ? new THREE.SphereGeometry(0.88, 28, 28)
      : new THREE.IcosahedronGeometry(0.78, 0);

  const material = new THREE.MeshStandardMaterial({
    color: options.color || 0xff5f57,
    metalness: 0.5,
    roughness: 0.18
  });

  const mesh = new THREE.Mesh(geometry, material);
  const wireframe = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({
      color: options.wireColor || 0xffffff,
      transparent: true,
      opacity: 0.3
    })
  );

  scene.add(mesh, wireframe);

  function animate() {
    mesh.rotation.x += options.speedX || 0.008;
    mesh.rotation.y += options.speedY || 0.012;
    wireframe.rotation.copy(mesh.rotation);
    mesh.position.y = Math.sin(Date.now() * 0.0012) * (options.floatAmplitude || 0.08);
    wireframe.position.y = mesh.position.y;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();

  window.addEventListener("resize", () => {
    const nextWidth = target.clientWidth || width;
    const nextHeight = target.clientHeight || height;
    camera.aspect = nextWidth / nextHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(nextWidth, nextHeight);
  });
}

function refreshThreeButtons() {
  document.querySelectorAll('[data-scene="button"]').forEach((target, index) => {
    mountThreeScene(target, {
      geometry: index % 2 === 0 ? "icosahedron" : "torus",
      color: index % 2 === 0 ? 0x76d0ff : 0xff7f66,
      wireColor: 0xffffff,
      speedX: 0.012,
      speedY: 0.018,
      cameraZ: 3.1,
      fallbackWidth: 28,
      fallbackHeight: 28,
      floatAmplitude: 0.05
    });
  });
}

mountThreeScene(document.getElementById("navLogo"), {
  geometry: "torus",
  color: 0xff6b57,
  wireColor: 0xffd6cf,
  speedX: 0.008,
  speedY: 0.015,
  cameraZ: 3.4
});

mountThreeScene(document.getElementById("heroScene"), {
  geometry: "orb",
  color: 0x4ec7ff,
  wireColor: 0xffffff,
  speedX: 0.004,
  speedY: 0.01,
  cameraZ: 3.8,
  floatAmplitude: 0.14
});

attachEvents();
bootstrap();
refreshThreeButtons();

window.scrollToSection = scrollToSection;
window.selectEvent = selectEvent;
window.quickBook = quickBook;
window.refreshThreeButtons = refreshThreeButtons;
