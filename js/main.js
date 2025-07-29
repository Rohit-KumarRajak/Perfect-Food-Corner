// Loader
window.addEventListener('load', function() {
    const loader = document.querySelector('.loader');
    setTimeout(() => {
        loader.classList.add('loader-hidden');
    }, 1000);
});

// Cart functionality with half/full plate options
document.addEventListener('DOMContentLoaded', function() {
    const cart = {
        items: [],
        total: 0,
        currentItem: null,
        
        addItem: function(item, portion) {
            const existingItem = this.items.find(i => 
                i.name === item.name && 
                i.price === item.price && 
                i.portion === portion
            );
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                this.items.push({
                    ...item,
                    portion: portion,
                    quantity: 1
                });
            }
            
            this.updateTotal();
            this.saveToSessionStorage();
            this.updateCartUI();
            this.showCartNotification();
        },
        
        removeItem: function(index) {
            this.items.splice(index, 1);
            this.updateTotal();
            this.saveToSessionStorage();
            this.updateCartUI();
        },
        
        updateQuantity: function(index, newQuantity) {
            if (newQuantity < 1) {
                this.removeItem(index);
                return;
            }
            
            this.items[index].quantity = newQuantity;
            this.updateTotal();
            this.saveToSessionStorage();
            this.updateCartUI();
        },
        
        clearCart: function() {
            this.items = [];
            this.total = 0;
            sessionStorage.removeItem('cart');
            this.updateCartUI();
        },
        
        updateTotal: function() {
            this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        },
        
        saveToSessionStorage: function() {
            sessionStorage.setItem('cart', JSON.stringify(this.items));
        },
        
        loadFromSessionStorage: function() {
            const savedCart = sessionStorage.getItem('cart');
            if (savedCart) {
                this.items = JSON.parse(savedCart);
                this.updateTotal();
                this.updateCartUI();
            }
        },
        
        updateCartUI: function() {
            const cartItemsContainer = document.querySelector('.cart-items');
            const cartCountElements = document.querySelectorAll('.cart-count');
            const totalPrice = document.querySelector('.total-price');
            
            // Update cart items
            cartItemsContainer.innerHTML = this.items.length > 0 ? '' : '<div class="empty-cart">Your order is empty</div>';
            
            this.items.forEach((item, index) => {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name} (${item.portion === 'half' ? 'Half' : 'Full'})</div>
                        <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn minus" data-index="${index}">-</button>
                            <input type="text" class="quantity-value" value="${item.quantity}" readonly>
                            <button class="quantity-btn plus" data-index="${index}">+</button>
                        </div>
                    </div>
                    <button class="remove-item" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                cartItemsContainer.appendChild(cartItem);
            });
            
            // Update cart count and total
            const itemCount = this.items.reduce((count, item) => count + item.quantity, 0);
            cartCountElements.forEach(el => el.textContent = itemCount);
            totalPrice.textContent = `₹${this.total.toFixed(2)}`;
            
            // Add event listeners to quantity buttons
            document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.getAttribute('data-index'));
                    this.updateQuantity(index, this.items[index].quantity - 1);
                });
            });
            
            document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.getAttribute('data-index'));
                    this.updateQuantity(index, this.items[index].quantity + 1);
                });
            });
            
            document.querySelectorAll('.remove-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.closest('.remove-item').getAttribute('data-index'));
                    this.removeItem(index);
                });
            });
        },
        
        showCartNotification: function() {
            const notification = document.createElement('div');
            notification.className = 'cart-notification';
            notification.innerHTML = '<i class="fas fa-check-circle"></i> Item added to order';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('show');
            }, 10);
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 2000);
        },
        
        generateWhatsAppMessage: function() {
            let message = `Hello Perfect Food Corner,\n\nI would like to order:\n\n`;
            
            this.items.forEach(item => {
                message += `${item.name} (${item.portion === 'half' ? 'Half' : 'Full'}) - ${item.quantity} x ₹${item.price.toFixed(2)} = ₹${(item.quantity * item.price).toFixed(2)}\n`;
            });
            
            message += `\nTotal: ₹${this.total.toFixed(2)}\n\n`;
            message += `My delivery address is: \n`;
            message += `My contact number is: \n\n`;
            message += `Thank you!`;
            
            return encodeURIComponent(message);
        }
    };
    
    // Plate selection modal
    const plateModal = document.querySelector('.plate-modal');
    const plateOptions = document.querySelectorAll('.plate-option');
    const closeModalBtn = document.querySelector('.close-modal');
    
    function openPlateModal(item) {
        cart.currentItem = item;
        plateModal.classList.add('active');
    }
    
    function closePlateModal() {
        plateModal.classList.remove('active');
    }
    
    plateOptions.forEach(option => {
        option.addEventListener('click', () => {
            const portion = option.getAttribute('data-size');
            const price = portion === 'half' ? cart.currentItem.halfPrice : cart.currentItem.fullPrice;
            
            cart.addItem({
                name: cart.currentItem.name,
                price: price
            }, portion);
            
            closePlateModal();
        });
    });
    
    closeModalBtn.addEventListener('click', closePlateModal);
    
    // Close modal when clicking outside
    plateModal.addEventListener('click', (e) => {
        if (e.target === plateModal) {
            closePlateModal();
        }
    });
    
    // Initialize cart
    cart.loadFromSessionStorage();
    
    // Cart toggle functionality
    const cartSidebar = document.querySelector('.cart-sidebar');
    const closeCartBtn = document.querySelector('.close-cart');
    const navCart = document.querySelector('.nav-cart a');
    const floatingCartBtn = document.querySelector('.floating-cart-btn');
    
    function toggleCart() {
        cartSidebar.classList.toggle('active');
    }
    
    navCart.addEventListener('click', (e) => {
        e.preventDefault();
        toggleCart();
    });
    
    floatingCartBtn.addEventListener('click', toggleCart);
    
    closeCartBtn.addEventListener('click', toggleCart);
    
    // Add to cart buttons with portion selection
    document.querySelectorAll('.menu-item').forEach(item => {
        const addToCartBtn = document.createElement('button');
        addToCartBtn.className = 'add-to-cart';
        addToCartBtn.innerHTML = '<i class="fas fa-plus"></i>';
        
        item.style.position = 'relative';
        item.appendChild(addToCartBtn);
        
        const itemName = item.querySelector('h3').textContent.trim();
        const priceText = item.querySelector('.price').textContent;
        
        // Extract half and full prices (format: "₹40 / ₹70")
        let halfPrice, fullPrice;
        const prices = priceText.match(/[\d\.]+/g);
        
        if (prices && prices.length >= 2) {
            halfPrice = parseFloat(prices[0]);
            fullPrice = parseFloat(prices[1]);
        } else {
            // For items without half/full option
            halfPrice = fullPrice = parseFloat(priceText.replace(/[^\d\.]/g, ''));
        }
        
        addToCartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Check if item has half/full option
            if (priceText.includes('/')) {
                openPlateModal({
                    name: itemName,
                    halfPrice: halfPrice,
                    fullPrice: fullPrice
                });
            } else {
                // Single price item
                cart.addItem({
                    name: itemName,
                    price: fullPrice
                }, 'full');
            }
        });
    });
    
    // WhatsApp checkout
    document.querySelector('.checkout-btn').addEventListener('click', () => {
        if (cart.items.length === 0) {
            alert('Your order is empty. Please add some items first.');
            return;
        }
        
        const phoneNumber = '918447830914'; // Replace with your WhatsApp number
        const message = cart.generateWhatsAppMessage();
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
        
        window.open(whatsappUrl, '_blank');
    });
    
    // Clear cart
    document.querySelector('.clear-cart-btn').addEventListener('click', () => {
        if (cart.items.length === 0) return;
        
        if (confirm('Are you sure you want to clear your order?')) {
            cart.clearCart();
        }
    });
    
    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
        if (!cartSidebar.contains(e.target) && 
            !e.target.closest('.nav-cart') && 
            !e.target.closest('.floating-cart-btn') &&
            cartSidebar.classList.contains('active')) {
            cartSidebar.classList.remove('active');
        }
    });

    // Show floating cart button on mobile
    function checkScreenSize() {
        if (window.innerWidth <= 768) {
            floatingCartBtn.style.display = 'flex';
            document.querySelector('.nav-cart').style.display = 'none';
        } else {
            floatingCartBtn.style.display = 'none';
            document.querySelector('.nav-cart').style.display = 'block';
        }
    }
    
    window.addEventListener('resize', checkScreenSize);
    checkScreenSize();
    
    // Header scroll effect
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navbar = document.querySelector('.navbar');
    
    mobileMenuBtn.addEventListener('click', function() {
        navbar.classList.toggle('active');
        mobileMenuBtn.innerHTML = navbar.classList.contains('active') ? 
            '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });
    
    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.navbar ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navbar.classList.remove('active');
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        });
    });
    
    // Menu tabs functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const menuCategories = document.querySelectorAll('.menu-category');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons and categories
            tabBtns.forEach(btn => btn.classList.remove('active'));
            menuCategories.forEach(category => category.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show corresponding category
            const categoryId = this.getAttribute('data-category');
            document.getElementById(categoryId).classList.add('active');
        });
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Animate elements on scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.info-card, .section-title, .menu-section');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementPosition < windowHeight - 100) {
                element.classList.add('animated');
            }
        });
    };
    
    window.addEventListener('scroll', animateOnScroll);
    window.addEventListener('load', animateOnScroll);
});
