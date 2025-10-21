// MultipleFiles/renderer.js
console.log("electronAPI disponible:", window.electronAPI);

document.addEventListener('DOMContentLoaded', () => {

    // Referencias a Elementos del DOM
    const screens = {
        welcome: document.getElementById('screen-welcome'),
        menu: document.getElementById('screen-menu'),
        cart: document.getElementById('screen-cart'),
        thankyou: document.getElementById('screen-thankyou'),
    };

    const categoryListEl = document.getElementById('category-list');
    const productGridEl = document.getElementById('product-grid');
    const currentCategoryTitleEl = document.getElementById('current-category-title');
    const cartCountEl = document.getElementById('cart-count');
    const cartItemsContainerEl = document.getElementById('cart-items-container');
    const cartTotalAmountEl = document.getElementById('cart-total-amount');
    const emptyCartMessageEl = document.getElementsByClassName('empty-cart-message')[0];


    // Modal de Producto
    const productModal = document.getElementById('modal-product-customization');
    const modalProductNameEl = document.getElementById('modal-product-name');
    const modalProductImageEl = document.getElementById('modal-product-image');
    const modalProductDescEl = document.getElementById('modal-product-desc');
    const modalProductPriceEl = document.getElementById('modal-product-price');
    const modalCustomizationOptionsEl = document.getElementById('modal-customization-options');
    const modalQuantityInput = document.getElementById('modal-quantity');

    // Estado de la Aplicación
    let currentScreen = 'welcome';
    let cart = [];
    let currentSelectedProduct = null;
    let activityTimer = null;
    const INACTIVITY_TIMEOUT = 20000; // 20 segundos
    const THANKYOU_REDIRECT_DELAY = 6000; // 6 segundos

    // --- NAVEGACIÓN ENTRE PANTALLAS ---
    function showScreen(screenId) {
        const screenElement = screens[screenId] || document.getElementById(screenId);
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        if (screenElement) {
            screenElement.classList.add('active');
            currentScreen = screenId.replace('screen-', ''); // Normalizar el nombre
            console.log("Mostrando pantalla:", screenId);
            resetActivityTimer();
        } else {
            console.error("Pantalla no encontrada:", screenId);
        }
    }
    



    // --- LÓGICA DE INACTIVIDAD ---
    function resetActivityTimer() {
        clearTimeout(activityTimer);
        // Do not reset timer on payment or thankyou screens if they should auto-redirect
        if (currentScreen !== 'welcome' && currentScreen !== 'thankyou') {
            activityTimer = setTimeout(() => {
                console.log("Inactividad detectada, volviendo al inicio.");
                // Optional: show an alert before redirecting
                // alert("Por inactividad, serás redirigido a la pantalla de bienvenida.");
                cart = []; // Vaciar carrito por inactividad
                updateCartDisplay();
                showScreen('welcome');
            }, INACTIVITY_TIMEOUT);
        }
    }
    // Eventos para reiniciar el timer de inactividad
    document.body.addEventListener('click', resetActivityTimer);
    document.body.addEventListener('keypress', resetActivityTimer);
    // Also listen for touch events on touch screens
    document.body.addEventListener('touchstart', resetActivityTimer);


    // --- PANTALLA DE BIENVENIDA ---
    function initWelcomeScreen() {
        // Adding a click listener to the entire welcome screen area
        screens.welcome.addEventListener('click', () => {
            // Only proceed if currently on the welcome screen
            if (currentScreen === 'welcome') {
                showScreen('menu');
                renderCategories();
                if (menuData.categorias.length > 0) {
                    // Find the first category that actually has products
                    const firstCategoryWithProducts = menuData.categorias.find(cat =>
                        menuData.productos[cat.id] && menuData.productos[cat.id].length > 0
                    );
                    if (firstCategoryWithProducts) {
                        renderProducts(firstCategoryWithProducts.id);
                        // Also activate the corresponding category button visually
                        const firstCategoryButton = categoryListEl.querySelector(`li[data-category-id="${firstCategoryWithProducts.id}"]`);
                        if (firstCategoryButton) {
                            firstCategoryButton.classList.add('active');
                        }
                    } else {
                        currentCategoryTitleEl.textContent = 'No hay productos disponibles';
                        productGridEl.innerHTML = '<p>No se encontraron productos en el menú.</p>';
                    }
                }
            }
        });
    }

    // --- PANTALLA DE MENÚ: CATEGORÍAS Y PRODUCTOS ---
    function renderCategories() {
        categoryListEl.innerHTML = ''; // Limpiar categorías existentes
        menuData.categorias.forEach(category => {
            const li = document.createElement('li');
            li.textContent = `${category.icono || ''} ${category.nombre}`;
            li.dataset.categoryId = category.id;
            li.addEventListener('click', () => {
                renderProducts(category.id);
                // Marcar categoría activa
                Array.from(categoryListEl.children).forEach(child => child.classList.remove('active'));
                li.classList.add('active');
            });
            categoryListEl.appendChild(li);
        });
    }

    //Render de productos
    function renderProducts(categoryId) {
        const category = menuData.categorias.find(c => c.id === categoryId);
        currentCategoryTitleEl.textContent = category ? category.nombre : 'Productos';
        productGridEl.innerHTML = ''; // Limpiar productos existentes

        const productsInCategory = menuData.productos[categoryId] || [];

        if (productsInCategory.length === 0) {
            productGridEl.innerHTML = '<p>No hay productos en esta categoría.</p>';
            return;
        }

        productsInCategory.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            // Add click listener to the card to open the modal
            card.addEventListener('click', () => {
                openProductModal(product);
            });

            card.innerHTML = `
                <img src="${product.img || 'assets/images/producto_placeholder.png'}" alt="${product.nombre}">
                <h3>${product.nombre}</h3>
                <p class="product-description">${product.desc || ''}</p>
                <p class="product-price">$${product.precio.toFixed(2)}</p>
                ${product.personalizaciones && product.personalizaciones.length > 0 ? '<p class="product-has-customizations">Personalizable</p>' : ''}
                 <button class="add-to-cart-btn primary-button hidden">Seleccionar</button>
            `;
            // The button inside the card is now hidden; the card itself is clickable
            productGridEl.appendChild(card);
        });
    }


    // Helper function to get dynamic customization options based on product name
    // This function now returns options grouped by category
    function getDynamicCustomizations(productName) {
        const nameLower = productName.toLowerCase();
        const options = {}; // Use an object to group options

        // Define common options groups
        const salsasOptions = [
            { id: 'salsa-mayo', nombre: 'Mayonesa', precio: 0 },
            { id: 'salsa-ketchup', nombre: 'Ketchup', precio: 0 },
            { id: 'salsa-mostaza', nombre: 'Mostaza', precio: 0 },
            { id: 'salsa-picantina', nombre: 'Picantina', precio: 0 },
            { id: 'salsa-bbq', nombre: 'Salsa barbacoa', precio: 0 },
            { id: 'salsa-americana', nombre: 'Americana', precio: 0 }
        ];
        const verdurasOptions = [
            { id: 'verdura-todas', nombre: 'Todas las verduras', precio: 0 },
            { id: 'verdura-tomate', nombre: 'Tomate', precio: 0 },
            { id: 'verdura-lechuga', nombre: 'Lechuga', precio: 0 },
            { id: 'verdura-cebolla', nombre: 'Cebolla', precio: 0 },
            { id: 'verdura-choclo', nombre: 'Choclo', precio: 0 },
            { id: 'verdura-arbeja', nombre: 'Arbeja', precio: 0 },
            { id: 'verdura-aceituna', nombre: 'Aceituna', precio: 0 },
            { id: 'verdura-morron', nombre: 'Morron', precio: 0 },
            { id: 'verdura-picles', nombre: 'Picles', precio: 0 },
            { id: 'verdura-hongos', nombre: 'Hongos', precio: 0 },
            { id: 'verdura-ajies', nombre: 'Ajies', precio: 0 }
        ];
        const extrasOptions = [
            { id: 'extra-jamon', nombre: 'Jamón Extra', precio: 30 },
            { id: 'extra-cheddar', nombre: 'Salsa cheddar', precio: 30 },
            { id: 'extra-colby', nombre: 'Queso colby', precio: 30 },
            { id: 'extra-panceta', nombre: 'Panceta', precio: 30 },
            { id: 'extra-huevo', nombre: 'Huevo', precio: 30 }
        ];


        // Map product names to customization groups
        if (nameLower.includes('hamburguesa')) {
            
            // Most burgers get Verduras and Salsas
            if (!nameLower.includes('con jamón y queso') && !nameLower.includes('mixta con')) { // Jamon y Queso might not have standard veg/salsas
                options['Verduras'] = verdurasOptions;
            }
            options['Salsas'] = salsasOptions;
            
            
            // Add Extras to most burgers except basic ones and cajita
            if (!nameLower.includes('mixta con') && !nameLower.includes('con jamón y queso') && !nameLower.includes('cajita sorpresa')) {
                options['Extras'] = extrasOptions;
            }
            if (nameLower.includes('de pollo xl')) { // Specific extras for Chicken XL
                options['Extras'] = [
                    { id: 'extra-jamon', nombre: 'Jamon extra', precio: 30 },
                    { id: 'extra-cheddar', nombre: 'Salsa cheddar', precio: 30 },
                    { id: 'extra-muzza', nombre: 'Queso muzza', precio: 30 }
                ];
            }
        } else if (nameLower.includes('chivito')) {
            options['Salsas'] = salsasOptions;
            if (nameLower.includes('completo')) {
                options['Verduras'] = verdurasOptions;
                options['Extras'] = [
                    { id: 'extra-cheddar', nombre: 'Salsa cheddar', precio: 50 }
                ];
            } else { // Especial del Paseo (or other non-completo)
                options['Extras'] = [
                    { id: 'extra-verduras', nombre: 'Verduras a elección', precio: 40 }, // Placeholder/option for adding any veg
                    { id: 'extra-jamon', nombre: 'Jamón', precio: 60 }
                ];
            }
        } else if (nameLower.includes('pancho')) {
            options['Salsas'] = salsasOptions;
            // Add specific pancho extras if needed in the future
        } else if (nameLower.includes('papas fritas pequeñas')) {
            options['Salsas'] = salsasOptions;
            options['Extras'] = [
                { id: 'extra-cheddar', nombre: 'Salsa cheddar', precio: 50 }
            ];
        } else if (nameLower.includes('papa')) { // Medium or Large
            options['Salsas'] = salsasOptions;
            options['Extras'] = [
                { id: 'extra-cheddar', nombre: 'Salsa cheddar', precio: 50 },
                { id: 'extra-panceta', nombre: 'Panceta', precio: 80 }
            ];
        } else if (nameLower.includes('nugget')) {
            options['Salsas'] = salsasOptions;
        } else if (nameLower.includes('chorizo completo')) {
            options['Verduras'] = verdurasOptions;
            options['Salsas'] = salsasOptions; // Added salsas based on common sense, adjust if needed
        } else if (nameLower.includes('chorizo')) { // Standard Chorizo
            options['Salsas'] = salsasOptions; // Added salsas based on common sense, adjust if needed
        }
        // Add logic for Sandwiches if they have specific customizations

        return options;
    }


    // --- MODAL DE PERSONALIZACIÓN DE PRODUCTO ---
    function openProductModal(product, itemToEdit = null) {
        currentSelectedProduct = product;
        modalProductNameEl.textContent = product.nombre;
        modalProductImageEl.src = product.img || 'assets/images/producto_placeholder.png';
        modalProductDescEl.textContent = product.desc || 'Sin descripción disponible.';
        modalProductPriceEl.textContent = product.precio.toFixed(2);
        modalQuantityInput.value = itemToEdit ? itemToEdit.cantidad : 1;
    
        modalCustomizationOptionsEl.innerHTML = '';
    
        const customizationsGroups = product.personalizaciones && product.personalizaciones.length > 0
            ? { 'Opciones': product.personalizaciones }
            : getDynamicCustomizations(product.nombre);
    
        const groupTitles = Object.keys(customizationsGroups);
    
        if (groupTitles.length > 0) {
            groupTitles.forEach(groupTitle => {
                const options = customizationsGroups[groupTitle];
    
                if (options.length > 0) {
                    const titleEl = document.createElement('div');
                    titleEl.className = 'customization-category-title';
                    titleEl.innerHTML = `<span>${groupTitle}</span> <span class="arrow">▼</span>`;
                    titleEl.dataset.targetGroup = groupTitle.replace(/\s+/g, '-').toLowerCase();
    
                    const optionsContainer = document.createElement('div');
                    optionsContainer.className = 'customization-group-options hidden';
                    optionsContainer.id = titleEl.dataset.targetGroup;
    
                    let salsaCount = 0; // Contador para las salsas seleccionadas
    
                    options.forEach(cust => {
                        const label = document.createElement('label');
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.name = 'customization';
                        checkbox.value = cust.id;
                        checkbox.dataset.name = cust.nombre;
                        checkbox.dataset.priceValue = (cust.precio || 0).toFixed(2);
    
                        // Pre-check customizations if editing an existing item
                        if (itemToEdit && itemToEdit.personalizaciones.some(p => p.id === cust.id)) {
                            checkbox.checked = true;
                            salsaCount++;
                        }
    
                        // Agregar evento para manejar la selección de salsas
                        checkbox.addEventListener('change', () => {
                            if (checkbox.checked) {
                                salsaCount++;
                            } else {
                                salsaCount--;
                            }
    
                            // Deshabilitar checkboxes si se alcanzan 3 salsas
                            options.forEach(opt => {
                                const optCheckbox = optionsContainer.querySelector(`input[value="${opt.id}"]`);
                                if (salsaCount >= 3 && !optCheckbox.checked) {
                                    optCheckbox.disabled = true;
                                } else {
                                    optCheckbox.disabled = false;
                                }
                            });
                        });
    
                        label.appendChild(checkbox);
                        label.append(` ${cust.nombre}${cust.precio > 0 ? ` (+$${(cust.precio || 0).toFixed(2)})` : ''}`);
                        optionsContainer.appendChild(label);
                    });
    
                    titleEl.addEventListener('click', () => {
                        const isHidden = optionsContainer.classList.contains('hidden');
                        if (isHidden) {
                            optionsContainer.classList.remove('hidden');
                            titleEl.querySelector('.arrow').textContent = '▲';
                        } else {
                            optionsContainer.classList.add('hidden');
                            titleEl.querySelector('.arrow').textContent = '▼';
                        }
                    });
    
                    modalCustomizationOptionsEl.appendChild(titleEl);
                    modalCustomizationOptionsEl.appendChild(optionsContainer);
                }
            });
        }
    
        if (modalCustomizationOptionsEl.innerHTML === '') {
            modalCustomizationOptionsEl.innerHTML = '<p>Sin opciones de personalización adicionales.</p>';
        }
    
        productModal.dataset.editingIndex = itemToEdit ? itemToEdit.originalIndex : '';
        productModal.classList.remove('hidden');
    }
    

    function closeProductModal() {
        productModal.classList.add('hidden');
        currentSelectedProduct = null;
        // Reset modal content if necessary (e.g., uncheck boxes)
        modalCustomizationOptionsEl.innerHTML = '';
        modalQuantityInput.value = 1;
        productModal.dataset.editingIndex = ''; // Clear editing index
    }

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // const modalId = btn.dataset.targetModal; // Si tuvieras múltiples modales
            closeProductModal();
        });
    });

    // Add event listener to modal backdrop to close modal (optional but good UX)
    productModal.addEventListener('click', (event) => {
        if (event.target === productModal) {
            closeProductModal();
        }
    });


    // MultipleFiles/renderer.js (actualización)

document.getElementById('add-to-cart-from-modal-btn').addEventListener('click', () => {
    if (!currentSelectedProduct) return;

    const quantity = parseInt(modalQuantityInput.value, 10);
    if (isNaN(quantity) || quantity <= 0) {
        alert("Por favor, ingresa una cantidad válida.");
        return;
    }

    const selectedCustomizations = [];
    let customizationsPrice = 0;

    modalCustomizationOptionsEl.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        const cust = {
            id: cb.value,
            nombre: cb.dataset.name,
            precio: parseFloat(cb.dataset.priceValue)
        };
        selectedCustomizations.push(cust);
        customizationsPrice += cust.precio;
    });

    const finalPricePerUnit = currentSelectedProduct.precio + customizationsPrice;
    const finalPriceTotal = finalPricePerUnit * quantity;

    const cartItem = {
        groupingKey: currentSelectedProduct.id + '-' + selectedCustomizations.map(c => c.id).sort().join('-'),
        productId: currentSelectedProduct.id,
        nombre: currentSelectedProduct.nombre,
        cantidad: quantity,
        precioUnitarioBase: currentSelectedProduct.precio,
        precioUnitarioConPersonalizacion: finalPricePerUnit,
        precioTotal: finalPriceTotal, // Asegurarnos que usamos el precio calculado
        personalizaciones: selectedCustomizations.sort((a, b) => a.id.localeCompare(b.id)),
        img: currentSelectedProduct.img
    };

    const editingIndex = productModal.dataset.editingIndex;

    if (editingIndex !== '') {
        // Reemplazar el item existente en el carrito
        cart[editingIndex] = cartItem; // Asignación directa en lugar de splice
        console.log("Item actualizado en el carrito:", cartItem);
    } else {
        // Agregar como nuevo item
        addToCart(cartItem);
    }

    updateCartDisplay(); // Forzar la actualización del carrito
    closeProductModal();
});





    // --- LÓGICA DEL CARRITO ---
    function addToCart(item) {
        // Check if an item with the same groupingKey (product + customizations) exists
        const existingItemIndex = cart.findIndex(cartItem => cartItem.groupingKey === item.groupingKey);

        if (existingItemIndex > -1) {
            // If item exists, update its quantity and total
            cart[existingItemIndex].cantidad += item.cantidad;
            cart[existingItemIndex].precioTotal = cart[existingItemIndex].precioUnitarioConPersonalizacion * cart[existingItemIndex].cantidad;
            console.log("Cantidad actualizada para item existente:", cart[existingItemIndex]);
        } else {
            // If item does not exist, add it to the cart
            cart.push(item);
            console.log("Nuevo item agregado al carrito:", item);
        }

        updateCartDisplay();
        // showItemAddedAnimation(item); // Optional animation
    }

    function updateCartDisplay() {
        cartItemsContainerEl.innerHTML = ''; // Limpiar
        let totalGeneral = 0;

        if (cart.length === 0) {
            emptyCartMessageEl.classList.remove('hidden');
        } else {
            emptyCartMessageEl.classList.add('hidden');
            cart.forEach((item, index) => {
                totalGeneral += item.precioTotal;
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';

                // Display customizations clearly
                let personalizacionesStr = item.personalizaciones.map(p => p.nombre).join(', ');
                if (!personalizacionesStr) personalizacionesStr = 'Estándar';

                itemEl.innerHTML = `
                    <img src="${item.img || 'assets/images/producto_placeholder.png'}" alt="${item.nombre}" style="width:60px; height:60px; object-fit:cover; border-radius:4px; margin-right:15px;">
                    <div class="cart-item-details">
                        <h3>${item.nombre}</h3>
                        <p class="item-customizations">Personalización: ${personalizacionesStr}</p>
                        <p class="item-price">Precio unit.: $${item.precioUnitarioConPersonalizacion.toFixed(2)}</p>
                    </div>
                    <div class="cart-item-actions">
                        <button class="quantity-decrease" data-index="${index}">-</button>
                        <span class="quantity">${item.cantidad}</span>
                        <button class="quantity-increase" data-index="${index}">+</button>
                        <button class="edit-item" data-index="${index}" style="margin-left:15px; background-color:#e67e22; color:white; border:none; padding: 8px 12px;">Editar</button>
                        <button class="remove-item" data-index="${index}" style="margin-left:15px; background-color:#e74c3c; color:white; border:none; padding: 8px 12px;">Eliminar</button>
                    </div>
                `;
                cartItemsContainerEl.appendChild(itemEl);
            });
        }

        cartTotalAmountEl.textContent = totalGeneral.toFixed(2);
        cartCountEl.textContent = cart.reduce((acc, item) => acc + item.cantidad, 0);

        // Habilitar o deshabilitar botón de checkout
        document.getElementById('checkout-btn').disabled = cart.length === 0;
    }

    cartItemsContainerEl.addEventListener('click', (event) => {
        const target = event.target;
        // Find the closest parent with data-index to handle clicks on child elements within the button
        const button = target.closest('button[data-index]');

        if (!button) return; // Exit if the clicked element or its parent is not a button with data-index

        const itemIndex = parseInt(button.dataset.index, 10);

        if (button.classList.contains('quantity-increase')) {
            if (cart[itemIndex]) {
                cart[itemIndex].cantidad++;
                cart[itemIndex].precioTotal = cart[itemIndex].precioUnitarioConPersonalizacion * cart[itemIndex].cantidad;
                updateCartDisplay();
            }
        } else if (button.classList.contains('quantity-decrease')) {
            if (cart[itemIndex]) {
                if (cart[itemIndex].cantidad > 1) {
                    cart[itemIndex].cantidad--;
                    cart[itemIndex].precioTotal = cart[itemIndex].precioUnitarioConPersonalizacion * cart[itemIndex].cantidad;
                } else {
                    // Si cantidad es 1 y se presiona '-', se elimina
                    cart.splice(itemIndex, 1);
                }
                updateCartDisplay();
            }
        } else if (button.classList.contains('remove-item')) {
            if (cart[itemIndex]) {
                cart.splice(itemIndex, 1);
                updateCartDisplay();
            }
        } else if (button.classList.contains('edit-item')) { // Nuevo: Manejar el botón de edición
            if (cart[itemIndex]) {
                const itemToEdit = { ...cart[itemIndex], originalIndex: itemIndex }; // Pass a copy and its original index
                // Find the original product data from menuData
                let originalProduct = null;
                for (const categoryId in menuData.productos) {
                    originalProduct = menuData.productos[categoryId].find(p => p.id === itemToEdit.productId);
                    if (originalProduct) break;
                }

                if (originalProduct) {
                    openProductModal(originalProduct, itemToEdit);
                } else {
                    console.error("Producto original no encontrado para edición:", itemToEdit.productId);
                    showError("No se pudo cargar la información del producto para editar.");
                }
            }
        }
        // updateCartDisplay() is called inside each action to ensure the display is updated immediately
    });


    document.getElementById('view-cart-btn').addEventListener('click', () => showScreen('cart'));
    document.getElementById('back-to-menu-btn').addEventListener('click', () => showScreen('menu'));
    document.getElementById('checkout-btn').addEventListener('click', () => {
        if (cart.length > 0) {
            const ticketData = {
                orderNumber: Math.floor(1000 + Math.random() * 9000), // Número de orden aleatorio de 4 dígitos
                items: cart.map(item => ({
                    nombre: item.nombre,
                    cantidad: item.cantidad,
                    personalizaciones: item.personalizaciones,
                    precioTotal: item.precioTotal
                })),

                total: parseFloat(cartTotalAmountEl.textContent)
            };
            console.log("Enviando ticket a imprimir...");
            window.electronAPI.printTicket(ticketData);
        } else {
            alert("Tu carrito está vacío.");
        }
    });



    window.electronAPI.onPrintComplete((event, response) => {
        console.log("Respuesta de impresión recibida:", response);
        console.log("¿Success llegó como true?", response.success);
    
        if (response?.success) {
            const orderNumberDisplay = document.getElementById('order-number-display');
            if (orderNumberDisplay) {
                orderNumberDisplay.textContent = `#${response.orderNumber}`;
            }
            
            // Limpiar carrito
            cart = [];
            updateCartDisplay();
            
            // ✅ CORREGIDO: Mostrar la pantalla correcta
            showScreen('screen-thankyou');
            startThankYouRedirectTimer();
        } else {
            showError("Error al imprimir. Por favor, avisa al personal.");
            showScreen('cart');
        }
    });

    // --- PANTALLA DE AGRADECIMIENTO ---
    function startThankYouRedirectTimer() {
        let timeLeft = THANKYOU_REDIRECT_DELAY / 1000;
        const timerEl = document.getElementById('thankyou-redirect-timer');
        
        if (timerEl) {
            const interval = setInterval(() => {
                timeLeft--;
                timerEl.textContent = timeLeft;
                
                if (timeLeft <= 0) {
                    clearInterval(interval);
                    showScreen('welcome');
                }
            }, 1000);
        } else {
            console.error("Elemento #thankyou-redirect-timer no encontrado.");
            setTimeout(() => showScreen('welcome'), THANKYOU_REDIRECT_DELAY);
        }
    }

    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 6000); // Mostrar por 3 segundos
    }
    function showError(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.style.backgroundColor = 'var(--error-color)'; // Rojo para errores
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // --- INICIALIZACIÓN ---
    initWelcomeScreen();
    showScreen('welcome'); // Iniciar en la pantalla de bienvenida
    updateCartDisplay(); // Ensure cart display is correct on load (should be empty)
});
