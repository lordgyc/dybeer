document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('sales-table-body');
    const dateSelector = document.getElementById('date-selector');
    const waiterSelector = document.getElementById('waiter-selector');
    const fetchSalesBtn = document.getElementById('fetch-sales-btn');
    const totalQuantityEl = document.getElementById('total-quantity');
    const totalPriceEl = document.getElementById('total-price');

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    dateSelector.value = today;

    const formatDateToISO = (date) => {
        const selectedDate = new Date(date);
        return selectedDate.toISOString(); // Format to 2025-04-02T18:32:37.929Z
    };

    const showNotification = (message, type = 'error') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    };

    const fetchWaiters = () => {
        fetch('http://localhost:3000/get-waiters')
            .then(response => response.json())
            .then(data => {
                waiterSelector.innerHTML = '<option value="">All Waiters</option>'; // Reset options
                data.forEach(waiter => {
                    const option = document.createElement('option');
                    option.value = waiter.name;
                    option.textContent = waiter.name;
                    waiterSelector.appendChild(option);
                });
            })
            .catch(error => {
                showNotification('Error fetching waiters. Please try again.', 'error');
                console.error('Error fetching waiters:', error);
            });
    };

    const fetchSalesData = (date, waiter) => {
        const formattedDate = formatDateToISO(date);
        const url = waiter
            ? `http://localhost:3000/daily-sales?date=${formattedDate}&waiter=${encodeURIComponent(waiter)}`
            : `http://localhost:3000/daily-sales?date=${formattedDate}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                tableBody.innerHTML = ''; // Clear existing rows
                let totalQuantity = 0;
                let totalPrice = 0;

                data.forEach(sale => {
                    totalQuantity += sale.total_quantity;
                    totalPrice += sale.total_price;

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${sale.beer_name}</td>
                        <td>${sale.total_quantity}</td>
                        <td>${sale.total_price.toFixed(2)}</td>
                    `;
                    tableBody.appendChild(row);
                });

                // Update totals
                totalQuantityEl.textContent = totalQuantity;
                totalPriceEl.textContent = totalPrice.toFixed(2);
            })
            .catch(error => {
                showNotification('Error fetching daily sales. Please try again.', 'error');
                console.error('Error fetching daily sales:', error);
            });
    };

    // Fetch waiters on page load
    fetchWaiters();

    // Fetch sales data when the button is clicked
    fetchSalesBtn.addEventListener('click', () => {
        const selectedDate = dateSelector.value;
        const selectedWaiter = waiterSelector.value;
        fetchSalesData(selectedDate, selectedWaiter);
    });
});
