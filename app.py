# Save this as 'app.py' in your backend server repository

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
# Configure CORS to allow requests from GitHub Pages
CORS(app, origins=["https://betoff.github.io"])

# File to store products
PRODUCTS_FILE = 'products.json'

def load_products():
    if os.path.exists(PRODUCTS_FILE):
        with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_products(products):
    with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False)

@app.route('/')
def home():
    return "Backend server is running!"

@app.route('/get_products', methods=['GET'])
def get_products():
    products = load_products()
    return jsonify(products)

@app.route('/add_product', methods=['POST'])
def add_product():
    try:
        products = load_products()
        new_product = request.json
        
        # Add timestamp
        new_product['created_at'] = datetime.now().isoformat()
        
        # Assign unique ID
        max_id = max([p.get('id', 0) for p in products]) if products else 0
        new_product['id'] = max_id + 1
        
        products.append(new_product)
        save_products(products)
        
        return jsonify({'message': 'Producto agregado exitosamente', 'product': new_product}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/delete_product/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    products = load_products()
    products = [p for p in products if p.get('id') != product_id]
    save_products(products)
    return jsonify({'message': 'Producto eliminado exitosamente'})

@app.route('/update_product/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        products = load_products()
        updated_product = request.json
        
        for i, product in enumerate(products):
            if product.get('id') == product_id:
                # Keep original ID and creation date
                updated_product['id'] = product_id
                updated_product['created_at'] = product.get('created_at')
                updated_product['updated_at'] = datetime.now().isoformat()
                products[i] = updated_product
                save_products(products)
                return jsonify({'message': 'Producto actualizado exitosamente'})
        
        return jsonify({'error': 'Producto no encontrado'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
