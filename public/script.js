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
