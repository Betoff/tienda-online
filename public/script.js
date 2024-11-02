// Configuración de Firebase se mantiene igual
const firebaseConfig = {
    apiKey: "AIzaSyC-bzUQKIzTkurLkudfLtvh8OjOSD8YZ0w",
    authDomain: "base-de-datos-pagina-f9038.firebaseapp.com",
    projectId: "base-de-datos-pagina-f9038",
    storageBucket: "base-de-datos-pagina-f9038.appspot.com",
    messagingSenderId: "455220883391",
    appId: "1:455220883391:web:b2ade4281c12e20fb5bb0a",
    measurementId: "G-4RQ3H9J2L1"
};
function loadProducts(category = 'all') {
    const productsContainer = document.getElementById('products-container');
    const bestSellersContainer = document.getElementById('best-sellers');
    if (!productsContainer || !bestSellersContainer) return;

    // Limpiar contenedores
    productsContainer.innerHTML = '<div class="loading">Cargando productos...</div>';
    bestSellersContainer.innerHTML = '';

    // Crear referencia a la colección de productos
    let query = db.collection('products');
    
    // Filtrar por categoría si no es 'all'
    if (category !== 'all') {
        query = query.where('category', '==', category);
    }

    // Obtener productos
    query.get().then((querySnapshot) => {
        // Limpiar el mensaje de carga
        productsContainer.innerHTML = '';
        
        if (querySnapshot.empty) {
            productsContainer.innerHTML = '<p>No se encontraron productos en esta categoría</p>';
            return;
        }

        // Convertir los documentos en array para poder ordenarlos
        const products = [];
        querySnapshot.forEach((doc) => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Mostrar productos
        products.forEach(product => {
            const productCard = createProductCard(product);
            productsContainer.appendChild(productCard);
            
            // Si el producto está marcado como "mejor vendido", agregarlo a esa sección
            if (product.bestSeller) {
                const bestSellerCard = createProductCard(product);
                bestSellersContainer.appendChild(bestSellerCard);
            }
        });
    }).catch((error) => {
        console.error("Error loading products: ", error);
        productsContainer.innerHTML = '<p>Error al cargar los productos. Por favor, intenta más tarde.</p>';
    });
}

// Función para crear tarjeta de producto
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Crear el HTML de la tarjeta
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

// Agregar event listeners para los filtros de categoría
document.addEventListener('DOMContentLoaded', () => {
    // Cargar productos inicialmente
    loadProducts();

    // Agregar listeners para los filtros de categoría
    const categoryFilters = document.querySelectorAll('.category-filter');
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remover clase activa de todos los filtros
            categoryFilters.forEach(f => f.classList.remove('active'));
            // Agregar clase activa al filtro seleccionado
            filter.classList.add('active');
            
            // Obtener categoría del atributo
            const category = filter.getAttribute('category');
            currentCategory = category;
            
            // Cargar productos de la categoría
            loadProducts(category);
        });
    });
});
// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variables globales
let lastVisibleProduct = null;
let currentCategory = 'all';
let cart = [];
let selectedSizes = {};

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

// Función mejorada para agregar al carrito
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
    // Mostrar el carrito automáticamente cuando se agrega un producto
    document.getElementById('cart').classList.add('show');
}

// Función mejorada para actualizar el carrito
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
    
    // Actualizar contador del carrito
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'block' : 'none';
    }
}

// Nueva función para actualizar la cantidad
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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Asegurarse de que los elementos existen
    const cartToggle = document.getElementById('cart-toggle');
    const cart = document.getElementById('cart');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (!cartToggle || !cart || !checkoutBtn) {
        console.error('Elementos necesarios del carrito no encontrados');
        return;
    }

    // Evento para toggle del carrito
    cartToggle.addEventListener('click', (e) => {
        e.preventDefault();
        toggleCart();
    });

    // Agregar botón de cerrar al carrito
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.className = 'cart-close-btn';
    closeButton.onclick = closeCart;
    cart.insertBefore(closeButton, cart.firstChild);

    // Evento de checkout
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Tu carrito está vacío');
            return;
        }
        
        const message = createWhatsAppMessage();
        window.open(`https://wa.me/543765225116?text=${message}`, '_blank');
        
        // Limpiar el carrito después de enviar el mensaje
        cart = [];
        updateCartDisplay();
        closeCart();
    });

    // Cerrar el carrito cuando se hace clic fuera de él
    document.addEventListener('click', (e) => {
        if (cart.classList.contains('show') && 
            !cart.contains(e.target) && 
            e.target !== cartToggle) {
            closeCart();
        }
    });
});
