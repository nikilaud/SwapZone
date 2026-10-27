import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, isSupabaseConfigured } from "./config.js";

const supabase = isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const IMAGE_BUCKET = "listing-images";
const FALLBACK_EMOJI = { Electronics: "⌁", Home: "⌂", Fashion: "◇", Sports: "↗", Other: "✳" };

const demoListings = [
  { id: "demo-1", title: "Studio headphones", description: "Rich sound, comfy fit, and still in great shape. Includes the cable.", price: 145, category: "Electronics", condition: "Good", image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80", user_id: null, created_at: "2026-10-24T09:00:00Z" },
  { id: "demo-2", title: "Everyday tote bag", description: "A sturdy everyday bag with plenty of room for the essentials.", price: 38, category: "Fashion", condition: "Like New", image_url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80", user_id: null, created_at: "2026-10-23T09:00:00Z" },
  { id: "demo-3", title: "Minimal desk lamp", description: "Warm light for slow evenings and late-night study sessions.", price: 55, category: "Home", condition: "Good", image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80", user_id: null, created_at: "2026-10-22T09:00:00Z" },
  { id: "demo-4", title: "Classic wristwatch", description: "A timeless everyday watch. Clean face and a comfortable strap.", price: 95, category: "Fashion", condition: "Fair", image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80", user_id: null, created_at: "2026-10-21T09:00:00Z" },
  { id: "demo-5", title: "Pocket-size camera", description: "Small camera for travel, walks, and capturing little moments.", price: 220, category: "Electronics", condition: "Good", image_url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80", user_id: null, created_at: "2026-10-20T09:00:00Z" },
  { id: "demo-6", title: "Weekend sneakers", description: "Easy-to-wear sneakers. Plenty of life left in the soles.", price: 80, category: "Sports", condition: "Like New", image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80", user_id: null, created_at: "2026-10-19T09:00:00Z" },
  { id: "demo-7", title: "Wireless mouse", description: "A compact wireless mouse that is ready for a new desk setup.", price: 42, category: "Electronics", condition: "Good", image_url: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80", user_id: null, created_at: "2026-10-18T09:00:00Z" },
  { id: "demo-8", title: "Ceramic coffee set", description: "A simple matching set for slow mornings and coffee catch-ups.", price: 60, category: "Home", condition: "Like New", image_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80", user_id: null, created_at: "2026-10-17T09:00:00Z" }
];

const state = { user: null, listings: [], mode: "login", showMine: false, editingImageUrl: "", toastTimer: null };
const $ = (selector) => document.querySelector(selector);
const productGrid = $("#product-grid");
const emptyState = $("#empty-state");
const resultsCount = $("#results-count");

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
function formatPrice(value) {
  return new Intl.NumberFormat("ka-GE", { style: "currency", currency: "GEL", maximumFractionDigits: 2 }).format(Number(value) || 0);
}
function formatDate(value) {
  if (!value) return "Recently added";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}
function isValidImage(file) {
  return file && ["image/webp", "image/avif"].includes(file.type) && file.size <= MAX_IMAGE_SIZE;
}
function safeImageUrl(url) {
  if (!url) return "";
  try { const parsed = new URL(url); return parsed.protocol === "https:" ? parsed.href : ""; }
  catch { return ""; }
}
function getVideoEmbedUrl(rawUrl) {
  if (!rawUrl) return "";
  try {
    const url = new URL(rawUrl);
    if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) {
      const id = url.searchParams.get("v");
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;
      const shorts = url.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shorts) return `https://www.youtube-nocookie.com/embed/${shorts[1]}`;
    }
    if (["youtu.be", "www.youtu.be"].includes(url.hostname)) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    if (["vimeo.com", "www.vimeo.com"].includes(url.hostname)) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
  } catch { return ""; }
  return "";
}
function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.remove("hidden");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => node.classList.add("hidden"), 3600);
}
function setFormError(selector, message = "") {
  const el = $(selector);
  el.textContent = message;
  el.classList.toggle("hidden", !message);
}
function openModal(id) { $("#" + id).classList.remove("hidden"); document.body.style.overflow = "hidden"; }
function closeModal(id) {
  $("#" + id).classList.add("hidden");
  if (![...document.querySelectorAll(".modal")].some((modal) => !modal.classList.contains("hidden"))) document.body.style.overflow = "";
}
function openAuth(mode = "login") {
  if (!isSupabaseConfigured) { toast("Add your Supabase URL and publishable key in js/config.js first."); return; }
  setAuthMode(mode); setFormError("#auth-error"); $("#auth-form").reset(); openModal("auth-modal");
}
function setAuthMode(mode) {
  state.mode = mode;
  $("#auth-title").innerHTML = mode === "login" ? 'Good to have you <span>back.</span>' : 'Join the <span>good finds.</span>';
  $("#auth-intro").textContent = mode === "login" ? "Log in to manage your listings and find your next favorite thing." : "Create an account to post items and manage your listings.";
  $("#auth-submit").innerHTML = mode === "login" ? 'Log in <span>↗</span>' : 'Create account <span>↗</span>';
  $("#auth-password").autocomplete = mode === "login" ? "current-password" : "new-password";
  document.querySelectorAll("[data-auth-mode]").forEach((button) => button.classList.toggle("active", button.dataset.authMode === mode));
}
function updateAuthUI() {
  const account = $("#account-btn");
  const email = $("#user-email");
  if (state.user) {
    account.textContent = "Log out";
    email.textContent = state.user.email || "Signed in";
    email.classList.remove("hidden");
    $("#sell-btn").classList.remove("needs-auth");
  } else {
    account.textContent = "Log in";
    email.classList.add("hidden");
  }
}
function getFilteredListings() {
  const query = $("#search-input").value.trim().toLowerCase();
  const category = $("#category-filter").value;
  const condition = $("#condition-filter").value;
  const sort = $("#sort-filter").value;
  let list = state.listings.filter((item) => {
    const matchesQuery = !query || [item.title, item.description, item.category].some((value) => String(value || "").toLowerCase().includes(query));
    const matchesCategory = category === "all" || item.category === category;
    const matchesCondition = condition === "all" || item.condition === condition;
    const matchesMine = !state.showMine || (state.user && item.user_id === state.user.id);
    return matchesQuery && matchesCategory && matchesCondition && matchesMine;
  });
  if (sort === "price-low") list.sort((a, b) => Number(a.price) - Number(b.price));
  else if (sort === "price-high") list.sort((a, b) => Number(b.price) - Number(a.price));
  else list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  return list;
}
function renderListings() {
  const list = getFilteredListings();
  resultsCount.textContent = `${list.length} ${list.length === 1 ? "find" : "finds"}${state.showMine ? " · yours" : ""}`;
  $("#my-listings-btn").classList.toggle("active", state.showMine);
  productGrid.innerHTML = list.map((item) => {
    const image = safeImageUrl(item.image_url);
    const own = state.user && item.user_id === state.user.id;
    const categoryFallback = FALLBACK_EMOJI[item.category] || "✳";
    return `<article class="product-card">
      <div class="product-image-wrap">
        ${image ? `<img class="product-image" src="${escapeHTML(image)}" alt="${escapeHTML(item.title)}" loading="lazy" decoding="async">` : `<div class="product-fallback" aria-label="No product image">${categoryFallback}</div>`}
        <span class="product-label">${escapeHTML(item.condition || "Pre-loved")}</span>
        ${own ? `<div class="owner-tools"><button class="icon-action" data-edit="${escapeHTML(item.id)}" aria-label="Edit ${escapeHTML(item.title)}" title="Edit" type="button">✎</button><button class="icon-action" data-delete="${escapeHTML(item.id)}" aria-label="Delete ${escapeHTML(item.title)}" title="Delete" type="button">×</button></div>` : ""}
      </div>
      <div class="product-meta"><span class="product-category">${escapeHTML(item.category || "Other")}</span><span class="condition-tag">Added ${escapeHTML(formatDate(item.created_at))}</span></div>
      <h3 class="product-title">${escapeHTML(item.title)}</h3>
      <p class="product-description">${escapeHTML(item.description || "A good item ready for a new home.")}</p>
      <div class="product-bottom"><span class="product-price">${escapeHTML(formatPrice(item.price))}</span><button class="view-item" data-view="${escapeHTML(item.id)}" type="button">View item ↗</button></div>
    </article>`;
  }).join("");
  productGrid.classList.toggle("hidden", list.length === 0);
  emptyState.classList.toggle("hidden", list.length !== 0);
}
async function loadListings() {
  if (!isSupabaseConfigured) {
    state.listings = [...demoListings];
    $("#setup-notice").classList.remove("hidden");
    renderListings();
    return;
  }
  $("#setup-notice").classList.add("hidden");
  resultsCount.textContent = "Loading finds…";
  const { data, error } = await supabase.from("listings").select("id,user_id,title,description,price,category,condition,image_url,video_url,created_at").order("created_at", { ascending: false });
  if (error) {
    state.listings = [];
    renderListings();
    $("#status-message").textContent = `Could not load listings: ${error.message}. Check the SQL setup and Supabase Data API permissions.`;
    $("#status-message").classList.remove("hidden");
    return;
  }
  $("#status-message").classList.add("hidden");
  state.listings = data || [];
  renderListings();
}
function resetFilters() {
  $("#search-input").value = "";
  $("#category-filter").value = "all";
  $("#condition-filter").value = "all";
  $("#sort-filter").value = "newest";
  document.querySelectorAll(".category-chip").forEach((chip) => chip.classList.toggle("active", chip.dataset.category === "all"));
  renderListings();
}
function openListingForm(item = null) {
  if (!state.user) { openAuth("login"); toast("Log in to publish and manage listings."); return; }
  setFormError("#listing-error");
  $("#listing-form").reset();
  $("#listing-id").value = item?.id || "";
  $("#listing-name").value = item?.title || "";
  $("#listing-price").value = item?.price ?? "";
  $("#listing-category").value = item?.category || "Electronics";
  $("#listing-condition").value = item?.condition || "Like New";
  $("#listing-description").value = item?.description || "";
  $("#listing-video").value = item?.video_url || "";
  state.editingImageUrl = item?.image_url || "";
  $("#image-hint").textContent = state.editingImageUrl ? "Leave empty to keep the current photo, or choose a new WebP/AVIF image." : "Choose a WebP or AVIF image. A photo is optional.";
  $("#listing-title").innerHTML = item ? 'Make it <span>even better.</span>' : 'List something <span>good.</span>';
  $("#listing-submit").innerHTML = item ? 'Save changes <span>↗</span>' : 'Publish listing <span>↗</span>';
  openModal("listing-modal");
}
async function uploadImage(file) {
  if (!isValidImage(file)) throw new Error("Please choose a WebP or AVIF image that is no larger than 2 MB.");
  const extension = file.type === "image/avif" ? "avif" : "webp";
  const path = `${state.user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, { contentType: file.type, upsert: false, cacheControl: "3600" });
  if (error) throw error;
  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
async function saveListing(event) {
  event.preventDefault();
  if (!state.user) { toast("Please log in first."); return; }
  setFormError("#listing-error");
  const submit = $("#listing-submit");
  submit.disabled = true; submit.textContent = "Saving…";
  try {
    const title = $("#listing-name").value.trim();
    const description = $("#listing-description").value.trim();
    const price = Number($("#listing-price").value);
    const category = $("#listing-category").value;
    const condition = $("#listing-condition").value;
    const videoInput = $("#listing-video").value.trim();
    const videoUrl = videoInput ? getVideoEmbedUrl(videoInput) : "";
    const file = $("#listing-image").files[0];
    if (!title || !description || !Number.isFinite(price) || price < 0) throw new Error("Fill in the title, description, and a valid price.");
    if (videoInput && !videoUrl) throw new Error("Use a valid YouTube or Vimeo video link.");
    if (file && !isValidImage(file)) throw new Error("Images must be WebP or AVIF and no larger than 2 MB.");
    let imageUrl = state.editingImageUrl;
    if (file) imageUrl = await uploadImage(file);
    const payload = { user_id: state.user.id, title, description, price, category, condition, image_url: imageUrl || null, video_url: videoInput || null };
    const listingId = $("#listing-id").value;
    let error;
    if (listingId) {
      ({ error } = await supabase.from("listings").update(payload).eq("id", listingId).eq("user_id", state.user.id));
    } else {
      ({ error } = await supabase.from("listings").insert(payload));
    }
    if (error) throw error;
    closeModal("listing-modal");
    toast(listingId ? "Your listing has been updated." : "Your item is live. Nice one!");
    state.showMine = false;
    await loadListings();
  } catch (error) {
    setFormError("#listing-error", error.message || "Something went wrong. Please try again.");
  } finally {
    submit.disabled = false;
    submit.innerHTML = $("#listing-id").value ? 'Save changes <span>↗</span>' : 'Publish listing <span>↗</span>';
  }
}
async function deleteListing(id) {
  if (!state.user) return;
  const item = state.listings.find((listing) => listing.id === id);
  if (!item || item.user_id !== state.user.id) return;
  if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
  const { error } = await supabase.from("listings").delete().eq("id", id).eq("user_id", state.user.id);
  if (error) { toast(`Could not delete listing: ${error.message}`); return; }
  state.listings = state.listings.filter((listing) => listing.id !== id);
  renderListings(); toast("Listing deleted.");
}
function openDetails(id) {
  const item = state.listings.find((listing) => listing.id === id);
  if (!item) return;
  const image = safeImageUrl(item.image_url);
  const video = getVideoEmbedUrl(item.video_url || "");
  const own = state.user && item.user_id === state.user.id;
  const imageMarkup = image ? `<img class="detail-image" src="${escapeHTML(image)}" alt="${escapeHTML(item.title)}">` : `<div class="detail-image detail-placeholder">${FALLBACK_EMOJI[item.category] || "✳"}</div>`;
  $("#detail-content").innerHTML = `<div class="detail-layout"><div>${imageMarkup}${video ? `<iframe class="detail-video" src="${escapeHTML(video)}" title="${escapeHTML(item.title)} video" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>` : ""}</div><div class="detail-copy"><div class="modal-eyebrow">${escapeHTML(item.category || "OTHER")}</div><h2 id="detail-title">${escapeHTML(item.title)}</h2><div class="detail-price">${escapeHTML(formatPrice(item.price))}</div><p class="detail-description">${escapeHTML(item.description || "No description provided.")}</p><div class="detail-meta"><span>${escapeHTML(item.condition || "Pre-loved")}</span><span>Added ${escapeHTML(formatDate(item.created_at))}</span></div><p class="detail-seller">Listed by ${own ? "you" : "a SwapZone member"}</p><div class="detail-actions">${own ? `<button class="button button-dark" data-detail-edit="${escapeHTML(item.id)}" type="button">Edit listing</button><button class="button muted-action" data-detail-delete="${escapeHTML(item.id)}" type="button">Delete</button>` : `<button class="button button-dark" data-contact="${escapeHTML(item.id)}" type="button">I'm interested <span>↗</span></button>`}</div></div></div>`;
  openModal("detail-modal");
}
async function authenticate(event) {
  event.preventDefault();
  if (!supabase) return;
  setFormError("#auth-error");
  const submit = $("#auth-submit");
  const email = $("#auth-email").value.trim();
  const password = $("#auth-password").value;
  submit.disabled = true; submit.textContent = state.mode === "login" ? "Logging in…" : "Creating account…";
  try {
    const result = state.mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (result.error) throw result.error;
    if (state.mode === "signup" && !result.data.session) {
      closeModal("auth-modal"); toast("Account created. Check your email to confirm it, then log in.");
    } else {
      state.user = result.data.user;
      updateAuthUI(); closeModal("auth-modal"); await loadListings();
      toast(state.mode === "login" ? "Welcome back!" : "Account created. Welcome to SwapZone!");
    }
  } catch (error) {
    setFormError("#auth-error", error.message || "Authentication failed.");
  } finally {
    submit.disabled = false;
    submit.innerHTML = state.mode === "login" ? 'Log in <span>↗</span>' : 'Create account <span>↗</span>';
  }
}
async function accountButtonClick() {
  if (!state.user) { openAuth("login"); return; }
  const { error } = await supabase.auth.signOut();
  if (error) { toast(error.message); return; }
  state.user = null; state.showMine = false; updateAuthUI(); await loadListings(); toast("You have logged out.");
}

$("#year").textContent = new Date().getFullYear();
$("#search-input").addEventListener("input", renderListings);
$("#category-filter").addEventListener("change", () => {
  document.querySelectorAll(".category-chip").forEach((chip) => chip.classList.toggle("active", chip.dataset.category === $("#category-filter").value));
  renderListings();
});
$("#condition-filter").addEventListener("change", renderListings);
$("#sort-filter").addEventListener("change", renderListings);
document.querySelectorAll(".category-chip").forEach((chip) => chip.addEventListener("click", () => {
  $("#category-filter").value = chip.dataset.category;
  document.querySelectorAll(".category-chip").forEach((other) => other.classList.toggle("active", other === chip)); renderListings();
}));
$("#clear-filters-btn").addEventListener("click", resetFilters);
$("#sell-btn").addEventListener("click", () => openListingForm());
$("#sell-bottom-btn").addEventListener("click", () => openListingForm());
$("#account-btn").addEventListener("click", accountButtonClick);
$("#auth-form").addEventListener("submit", authenticate);
$("#listing-form").addEventListener("submit", saveListing);
document.querySelectorAll("[data-auth-mode]").forEach((button) => button.addEventListener("click", () => setAuthMode(button.dataset.authMode)));
document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => closeModal(button.dataset.close)));
document.addEventListener("keydown", (event) => { if (event.key === "Escape") document.querySelectorAll(".modal:not(.hidden)").forEach((modal) => closeModal(modal.id)); });
$("#my-listings-btn").addEventListener("click", () => {
  if (!state.user) { openAuth("login"); toast("Log in to see your listings."); return; }
  state.showMine = !state.showMine; renderListings(); $("#market").scrollIntoView({ behavior: "smooth" });
});
$("#product-grid").addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  const viewButton = event.target.closest("[data-view]");
  if (editButton) {
    const item = state.listings.find((listing) => listing.id === editButton.dataset.edit);
    if (item && item.user_id === state.user?.id) openListingForm(item);
  } else if (deleteButton) {
    await deleteListing(deleteButton.dataset.delete);
  } else if (viewButton) openDetails(viewButton.dataset.view);
});
$("#detail-content").addEventListener("click", async (event) => {
  const edit = event.target.closest("[data-detail-edit]");
  const remove = event.target.closest("[data-detail-delete]");
  const contact = event.target.closest("[data-contact]");
  if (edit) {
    const item = state.listings.find((listing) => listing.id === edit.dataset.detailEdit);
    closeModal("detail-modal"); if (item) openListingForm(item);
  } else if (remove) {
    const id = remove.dataset.detailDelete; closeModal("detail-modal"); await deleteListing(id);
  } else if (contact) {
    const item = state.listings.find((listing) => listing.id === contact.dataset.contact);
    if (!state.user) { closeModal("detail-modal"); openAuth("login"); toast("Log in to continue."); }
    else toast("Messaging is a great next feature to add. For now, you can expand this button with seller contact details.");
  }
});
$("#listing-image").addEventListener("change", () => {
  const file = $("#listing-image").files[0];
  if (!file) { $("#image-hint").textContent = state.editingImageUrl ? "Leave empty to keep the current photo, or choose a new WebP/AVIF image." : "Choose a WebP or AVIF image. A photo is optional."; return; }
  if (!isValidImage(file)) {
    $("#listing-image").value = "";
    $("#image-hint").textContent = "Invalid file. Choose WebP or AVIF up to 2 MB.";
    setFormError("#listing-error", "Images must be WebP or AVIF and no larger than 2 MB.");
  } else { setFormError("#listing-error"); $("#image-hint").textContent = `${file.name} · ${(file.size / 1024).toFixed(0)} KB`; }
});
$("#mobile-menu-btn").addEventListener("click", () => {
  const nav = document.querySelector(".main-nav");
  const isOpen = nav.classList.toggle("open");
  $("#mobile-menu-btn").setAttribute("aria-expanded", String(isOpen));
});
document.querySelectorAll(".main-nav a").forEach((link) => link.addEventListener("click", () => document.querySelector(".main-nav").classList.remove("open")));

async function init() {
  if (!isSupabaseConfigured) {
    updateAuthUI(); await loadListings();
    return;
  }
  const { data: { session } } = await supabase.auth.getSession();
  state.user = session?.user || null;
  updateAuthUI();
  supabase.auth.onAuthStateChange((_event, session) => {
    state.user = session?.user || null;
    updateAuthUI();
    // Defer database calls to avoid doing Supabase work inside the auth callback lock.
    setTimeout(() => loadListings(), 0);
  });
  await loadListings();
}
init().catch((error) => {
  console.error(error);
  $("#status-message").textContent = "The app could not start. Check the browser console for details.";
  $("#status-message").classList.remove("hidden");
});
