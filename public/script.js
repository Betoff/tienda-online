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

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variables globales
let lastVisibleProduct = null;
let currentCategory = 'all';
let cart = [];
let selectedSizes = {};

// Función para generar keywords para la búsqueda
function generateKeywords(text) {
    const words = text.toLowerCase().split(' ');
    const keywords = new Set();
    words.forEach(word => {
        for (let i = 1; i <= word.length; i++) {
            keywords.add(word.substring(0, i));
        }
    });
    return Array.from(keywords);
}

// Función mejorada para mostrar productos
async function displayProducts(category = 'all', isLoadMore = false) {
    const productsContainer = document.getElementById('products-container');
    let query = db.collection('productos').orderBy('nombre');
    
    if (category !== 'all') {
        query = query.where('categoria', '==', category);
    }

    if (isLoadMore && lastVisibleProduct) {
        query = query.startAfter(lastVisibleProduct);
    }

    query = query.limit(8);

    try {
        const snapshot = await query.get();
        if (snapshot.empty && !isLoadMore) {
            productsContainer.innerHTML = '<p class="no-products">No se encontraron productos.</p>';
            return;
        }

        if (!isLoadMore) {
            productsContainer.innerHTML = '';
        }

        snapshot.forEach(doc => {
            const product = doc.data();
            const productId = doc.id;
            
            const tallesDisponibles = Object.entries(product.talles || {})
                .filter(([_, stock]) => stock > 0)
                .map(([talle, stock]) => `
                    <div class="talle-option">
                        <label class="talle-label">
                            <input type="radio" 
                                   name="talle-${productId}" 
                                   value="${talle}"
                                   onchange="updateSelectedSize('${productId}', '${talle}', ${stock})"
                            >
                            <span class="talle-text">${talle.toUpperCase()}</span>
                            <span class="stock-text">(${stock} disponibles)</span>
                        </label>
                    </div>
                `).join('');

            const productCard = `
                <div class="product-card" id="product-${productId}">
                    <div class="image-container">
                        <img src="${product.imagen || 'placeholder.jpg'}" 
                             alt="${product.nombre}"
                             class="product-image">
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.nombre}</h3>
                        <p class="price">$${product.precio}</p>
                        <div class="talles-container">
                            <h4>Talles disponibles:</h4>
                            <div class="talles-grid">
                                ${tallesDisponibles || '<p class="no-stock">Sin stock disponible</p>'}
                            </div>
                        </div>
                        <button class="add-to-cart-btn"
                                onclick="addToCart('${productId}', '${product.nombre}', ${product.precio})"
                                ${!tallesDisponibles ? 'disabled' : ''}
                                id="add-btn-${productId}">
                            ${tallesDisponibles ? 'Agregar al carrito' : 'Sin stock'}
                        </button>
                    </div>
                </div>
            `;
            productsContainer.innerHTML += productCard;
        });

        lastVisibleProduct = snapshot.docs[snapshot.docs.length - 1];
        const loadMoreBtn = document.getElementById('load-more');
        loadMoreBtn.style.display = snapshot.docs.length < 8 ? 'none' : 'block';
    } catch (error) {
        console.error("Error al cargar productos:", error);
        productsContainer.innerHTML = '<p class="error">Error al cargar productos.</p>';
    }
}

// Función mejorada para búsqueda de productos
async function searchProducts(searchTerm) {
    if (!searchTerm) {
        displayProducts(currentCategory);
        return;
    }

    const productsContainer = document.getElementById('products-container');
    searchTerm = searchTerm.toLowerCase();

    try {
        const snapshot = await db.collection('productos')
            .where('keywords', 'array-contains', searchTerm)
            .get();

        productsContainer.innerHTML = '';
        
        if (snapshot.empty) {
            productsContainer.innerHTML = '<p class="no-results">No se encontraron productos.</p>';
            return;
        }

        snapshot.forEach(doc => {
            // Reutilizar la lógica de displayProducts para mantener consistencia
            const product = doc.data();
            // ... (mismo código de generación de productCard que en displayProducts)
        });
    } catch (error) {
        console.error("Error en la búsqueda:", error);
        productsContainer.innerHTML = '<p class="error">Error al buscar productos.</p>';
    }
}

// Función para manejar la selección de talle
function updateSelectedSize(productId, talle, stock) {
    selectedSizes[productId] = { talle, stock };
    const addButton = document.getElementById(`add-btn-${productId}`);
    if (addButton) {
        addButton.disabled = false;
        addButton.textContent = 'Agregar al carrito';
    }
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
}

// Función mejorada para actualizar el carrito
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
                    <span class="item-quantity">Cantidad: ${item.quantity}</span>
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

// Función mejorada para eliminar del carrito
function removeFromCart(productId, talle) {
    const index = cart.findIndex(item => 
        item.id === productId && item.talle === talle
    );
    
    if (index !== -1) {
        cart.splice(index, 1);
        updateCartDisplay();
    }
}

// Función mejorada para crear mensaje de WhatsApp
function createWhatsAppMessage() {
    let message = "¡Hola! Me gustaría hacer el siguiente pedido:\n\n";
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        message += `• ${item.name} (Talle: ${item.talle}) x ${item.quantity} = $${itemTotal}\n`;
    });

    message += `\nTotal: $${total}`;
    return encodeURIComponent(message);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    displayProducts();
    displayBestSellers();

    // Mejorar el evento de búsqueda
    const searchInput = document.getElementById('search-bar');
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const searchTerm = e.target.value.trim();
        
        // Debounce para evitar muchas búsquedas seguidas
        searchTimeout = setTimeout(() => {
            searchProducts(searchTerm);
        }, 300);
    });


    // Filtrado por categorías
    document.querySelectorAll('.category-filter').forEach(filter => {
        filter.addEventListener('click', (e) => {
            e.preventDefault();
            const category = e.target.dataset.category;
            currentCategory = category;
            lastVisibleProduct = null;
            displayProducts(category);
        });
    });

    // Botón "Ver más"
    document.getElementById('load-more').addEventListener('click', () => {
        displayProducts(currentCategory, true);
    });

    // Toggle del carrito
    document.getElementById('cart-toggle').addEventListener('click', () => {
        document.getElementById('cart').classList.toggle('show');
    });

    // Búsqueda de productos
    document.getElementById('search-bar').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm.length < 3) {
            displayProducts(currentCategory);
            return;
        }

        const productsContainer = document.getElementById('products-container');
        db.collection('productos')
            .where('nombre', '>=', searchTerm)
            .where('nombre', '<=', searchTerm + '\uf8ff')
            .get()
            .then(snapshot => {
                productsContainer.innerHTML = '';
                snapshot.forEach(doc => {
                    const product = doc.data();
                    const productCard = `
                        <div class="product-card">
                            <div class="image-container">
                                <img src="${product.imagen || 'placeholder.jpg'}" alt="${product.nombre}">
                            </div>
                            <div class="product-info">
                                <h3>${product.nombre}</h3>
                                <p class="price">$${product.precio}</p>
                                <button onclick="addToCart('${doc.id}', '${product.nombre}', ${product.precio})">
                                    Agregar al carrito
                                </button>
                            </div>
                        </div>
                    `;
                    productsContainer.innerHTML += productCard;
                });
            })
            .catch(error => {
                console.error("Error en la búsqueda:", error);
            });
    });

    // Finalizar compra
    document.getElementById('checkout-btn').addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Tu carrito está vacío');
            return;
        }
        
        const message = createWhatsAppMessage();
        window.open(`https://wa.me/543765225116?text=${message}`, '_blank');
        
        // Limpiar el carrito después de enviar el mensaje
        cart = [];
        updateCartDisplay();
        closeCart(); // Cerrar el carrito después de la compra
    });

    // Agregar evento para cerrar el carrito
    const cart = document.getElementById('cart');
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.className = 'cart-close-btn';
    closeButton.onclick = closeCart;
    cart.insertBefore(closeButton, cart.firstChild);
});
