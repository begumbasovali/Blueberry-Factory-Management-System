// DOM Elements
const reportForm = document.getElementById('sales-report-form');
const reportStartDate = document.getElementById('report-start-date');
const reportEndDate = document.getElementById('report-end-date');
const reportType = document.getElementById('report-type');
const reportCategory = document.getElementById('report-category');
const revenueChartCanvas = document.getElementById('revenue-chart');
const unitsChartCanvas = document.getElementById('units-chart');
const trendChartCanvas = document.getElementById('trend-chart');
const reportSummary = document.getElementById('report-summary');
const reportDetails = document.getElementById('report-details');
const reportCategorySelect = document.getElementById('report-category');

// Add chart instance tracking
let revenueChart = null;
let unitsChart = null;
let trendChart = null;

function cleanupCharts() {
  // Destroy existing charts if they exist
  if (revenueChart) {
    revenueChart.destroy();
    revenueChart = null;
  }
  if (unitsChart) {
    unitsChart.destroy();
    unitsChart = null;
  }
  if (trendChart) {
    trendChart.destroy();
    trendChart = null;
  }
}

// Initialize Charts
function initializeCharts() {
  try {
    if (!revenueChartCanvas || !unitsChartCanvas || !trendChartCanvas) {
      console.error('Chart canvases not found');
      return;
    }
  // Revenue by Category Chart
  revenueChart = new Chart(revenueChartCanvas, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Revenue by Category',
        data: [],
        backgroundColor: [
          '#4e73df', '#1cc88a', '#36b9cc',
          '#f6c23e', '#e74a3b', '#858796'
        ]
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => '$' + value.toFixed(2)
          }
        }
      }
    }
  });

  // Units Sold Chart
  unitsChart = new Chart(unitsChartCanvas, {
    type: 'pie',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          '#4e73df', '#1cc88a', '#36b9cc',
          '#f6c23e', '#e74a3b', '#858796'
        ]
      }]
    }
  });

  // Sales Trend Chart
  trendChart = new Chart(trendChartCanvas, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Sales Trend',
        data: [],
        borderColor: '#4e73df',
        tension: 0.1
      }]
    }
  });
} catch (error) {
  console.error('Error initializing charts:', error);
  cleanupCharts(); // Cleanup on error
}
}

// Update populateReportCategories function
function populateReportCategories() {
  if (!reportCategorySelect) return;
  
  // Clear existing options except "All Categories"
  reportCategorySelect.innerHTML = '<option value="all">All Categories</option>';
  
  // Add all product categories
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    reportCategorySelect.appendChild(option);
  });
}


// Generate Report Data
function generateReportData(startDate, endDate, category = 'all') {
  const filteredSales = salesArray.filter(sale => {
    const saleDate = new Date(sale.orderDate);
    return saleDate >= startDate && 
           saleDate <= endDate && 
           (category === 'all' || sale.category === category);
  });

  // Calculate totals
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const totalUnits = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);

  // Group by category
  const categoryData = {};
  filteredSales.forEach(sale => {
    if (!categoryData[sale.category]) {
      categoryData[sale.category] = {
        units: 0,
        revenue: 0
      };
    }
    categoryData[sale.category].units += sale.quantity;
    categoryData[sale.category].revenue += sale.totalPrice;
  });

  return {
    filteredSales,
    totalRevenue,
    totalUnits,
    categoryData
  };
}

// Update Charts
function updateCharts(reportData) {
  const { categoryData } = reportData;
  const categories = Object.keys(categoryData);

  // Update Revenue Chart
  revenueChart.data.labels = categories;
  revenueChart.data.datasets[0].data = categories.map(cat => categoryData[cat].revenue);
  revenueChart.update();

  // Update Units Chart
  unitsChart.data.labels = categories;
  unitsChart.data.datasets[0].data = categories.map(cat => categoryData[cat].units);
  unitsChart.update();

  // Update Trend Chart
  const trendData = getTrendData(reportData.filteredSales);
  trendChart.data.labels = Object.keys(trendData);
  trendChart.data.datasets[0].data = Object.values(trendData);
  trendChart.update();
}

// Get Trend Data
function getTrendData(sales) {
  const trendData = {};
  sales.sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate))
    .forEach(sale => {
      const date = new Date(sale.orderDate).toLocaleDateString();
      trendData[date] = (trendData[date] || 0) + sale.totalPrice;
    });
  return trendData;
}

// Update generateReportHTML function
function generateReportHTML(reportData, type) {
  const html = {
    summary: generateSummaryReport(reportData),
    detailed: generateDetailedReport(reportData),
    category: generateCategoryAnalysis(reportData),
    customer: generateCustomerAnalysis(reportData)
  }[type] || '';

  // Update both summary and details sections
  document.getElementById('report-summary').innerHTML = html;
  
  return html;
}


// Generate Summary Report
function generateSummaryReport(reportData) {
  const { totalRevenue, totalUnits, categoryData } = reportData;
  
  return `
    <div class="report-summary">
      <h4>Sales Report Summary</h4>
      <p>Total Revenue: $${totalRevenue.toFixed(2)}</p>
      <p>Total Units Sold: ${totalUnits}</p>
      <table class="report-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Units Sold</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(categoryData).map(([category, data]) => `
            <tr>
              <td>${category}</td>
              <td>${data.units}</td>
              <td>$${data.revenue.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
// Generate Customer Analysis
function generateCustomerAnalysis(reportData) {
  const { filteredSales } = reportData;
  
  // Group sales by customer
  const customerData = {};
  filteredSales.forEach(sale => {
    if (!customerData[sale.customerName]) {
      customerData[sale.customerName] = {
        orders: 0,
        totalSpent: 0,
        categories: new Set(),
        lastOrder: sale.orderDate
      };
    }
    
    const customer = customerData[sale.customerName];
    customer.orders++;
    customer.totalSpent += sale.totalPrice;
    customer.categories.add(sale.category);
    customer.lastOrder = new Date(Math.max(
      new Date(customer.lastOrder),
      new Date(sale.orderDate)
    ));
  });

  return `
    <div class="customer-analysis">
      <h4>Customer Purchase Analysis</h4>
      <table class="report-table">
        <thead>
          <tr>
            <th>Customer Name</th>
            <th>Total Orders</th>
            <th>Total Spent</th>
            <th>Categories Purchased</th>
            <th>Average Order Value</th>
            <th>Last Order Date</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(customerData).map(([customer, data]) => `
            <tr>
              <td>${customer}</td>
              <td>${data.orders}</td>
              <td>$${data.totalSpent.toFixed(2)}</td>
              <td>${Array.from(data.categories).join(', ')}</td>
              <td>$${(data.totalSpent / data.orders).toFixed(2)}</td>
              <td>${new Date(data.lastOrder).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
// Generate Detailed Report
function generateDetailedReport(reportData) {
  const { filteredSales } = reportData;
  
  return `
    <div class="detailed-report">
      <h4>Detailed Sales Records</h4>
      <table class="report-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Price/Unit</th>
            <th>Total Price</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${filteredSales.map(sale => `
            <tr>
              <td>${new Date(sale.orderDate).toLocaleDateString()}</td>
              <td>${sale.orderId}</td>
              <td>${sale.customerName}</td>
              <td>${sale.category}</td>
              <td>${sale.quantity}</td>
              <td>$${(sale.totalPrice / sale.quantity).toFixed(2)}</td>
              <td>$${sale.totalPrice.toFixed(2)}</td>
              <td>${sale.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
// Add Category Analysis Report Generation
function generateCategoryAnalysis(reportData) {
  const { categoryData, totalRevenue, totalUnits } = reportData;

  return `
    <div class="category-analysis">
      <h4>Category Performance Analysis</h4>
      <table class="report-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Units Sold</th>
            <th>Revenue</th>
            <th>% of Total Revenue</th>
            <th>% of Total Units</th>
            <th>Average Price per Unit</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(categoryData).map(([category, data]) => `
            <tr>
              <td>${category}</td>
              <td>${data.units}</td>
              <td>$${data.revenue.toFixed(2)}</td>
              <td>${((data.revenue / totalRevenue) * 100).toFixed(1)}%</td>
              <td>${((data.units / totalUnits) * 100).toFixed(1)}%</td>
              <td>$${(data.revenue / data.units).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="category-summary">
        <p><strong>Total Revenue:</strong> $${totalRevenue.toFixed(2)}</p>
        <p><strong>Total Units:</strong> ${totalUnits}</p>
      </div>
    </div>
  `;
}



// Export Report
async function exportReport(format, reportData) {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const startDate = new Date(reportStartDate.value);
    const endDate = new Date(reportEndDate.value);
    const type = reportType.value;

    // Title Page
    doc.setFontSize(20);
    doc.text('Sales Report', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 105, 30, { align: 'center' });
    doc.text(`Report Type: ${type.charAt(0).toUpperCase() + type.slice(1)}`, 105, 40, { align: 'center' });

    // Summary Section
    const summaryData = [
      ['Total Revenue', `$${reportData.totalRevenue.toFixed(2)}`],
      ['Total Units Sold', reportData.totalUnits],
      ['Number of Sales', reportData.filteredSales.length]
    ];

    doc.autoTable({
      startY: 50,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [81, 48, 81] }
    });

    // Charts Section
    try {
      // Revenue Chart
      if (revenueChart) {
        doc.addPage();
        doc.text('Revenue Analysis', 15, 15);
        const revenueImg = await html2canvas(revenueChartCanvas);
        const revenueImgData = revenueImg.toDataURL('image/png');
        doc.addImage(revenueImgData, 'PNG', 15, 25, 180, 100);
      }

      // Units Chart
      if (unitsChart) {
        doc.text('Units Distribution', 15, 140);
        const unitsImg = await html2canvas(unitsChartCanvas);
        const unitsImgData = unitsImg.toDataURL('image/png');
        doc.addImage(unitsImgData, 'PNG', 15, 150, 180, 100);
      }

      // Add Trend Chart
      doc.addPage();
      doc.text('Sales Trend', 15, 15);
      if (trendChart) {
        const trendImg = await html2canvas(trendChartCanvas);
        const trendImgData = trendImg.toDataURL('image/png');
        doc.addImage(trendImgData, 'PNG', 15, 25, 180, 100);
      }
    } catch (chartError) {
      console.error('Error adding charts:', chartError);
    }

    // Category Analysis
    doc.addPage();
    doc.text('Category Analysis', 15, 15);
    const categoryData = Object.entries(reportData.categoryData).map(([category, data]) => [
      category,
      data.units,
      `$${data.revenue.toFixed(2)}`,
      `${((data.revenue / reportData.totalRevenue) * 100).toFixed(1)}%`
    ]);

    doc.autoTable({
      startY: 25,
      head: [['Category', 'Units Sold', 'Revenue', '% of Total']],
      body: categoryData,
      theme: 'grid'
    });

    // Customer Analysis Section
    doc.addPage();
    doc.text('Customer Analysis', 15, 15);
    
    const customerData = Object.entries(generateCustomerData(reportData.filteredSales))
      .map(([customer, data]) => [
        customer,
        data.orders,
        `$${data.totalSpent.toFixed(2)}`,
        Array.from(data.categories).join(', '),
        `$${(data.totalSpent / data.orders).toFixed(2)}`
      ]);

    doc.autoTable({
      startY: 25,
      head: [['Customer', 'Orders', 'Total Spent', 'Categories', 'Avg Order']],
      body: customerData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        3: { cellWidth: 50 } // Make categories column wider
      }
    });

    // Save PDF
    doc.save(`sales_report_${startDate.toLocaleDateString()}.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF report. Please try again.');
  }
}
// Helper function to generate customer data
function generateCustomerData(sales) {
  const customerData = {};
  sales.forEach(sale => {
    if (!customerData[sale.customerName]) {
      customerData[sale.customerName] = {
        orders: 0,
        totalSpent: 0,
        categories: new Set()
      };
    }
    const customer = customerData[sale.customerName];
    customer.orders++;
    customer.totalSpent += sale.totalPrice;
    customer.categories.add(sale.category);
  });
  return customerData;
}

// Update export button event listener
document.getElementById('export-pdf')?.addEventListener('click', () => {
  const startDate = new Date(reportStartDate.value);
  const endDate = new Date(reportEndDate.value);
  const category = reportCategory.value;
  const reportData = generateReportData(startDate, endDate, category);
  exportReport('pdf', reportData);
});


// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  const exportButton = document.getElementById('export-pdf');
  if (exportButton) {
    // Remove old listeners
    const newExportButton = exportButton.cloneNode(true);
    exportButton.parentNode.replaceChild(newExportButton, exportButton);
    
    // Add single listener
    newExportButton.addEventListener('click', () => {
      const startDate = new Date(reportStartDate.value);
      const endDate = new Date(reportEndDate.value);
      const category = reportCategory.value;
      const reportData = generateReportData(startDate, endDate, category);
      exportReport('pdf', reportData);
    });
  }
});
// Make functions globally accessible
window.generateReportData = generateReportData;
window.updateCharts = updateCharts;
window.exportReport = exportReport;
window.populateReportCategories = populateReportCategories;  // Add this line