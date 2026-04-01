import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

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

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

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
    elements.eventList.innerHTML = `<div class="empty-state">Nothing matches that search just yet. Try a different city, category, or keyword.</div>`;
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
    const data = await requestJson("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name })
    });

    state.currentUser = data.user;
    elements.loginBtn.lastElementChild.textContent = data.user.name.split(" ")[0];
    closeLoginModal();
    await loadBookings();
    showToast(data.message);
  } catch (error) {
    showToast(error.message);
  }
}

async function loadEventsAndStats() {
  const [eventsData, statsData] = await Promise.all([
    requestJson("/api/events"),
    requestJson("/api/stats")
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
    const data = await requestJson(`/api/bookings?email=${encodeURIComponent(state.currentUser.email)}`);
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
    const data = await requestJson("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: event.id,
        quantity,
        email: state.currentUser.email,
        name: state.currentUser.name
      })
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
  state.stats = await requestJson("/api/stats");
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
  elements.loginBtn.addEventListener("click", openLoginModal);
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
    await loadEventsAndStats();
    buildFilters();
    renderEvents();
    renderStats();
    renderBookingHistory();
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
