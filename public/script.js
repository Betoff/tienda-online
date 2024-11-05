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

// Inicializar Firestore
const db = firebase.firestore();

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
              <img src="${product.imagen}" alt="${product.nombre}">
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
              <button onclick="addToCart('${doc.id}', '${product.nombre}', ${product.precio})" 
                      class="add-to-cart-btn">
                Agregar al carrito
              </button>
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

// Función para actualizar la visualización del carrito
function updateCartDisplay() {
  const cartItems = document.getElementById('cart-items');
  const cartCount = document.getElementById('cart-count');
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

  document.getElementById('cart-total').textContent = `Total: $${total}`;
  cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Función para actualizar la cantidad de un item
function updateQuantity(index, change) {
  cart[index].quantity += change;
  
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  
  updateCartDisplay();
}

// Función para remover un item
function removeItem(index) {
  cart.splice(index, 1);
  updateCartDisplay();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  
  // Toggle categorías
  const categoryBtn = document.getElementById('category-btn');
  const categoryList = document.getElementById('category-list');
  
  categoryBtn.addEventListener('click', () => {
    categoryList.classList.toggle('show');
  });

  // Filtros de categoría
  document.querySelectorAll('.category-filter').forEach(filter => {
    filter.addEventListener('click', (e) => {
      e.preventDefault();
      const category = e.target.dataset.category;
      currentCategory = category;
      loadProducts(category);
      categoryList.classList.remove('show');
    });
  });

  // Toggle carrito
  const cartToggle = document.getElementById('cart-toggle');
  const cart = document.getElementById('cart');
  const closeCart = document.getElementById('close-cart');
  
  cartToggle.addEventListener('click', () => {
    cart.classList.toggle('show');
  });
  
  closeCart.addEventListener('click', () => {
    cart.classList.remove('show');
  });

  // Checkout
  document.getElementById('checkout-btn').addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }
    // Aquí puedes agregar la lógica para procesar la compra
    alert('¡Gracias por tu compra!');
    cart = [];
    updateCartDisplay();
    document.getElementById('cart').classList.remove('show');
  });
});
