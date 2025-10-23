from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from datetime import datetime
import re
import json

app = Flask(__name__)
CORS(app)

# Serve static files from frontend folder
@app.route('/')
def serve_frontend():
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    return send_from_directory('../frontend', path)

# Enhanced mock database
mock_database = {
    'orders': {
        'ORDER-123': {
            'id': 'ORDER-123',
            'status': 'shipped',
            'trackingNumber': 'TRK-789456',
            'carrier': 'FedEx',
            'estimatedDelivery': '2024-01-15',
            'shippedDate': '2024-01-10',
            'items': [
                {'name': 'Wireless Headphones', 'quantity': 1, 'price': 99.99, 'sku': 'WH-001'}
            ],
            'total': 99.99,
            'customer': {
                'name': 'John Doe',
                'email': 'john@example.com'
            }
        },
        'ORDER-456': {
            'id': 'ORDER-456',
            'status': 'delivered',
            'trackingNumber': 'TRK-123456',
            'carrier': 'UPS',
            'deliveredDate': '2024-01-10',
            'deliveredTime': '2:30 PM',
            'items': [
                {'name': 'Smart Watch', 'quantity': 1, 'price': 199.99, 'sku': 'SW-002'}
            ],
            'total': 199.99,
            'customer': {
                'name': 'Jane Smith',
                'email': 'jane@example.com'
            }
        },
        'ORDER-789': {
            'id': 'ORDER-789',
            'status': 'processing',
            'estimatedDelivery': '2024-01-18',
            'items': [
                {'name': 'Gaming Laptop', 'quantity': 1, 'price': 1299.99, 'sku': 'GL-003'}
            ],
            'total': 1299.99,
            'customer': {
                'name': 'Bob Johnson',
                'email': 'bob@example.com'
            }
        }
    },
    
    'products': {
        'WH-001': {
            'id': 'WH-001',
            'name': 'Wireless Headphones',
            'price': 99.99,
            'inStock': True,
            'stock': 25,
            'category': 'Audio',
            'description': 'Noise-cancelling wireless headphones with 30hr battery life',
            'features': ['Bluetooth 5.0', 'Noise Cancellation', '30hr Battery']
        },
        'SW-002': {
            'id': 'SW-002',
            'name': 'Smart Watch',
            'price': 199.99,
            'inStock': False,
            'stock': 0,
            'category': 'Wearables',
            'description': 'Advanced smartwatch with health monitoring and GPS',
            'features': ['Heart Rate Monitor', 'GPS', 'Water Resistant'],
            'restockDate': '2024-01-25'
        },
        'GL-003': {
            'id': 'GL-003',
            'name': 'Gaming Laptop',
            'price': 1299.99,
            'inStock': True,
            'stock': 8,
            'category': 'Computers',
            'description': 'High-performance gaming laptop with RTX graphics',
            'features': ['RTX 4060', '16GB RAM', '1TB SSD', '144Hz Display']
        },
        'SP-004': {
            'id': 'SP-004',
            'name': 'Smartphone Pro',
            'price': 899.99,
            'inStock': True,
            'stock': 15,
            'category': 'Phones',
            'description': 'Flagship smartphone with advanced camera system',
            'features': ['Triple Camera', '5G', '128GB Storage']
        }
    },
    
    'policies': {
        'shipping': {
            'standard': '3-5 business days',
            'express': '1-2 business days ($9.99)',
            'international': '7-14 business days ($24.99)',
            'freeThreshold': 50,
            'carriers': ['FedEx', 'UPS', 'USPS']
        },
        'returns': {
            'period': 30,
            'condition': 'Items must be unused and in original packaging with tags',
            'process': 'Initiate return online and print shipping label',
            'refundTime': '5-7 business days'
        },
        'contact': {
            'email': 'support@yourstore.com',
            'phone': '1-800-123-4567',
            'hours': 'Monday-Friday 9AM-9PM EST',
            'liveChat': 'Available during business hours'
        }
    }
}

# Helper functions
def extract_order_number(message):
    order_match = re.search(r'(ORDER-?)?(\d{3,})', message, re.IGNORECASE)
    return f"ORDER-{order_match.group(2)}" if order_match else None

def extract_product_name(message):
    products = ['headphone', 'watch', 'laptop', 'phone', 'smartphone']
    message_lower = message.lower()
    for product in products:
        if product in message_lower:
            return product
    return None

# Enhanced response generator
def generate_chat_response(user_message, parameters=None):
    if parameters is None:
        parameters = {}
        
    lower_message = user_message.lower()
    
    # Order tracking
    if any(word in lower_message for word in ['track', 'order', 'status']):
        order_number = parameters.get('orderNumber') or extract_order_number(user_message)
        
        if order_number and order_number.upper() in mock_database['orders']:
            order = mock_database['orders'][order_number.upper()]
            
            if order['status'] == 'delivered':
                return {
                    'text': f"✅ Order {order_number} was delivered on {order['deliveredDate']} at {order['deliveredTime']}.\n\n📦 {order['items'][0]['name']}\n🎯 Tracking: {order['trackingNumber']} ({order['carrier']})\n💰 Total: ${order['total']}\n\nHope you're enjoying your purchase!",
                    'quickReplies': ['Start Return', 'Contact Support', 'Track Another Order']
                }
                
            elif order['status'] == 'shipped':
                return {
                    'text': f"🚚 Order {order_number} is shipped and on the way!\n\n📦 {order['items'][0]['name']}\n📅 Shipped: {order['shippedDate']}\n🎯 Expected: {order['estimatedDelivery']}\n📦 Tracking: {order['trackingNumber']} ({order['carrier']})\n\nYou can track your package using the tracking number above.",
                    'quickReplies': ['Tracking Updates', 'Contact Support', 'Another Order']
                }
                
            elif order['status'] == 'processing':
                return {
                    'text': f"⏳ Order {order_number} is being processed.\n\n📦 {order['items'][0]['name']}\n📅 Expected to ship by: {order['estimatedDelivery']}\n\nWe're preparing your order for shipment. You'll receive tracking info once it ships.",
                    'quickReplies': ['Contact Support', 'Track Another Order', 'Shipping Info']
                }
                
            else:
                return {
                    'text': f"Order {order_number} status: {order['status']}",
                    'quickReplies': ['Contact Support', 'Track Another Order']
                }
        else:
            return {
                'text': "I can help you track your order! We have these demo orders:\n\n• 📦 ORDER-123 (Shipped - Headphones)\n• ✅ ORDER-456 (Delivered - Smart Watch)\n• ⏳ ORDER-789 (Processing - Laptop)\n\nWhich order would you like to check?",
                'quickReplies': ['ORDER-123', 'ORDER-456', 'ORDER-789', 'Contact Support']
            }
    
    # Product stock checking
    elif any(word in lower_message for word in ['stock', 'available', 'have', 'in stock']):
        product_name = extract_product_name(user_message)
        
        if product_name:
            # Find product by name
            product = None
            for prod in mock_database['products'].values():
                if product_name in prod['name'].lower():
                    product = prod
                    break
            
            if product:
                if product['inStock']:
                    features_text = '\n'.join([f'• {feature}' for feature in product['features']])
                    return {
                        'text': f"✅ {product['name']} is IN STOCK! 🎉\n\n💰 Price: ${product['price']}\n📦 Available: {product['stock']} units\n📝 {product['description']}\n\nKey Features:\n{features_text}",
                        'quickReplies': ['Add to Cart', 'Shipping Info', 'Other Products']
                    }
                else:
                    return {
                        'text': f"❌ {product['name']} is currently OUT OF STOCK\n\n💰 Price: ${product['price']}\n📦 Expected Restock: {product['restockDate']}\n📝 {product['description']}\n\nWould you like to be notified when it's available again?",
                        'quickReplies': ['Notify Me', 'Similar Products', 'Contact Support']
                    }
        
        return {
            'text': "I can check product availability! Here's what we have:\n\n• 🎧 Wireless Headphones - $99.99 (In Stock)\n• ⌚ Smart Watch - $199.99 (Restocking Soon)\n• 💻 Gaming Laptop - $1299.99 (In Stock)\n• 📱 Smartphone Pro - $899.99 (In Stock)\n\nWhich product are you interested in?",
            'quickReplies': ['Headphones', 'Smart Watch', 'Laptop', 'Smartphone']
        }
    
    # Shipping information
    elif any(word in lower_message for word in ['shipping', 'delivery', 'ship']):
        policy = mock_database['policies']['shipping']
        carriers = ', '.join(policy['carriers'])
        return {
            'text': f"📦 SHIPPING INFORMATION\n\n• 🆓 FREE Standard Shipping on orders over ${policy['freeThreshold']}\n• 🚚 Standard Delivery: {policy['standard']}\n• ⚡ Express Delivery: {policy['express']}\n• 🌍 International: {policy['international']}\n• 📦 Carriers: {carriers}\n\nAll packages include tracking and insurance.",
            'quickReplies': ['Track Order', 'Return Policy', 'Contact Support']
        }
    
    # Returns policy
    elif any(word in lower_message for word in ['return', 'refund', 'exchange']):
        policy = mock_database['policies']['returns']
        return {
            'text': f"🔄 RETURNS & EXCHANGES\n\n• 📅 {policy['period']}-Day Return Policy\n• ✅ {policy['condition']}\n• 📦 {policy['process']}\n• 💰 Refunds processed in {policy['refundTime']}\n\nExchanges are available for different sizes or colors.",
            'quickReplies': ['Start Return', 'Contact Returns', 'Shipping Info']
        }
    
    # Contact information
    elif any(word in lower_message for word in ['contact', 'support', 'help', 'call']):
        contact = mock_database['policies']['contact']
        return {
            'text': f"📞 CONTACT & SUPPORT\n\n• 📧 Email: {contact['email']}\n• 📞 Phone: {contact['phone']}\n• 🕒 Hours: {contact['hours']}\n• 💬 Live Chat: {contact['liveChat']}\n\nWe're here to help! What can we assist you with?",
            'quickReplies': ['Track Order', 'Product Question', 'Returns Help', 'Shipping Question']
        }
    
    # Greetings
    elif any(word in lower_message for word in ['hello', 'hi', 'hey']):
        return {
            'text': "👋 Hello! Welcome to TechStore! I'm your shopping assistant. I can help you with:\n\n• 📦 Order Tracking & Status\n• 🏪 Product Availability & Info\n• 📦 Shipping & Delivery\n• 🔄 Returns & Exchanges\n• 📞 Customer Support\n\nHow can I help you today?",
            'quickReplies': ['Track Order', 'Check Stock', 'Shipping Info', 'Contact Support']
        }

    # basic response
    elif any(word in lower_message for word in ['how are you', 'how r u', 'good']):
        return {
            'text': "Hello! I'm doing great, thank you for asking!. How are you doing today? 😊. I can help you with:\n\n• 📦 Order Tracking & Status\n• 🏪 Product Availability & Info\n• 📦 Shipping & Delivery\n• 🔄 Returns & Exchanges\n• 📞 Customer Support\n\nHow can I help you today?",
            'quickReplies': ['Track Order', 'Check Stock', 'Shipping Info', 'Contact Support']
        }
    
    # Default response
    else:
        return {
            'text': "I'm here to help with your shopping needs! I can assist with:\n\n• Order tracking and status updates\n• Product availability and information\n• Shipping and delivery details\n• Returns and exchanges\n• General customer support\n\nWhat would you like to know?",
            'quickReplies': ['Track Order', 'Check Stock', 'Shipping Info', 'Contact Support']
        }

# Enhanced webhook endpoint
@app.route('/webhook', methods=['POST'])
def webhook():
    try:
        data = request.get_json()
        print('📍 Webhook received:', json.dumps(data, indent=2))
        
        user_message = data.get('queryResult', {}).get('queryText', '')
        parameters = data.get('queryResult', {}).get('parameters', {})
        
        response = generate_chat_response(user_message, parameters)
        
        webhook_response = {
            'fulfillmentText': response['text'],
            'fulfillmentMessages': [
                {
                    'text': {
                        'text': [response['text']]
                    }
                }
            ],
            'payload': {
                'quickReplies': response['quickReplies']
            }
        }
        
        print('🤖 Sending response:', response['text'])
        return jsonify(webhook_response)
        
    except Exception as error:
        print('❌ Webhook error:', error)
        return jsonify({
            'fulfillmentText': "I apologize, but I'm having trouble processing your request. Please try again or contact our support team.",
            'fulfillmentMessages': [
                {
                    'text': {
                        'text': ["I apologize, but I'm having trouble processing your request. Please try again or contact our support team."]
                    }
                }
            ]
        })

# Additional API endpoints
@app.route('/api/orders/<order_id>')
def get_order(order_id):
    order = mock_database['orders'].get(order_id.upper())
    if order:
        return jsonify({'success': True, 'order': order})
    else:
        return jsonify({'success': False, 'message': 'Order not found'})

@app.route('/api/products/<product_id>')
def get_product(product_id):
    product = mock_database['products'].get(product_id.upper())
    if product:
        return jsonify({'success': True, 'product': product})
    else:
        return jsonify({'success': False, 'message': 'Product not found'})

# Health check endpoint
@app.route('/health')
def health_check():
    return jsonify({
        'status': 'OK',
        'timestamp': datetime.now().isoformat(),
        'service': 'Ecommerce Chatbot API (Python/Flask)'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    
    print('\n🤖 =================================')
    print('🚀 Ecommerce Chatbot Server Started (Python)')
    print(f'📍 Port: {port}')
    print(f'🌐 URL: http://localhost:{port}')
    print(f'💬 Chat: http://localhost:{port}')
    print(f'❤️  Health: http://localhost:{port}/health')
    print(f'📦 API: http://localhost:{port}/api/orders/ORDER-123')
    print('🤖 =================================\n')
    
    print('Demo Orders Available:')
    print('• ORDER-123 - Shipped (Headphones)')
    print('• ORDER-456 - Delivered (Smart Watch)')
    print('• ORDER-789 - Processing (Laptop)')
    
    app.run(host='0.0.0.0', port=port, debug=True)