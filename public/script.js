// Configuración de Firebase
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

// Función para mostrar productos
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
            productsContainer.innerHTML = '<p>No se encontraron productos.</p>';
            return;
        }

        if (!isLoadMore) {
            productsContainer.innerHTML = '';
        }

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

        // Actualizar el último producto visible
        lastVisibleProduct = snapshot.docs[snapshot.docs.length - 1];
        
        // Ocultar el botón "Ver más" si no hay más productos
        const loadMoreBtn = document.getElementById('load-more');
        loadMoreBtn.style.display = snapshot.docs.length < 8 ? 'none' : 'block';
    } catch (error) {
        console.error("Error al cargar productos:", error);
        productsContainer.innerHTML = '<p>Error al cargar productos.</p>';
    }
}

// Función para mostrar los más vendidos
async function displayBestSellers() {
    const bestSellersContainer = document.getElementById('best-sellers');
    try {
        const snapshot = await db.collection('productos')
            .where('masVendido', '==', true)
            .limit(4)
            .get();

        bestSellersContainer.innerHTML = '';
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
            bestSellersContainer.innerHTML += productCard;
        });
    } catch (error) {
        console.error("Error al cargar los más vendidos:", error);
        bestSellersContainer.innerHTML = '<p>Error al cargar los más vendidos.</p>';
    }
}

// Funciones del carrito
function addToCart(productId, name, price) {
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: productId,
            name: name,
            price: price,
            quantity: 1
        });
    }
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    let total = 0;

    cartItems.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="cart-item">
                <span>${item.name} x ${item.quantity}</span>
                <span>$${itemTotal}</span>
                <button onclick="removeFromCart('${item.id}')">×</button>
            </div>
        `;
    }).join('');

    cartTotal.textContent = total;
}

function removeFromCart(productId) {
    const index = cart.findIndex(item => item.id === productId);
    if (index > -1) {
        if (cart[index].quantity > 1) {
            cart[index].quantity--;
        } else {
            cart.splice(index, 1);
        }
        updateCartDisplay();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    displayProducts();
    displayBestSellers();

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
        alert('¡Gracias por tu compra!');
        cart = [];
        updateCartDisplay();
    });
});
