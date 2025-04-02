document.addEventListener('DOMContentLoaded', () => {
    const waiterSelect = document.getElementById('waiter-select');
    const refillForm = document.getElementById('refill-form');
    const modal = document.getElementById('notification-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalClose = document.getElementById('modal-close');

    // Function to show the modal
    const showModal = (message) => {
        modalMessage.textContent = message;
        modal.classList.remove('hidden');
        modal.style.display = 'block';
    };

    // Function to hide the modal
    const hideModal = () => {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    };

    modalClose.addEventListener('click', hideModal);

    // Fetch waiters and populate the dropdown
    fetch('http://localhost:3000/get-waiters')
        .then(response => response.json())
        .then(waiters => {
            waiters.forEach(waiter => {
                const option = document.createElement('option');
                option.value = waiter.unique_id;
                option.textContent = `${waiter.name} (Balance: ${waiter.current_balance} Birr)`;
                waiterSelect.appendChild(option);
            });

            // Add "All Waiters" option
            const allOption = document.createElement('option');
            allOption.value = 'all';
            allOption.textContent = 'All Waiters';
            waiterSelect.appendChild(allOption);
        })
        .catch(error => console.error('Error fetching waiters:', error));

    // Handle form submission
    refillForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const selectedWaiter = waiterSelect.value;
        const refillAmount = parseFloat(document.getElementById('refill-amount').value);

        if (!selectedWaiter || isNaN(refillAmount) || refillAmount <= 0) {
            showModal('Please select a waiter and enter a valid refill amount.');
            return;
        }

        const payload = {
            waiter: selectedWaiter,
            amount: refillAmount
        };

        fetch('http://localhost:3000/refill-balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showModal('Balance updated successfully.');
                    setTimeout(() => location.reload(), 2000); // Reload after 2 seconds
                } else {
                    showModal('Error updating balance: ' + data.error);
                }
            })
            .catch(error => console.error('Error updating balance:', error));
    });
});
