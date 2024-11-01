<script>
// Manejo de errores global
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error: ' + msg + '\nURL: ' + url + '\nLine: ' + lineNo);
    return false;
};
        // Configuración de Firebase
       // Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC-bzUQKIzTkurLkudfLtvh8OjOSD8YZ0w",
    authDomain: "base-de-datos-pagina-f9038.firebaseapp.com",
    projectId: "base-de-datos-pagina-f9038",
    storageBucket: "base-de-datos-pagina-f9038.appspot.com",
    messagingSenderId: "455220883391",
    appId: "1:455220883391:web:b2ade4281c12e20fb5bb0a",
};

// Inicialización de Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let products = [];
const cart = [];
let displayedProducts = 0;
const productsPerLoad = 8;

// Función para manejar errores de imagen
function handleImageError(img) {
    img.src = 'https://via.placeholder.com/300x300?text=Imagen+no+disponible';
}

function toggleCart() {
    document.getElementById('cart').classList.toggle('active');
}

function addToCart(productId, selectedSize) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const cartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        size: selectedSize,
        quantity: 1
    };

    cart.push(cartItem);
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <span>${item.name} - Talle: ${item.size}</span>
            <span>$${item.price.toLocaleString()}</span>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    cartTotal.textContent = total.toLocaleString();
}

function displayProducts(start, end, container, productList) {
    const productContainer = document.getElementById(container);
    if (!productContainer) {
        console.error(`Container '${container}' not found`);
        return;
    }

    for (let i = start; i < end && i < productList.length; i++) {
        const product = productList[i];
        const productElement = document.createElement('div');
        productElement.className = 'product';
        
        productElement.innerHTML = `
            <img src="${product.image}" alt="${product.name}" 
                 loading="lazy" onerror="handleImageError(this)">
            <h3>${product.name}</h3>
            <p>$${product.price.toLocaleString()}</p>
            <div class="size-selector">
                <label for="size-${product.id}">Talle: ${product.size}</label>
                <p>Stock disponible: ${product.stock}</p>
            </div>
            <button onclick="addToCart('${product.id}')" 
                    class="add-to-cart-btn" ${product.stock <= 0 ? 'disabled' : ''}>
                <i class="fas fa-shopping-cart"></i> 
                ${product.stock <= 0 ? 'Sin stock' : 'Agregar al carrito'}
            </button>
        `;

        productContainer.appendChild(productElement);
    }
    
    if (container === 'products-container') {
        displayedProducts = end;
        const loadMoreButton = document.getElementById('load-more');
        if (loadMoreButton) {
            loadMoreButton.style.display = 
                displayedProducts >= productList.length ? 'none' : 'block';
        }
    }
}

async function loadInitialData() {
    try {
        console.log('Cargando productos desde Firebase...');
        const snapshot = await db.collection('productos').get();
        
        if (snapshot.empty) {
            console.log('No hay productos en la base de datos');
            return;
        }

        products = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.nombre,
                price: parseFloat(data.precio),
                category: data.categoria,
                image: data.imagen,
                size: data.talle,
                stock: data.stock || 10
            };
        });

        console.log('Productos cargados:', products);

        // Limpiar contenedores
        const bestSellersContainer = document.getElementById('best-sellers');
        const productsContainer = document.getElementById('products-container');
        
        if (bestSellersContainer) bestSellersContainer.innerHTML = '';
        if (productsContainer) productsContainer.innerHTML = '';
        
        // Mostrar productos
        displayProducts(0, productsPerLoad, 'products-container', products);
        
        // Mostrar algunos productos como "más vendidos" (temporalmente los primeros 4)
        const bestSellers = products.slice(0, 4);
        displayProducts(0, bestSellers.length, 'best-sellers', bestSellers);
        
    } catch (error) {
        console.error('Error al cargar los productos:', error);
        alert('Ocurrió un error al cargar los productos. Por favor, inténtalo de nuevo más tarde.');
    }
}

function displayBestSellers() {
    if (products.length === 0) return;
    
    const bestSellers = [...products]
        .sort((a, b) => (b.sales || 0) - (a.sales || 0))
        .slice(0, 4);
    displayProducts(0, bestSellers.length, 'best-sellers', bestSellers);
}

function filterByCategory(category) {
    const productContainer = document.getElementById('products-container');
    if (!productContainer) return;
    
    productContainer.innerHTML = '';
    displayedProducts = 0;
    
    let filteredProducts = category === 'all' ? 
        products : 
        products.filter(p => (p.category || p.categoria).toLowerCase() === category.toLowerCase());
    
    displayProducts(0, productsPerLoad, 'products-container', filteredProducts);
}

function searchProducts() {
    const searchTerm = document.getElementById('search-bar').value.toLowerCase();
    const productContainer = document.getElementById('products-container');
    if (!productContainer) return;
    
    productContainer.innerHTML = '';
    displayedProducts = 0;
    
    const filteredProducts = products.filter(product => 
        (product.name || product.nombre).toLowerCase().includes(searchTerm) ||
        (product.category || product.categoria).toLowerCase().includes(searchTerm)
    );
    
    displayProducts(0, productsPerLoad, 'products-container', filteredProducts);
}

function loadMore() {
    displayProducts(
        displayedProducts, 
        displayedProducts + productsPerLoad, 
        'products-container', 
        products
    );
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadInitialData();
    
    // Manejar errores de imágenes
    document.querySelectorAll('img').forEach(img => {
        img.onerror = () => handleImageError(img);
    });
    
    // Cerrar el carrito al hacer clic fuera
    document.addEventListener('click', (e) => {
        const cart = document.getElementById('cart');
        const cartToggle = document.getElementById('cart-toggle');
        
        if (!cart.contains(e.target) && e.target !== cartToggle && cart.classList.contains('active')) {
            cart.classList.remove('active');
        }
    });
});
