// Inicializar Firestore
const db = firebase.firestore();

// Variables globales
let cart = [];
let selectedSizes = {};
let currentCategory = 'all';

// Función para cargar productos
async function loadProducts(category = 'all') {
    try {
        console.log('Cargando productos...');
        let query = db.collection('productos');
        
        if (category !== 'all') {
            query = query.where('categoria', '==', category);
        }
        
        const snapshot = await query.get();
        const productsContainer = document.getElementById('products-container');
        
        if (productsContainer) {
            productsContainer.innerHTML = '';
            
            if (snapshot.empty) {
                console.log('No se encontraron productos');
                productsContainer.innerHTML = '<p>No hay productos disponibles.</p>';
                return;
            }

            snapshot.forEach(doc => {
                const product = doc.data();
                const tallesArray = product.talles ? 
                    Object.entries(product.talles).map(([nombre, stock]) => ({
                        nombre,
                        stock
                    })) : [];
                
                const productCard = `
                    <div class="product-card">
                        <div class="image-container">
                            <img src="${product.imagen}" alt="${product.nombre}" loading="lazy">
                        </div>
                        <div class="product-info">
                            <h3>${product.nombre}</h3>
                            <p>$${product.precio}</p>
                            <div class="talles-container">
                                <p>Talles:</p>
                                <div class="talles-grid">
                                    ${tallesArray.map(talle => `
                                        <div class="talle-option">
                                            <label class="talle-label">
                                                <input type="radio" 
                                                    name="talle-${doc.id}" 
                                                    value="${talle.nombre}"
                                                    ${talle.stock <= 0 ? 'disabled' : ''}
                                                >
                                                <span class="talle-text">${talle.nombre}</span>
                                                <span class="stock-text">${talle.stock} disponibles</span>
                                            </label>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="button" data-tooltip="Precio: $${product.precio}" onclick="handleBuyClick('${doc.id}', '${product.nombre}', ${product.precio})">
                                <div class="button-wrapper">
                                    <div class="text">Comprar</div>
                                    <span class="icon">
                                        <svg viewBox="0 0 16 16" class="bi bi-cart2" fill="currentColor" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5zM3.14 5l1.25 5h8.22l1.25-5H3.14zM5 13a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm9-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0z"></path>
                                        </svg>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                productsContainer.innerHTML += productCard;
            });
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
        const productsContainer = document.getElementById('products-container');
        if (productsContainer) {
            productsContainer.innerHTML = '<p>Error al cargar los productos. Por favor, intenta de nuevo más tarde.</p>';
        }
    }
}

// Función para manejar el click del botón comprar
function handleBuyClick(productId, name, price) {
    const selectedSize = document.querySelector(`input[name="talle-${productId}"]:checked`);
    
    if (!selectedSize) {
        alert('Por favor selecciona un talle');
        return;
    }

    addToCart(productId, name, price);
}

// Función para manejar el carrito
function addToCart(productId, name, price) {
    const selectedSize = document.querySelector(`input[name="talle-${productId}"]:checked`);
    
    if (!selectedSize) {
        alert('Por favor selecciona un talle');
        return;
    }

    const size = selectedSize.value;
    const existingItem = cart.find(item => item.id === productId && item.size === size);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: name,
            price: price,
            size: size,
            quantity: 1
        });
    }

    updateCartDisplay();
}

// Función para actualizar la cantidad de un item
function updateQuantity(index, change) {
    if (cart[index]) {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        updateCartDisplay();
    }
}

// Función para remover un item del carrito
function removeItem(index) {
    if (cart[index]) {
        cart.splice(index, 1);
        updateCartDisplay();
    }
}

// Función para actualizar la visualización del carrito
function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.querySelector('.cart-total');
    let total = 0;

    cartItems.innerHTML = '';
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        cartItems.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-size">Talle: ${item.size}</span>
                    <div class="quantity-controls">
                        <button onclick="updateQuantity(${index}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity(${index}, 1)">+</button>
                    </div>
                </div>
                <div class="cart-item-price">
                    <span>$${itemTotal}</span>
                    <button class="remove-item" onclick="removeItem(${index})">&times;</button>
                </div>
            </div>
        `;
    });

    cartTotal.innerHTML = `
        <div class="total-amount">Total: $${total}</div>
        <div class="cart-buttons">
            <button class="close-cart-btn">Volver</button>
            <button class="checkout-btn" ${cart.length === 0 ? 'disabled' : ''}>Finalizar compra</button>
        </div>
    `;

    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    setupCartButtons();
}

// Función para configurar los botones del carrito
function setupCartButtons() {
    const closeCartBtn = document.querySelector('.close-cart-btn');
    const checkoutBtn = document.querySelector('.checkout-btn');
    const cartElement = document.getElementById('cart');

    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', () => {
            cartElement.classList.remove('show');
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Tu carrito está vacío');
                return;
            }

            try {
                let mensaje = "¡Hola! Quiero realizar la siguiente compra:%0A%0A";
                let total = 0;

                cart.forEach(item => {
                    const itemTotal = item.price * item.quantity;
                    total += itemTotal;
                    mensaje += `▪ ${item.quantity}x ${item.name} (Talle: ${item.size}) - $${itemTotal}%0A`;
                });

                mensaje += `%0ATotal: $${total}`;
                const numeroWhatsApp = "543765225116";
                const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensaje}`;

                window.open(urlWhatsApp, '_blank');

                cart = [];
                updateCartDisplay();
                cartElement.classList.remove('show');
            } catch (error) {
                console.error('Error al procesar la compra:', error);
                alert('Hubo un error al procesar tu compra. Por favor, intenta de nuevo.');
            }
        });
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    
    const cartIcon = document.querySelector('.cart-toggle');
    const cartElement = document.getElementById('cart');
    const closeCartHeader = document.querySelector('.cart-header');
    
    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            cartElement.classList.toggle('show');
        });
    }
    
    if (closeCartHeader) {
        closeCartHeader.addEventListener('click', () => {
            cartElement.classList.remove('show');
        });
    }

    setupCartButtons();

    const categoryButtons = document.querySelectorAll('.category-filter');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const category = button.dataset.category || 'all';
            loadProducts(category);
        });
    });
});
