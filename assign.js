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

document.getElementById('addWaiterBtn').addEventListener('click', async (event) => {
    event.preventDefault();

    const waiterName = document.getElementById('waiterName').value;
    const waiterId = document.getElementById('waiterId').value;
    const initialBalance = parseFloat(document.getElementById('initialBalance').value);

    if (!waiterName || !waiterId || isNaN(initialBalance)) {
        showModal('Please provide valid waiter name, ID, and initial balance.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/assign-waiter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ unique_id: waiterId, name: waiterName, default_balance: initialBalance }),
        });

        if (response.ok) {
            const result = await response.json();
            addWaiterToTable(result.name, result.unique_id, result.current_balance);
            document.getElementById('waiterName').value = '';
            document.getElementById('waiterId').value = '';
            document.getElementById('initialBalance').value = '';
            showModal('Waiter assigned successfully!');
        } else {
            const error = await response.json();
            showModal(`Error: ${error.error}`);
        }
    } catch (error) {
        console.error('Error assigning waiter:', error);
        showModal('Failed to assign waiter. Please try again.');
    }
});

function addWaiterToTable(name, id, balance) {
    const tableBody = document.getElementById('waiterTableBody');
    const row = document.createElement('tr');

    row.innerHTML = `
        <td>${name}</td>
        <td>${id}</td>
        <td class="balance-cell">${balance.toFixed(2)}</td>
        <td><button class="btn btn-danger btn-small" onclick="this.closest('tr').remove()">Remove</button></td>
    `;

    tableBody.appendChild(row);
}

async function fetchWaiters() {
    try {
        const response = await fetch('http://localhost:3000/get-waiters');
        if (response.ok) {
            const waiters = await response.json();
            waiters.forEach(waiter => {
                addWaiterToTable(waiter.name, waiter.unique_id, waiter.current_balance);
            });
        } else {
            showModal('Failed to fetch waiters. Please try again.');
        }
    } catch (error) {
        console.error('Error fetching waiters:', error);
        showModal('Failed to fetch waiters. Please try again.');
    }
}

// Call fetchWaiters on page load
document.addEventListener('DOMContentLoaded', fetchWaiters);
