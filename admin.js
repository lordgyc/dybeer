document.getElementById('sign-out-btn').addEventListener('click', () => {
    // Add logic here to sign out the user, e.g., redirect to login page
    window.location.href = 'login.html';
});

function showModal(message) {
    const modal = document.getElementById('notification-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalClose = document.getElementById('modal-close');

    modalMessage.textContent = message;
    modal.classList.remove('hidden');
    modal.style.display = 'block';

    modalClose.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

document.getElementById('add-item-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const itemName = document.getElementById('new-item-name').value;
    const itemPrice = parseFloat(document.getElementById('new-item-price').value);

    if (!itemName || isNaN(itemPrice)) {
        showModal('Please provide valid item name and price.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/add-item', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: itemName, price: itemPrice }),
        });

        if (response.ok) {
            const result = await response.json();
            showModal(`Item added successfully! ID: ${result.id}`);
            document.getElementById('add-item-form').reset();
        } else {
            const error = await response.json();
            showModal(`Error: ${error.error}`);
        }
    } catch (error) {
        console.error('Error adding item:', error);
        showModal('Failed to add item. Please try again.');
    }
});

async function fetchItems() {
    try {
        const response = await fetch('http://localhost:3000/get-items');
        const items = await response.json();

        const tableBody = document.querySelector('#items-table tbody');
        tableBody.innerHTML = ''; // Clear existing rows

        items.forEach((item) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>
                    <button class="btn btn-small btn-primary" onclick="populateUpdateForm(${item.id}, '${item.name}', ${item.price})">Edit</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching items:', error);
    }
}

function populateUpdateForm(id, name, price) {
    if (id !== undefined && price !== undefined) {
        document.getElementById('update-item-id').value = id;
        document.getElementById('update-item-price').value = price;
    } else {
        console.error('Invalid item data:', { id, name, price });
        showModal('Failed to populate the update form. Please try again.');
    }
}

document.getElementById('update-item-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const itemId = parseInt(document.getElementById('update-item-id').value, 10);
    const newPrice = parseFloat(document.getElementById('update-item-price').value);

    if (isNaN(itemId) || isNaN(newPrice)) {
        showModal('Please provide valid item ID and price.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/update-item', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: itemId, price: newPrice }),
        });

        if (response.ok) {
            showModal('Item price updated successfully!');
            fetchItems(); // Refresh the table
            document.getElementById('update-item-form').reset();
        } else {
            const error = await response.json();
            showModal(`Error: ${error.error}`);
        }
    } catch (error) {
        console.error('Error updating item price:', error);
        showModal('Failed to update item price. Please try again.');
    }
})

// Fetch items on page load
fetchItems();
