// Variables globales
let cart = [];
let selectedSizes = {};
let lastVisibleProduct = null;
let currentCategory = 'all';

// Función para cargar productos
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

// Función para mostrar/ocultar el carrito
function toggleCart() {
    const cartElement = document.getElementById('cart');
    cartElement.classList.toggle('show');
}

// Función para cerrar el carrito
function closeCart() {
    const cartElement = document.getElementById('cart');
    cartElement.classList.remove('show');
}

// Función para seleccionar talle
function selectSize(productId, talle, stock) {
    selectedSizes[productId] = { talle, stock };
}

// Función para agregar al carrito
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

// Función para actualizar el carrito
function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
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

    cartTotal.textContent = `Total: $${total}`;
    
    const cartCount = document.getElementById('cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'block' : 'none';
}

// Función para actualizar cantidad
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

// Función para remover del carrito
function removeFromCart(productId, talle) {
    cart = cart.filter(item => !(item.id === productId && item.talle === talle));
    updateCartDisplay();
}

// Función para crear mensaje de WhatsApp
function createWhatsAppMessage() {
    let message = 'Hola! Me gustaría comprar:%0A';
    cart.forEach(item => {
        message += `- ${item.quantity}x ${item.name} (Talle: ${item.talle}) - $${item.price * item.quantity}%0A`;
    });
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `%0ATotal: $${total}`;
    return encodeURIComponent(message);
}

// Event Listeners cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    // Cargar productos iniciales
    loadProducts();

    // Event listeners para filtros de categoría
    document.querySelectorAll('.category-filter').forEach(filter => {
        filter.addEventListener('click', (e) => {
            e.preventDefault();
            const category = filter.getAttribute('category');
            currentCategory = category;
            loadProducts(category);
        });
    });

    // Event listener para el botón del carrito
    const cartToggle = document.getElementById('cart-toggle');
    cartToggle.addEventListener('click', toggleCart);

    // Event listener para cerrar el carrito cuando se hace clic fuera
    document.addEventListener('click', (e) => {
        const cart = document.getElementById('cart');
        if (cart.classList.contains('show') && 
            !cart.contains(e.target) && 
            e.target !== cartToggle) {
            closeCart();
        }
    });

    // Event listener para el botón de checkout
    const checkoutBtn = document.getElementById('checkout-btn');
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
});
