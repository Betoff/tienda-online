// Variables globales
let cart = [];
let selectedSizes = {};
let currentCategory = 'all';

// Función para cargar productos
async function loadProducts(category = 'all') {
    try {
        console.log('Cargando productos...'); // Debug log
        let query = db.collection('productos');
        
        if (category !== 'all') {
            query = query.where('categoria', '==', category);
        }
        
        const snapshot = await query.get();
        const productsContainer = document.getElementById('products-container');
        
        if (productsContainer) {
            productsContainer.innerHTML = '';
            
            if (snapshot.empty) {
                console.log('No se encontraron productos'); // Debug log
                productsContainer.innerHTML = '<p>No hay productos disponibles.</p>';
                return;
            }

            snapshot.forEach(doc => {
                const product = doc.data();
                console.log('Producto encontrado:', product); // Debug log
                
                // Convertir el objeto de talles en un array
                const tallesArray = product.talles ? 
                    Object.entries(product.talles).map(([nombre, stock]) => ({
                        nombre,
                        stock
                    })) : [];
                
                const productCard = `
                    <div class="product-card">
                        <div class="image-container">
                            <img src="${product.imagen || ''}" alt="${product.nombre}">
                        </div>
                        <div class="product-info">
                            <h3>${product.nombre}</h3>
                            <p class="price">$${product.precio}</p>
                            <div class="talles-container">
                                <div class="talles-grid">
                                    ${tallesArray.map(talle => `
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
        const productsContainer = document.getElementById('products-container');
        if (productsContainer) {
            productsContainer.innerHTML = '<p>Error al cargar los productos. Por favor, intenta más tarde.</p>';
        }
    }
}

// Función para seleccionar talle
function selectSize(productId, talle, stock) {
    selectedSizes[productId] = { talle, stock };
}

// Resto del código permanece igual...

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

// Función para actualizar display del carrito
function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    let total = 0;

    if (cartItems && cartTotal) {
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
        if (cartCount) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'block' : 'none';
        }
    }
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

// Función para el mensaje de WhatsApp
function createWhatsAppMessage() {
    let message = 'Hola! Me gustaría comprar:\n';
    cart.forEach(item => {
        message += `- ${item.quantity}x ${item.name} (Talle: ${item.talle}) - $${item.price * item.quantity}\n`;
    });
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `\nTotal: $${total}`;
    return encodeURIComponent(message);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Cargado'); // Debug log
    
    // Cargar productos iniciales
    loadProducts();

    // Event listeners para filtros de categoría
    document.querySelectorAll('.category-filter').forEach(filter => {
        filter.addEventListener('click', (e) => {
            e.preventDefault();
            const category = filter.getAttribute('data-category');
            currentCategory = category;
            loadProducts(category);
        });
    });

    // Toggle del carrito
    const cartToggle = document.getElementById('cart-toggle');
    const cart = document.getElementById('cart');
    const closeCart = document.getElementById('close-cart');
    
    if (cartToggle) {
        cartToggle.addEventListener('click', () => {
            cart.classList.toggle('show');
        });
    }

    if (closeCart) {
        closeCart.addEventListener('click', () => {
            cart.classList.remove('show');
        });
    }

    // Botón de checkout
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Tu carrito está vacío');
                return;
            }
            
            const message = createWhatsAppMessage();
            window.open(`https://wa.me/543765225116?text=${message}`, '_blank');
            
            cart = [];
            updateCartDisplay();
            cart.classList.remove('show');
        });
    }
});
