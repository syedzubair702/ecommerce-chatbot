// Ecommerce Chatbot - Enhanced Version for Robust Backend
document.addEventListener('DOMContentLoaded', function() {
    console.log('🤖 Chatbot initializing...');
    
    // Get DOM elements
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    
    // Add message to chat
    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = isUser ? 'message user-message' : 'message bot-message';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = message;
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Show typing indicator
    function showTypingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.id = 'typingIndicator';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content typing-indicator';
        contentDiv.textContent = 'Assistant is typing...';
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Add bot message with quick replies
    function addBotMessageWithReplies(message, quickReplies = []) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = message;
        messageDiv.appendChild(contentDiv);
        
        if (quickReplies && quickReplies.length > 0) {
            const repliesDiv = document.createElement('div');
            repliesDiv.className = 'quick-replies';
            
            quickReplies.forEach(reply => {
                const button = document.createElement('button');
                button.className = 'quick-reply';
                button.textContent = reply;
                button.setAttribute('data-reply', reply);
                repliesDiv.appendChild(button);
            });
            
            messageDiv.appendChild(repliesDiv);
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Send message to backend
    async function sendToBackend(message) {
        try {
            console.log('📤 Sending to backend:', message);
            
            const response = await fetch('/webhook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    queryResult: {
                        queryText: message,
                        parameters: {},
                        intent: {
                            displayName: 'user_message'
                        }
                    },
                    originalDetectIntentRequest: {
                        source: 'web'
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📥 Backend response:', data);
            
            return {
                text: data.fulfillmentText,
                quickReplies: data.payload?.quickReplies || []
            };
            
        } catch (error) {
            console.error('❌ Backend error:', error);
            throw error;
        }
    }

    // Send message function
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) {
            alert('Please type a message first!');
            return;
        }
        
        console.log('💬 User message:', message);
        addMessage(message, true);
        messageInput.value = '';
        
        showTypingIndicator();
        
        try {
            const response = await sendToBackend(message);
            removeTypingIndicator();
            addBotMessageWithReplies(response.text, response.quickReplies);
        } catch (error) {
            removeTypingIndicator();
            // Fallback response if backend fails
            const fallbackResponse = "I'm having trouble connecting right now. Please try again in a moment.";
            addBotMessageWithReplies(fallbackResponse, ['Try Again', 'Contact Support']);
        }
    }

    // Handle quick reply
    async function handleQuickReply(reply) {
        console.log('🔘 Quick reply:', reply);
        addMessage(reply, true);
        
        showTypingIndicator();
        
        try {
            const response = await sendToBackend(reply);
            removeTypingIndicator();
            addBotMessageWithReplies(response.text, response.quickReplies);
        } catch (error) {
            removeTypingIndicator();
            const fallbackResponse = "I'm having trouble connecting right now. Please try again.";
            addBotMessageWithReplies(fallbackResponse, ['Try Again', 'Contact Support']);
        }
    }

    // Handle Enter key
    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', handleKeyPress);
    
    // Event delegation for quick replies
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('quick-reply')) {
            const reply = event.target.getAttribute('data-reply');
            handleQuickReply(reply);
        }
    });

    // Focus input on load
    messageInput.focus();
    
    console.log('✅ Chatbot initialized successfully!');
    console.log('💡 Try these commands:');
    console.log('   - "Track my order ORDER-123"');
    console.log('   - "Are headphones in stock?"');
    console.log('   - "What\'s your shipping policy?"');
});