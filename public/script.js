// Importar Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

// 1. Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC-bzUQKIzTkurLkudfLtvh8OjOSD8YZ0w",
    authDomain: "base-de-datos-pagina-f9038.firebaseapp.com",
    projectId: "base-de-datos-pagina-f9038",
    storageBucket: "base-de-datos-pagina-f9038.appspot.com",
    messagingSenderId: "455220883391",
    appId: "1:455220883391:web:b2ade4281c12e20fb5bb0a",
    measurementId: "G-4RQ3H9J2L1"
};

// 2. Inicialización de Firebase
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();

    // 3. Función para cargar productos
    async function loadProducts(category = 'all') {
        try {
            let query = db.collection('productos');
            
            if (category !== 'all') {
                query = query.where('categoria', '==', category);
            }
            
            const snapshot = await query.get();
            const productsContainer = document.getElementById('products-container');
            
            if (productsContainer) {
                productsContainer.innerHTML = '';
                
                snapshot.forEach(doc => {
                    const product = doc.data();
                    const productCard = `
                        <div class="product-card">
                            <div class="image-container">
                                <img src="${product.imagen}" alt="${product.nombre}">
                            </div>
                            <div class="product-info">
                                <h3>${product.nombre}</h3>
                                <p class="price">$${product.precio}</p>
                                <div class="talles-container">
                                    <div class="talles-grid">
                                        ${product.talles.map(talle => `
                                            <div class="talle-option">
                                                <label class="talle-label">
                                                    <input type="radio" name="talle-${doc.id}" 
                                                           onclick="selectSize('${doc.id}', '${talle.nombre}', ${talle.stock})">
                                                    <span class="talle-text">${talle.nombre}</span>
                                                    <span class="stock-text">Stock: ${talle.stock}</span>
                                                </label>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                                <button onclick="addToCart('${doc.id}', '${product.nombre}', ${product.precio})">
                                    Agregar al carrito
                                </button>
                            </div>
                        </div>
                    `;
                    productsContainer.innerHTML += productCard;
                });
            }
        } catch (error) {
            console.error("Error al cargar productos:", error);
        }
    }

    // 4. Cargar productos iniciales
    loadProducts();

    // 5. Event listeners para filtros de categoría
    document.querySelectorAll('.category-filter').forEach(filter => {
        filter.addEventListener('click', (e) => {
            e.preventDefault();
            const category = filter.getAttribute('category');
            loadProducts(category);
        });
    });
});

// 6. Función para seleccionar talle
window.selectSize = function(productId, talle, stock) {
    selectedSizes[productId] = { talle, stock };
}
// Función para crear tarjeta de producto
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.innerHTML = `
        <div class="image-container">
            <img src="${product.imageUrl}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-info">
            <h3>${product.name}</h3>
            <p class="price">$${product.price}</p>
            <div class="talles-container">
                <p>Talles disponibles:</p>
                <div class="talles-grid">
                    ${createSizesHTML(product.sizes, product.id)}
                </div>
            </div>
            <button onclick="addToCart('${product.id}', '${product.name}', ${product.price})" 
                    class="add-to-cart-btn">
                Agregar al carrito
            </button>
        </div>
    `;
    
    return card;
}

// Función para crear HTML de talles
function createSizesHTML(sizes, productId) {
    return sizes.map(size => `
        <div class="talle-option">
            <label class="talle-label">
                <input type="radio" 
                       name="talle-${productId}" 
                       value="${size.size}"
                       onchange="handleSizeSelection('${productId}', '${size.size}', ${size.stock})">
                <span class="talle-text">${size.size}</span>
                <span class="stock-text">${size.stock} disponibles</span>
            </label>
        </div>
    `).join('');
}

// Función para manejar la selección de talle
function handleSizeSelection(productId, size, stock) {
    selectedSizes[productId] = { talle: size, stock: stock };
}

// Funciones del carrito
function toggleCart() {
    const cartElement = document.getElementById('cart');
    cartElement.classList.toggle('show');
}

function closeCart() {
    const cartElement = document.getElementById('cart');
    cartElement.classList.remove('show');
}

function addToCart(productId, name, price) {
    if (!selectedSizes[productId]) {
        alert('Por favor selecciona un talle');
        return;
    }

    const { talle, stock } = selectedSizes[productId];
    
    const existingItem = cart.find(item => 
        item.id === productId && item.talle === talle
    );

    if (existingItem) {
        if (existingItem.quantity >= stock) {
            alert('No hay más stock disponible para este talle');
            return;
        }
        existingItem.quantity++;
    } else {
        cart.push({
            id: productId,
            name,
            price,
            talle,
            quantity: 1
        });
    }

    updateCartDisplay();
    document.getElementById('cart').classList.add('show');
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (!cartItems || !cartTotal) {
        console.error('Elementos del carrito no encontrados');
        return;
    }

    let total = 0;

    cartItems.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-size">Talle: ${item.talle}</span>
                    <div class="quantity-controls">
                        <button onclick="updateQuantity('${item.id}', '${item.talle}', -1)">-</button>
                        <span class="item-quantity">${item.quantity}</span>
                        <button onclick="updateQuantity('${item.id}', '${item.talle}', 1)">+</button>
                    </div>
                </div>
                <div class="cart-item-price">
                    <span>$${itemTotal}</span>
                    <button class="remove-item" onclick="removeFromCart('${item.id}', '${item.talle}')">×</button>
                </div>
            </div>
        `;
    }).join('');

    cartTotal.textContent = `$${total}`;
    
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'block' : 'none';
    }
}

function updateQuantity(productId, talle, change) {
    const item = cart.find(item => item.id === productId && item.talle === talle);
    if (item) {
        const newQuantity = item.quantity + change;
        if (newQuantity > 0 && newQuantity <= selectedSizes[productId].stock) {
            item.quantity = newQuantity;
            updateCartDisplay();
        }
    }
}

function removeFromCart(productId, talle) {
    cart = cart.filter(item => !(item.id === productId && item.talle === talle));
    updateCartDisplay();
}

// Función para crear mensaje de WhatsApp
function createWhatsAppMessage() {
    let message = "¡Hola! Me gustaría realizar el siguiente pedido:\n\n";
    cart.forEach(item => {
        message += `${item.name} - Talle: ${item.talle} - Cantidad: ${item.quantity} - $${item.price * item.quantity}\n`;
    });
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `\nTotal: $${total}`;
    return encodeURIComponent(message);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Cargar productos inicialmente
    loadProducts();

    // Configurar filtros de categoría
    const categoryFilters = document.querySelectorAll('.category-filter');
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', (e) => {
            e.preventDefault();
            categoryFilters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            const category = filter.getAttribute('category');
            currentCategory = category;
            loadProducts(category);
        });
    });

    // Configurar carrito
    const cartToggle = document.getElementById('cart-toggle');
    const cart = document.getElementById('cart');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (cartToggle && cart && checkoutBtn) {
        cartToggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggleCart();
        });

        const closeButton = document.createElement('button');
        closeButton.innerHTML = '✕';
        closeButton.className = 'cart-close-btn';
        closeButton.onclick = closeCart;
        cart.insertBefore(closeButton, cart.firstChild);

        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Tu carrito está vacío');
                return;
            }
            
            const message = createWhatsAppMessage();
            window.open(`https://wa.me/543765225116?text=${message}`, '_blank');
            
            cart = [];
            updateCartDisplay();
            closeCart();
        });

        document.addEventListener('click', (e) => {
            if (cart.classList.contains('show') && 
                !cart.contains(e.target) && 
                e.target !== cartToggle) {
                closeCart();
            }
        });
    }
});
