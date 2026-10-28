// Наскрізна перевірка API проти запущеного сервера (npm start) і БД з даними.
//   npm run db:smoke            # BASE_URL=http://localhost:3000, ADMIN_EMAIL/ADMIN_PASS — для адмін-перевірок (необов'язково)
const BASE = process.env.BASE_URL || 'http://localhost:3000';
let failed = 0;
const ok = (cond, msg) => { console.log(`${cond ? '  ✓' : '  ✗'} ${msg}`); if (!cond) failed++; };

function client() {
    let cookie = '';
    return async function call(file, action, { body, query = '' } = {}) {
        const res = await fetch(`${BASE}/api/${file}.php?action=${action}${query}`, {
            method: body === undefined ? 'GET' : 'POST',
            headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) },
            body: body === undefined ? undefined : JSON.stringify(body)
        });
        const set = res.headers.get('set-cookie');
        if (set) cookie = set.split(';')[0];
        return { status: res.status, ...(await res.json()) };
    };
}

(async () => {
    const u = client();
    const email = `smoke${Date.now()}@test.local`;

    console.log('Каталог');
    const list = await u('products', 'list');
    ok(list.success && list.products.length > 0, `products.list: ${list.products?.length} товарів`);
    const p = list.products.find(x => x.stock >= 2) || list.products[0];
    const keys = ['id','title','price','category','discountPercentage','rating','reviewsCount','stock','brand','seller','thumbnail','images'];
    ok(keys.every(k => k in p), 'форма товару збігається з контрактом фронтенду');
    ok((await u('products', 'get', { query: `&id=${p.id}` })).product.id === p.id, 'products.get');
    ok((await u('products', 'get', { query: '&id=999999' })).status === 404, 'products.get неіснуючого → 404');
    ok((await u('products', 'categories')).categories.length > 0, 'products.categories');

    console.log('Користувач');
    ok((await u('auth', 'register', { body: { name: 'Smoke', email, password: '123' } })).status === 422, 'короткий пароль → 422');
    const reg = await u('auth', 'register', { body: { name: 'Smoke', email, password: 'secret123' } });
    ok(reg.success && reg.user.role === 'user', 'register');
    ok((await u('auth', 'register', { body: { name: 'Smoke', email, password: 'secret123' } })).status === 409, 'дубль email → 409');
    ok((await u('auth', 'me')).user?.email === email, 'me (сесія)');

    console.log('Відгуки');
    ok((await u('reviews', 'add', { body: { productId: p.id, rating: 4, comment: 'ok' } })).success, 'додати відгук');
    ok((await u('reviews', 'add', { body: { productId: p.id, rating: 2, comment: 'потім передумав' } })).success, 'повторний відгук оновлює (UNIQUE)');
    const rv = await u('reviews', 'list', { query: `&product_id=${p.id}` });
    ok(rv.myReview?.rating === 2 && rv.reviews.filter(r => r.userId === reg.user.id).length === 1, 'один відгук на пару, myReview');
    ok((await u('products', 'get', { query: `&id=${p.id}` })).product.reviewsCount >= 1, 'reviewsCount враховує відгук');
    ok((await u('reviews', 'delete', { body: { productId: p.id } })).success, 'видалити відгук');

    console.log('Кошик та обране');
    ok((await u('cart', 'sync', { body: [{ id: p.id, quantity: 2 }, { id: p.id, quantity: 1 }, { id: 999999, quantity: 1 }] })).success, 'cart.sync (дубль зливається, невідомий пропущено)');
    const cart = await u('cart', 'list');
    ok(cart.cart.length === 1 && cart.cart[0].quantity === 3 && cart.cart[0].title === p.title, 'cart.list повертає товар із quantity=3');
    ok((await u('favorites', 'sync', { body: [{ id: p.id }] })).success && (await u('favorites', 'list')).favorites[0]?.id === p.id, 'favorites sync/list');

    console.log('Замовлення');
    const customer = { name: 'A', surname: 'B', phone: '1', email, city: 'Kyiv', postcode: '01001', address: 'Main 1', delivery: 'courier', payment: 'card' };
    const tooMany = await u('orders', 'create', { body: { customer, items: [{ id: p.id, quantity: p.stock + 1 }] } });
    ok(tooMany.status === 409, `перевищення залишку → 409 («${tooMany.message}»)`);
    const created = await u('orders', 'create', { body: { customer, items: [{ id: p.id, quantity: 2 }] } });
    ok(created.success && created.order_id, `orders.create → №${created.order_id}`);
    ok((await u('products', 'get', { query: `&id=${p.id}` })).product.stock === p.stock - 2, 'залишок списано');
    ok((await u('cart', 'list')).cart.length === 0, 'кошик очищено');
    const orders = (await u('orders', 'list')).orders;
    ok(orders[0].status === 'new' && Math.abs(orders[0].total - p.price * 2) < 0.005 && orders[0].items[0].title === p.title, 'orders.list: статус new, total, items');

    console.log('Мої товари');
    const add = await u('products', 'add', { body: { title: 'Smoke item', category: 'smoke-cat', price: 10, stock: 3, brand: 'X' } });
    ok(add.success, 'products.add');
    ok((await u('products', 'myProducts')).products.some(x => x.id === add.id && x.seller === 'Smoke' && x.category === 'smoke-cat'), 'myProducts');
    ok((await u('auth', 'me')).user.role === 'user', 'роль для фронтенду лишається "user"');
    ok((await u('products', 'deleteMyProduct', { body: { id: add.id } })).success, 'deleteMyProduct');
    ok((await u('products', 'deleteMyProduct', { body: { id: p.id } })).status === 403, 'чужий товар не видалити → 403');

    console.log('Адмінка');
    ok((await u('admin', 'ordersList')).status === 403, 'не-адмін → 403');
    if (process.env.ADMIN_EMAIL) {
        const a = client();
        ok((await a('auth', 'login', { body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASS } })).user?.role === 'admin', 'вхід адміна');
        const ol = await a('admin', 'ordersList');
        ok(ol.success && ol.orders.some(o => o.id === created.order_id), 'admin.ordersList бачить нове замовлення');
        ok((await a('admin', 'updateOrderStatus', { body: { id: created.order_id, status: 'processing' } })).success, 'updateOrderStatus processing');
        ok((await u('orders', 'list')).orders[0].status === 'processing', 'покупець бачить processing');
        ok((await a('admin', 'updateOrderStatus', { body: { id: created.order_id, status: 'bogus' } })).status === 422, 'невідомий статус → 422');
        const save = await a('admin', 'productSave', { body: { title: 'Admin item', category: 'smoke-cat', price: 5, stock: 1, seller: 'NovaShop', brand: 'Z', discountPercentage: 15 } });
        ok(save.success, 'productSave (create)');
        ok((await a('admin', 'productSave', { body: { id: save.id, title: 'Admin item 2', category: 'smoke-cat', price: 6, stock: 2, seller: 'NovaShop', brand: 'Z', thumbnail: 'x.png' } })).success, 'productSave (update)');
        const got = (await u('products', 'get', { query: `&id=${save.id}` })).product;
        ok(got.title === 'Admin item 2' && got.discountPercentage === 15 && got.thumbnail === 'x.png' && got.seller === 'NovaShop', 'update зберіг атрибути (merge jsonb)');
        ok((await a('admin', 'productDelete', { body: { id: save.id } })).success, 'productDelete');
        ok((await a('admin', 'productDelete', { body: { id: p.id } })).status === 409, 'товар із замовлень → 409 (ON DELETE RESTRICT)');
        const users = (await a('admin', 'usersList')).users;
        ok(users.some(x => x.email === email), 'usersList');
        ok((await a('admin', 'updateUserRole', { body: { id: reg.user.id, role: 'admin' } })).success && (await u('auth', 'me')).user.role === 'admin', 'updateUserRole → admin');
        ok((await a('admin', 'updateUserRole', { body: { id: reg.user.id, role: 'user' } })).success && (await u('auth', 'me')).user.role === 'user', 'updateUserRole → user');
    } else console.log('  (пропущено: задайте ADMIN_EMAIL / ADMIN_PASS)');

    await u('auth', 'logout');
    ok((await u('auth', 'me')).user === null, 'logout');
    console.log(failed ? `\nПровалено перевірок: ${failed}` : '\nВсе гаразд');
    process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
