// Fetch beers from the server and populate the options grid
fetch('http://localhost:3000/get-items')
    .then(response => response.json())
    .then(items => {
        const optionsGrid = document.querySelector('.options-grid');
        optionsGrid.innerHTML = ''; // Clear existing options

        items.forEach(item => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = item.name;
            button.dataset.price = item.price; // Store price as data attribute
            optionsGrid.appendChild(button);
        });

        // Reattach event listeners to dynamically added buttons
        attachOptionButtonListeners();
    })
    .catch(error => console.error('Error fetching items:', error));

// Fetch waiters from the server and populate the waiter select
fetch('http://localhost:3000/get-waiters')
    .then(response => response.json())
    .then(waiters => {
        const waiterSelect = document.getElementById('waiter-select');
        const balanceDisplay = document.querySelector('.balance');
        waiterSelect.innerHTML = ''; // Clear existing options

        waiters.forEach(waiter => {
            const option = document.createElement('option');
            option.value = waiter.unique_id;
            option.textContent = `${waiter.name} (Balance: ${waiter.current_balance} birr)`;
            option.dataset.balance = waiter.current_balance; // Store balance as a data attribute
            waiterSelect.appendChild(option);
        });

        // Update balance display when a waiter is selected
        waiterSelect.addEventListener('change', () => {
            const selectedOption = waiterSelect.options[waiterSelect.selectedIndex];
            const balance = selectedOption.dataset.balance;
            balanceDisplay.textContent = `balance: ${balance} birr`;
        });

        // Trigger change event to display the balance of the first waiter by default
        waiterSelect.dispatchEvent(new Event('change'));
    })
    .catch(error => console.error('Error fetching waiters:', error));

// Attach click listeners to option buttons
function attachOptionButtonListeners() {
    document.querySelectorAll('.option-btn').forEach(button => {
        button.addEventListener('click', function () {
            const itemName = this.textContent;
            const itemPrice = parseFloat(this.dataset.price);
            addToOrderSummary(itemName, itemPrice);
        });
    });
}

// Add selected item to the order summary
function addToOrderSummary(name, price) {
    const orderSummary = document.querySelector('.order-summary');
    const existingItem = Array.from(orderSummary.children).find(item => item.dataset.name === name);

    if (existingItem) {
        const quantitySpan = existingItem.querySelector('.quantity');
        const quantity = parseInt(quantitySpan.textContent.slice(1)) + 1;
        quantitySpan.textContent = `x${quantity}`;
    } else {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.dataset.name = name;
        orderItem.dataset.price = price; // Store price as data attribute
        orderItem.innerHTML = `<span>${name}</span><span class="quantity">x1</span>`;
        orderSummary.insertBefore(orderItem, orderSummary.querySelector('.order-total'));
    }

    updateOrderTotal(price);
}

// Update the total price in the order summary
function updateOrderTotal(price) {
    const totalSpan = document.querySelector('.order-total span:last-child');
    const currentTotal = parseFloat(totalSpan.textContent.split(' ')[0]) || 0;
    totalSpan.textContent = `${currentTotal + price} birr`;
}

// Handle sell button click
document.querySelector('.sell-btn').addEventListener('click', function () {
    const waiterSelect = document.getElementById('waiter-select');
    const waiterName = waiterSelect.value; // Use unique_id instead of textContent
    const orderItems = Array.from(document.querySelectorAll('.order-item')).map(item => ({
        name: item.dataset.name,
        quantity: parseInt(item.querySelector('.quantity').textContent.slice(1)),
        price: parseFloat(item.dataset.price)
    }));

    if (!waiterName) {
        showNotification('Please select a waiter.');
        return;
    }

    if (orderItems.length === 0) {
        showNotification('No items in the order to sell.');
        return;
    }

    fetch('http://localhost:3000/add-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waiterName, items: orderItems })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Sale recorded successfully!');
                clearOrderSummary();
            } else if (data.error === 'Not enough balance. Please refill.') {
                showNotification('Not enough balance. Please refill.');
            } else {
                showNotification('Failed to record sale.');
            }
        })
        .catch(error => console.error('Error recording sale:', error));
});

// Show notification modal
function showNotification(message) {
    const modal = document.getElementById('notification-modal');
    const modalMessage = document.getElementById('modal-message');
    modalMessage.textContent = message;
    modal.style.display = 'block';

    document.getElementById('close-modal-btn').addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

// Clear the order summary after a successful sale
function clearOrderSummary() {
    const orderSummary = document.querySelector('.order-summary');
    Array.from(orderSummary.children).forEach(child => {
        if (!child.classList.contains('order-total')) {
            child.remove();
        }
    });

    // Reset total
    document.querySelector('.order-total span:last-child').textContent = '0 birr';

    // Re-fetch and update waiter select dropdown
    fetch('http://localhost:3000/get-waiters')
        .then(response => response.json())
        .then(waiters => {
            const waiterSelect = document.getElementById('waiter-select');
            const balanceDisplay = document.querySelector('.balance');
            waiterSelect.innerHTML = ''; // Clear existing options

            waiters.forEach(waiter => {
                const option = document.createElement('option');
                option.value = waiter.unique_id;
                option.textContent = `${waiter.name} (Balance: ${waiter.current_balance} birr)`;
                option.dataset.balance = waiter.current_balance; // Store balance as a data attribute
                waiterSelect.appendChild(option);
            });

            // Trigger change event to display the balance of the first waiter by default
            waiterSelect.dispatchEvent(new Event('change'));
        })
        .catch(error => console.error('Error fetching waiters:', error));
}

// Toggle the profile menu
const profileIcon = document.querySelector('.profile-icon');
const profileMenu = document.querySelector('.profile-menu') || { style: { display: 'none' } };

profileIcon.addEventListener('click', () => {
    profileMenu.style.display = profileMenu.style.display === 'block' ? 'none' : 'block';
});

// Close the profile menu if clicking outside
document.addEventListener('click', (event) => {
    if (!profileIcon.contains(event.target) && !profileMenu.contains(event.target)) {
        profileMenu.style.display = 'none';
    }
});

// Handle sign out button click
document.getElementById('sign-out-btn').addEventListener('click', () => {
    // Add logic here to sign out the user, e.g., redirect to login page
    window.location.href = 'login.html';
});
