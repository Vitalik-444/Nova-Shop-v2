const PRODUCTS_URL = "/api/products.php";
const ORDERS_URL = "/api/orders.php";
const REVIEWS_URL = "/api/reviews.php";
const ADMIN_URL = "/api/admin.php";
const AUTH_URL = "/api/auth.php";
const CART_URL = "/api/cart.php";
const FAVORITES_URL = "/api/favorites.php";

const NETWORK_ERROR = { success: false, message: "Ошибка сети" };

async function request(url, options = {}) {
  const response = await fetch(url, { credentials: "same-origin", ...options });
  return response.json();
}

function send(url, body, method = "POST") {
  return request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function safe(task, fallback) {
  try {
    return await task();
  } catch (error) {
    console.error(error);
    return fallback;
  }
}

export function getProducts(limit = 200) {
  return safe(async () => {
    const data = await request(`${PRODUCTS_URL}?action=list&limit=${limit}`);
    return data.success ? data.products : [];
  }, []);
}

export function getProduct(id) {
  return safe(async () => {
    const data = await request(`${PRODUCTS_URL}?action=get&id=${id}`);
    return data.success ? data.product : null;
  }, null);
}

export function getCategories() {
  return safe(async () => {
    const data = await request(`${PRODUCTS_URL}?action=categories`);
    return data.success ? data.categories : [];
  }, []);
}

export function addProduct(product) {
  return safe(() => send(`${PRODUCTS_URL}?action=add`, product), { success: false, message: "Помилка мережі" });
}

export function getMyProducts() {
  return safe(async () => {
    const data = await request(`${PRODUCTS_URL}?action=myProducts`);
    return data.success ? data.products : [];
  }, []);
}

export function deleteMyProduct(id) {
  return safe(() => send(`${PRODUCTS_URL}?action=deleteMyProduct`, { id }), { success: false, message: "Помилка мережі" });
}

export function getOrders() {
  return safe(async () => {
    const data = await request(`${ORDERS_URL}?action=list`);
    return data.success ? data.orders : [];
  }, []);
}

export function createOrder(customer, items) {
  return safe(() => send(`${ORDERS_URL}?action=create`, { customer, items }), NETWORK_ERROR);
}

export function getProductReviews(productId) {
  return safe(async () => {
    const data = await request(`${REVIEWS_URL}?action=list&product_id=${productId}`);
    return data.success
      ? { reviews: data.reviews, myReview: data.myReview }
      : { reviews: [], myReview: null };
  }, { reviews: [], myReview: null });
}

export function submitProductReview(productId, rating, comment) {
  return safe(() => send(`${REVIEWS_URL}?action=add`, { productId, rating, comment }), NETWORK_ERROR);
}

export function fetchMe() {
  return safe(async () => {
    const data = await request(`${AUTH_URL}?action=me`);
    return data.success && data.user ? data.user : null;
  }, null);
}

export function login(email, password) {
  return safe(() => send(`${AUTH_URL}?action=login`, { email, password }), NETWORK_ERROR);
}

export function register(name, email, password) {
  return safe(() => send(`${AUTH_URL}?action=register`, { name, email, password }), NETWORK_ERROR);
}

export function logout() {
  return safe(() => request(`${AUTH_URL}?action=logout`), null);
}

export function fetchServerCart() {
  return safe(async () => {
    const data = await request(`${CART_URL}?action=list`);
    return data.success && Array.isArray(data.cart) ? data.cart : [];
  }, null);
}

export function syncCart(cart) {
  return safe(() => send(`${CART_URL}?action=sync`, cart), null);
}

export function fetchServerFavorites() {
  return safe(async () => {
    const data = await request(`${FAVORITES_URL}?action=list`);
    return data.success && Array.isArray(data.favorites) ? data.favorites : [];
  }, null);
}

export function syncFavorites(favorites) {
  return safe(() => send(`${FAVORITES_URL}?action=sync`, favorites), null);
}

function adminGet(action) {
  return safe(() => request(`${ADMIN_URL}?action=${action}`), { success: false });
}

function adminPost(action, body) {
  return safe(() => send(`${ADMIN_URL}?action=${action}`, body), NETWORK_ERROR);
}

export async function adminGetOrders() {
  const data = await adminGet("ordersList");
  return data.success ? data.orders : [];
}

export function adminUpdateOrderStatus(id, status) {
  return adminPost("updateOrderStatus", { id, status });
}

export function adminSaveProduct(product) {
  return adminPost("productSave", product);
}

export function adminDeleteProduct(id) {
  return adminPost("productDelete", { id });
}

export async function adminGetUsers() {
  const data = await adminGet("usersList");
  return data.success ? data.users : [];
}

export function adminUpdateUserRole(id, role) {
  return adminPost("updateUserRole", { id, role });
}
