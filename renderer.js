// renderer.js - Con sistema Admin

console.log("electronAPI disponible:", window.electronAPI);

document.addEventListener('DOMContentLoaded', () => {

    let menuDataDefault = { ...menuData }; // Guardar copia de valores por defecto
    let menuLoaded = false;

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

    // Modal de Producto (Usuario normal)
    const productModal = document.getElementById('modal-product-customization');
    const modalProductNameEl = document.getElementById('modal-product-name');
    const modalProductImageEl = document.getElementById('modal-product-image');
    const modalProductDescEl = document.getElementById('modal-product-desc');
    const modalProductPriceEl = document.getElementById('modal-product-price');
    const modalCustomizationOptionsEl = document.getElementById('modal-customization-options');
    const modalQuantityInput = document.getElementById('modal-quantity');

    // NUEVO: Elementos Admin
    const adminAccessBtn = document.getElementById('admin-access-btn');
    const adminPasswordModal = document.getElementById('modal-admin-password');
    const adminPasswordInput = document.getElementById('admin-password-input');
    const adminPasswordSubmit = document.getElementById('admin-password-submit');
    const adminPasswordError = document.getElementById('admin-password-error');
    const exitAdminBtn = document.getElementById('exit-admin-btn');
    const adminEditModal = document.getElementById('modal-admin-edit');
    const adminProductNameEl = document.getElementById('modal-admin-product-name');
    const adminProductImageEl = document.getElementById('modal-admin-product-image');
    const adminProductPriceInput = document.getElementById('admin-product-price');
    const adminProductLockedCheckbox = document.getElementById('admin-product-locked');
    const adminSaveChangesBtn = document.getElementById('admin-save-changes-btn');

    // Estado de la Aplicación
    let currentScreen = 'welcome';
    let cart = [];
    let currentSelectedProduct = null;
    let activityTimer = null;
    const INACTIVITY_TIMEOUT = 20000; // 20 segundos
    const THANKYOU_REDIRECT_DELAY = 6000; // 6 segundos

    // NUEVO: Estado Admin
    const ADMIN_PASSWORD = "1234"; // Contraseña simple y única
    let isAdminMode = false;
    let currentEditingProduct = null;

    // --- NAVEGACIÓN ENTRE PANTALLAS ---
    function showScreen(screenId) {
        const screenElement = screens[screenId] || document.getElementById(screenId);
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        if (screenElement) {
            screenElement.classList.add('active');
            currentScreen = screenId.replace('screen-', '');
            console.log("Mostrando pantalla:", screenId);
            
            // MODIFICADO: No resetear timer si estamos en modo admin
            if (!isAdminMode) {
                resetActivityTimer();
            }
        } else {
            console.error("Pantalla no encontrada:", screenId);
        }
    }

    // Función para cargar datos guardados
async function loadSavedMenuData() {
    try {
        const result = await window.electronAPI.getMenuData();
        
        if (result.success && result.data) {
            // Hay datos guardados, usarlos
            menuData = result.data;
            console.log('[RENDERER] Menú cargado desde almacenamiento');
            console.log('Productos cargados:', Object.keys(menuData.productos).length, 'categorías');
        } else {
            // No hay datos guardados, usar los valores por defecto de menu.js
            console.log('[RENDERER] Usando menú por defecto (primera vez)');
            // Guardar los valores por defecto en el store
            await window.electronAPI.saveMenuData(menuData);
        }
    } catch (error) {
        console.error('[RENDERER] Error al cargar menú:', error);
        // En caso de error, usar valores por defecto
    }
    
    menuLoaded = true;
}


    // --- LÓGICA DE INACTIVIDAD ---
    function resetActivityTimer() {
        clearTimeout(activityTimer);
        // MODIFICADO: No activar timer en modo admin
        if (currentScreen !== 'welcome' && currentScreen !== 'thankyou' && !isAdminMode) {
            activityTimer = setTimeout(() => {
                console.log("Inactividad detectada, volviendo al inicio.");
                cart = [];
                updateCartDisplay();
                showScreen('welcome');
            }, INACTIVITY_TIMEOUT);
        }
    }

    // Eventos para reiniciar el timer de inactividad
    document.body.addEventListener('click', resetActivityTimer);
    document.body.addEventListener('keypress', resetActivityTimer);
    document.body.addEventListener('touchstart', resetActivityTimer);

    // --- NUEVO: SISTEMA ADMIN ---

    // Abrir modal de contraseña admin
    adminAccessBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Evitar que se active el click de bienvenida
        adminPasswordModal.classList.remove('hidden');
        adminPasswordInput.value = '';
        adminPasswordError.classList.add('hidden');
        adminPasswordInput.focus();
    });

    // Validar contraseña admin
    adminPasswordSubmit.addEventListener('click', () => {
        validateAdminPassword();
    });

    adminPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            validateAdminPassword();
        }
    });

    function validateAdminPassword() {
        const enteredPassword = adminPasswordInput.value.trim();
        
        if (enteredPassword === ADMIN_PASSWORD) {
            // Contraseña correcta
            adminPasswordModal.classList.add('hidden');
            enterAdminMode();
        } else {
            // Contraseña incorrecta
            adminPasswordError.classList.remove('hidden');
            adminPasswordInput.value = '';
            adminPasswordInput.focus();
            
            // Ocultar error después de 3 segundos
            setTimeout(() => {
                adminPasswordError.classList.add('hidden');
            }, 3000);
        }
    }

    function enterAdminMode() {
        isAdminMode = true;
        document.body.classList.add('admin-mode-active');
        exitAdminBtn.classList.remove('hidden');
        
        // Ir a pantalla de menú
        showScreen('menu');
        renderCategories();
        
        if (menuData.categorias.length > 0) {
            const firstCategoryWithProducts = menuData.categorias.find(cat =>
                menuData.productos[cat.id] && menuData.productos[cat.id].length > 0
            );
            if (firstCategoryWithProducts) {
                renderProducts(firstCategoryWithProducts.id);
                const firstCategoryButton = categoryListEl.querySelector(`li[data-category-id="${firstCategoryWithProducts.id}"]`);
                if (firstCategoryButton) {
                    firstCategoryButton.classList.add('active');
                }
            }
        }
        
        console.log("Modo Admin activado");
        showToast("Modo Administrador activado");
    }

    function exitAdminMode() {
        isAdminMode = false;
        document.body.classList.remove('admin-mode-active');
        exitAdminBtn.classList.add('hidden');
        
        // Volver a pantalla de bienvenida
        showScreen('welcome');
        
        console.log("Modo Admin desactivado");
    }

    // Botón de salir modo admin
    exitAdminBtn.addEventListener('click', () => {
        exitAdminMode();
    });

    // Cerrar modal de contraseña
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) {
                modal.classList.add('hidden');
            }
        });
    });

    // Cerrar modales al hacer click en el backdrop
    adminPasswordModal.addEventListener('click', (e) => {
        if (e.target === adminPasswordModal) {
            adminPasswordModal.classList.add('hidden');
        }
    });

    adminEditModal.addEventListener('click', (e) => {
        if (e.target === adminEditModal) {
            adminEditModal.classList.add('hidden');
        }
    });

    // Abrir modal de edición admin
    function openAdminEditModal(product) {
        currentEditingProduct = product;
        
        adminProductNameEl.textContent = product.nombre;
        adminProductImageEl.src = product.img || 'assets/images/producto_placeholder.png';
        adminProductPriceInput.value = product.precio;
        adminProductLockedCheckbox.checked = product.locked || false;
        
        adminEditModal.classList.remove('hidden');
    }

    // Guardar cambios admin
    adminSaveChangesBtn.addEventListener('click', async () => {
        if (!currentEditingProduct) return;
        
        const newPrice = parseFloat(adminProductPriceInput.value);
        const isLocked = adminProductLockedCheckbox.checked;
        
        if (isNaN(newPrice) || newPrice < 0) {
            alert("Por favor, ingresa un precio válido.");
            return;
        }
        
        // Actualizar el producto en menuData
        currentEditingProduct.precio = newPrice;
        currentEditingProduct.locked = isLocked;
        
        // NUEVO: Guardar en electron-store
        try {
            const result = await window.electronAPI.saveMenuData(menuData);
            
            if (result.success) {
                console.log('[RENDERER] Cambios guardados en almacenamiento');
                showToast(`Producto "${currentEditingProduct.nombre}" actualizado y guardado`);
            } else {
                console.error('[RENDERER] Error al guardar:', result.error);
                showError('Error al guardar los cambios');
            }
        } catch (error) {
            console.error('[RENDERER] Error al guardar cambios:', error);
            showError('Error al guardar los cambios');
        }
        
        // Cerrar modal y re-renderizar productos
        adminEditModal.classList.add('hidden');
        
        // Re-renderizar la categoría actual
        const activeCategory = categoryListEl.querySelector('li.active');
        if (activeCategory) {
            const categoryId = activeCategory.dataset.categoryId;
            renderProducts(categoryId);
        }
        
        console.log("Producto actualizado:", currentEditingProduct);
    });
    

    // --- FIN SISTEMA ADMIN ---

    // --- PANTALLA DE BIENVENIDA ---
    function initWelcomeScreen() {
        screens.welcome.addEventListener('click', (e) => {
            // MODIFICADO: Solo proceder si NO se hizo click en el botón de admin
            if (e.target.closest('#admin-access-btn')) {
                return;
            }
            
            if (currentScreen === 'welcome' && !isAdminMode) {
                showScreen('menu');
                renderCategories();
                if (menuData.categorias.length > 0) {
                    const firstCategoryWithProducts = menuData.categorias.find(cat =>
                        menuData.productos[cat.id] && menuData.productos[cat.id].length > 0
                    );
                    if (firstCategoryWithProducts) {
                        renderProducts(firstCategoryWithProducts.id);
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
        categoryListEl.innerHTML = '';
        menuData.categorias.forEach(category => {
            const li = document.createElement('li');
            li.textContent = `${category.icono || ''} ${category.nombre}`;
            li.dataset.categoryId = category.id;
            li.addEventListener('click', () => {
                renderProducts(category.id);
                Array.from(categoryListEl.children).forEach(child => child.classList.remove('active'));
                li.classList.add('active');
            });
            categoryListEl.appendChild(li);
        });
    }

    function renderProducts(categoryId) {
        const category = menuData.categorias.find(c => c.id === categoryId);
        currentCategoryTitleEl.textContent = category ? category.nombre : 'Productos';
        productGridEl.innerHTML = '';

        const productsInCategory = menuData.productos[categoryId] || [];

        if (productsInCategory.length === 0) {
            productGridEl.innerHTML = '<p>No hay productos en esta categoría.</p>';
            return;
        }

        productsInCategory.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            // NUEVO: Agregar clases según modo admin y estado bloqueado
            if (isAdminMode) {
                card.classList.add('admin-mode');
            }
            if (product.locked) {
                card.classList.add('locked');
            }
            
            // MODIFICADO: Diferentes comportamientos según modo
            card.addEventListener('click', () => {
                if (product.locked && !isAdminMode) {
                    // Producto bloqueado en modo usuario
                    showToast("Producto no disponible");
                    return;
                }
                
                if (isAdminMode) {
                    // Modo admin: abrir modal de edición
                    openAdminEditModal(product);
                } else {
                    // Modo usuario: abrir modal de personalización
                    openProductModal(product);
                }
            });

            card.innerHTML = `
                <img src="${product.img || 'assets/images/producto_placeholder.png'}" alt="${product.nombre}">
                <h3>${product.nombre}</h3>
                <p class="product-description">${product.desc || ''}</p>
                <p class="product-price">$${product.precio.toFixed(2)}</p>
                ${product.personalizaciones && product.personalizaciones.length > 0 ? '<p class="product-has-customizations">Personalizable</p>' : ''}
            `;
            
            productGridEl.appendChild(card);
        });
    }

    // Helper function para personalizaciones dinámicas
    function getDynamicCustomizations(productName) {
        const nameLower = productName.toLowerCase();
        const options = {};

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

        if (nameLower.includes('hamburguesa')) {
            if (!nameLower.includes('con jamón y queso') && !nameLower.includes('mixta con')) {
                options['Verduras'] = verdurasOptions;
            }
            options['Salsas'] = salsasOptions;
            
            if (!nameLower.includes('mixta con') && !nameLower.includes('con jamón y queso') && !nameLower.includes('cajita sorpresa')) {
                options['Extras'] = extrasOptions;
            }
            if (nameLower.includes('de pollo xl')) {
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
            } else {
                options['Extras'] = [
                    { id: 'extra-verduras', nombre: 'Verduras a elección', precio: 40 },
                    { id: 'extra-jamon', nombre: 'Jamón', precio: 60 }
                ];
            }
        } else if (nameLower.includes('pancho')) {
            options['Salsas'] = salsasOptions;
        } else if (nameLower.includes('papas fritas pequeñas')) {
            options['Salsas'] = salsasOptions;
            options['Extras'] = [
                { id: 'extra-cheddar', nombre: 'Salsa cheddar', precio: 50 }
            ];
        } else if (nameLower.includes('papa')) {
            options['Salsas'] = salsasOptions;
            options['Extras'] = [
                { id: 'extra-cheddar', nombre: 'Salsa cheddar', precio: 50 },
                { id: 'extra-panceta', nombre: 'Panceta', precio: 80 }
            ];
        } else if (nameLower.includes('nugget')) {
            options['Salsas'] = salsasOptions;
        } else if (nameLower.includes('chorizo completo')) {
            options['Verduras'] = verdurasOptions;
            options['Salsas'] = salsasOptions;
        } else if (nameLower.includes('chorizo')) {
            options['Salsas'] = salsasOptions;
        }

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
    
                    let salsaCount = 0;
    
                    options.forEach(cust => {
                        const label = document.createElement('label');
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.name = 'customization';
                        checkbox.value = cust.id;
                        checkbox.dataset.name = cust.nombre;
                        checkbox.dataset.priceValue = (cust.precio || 0).toFixed(2);
    
                        if (itemToEdit && itemToEdit.personalizaciones.some(p => p.id === cust.id)) {
                            checkbox.checked = true;
                            salsaCount++;
                        }
    
                        checkbox.addEventListener('change', () => {
                            if (checkbox.checked) {
                                salsaCount++;
                            } else {
                                salsaCount--;
                            }
    
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
        modalCustomizationOptionsEl.innerHTML = '';
        modalQuantityInput.value = 1;
        productModal.dataset.editingIndex = '';
    }

    productModal.addEventListener('click', (event) => {
        if (event.target === productModal) {
            closeProductModal();
        }
    });

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
            precioTotal: finalPriceTotal,
            personalizaciones: selectedCustomizations.sort((a, b) => a.id.localeCompare(b.id)),
            img: currentSelectedProduct.img
        };

        const editingIndex = productModal.dataset.editingIndex;

        if (editingIndex !== '') {
            cart[editingIndex] = cartItem;
            console.log("Item actualizado en el carrito:", cartItem);
        } else {
            addToCart(cartItem);
        }

        updateCartDisplay();
        closeProductModal();
    });

    // --- LÓGICA DEL CARRITO ---
    function addToCart(item) {
        const existingItemIndex = cart.findIndex(cartItem => cartItem.groupingKey === item.groupingKey);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].cantidad += item.cantidad;
            cart[existingItemIndex].precioTotal = cart[existingItemIndex].precioUnitarioConPersonalizacion * cart[existingItemIndex].cantidad;
            console.log("Cantidad actualizada para item existente:", cart[existingItemIndex]);
        } else {
            cart.push(item);
            console.log("Nuevo item agregado al carrito:", item);
        }

        updateCartDisplay();
    }

    function updateCartDisplay() {
        cartItemsContainerEl.innerHTML = '';
        let totalGeneral = 0;

        if (cart.length === 0) {
            emptyCartMessageEl.classList.remove('hidden');
        } else {
            emptyCartMessageEl.classList.add('hidden');
            cart.forEach((item, index) => {
                totalGeneral += item.precioTotal;
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';

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

        document.getElementById('checkout-btn').disabled = cart.length === 0;
    }

    cartItemsContainerEl.addEventListener('click', (event) => {
        const target = event.target;
        const button = target.closest('button[data-index]');

        if (!button) return;

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
                    cart.splice(itemIndex, 1);
                }
                updateCartDisplay();
            }
        } else if (button.classList.contains('remove-item')) {
            if (cart[itemIndex]) {
                cart.splice(itemIndex, 1);
                updateCartDisplay();
            }
        } else if (button.classList.contains('edit-item')) {
            if (cart[itemIndex]) {
                const itemToEdit = { ...cart[itemIndex], originalIndex: itemIndex };
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
    });

    document.getElementById('view-cart-btn').addEventListener('click', () => showScreen('cart'));
    document.getElementById('back-to-menu-btn').addEventListener('click', () => showScreen('menu'));
    document.getElementById('checkout-btn').addEventListener('click', () => {
        if (cart.length > 0) {
            const ticketData = {
                orderNumber: Math.floor(1000 + Math.random() * 9000),
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
            
            cart = [];
            updateCartDisplay();
            
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
        toast.style.backgroundColor = 'var(--success-color)';
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    function showError(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.style.backgroundColor = 'var(--error-color)';
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // --- INICIALIZACIÓN ---
    async function initialize() {
        await window.electronAPI.resetMenuData();
        await loadSavedMenuData(); // Cargar datos guardados primero
        initWelcomeScreen();
        showScreen('welcome');
        updateCartDisplay();
        window.electronAPI.resetMenuData();
    }
    
    initialize()
});
