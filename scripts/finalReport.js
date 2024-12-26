class ComprehensiveReport {
   // DOM Element References
  constructor() {
    this.form = document.getElementById('comprehensive-report-form');
    this.startDate = document.getElementById('comprehensive-start-date');
    this.endDate = document.getElementById('comprehensive-end-date');
    this.resultsDiv = document.getElementById('comprehensive-report-results');
    this.exportButton = document.getElementById('export-comprehensive-report');

    // Chart Instances
    this.overviewChart = null;
    this.categoryChart = null;
    // Initialize Event Handlers
    this.initializeEventListeners();
  }

  initializeEventListeners() {
     // Form submission handler
    this.form?.addEventListener('submit', (e) => this.generateReport(e));
    // PDF export handler
    this.exportButton?.addEventListener('click', () => this.exportToPDF());
  }

  async generateReport(event) {
    event.preventDefault();
    // Get date range from form
    const startDate = new Date(this.startDate.value);
    const endDate = new Date(this.endDate.value);
     // Generate and display report
    const reportData = this.gatherReportData(startDate, endDate);
    this.displayReport(reportData);
    this.updateCharts(reportData);
  }

  gatherReportData(startDate, endDate) {
    // Get sales data
    const salesArray = JSON.parse(localStorage.getItem('sales')) || [];
    const filteredSales = salesArray.filter(sale => {
      const saleDate = new Date(sale.orderDate);
      return saleDate >= startDate && saleDate <= endDate;
    });

    // Get purchases data
    const purchasesArray = JSON.parse(localStorage.getItem('purchases')) || [];
    const filteredPurchases = purchasesArray.filter(purchase => {
      const purchaseDate = new Date(purchase.date);
      return purchaseDate >= startDate && purchaseDate <= endDate;
    });

    // Calculate totals
    const totalIncome = filteredSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalExpenses = filteredPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
    const taxRate = parseFloat(localStorage.getItem('taxRate')) || 18;
    const taxAmount = (totalIncome * taxRate) / 100;
    const netProfit = totalIncome - totalExpenses - taxAmount;

    // Calculate sales by category
    const salesByCategory = {};
    filteredSales.forEach(sale => {
      if (!salesByCategory[sale.category]) {
        salesByCategory[sale.category] = {
          units: 0,
          revenue: 0
        };
      }
      salesByCategory[sale.category].units += sale.quantity;
      salesByCategory[sale.category].revenue += sale.totalPrice;
    });

    // Get current inventory
    const inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    const currentStock = inventory.map(item => ({
      category: item.category,
      stock: item.packets
    }));

    return {
      totalIncome,
      totalExpenses,
      taxAmount,
      taxRate,
      netProfit,
      salesByCategory,
      currentStock
    };
  }

  displayReport(data) {
    this.resultsDiv.innerHTML = `
      <div class="report-section">
        <h4>Financial Overview</h4>
        <table class="report-table">
          <tr>
            <td>Total Income</td>
            <td>$${data.totalIncome.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Total Expenses</td>
            <td>$${data.totalExpenses.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Tax Applied (${data.taxRate}%)</td>
            <td>$${data.taxAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Net Profit</td>
            <td>$${data.netProfit.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div class="report-section">
        <h4>Sales by Category</h4>
        <table class="report-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Units Sold</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(data.salesByCategory).map(([category, stats]) => `
              <tr>
                <td>${category}</td>
                <td>${stats.units}</td>
                <td>$${stats.revenue.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="report-section">
        <h4>Current Inventory Status</h4>
        <table class="report-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Current Stock</th>
            </tr>
          </thead>
          <tbody>
            ${data.currentStock.map(item => `
              <tr>
                <td>${item.category}</td>
                <td>${item.stock} packets</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  updateCharts(data) {
    const overviewCtx = document.getElementById('comprehensive-overview-chart');
    const categoryCtx = document.getElementById('comprehensive-category-chart');

    // Cleanup existing charts
    if (this.overviewChart) this.overviewChart.destroy();
    if (this.categoryChart) this.categoryChart.destroy();

    // Create Overview Chart
    this.overviewChart = new Chart(overviewCtx, {
      type: 'bar',
      data: {
        labels: ['Income', 'Expenses', 'Tax', 'Net Profit'],
        datasets: [{
          label: 'Financial Overview',
          data: [
            data.totalIncome,
            data.totalExpenses,
            data.taxAmount,
            data.netProfit
          ],
          backgroundColor: [
            '#4e73df',
            '#e74a3b',
            '#f6c23e',
            '#1cc88a'
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

    // Create Category Chart
    this.categoryChart = new Chart(categoryCtx, {
      type: 'pie',
      data: {
        labels: Object.keys(data.salesByCategory),
        datasets: [{
          data: Object.values(data.salesByCategory).map(cat => cat.revenue),
          backgroundColor: [
            '#4e73df', '#1cc88a', '#36b9cc',
            '#f6c23e', '#e74a3b', '#858796'
          ]
        }]
      },
      options: {
        responsive: true
      }
    });
  }

  async exportToPDF() {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const startDate = new Date(this.startDate.value);
      const endDate = new Date(this.endDate.value);
      
      // Add title
      doc.setFontSize(20);
      doc.text('Comprehensive Report', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 105, 30, { align: 'center' });

      // Add report content
      const reportData = this.gatherReportData(startDate, endDate);
      
      // Add financial overview
      doc.text('Financial Overview', 15, 45);
      const financialData = [
        ['Total Income', `$${reportData.totalIncome.toFixed(2)}`],
        ['Total Expenses', `$${reportData.totalExpenses.toFixed(2)}`],
        ['Tax Amount', `$${reportData.taxAmount.toFixed(2)}`],
        ['Net Profit', `$${reportData.netProfit.toFixed(2)}`]
      ];

      doc.autoTable({
        startY: 50,
        head: [['Metric', 'Amount']],
        body: financialData
      });

      // Add sales by category
      doc.addPage();
      doc.text('Sales by Category', 15, 15);
      const categoryData = Object.entries(reportData.salesByCategory).map(([category, stats]) => [
        category,
        stats.units.toString(),
        `$${stats.revenue.toFixed(2)}`
      ]);

      doc.autoTable({
        startY: 25,
        head: [['Category', 'Units Sold', 'Revenue']],
        body: categoryData
      });

      // Add inventory status
      doc.text('Current Inventory Status', 15, doc.autoTable.previous.finalY + 20);
      const inventoryData = reportData.currentStock.map(item => [
        item.category,
        `${item.stock} packets`
      ]);

      doc.autoTable({
        startY: doc.autoTable.previous.finalY + 30,
        head: [['Category', 'Current Stock']],
        body: inventoryData
      });

      // Add charts
      try {
        doc.addPage();
        doc.text('Charts', 15, 15);
        
        const overviewImg = await html2canvas(document.getElementById('comprehensive-overview-chart'));
        const overviewImgData = overviewImg.toDataURL('image/png');
        doc.addImage(overviewImgData, 'PNG', 15, 25, 180, 100);

        const categoryImg = await html2canvas(document.getElementById('comprehensive-category-chart'));
        const categoryImgData = categoryImg.toDataURL('image/png');
        doc.addImage(categoryImgData, 'PNG', 15, 140, 180, 100);
      } catch (chartError) {
        console.error('Error adding charts to PDF:', chartError);
      }

      // Save PDF
      doc.save(`comprehensive_report_${startDate.toLocaleDateString()}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ComprehensiveReport();
});