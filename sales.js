// Fetch sales data based on date range
async function fetchSalesData(startDate, endDate) {
    try {
        const response = await fetch(`http://localhost:3000/fetch-sales?startDate=${startDate}&endDate=${endDate}`); // Use full server URL
        if (!response.ok) {
            throw new Error('Failed to fetch sales data');
        }
        const data = await response.json();
        renderChart(data);
    } catch (error) {
        console.error(error.message);
    }
}

// Render sales data in a chart
function renderChart(data) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item.beer_name),
            datasets: [{
                label: 'Total Sales',
                data: data.map(item => item.total_price),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Render sales over time in a chart
function renderTimeChart(data) {
    const ctx = document.getElementById('timeChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item.date), // Use the 'date' field from the response
            datasets: [{
                label: 'Sales Over Time',
                data: data.map(item => item.total_price),
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Total Sales'
                    }
                }
            }
        }
    });
}

// Render categorized sales table
function renderSalesTable(data) {
    const tableBody = document.querySelector('#sales-table tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.beer_name}</td>
            <td>${item.total_quantity}</td>
            <td>${item.total_price.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Fetch sales data for charts and table
async function fetchSalesDataForChartsAndTable(startDate, endDate) {
    try {
        const response = await fetch(`http://localhost:3000/fetch-sales?startDate=${startDate}&endDate=${endDate}`);
        if (!response.ok) {
            throw new Error('Failed to fetch sales data');
        }
        const { byItem, byDate } = await response.json();
        renderChart(byItem); // Render bar chart
        renderTimeChart(byDate); // Render line chart
        renderSalesTable(byItem); // Render categorized table
    } catch (error) {
        console.error(error.message);
    }
}

// Event listener for the fetch button
document.getElementById('fetch-sales-btn').addEventListener('click', () => {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    if (startDate && endDate) {
        fetchSalesDataForChartsAndTable(startDate, endDate);
    } else {
        alert('Please select both start and end dates.');
    }
});
