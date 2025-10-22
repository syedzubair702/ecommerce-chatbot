const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Enhanced mock database
const mockDatabase = {
    orders: {
        'ORDER-123': {
            id: 'ORDER-123',
            status: 'shipped',
            trackingNumber: 'TRK-789456',
            carrier: 'FedEx',
            estimatedDelivery: '2024-01-15',
            shippedDate: '2024-01-10',
            items: [
                { name: 'Wireless Headphones', quantity: 1, price: 99.99, sku: 'WH-001' }
            ],
            total: 99.99,
            customer: {
                name: 'John Doe',
                email: 'john@example.com'
            }
        },
        'ORDER-456': {
            id: 'ORDER-456',
            status: 'delivered',
            trackingNumber: 'TRK-123456',
            carrier: 'UPS',
            deliveredDate: '2024-01-10',
            deliveredTime: '2:30 PM',
            items: [
                { name: 'Smart Watch', quantity: 1, price: 199.99, sku: 'SW-002' }
            ],
            total: 199.99,
            customer: {
                name: 'Jane Smith',
                email: 'jane@example.com'
            }
        },
        'ORDER-789': {
            id: 'ORDER-789',
            status: 'processing',
            estimatedDelivery: '2024-01-18',
            items: [
                { name: 'Gaming Laptop', quantity: 1, price: 1299.99, sku: 'GL-003' }
            ],
            total: 1299.99,
            customer: {
                name: 'Bob Johnson',
                email: 'bob@example.com'
            }
        }
    },
    
    products: {
        'WH-001': {
            id: 'WH-001',
            name: 'Wireless Headphones',
            price: 99.99,
            inStock: true,
            stock: 25,
            category: 'Audio',
            description: 'Noise-cancelling wireless headphones with 30hr battery life',
            features: ['Bluetooth 5.0', 'Noise Cancellation', '30hr Battery']
        },
        'SW-002': {
            id: 'SW-002',
            name: 'Smart Watch',
            price: 199.99,
            inStock: false,
            stock: 0,
            category: 'Wearables',
            description: 'Advanced smartwatch with health monitoring and GPS',
            features: ['Heart Rate Monitor', 'GPS', 'Water Resistant'],
            restockDate: '2024-01-25'
        },
        'GL-003': {
            id: 'GL-003',
            name: 'Gaming Laptop',
            price: 1299.99,
            inStock: true,
            stock: 8,
            category: 'Computers',
            description: 'High-performance gaming laptop with RTX graphics',
            features: ['RTX 4060', '16GB RAM', '1TB SSD', '144Hz Display']
        },
        'SP-004': {
            id: 'SP-004',
            name: 'Smartphone Pro',
            price: 899.99,
            inStock: true,
            stock: 15,
            category: 'Phones',
            description: 'Flagship smartphone with advanced camera system',
            features: ['Triple Camera', '5G', '128GB Storage']
        }
    },
    
    policies: {
        shipping: {
            standard: '3-5 business days',
            express: '1-2 business days ($9.99)',
            international: '7-14 business days ($24.99)',
            freeThreshold: 50,
            carriers: ['FedEx', 'UPS', 'USPS']
        },
        returns: {
            period: 30,
            condition: 'Items must be unused and in original packaging with tags',
            process: 'Initiate return online and print shipping label',
            refundTime: '5-7 business days'
        },
        contact: {
            email: 'support@yourstore.com',
            phone: '1-800-123-4567',
            hours: 'Monday-Friday 9AM-9PM EST',
            liveChat: 'Available during business hours'
        }
    }
};

// Enhanced response generator
function generateChatResponse(userMessage, parameters = {}) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Order tracking
    if (lowerMessage.includes('track') || lowerMessage.includes('order') || lowerMessage.includes('status')) {
        const orderNumber = parameters.orderNumber || extractOrderNumber(userMessage);
        
        if (orderNumber && mockDatabase.orders[orderNumber.toUpperCase()]) {
            const order = mockDatabase.orders[orderNumber.toUpperCase()];
            
            switch (order.status) {
                case 'delivered':
                    return {
                        text: `✅ Order ${orderNumber} was delivered on ${order.deliveredDate} at ${order.deliveredTime}.\n\n📦 ${order.items[0].name}\n🎯 Tracking: ${order.trackingNumber} (${order.carrier})\n💰 Total: $${order.total}\n\nHope you're enjoying your purchase!`,
                        quickReplies: ['Start Return', 'Contact Support', 'Track Another Order']
                    };
                    
                case 'shipped':
                    return {
                        text: `🚚 Order ${orderNumber} is shipped and on the way!\n\n📦 ${order.items[0].name}\n📅 Shipped: ${order.shippedDate}\n🎯 Expected: ${order.estimatedDelivery}\n📦 Tracking: ${order.trackingNumber} (${order.carrier})\n\nYou can track your package using the tracking number above.`,
                        quickReplies: ['Tracking Updates', 'Contact Support', 'Another Order']
                    };
                    
                case 'processing':
                    return {
                        text: `⏳ Order ${orderNumber} is being processed.\n\n📦 ${order.items[0].name}\n📅 Expected to ship by: ${order.estimatedDelivery}\n\nWe're preparing your order for shipment. You'll receive tracking info once it ships.`,
                        quickReplies: ['Contact Support', 'Track Another Order', 'Shipping Info']
                    };
                    
                default:
                    return {
                        text: `Order ${orderNumber} status: ${order.status}`,
                        quickReplies: ['Contact Support', 'Track Another Order']
                    };
            }
        } else {
            return {
                text: `I can help you track your order! We have these demo orders:\n\n• 📦 ORDER-123 (Shipped - Headphones)\n• ✅ ORDER-456 (Delivered - Smart Watch)\n• ⏳ ORDER-789 (Processing - Laptop)\n\nWhich order would you like to check?`,
                quickReplies: ['ORDER-123', 'ORDER-456', 'ORDER-789', 'Contact Support']
            };
        }
    }
    
    // Product stock checking
    else if (lowerMessage.includes('stock') || lowerMessage.includes('available') || lowerMessage.includes('have') || lowerMessage.includes('in stock')) {
        const productName = extractProductName(userMessage);
        
        if (productName) {
            const product = Object.values(mockDatabase.products).find(p => 
                p.name.toLowerCase().includes(productName.toLowerCase())
            );
            
            if (product) {
                if (product.inStock) {
                    return {
                        text: `✅ ${product.name} is IN STOCK! 🎉\n\n💰 Price: $${product.price}\n📦 Available: ${product.stock} units\n📝 ${product.description}\n\nKey Features:\n${product.features.map(f => `• ${f}`).join('\n')}`,
                        quickReplies: ['Add to Cart', 'Shipping Info', 'Other Products']
                    };
                } else {
                    return {
                        text: `❌ ${product.name} is currently OUT OF STOCK\n\n💰 Price: $${product.price}\n📦 Expected Restock: ${product.restockDate}\n📝 ${product.description}\n\nWould you like to be notified when it's available again?`,
                        quickReplies: ['Notify Me', 'Similar Products', 'Contact Support']
                    };
                }
            }
        }
        
        return {
            text: `I can check product availability! Here's what we have:\n\n• 🎧 Wireless Headphones - $99.99 (In Stock)\n• ⌚ Smart Watch - $199.99 (Restocking Soon)\n• 💻 Gaming Laptop - $1299.99 (In Stock)\n• 📱 Smartphone Pro - $899.99 (In Stock)\n\nWhich product are you interested in?`,
            quickReplies: ['Headphones', 'Smart Watch', 'Laptop', 'Smartphone']
        };
    }
    
    // Shipping information
    else if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery') || lowerMessage.includes('ship')) {
        const policy = mockDatabase.policies.shipping;
        return {
            text: `📦 SHIPPING INFORMATION\n\n• 🆓 FREE Standard Shipping on orders over $${policy.freeThreshold}\n• 🚚 Standard Delivery: ${policy.standard}\n• ⚡ Express Delivery: ${policy.express}\n• 🌍 International: ${policy.international}\n• 📦 Carriers: ${policy.carriers.join(', ')}\n\nAll packages include tracking and insurance.`,
            quickReplies: ['Track Order', 'Return Policy', 'Contact Support']
        };
    }
    
    // Returns policy
    else if (lowerMessage.includes('return') || lowerMessage.includes('refund') || lowerMessage.includes('exchange')) {
        const policy = mockDatabase.policies.returns;
        return {
            text: `🔄 RETURNS & EXCHANGES\n\n• 📅 ${policy.period}-Day Return Policy\n• ✅ ${policy.condition}\n• 📦 ${policy.process}\n• 💰 Refunds processed in ${policy.refundTime}\n\nExchanges are available for different sizes or colors.`,
            quickReplies: ['Start Return', 'Contact Returns', 'Shipping Info']
        };
    }
    
    // Contact information
    else if (lowerMessage.includes('contact') || lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('call')) {
        const contact = mockDatabase.policies.contact;
        return {
            text: `📞 CONTACT & SUPPORT\n\n• 📧 Email: ${contact.email}\n• 📞 Phone: ${contact.phone}\n• 🕒 Hours: ${contact.hours}\n• 💬 Live Chat: ${contact.liveChat}\n\nWe're here to help! What can we assist you with?`,
            quickReplies: ['Track Order', 'Product Question', 'Returns Help', 'Shipping Question']
        };
    }
    
    // Greetings
    else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return {
            text: `👋 Hello! Welcome to TechStore! I'm your shopping assistant. I can help you with:\n\n• 📦 Order Tracking & Status\n• 🏪 Product Availability & Info\n• 📦 Shipping & Delivery\n• 🔄 Returns & Exchanges\n• 📞 Customer Support\n\nHow can I help you today?`,
            quickReplies: ['Track Order', 'Check Stock', 'Shipping Info', 'Contact Support']
        };
    }
    
    // Default response
    else {
        return {
            text: `I'm here to help with your shopping needs! I can assist with:\n\n• Order tracking and status updates\n• Product availability and information\n• Shipping and delivery details\n• Returns and exchanges\n• General customer support\n\nWhat would you like to know?`,
            quickReplies: ['Track Order', 'Check Stock', 'Shipping Info', 'Contact Support']
        };
    }
}

// Helper functions
function extractOrderNumber(message) {
    const orderMatch = message.match(/(ORDER-?)?(\d{3,})/i);
    return orderMatch ? `ORDER-${orderMatch[2]}` : null;
}

function extractProductName(message) {
    const products = ['headphone', 'watch', 'laptop', 'phone', 'smartphone'];
    for (const product of products) {
        if (message.toLowerCase().includes(product)) {
            return product;
        }
    }
    return null;
}

// Enhanced webhook endpoint
app.post('/webhook', (req, res) => {
    console.log('📍 Webhook received:', JSON.stringify(req.body, null, 2));
    
    try {
        const userMessage = req.body.queryResult?.queryText || '';
        const parameters = req.body.queryResult?.parameters || {};
        
        const response = generateChatResponse(userMessage, parameters);
        
        const webhookResponse = {
            fulfillmentText: response.text,
            fulfillmentMessages: [
                {
                    text: {
                        text: [response.text]
                    }
                }
            ],
            payload: {
                quickReplies: response.quickReplies
            }
        };
        
        console.log('🤖 Sending response:', response.text);
        res.json(webhookResponse);
        
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.json({
            fulfillmentText: "I apologize, but I'm having trouble processing your request. Please try again or contact our support team.",
            fulfillmentMessages: [
                {
                    text: {
                        text: ["I apologize, but I'm having trouble processing your request. Please try again or contact our support team."]
                    }
                }
            ]
        });
    }
});

// Additional API endpoints
app.get('/api/orders/:orderId', (req, res) => {
    const orderId = req.params.orderId.toUpperCase();
    const order = mockDatabase.orders[orderId];
    
    if (order) {
        res.json({ success: true, order });
    } else {
        res.json({ success: false, message: 'Order not found' });
    }
});

app.get('/api/products/:productId', (req, res) => {
    const productId = req.params.productId.toUpperCase();
    const product = mockDatabase.products[productId];
    
    if (product) {
        res.json({ success: true, product });
    } else {
        res.json({ success: false, message: 'Product not found' });
    }
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Ecommerce Chatbot API'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🤖 =================================`);
    console.log(`🚀 Ecommerce Chatbot Server Started`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`💬 Chat: http://localhost:${PORT}`);
    console.log(`❤️  Health: http://localhost:${PORT}/health`);
    console.log(`📦 API: http://localhost:${PORT}/api/orders/ORDER-123`);
    console.log(`🤖 =================================\n`);
    
    console.log('Demo Orders Available:');
    console.log('• ORDER-123 - Shipped (Headphones)');
    console.log('• ORDER-456 - Delivered (Smart Watch)');
    console.log('• ORDER-789 - Processing (Laptop)');
});