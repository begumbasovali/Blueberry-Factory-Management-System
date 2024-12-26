// DOM Elements
const totalIncomeElement = document.getElementById('total-income');
const totalExpensesElement = document.getElementById('financial-total-expenses');
const taxAmountElement = document.getElementById('tax-amount');
const netProfitElement = document.getElementById('net-profit');
const taxRateInput = document.getElementById('tax-rate');
const taxForm = document.getElementById('tax-form');

const financialReportForm = document.getElementById('financial-report-form');
const reportStartInput = document.getElementById('report-start');
const reportEndInput = document.getElementById('report-end');
const financialReportResults = document.getElementById('financial-report-results');
const exportFinancialReportBtn = document.getElementById('export-financial-report');
const incomeExpenseChart = document.getElementById('income-expense-chart');
const profitTrendChart = document.getElementById('profit-trend-chart');

let incomeExpenseChartInstance = null;
let profitTrendChartInstance = null;
// Generate Financial Report
function generateFinancialReport(event) {
  event.preventDefault();

  const startDate = new Date(reportStartInput.value);
  const endDate = new Date(reportEndInput.value);
  const financials = calculateFinancialsForDateRange(startDate, endDate);

  // Generate report HTML
  const reportHTML = `
    <div class="report-section">
      <h4>Financial Report (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})</h4>
      <table class="report-table">
        <tr>
          <th>Metric</th>
          <th>Amount</th>
        </tr>
        <tr>
          <td>Total Income</td>
          <td>$${financials.totalIncome.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Total Expenses</td>
          <td>$${financials.totalExpenses.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Tax Amount (${currentTaxRate}%)</td>
          <td>$${financials.taxAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Net Profit</td>
          <td>$${financials.netProfit.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Number of Sales</td>
          <td>${financials.salesCount}</td>
        </tr>
        <tr>
          <td>Number of Purchases</td>
          <td>${financials.purchasesCount}</td>
        </tr>
      </table>
    </div>
  `;

  financialReportResults.innerHTML = reportHTML;
  updateFinancialCharts(startDate, endDate);
}
// Update Financial Charts
function updateFinancialCharts(startDate, endDate) {
  const financials = calculateFinancialsForDateRange(startDate, endDate);
  
  // Cleanup existing charts
  if (incomeExpenseChartInstance) {
    incomeExpenseChartInstance.destroy();
  }
  if (profitTrendChartInstance) {
    profitTrendChartInstance.destroy();
  }

  // Income vs Expenses Chart
  incomeExpenseChartInstance = new Chart(incomeExpenseChart, {
    type: 'bar',
    data: {
      labels: ['Income', 'Expenses', 'Net Profit'],
      datasets: [{
        label: 'Amount ($)',
        data: [
          financials.totalIncome,
          financials.totalExpenses,
          financials.netProfit
        ],
        backgroundColor: [
          '#4e73df',
          '#e74a3b',
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

  // Get trend data
  const trendData = calculateProfitTrend(startDate, endDate);

  // Profit Trend Chart
  profitTrendChartInstance = new Chart(profitTrendChart, {
    type: 'line',
    data: {
      labels: trendData.dates,
      datasets: [{
        label: 'Net Profit',
        data: trendData.profits,
        borderColor: '#1cc88a',
        tension: 0.1
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
}

// Calculate Profit Trend
function calculateProfitTrend(startDate, endDate) {
  const dates = [];
  const profits = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dailyFinancials = calculateFinancialsForDateRange(currentDate, dayEnd);
    
    dates.push(currentDate.toLocaleDateString());
    profits.push(dailyFinancials.netProfit);

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { dates, profits };
}

// Export Financial Report
async function exportFinancialReport() {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const startDate = new Date(reportStartInput.value);
    const endDate = new Date(reportEndInput.value);
    const financials = calculateFinancialsForDateRange(startDate, endDate);

    // Add title
    doc.setFontSize(16);
    doc.text('Financial Report', 15, 15);
    doc.setFontSize(12);
    doc.text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 15, 25);

    // Add financial summary
    const financialData = [
      ['Total Income', `$${financials.totalIncome.toFixed(2)}`],
      ['Total Expenses', `$${financials.totalExpenses.toFixed(2)}`],
      ['Tax Amount', `$${financials.taxAmount.toFixed(2)}`],
      ['Net Profit', `$${financials.netProfit.toFixed(2)}`],
      ['Number of Sales', financials.salesCount],
      ['Number of Purchases', financials.purchasesCount]
    ];

    // Generate table
    doc.autoTable({
      startY: 40,
      head: [['Metric', 'Amount']],
      body: financialData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 5
      },
      headStyles: {
        fillColor: [81, 48, 81],
        textColor: [255, 255, 255]
      }
    });

    try {
      // Add charts
      if (incomeExpenseChart) {
        const incomeExpenseImg = await html2canvas(incomeExpenseChart);
        const incomeExpenseImgData = incomeExpenseImg.toDataURL('image/png');
        doc.addPage();
        doc.text('Income vs Expenses Chart', 15, 15);
        doc.addImage(incomeExpenseImgData, 'PNG', 15, 25, 180, 100);
      }

      if (profitTrendChart) {
        const profitTrendImg = await html2canvas(profitTrendChart);
        const profitTrendImgData = profitTrendImg.toDataURL('image/png');
        doc.addPage();
        doc.text('Profit Trend Chart', 15, 15);
        doc.addImage(profitTrendImgData, 'PNG', 15, 25, 180, 100);
      }
    } catch (chartError) {
      console.error('Error adding charts to PDF:', chartError);
      // Continue without charts if there's an error
    }

    // Save PDF
    doc.save(`financial_report_${startDate.toLocaleDateString()}.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF report. Please try again.');
  }
}

// Initialize financial state
let currentTaxRate = parseFloat(localStorage.getItem('taxRate')) || 18;

// Financial Calculations
function calculateFinancials() {
  try {
    // Get sales and purchases data
    const salesArray = JSON.parse(localStorage.getItem('sales')) || [];
    const purchasesArray = JSON.parse(localStorage.getItem('purchases')) || [];

    // Calculate total income from sales
    const totalIncome = salesArray.reduce((sum, sale) => sum + sale.totalPrice, 0);

    // Calculate total expenses from purchases
    const totalExpenses = purchasesArray.reduce((sum, purchase) => {
      // Make sure we're accessing the correct property (totalCost)
      return sum + (purchase.totalCost || 0);
    }, 0);

    // Calculate tax amount
    const taxAmount = (totalIncome * currentTaxRate) / 100;

    // Calculate net profit
    const netProfit = totalIncome - totalExpenses - taxAmount;

    return {
      totalIncome,
      totalExpenses,
      taxAmount,
      netProfit
    };
  } catch (error) {
    console.error('Error calculating financials:', error);
    return {
      totalIncome: 0,
      totalExpenses: 0,
      taxAmount: 0,
      netProfit: 0
    };
  }
}

// Update financial displays
function updateFinancialDisplays() {
  const financials = calculateFinancials();
  
  totalIncomeElement.textContent = `$${financials.totalIncome.toFixed(2)}`;
  totalExpensesElement.textContent = `$${financials.totalExpenses.toFixed(2)}`;
  taxAmountElement.textContent = `$${financials.taxAmount.toFixed(2)}`;
  netProfitElement.textContent = `$${financials.netProfit.toFixed(2)}`;
}
// Add listener for purchase updates
document.addEventListener('purchasesUpdated', updateFinancialDisplays);

// Handle tax rate updates
function handleTaxRateUpdate(event) {
  event.preventDefault();
  
  const newTaxRate = parseFloat(taxRateInput.value);
  if (isNaN(newTaxRate) || newTaxRate < 0 || newTaxRate > 100) {
    alert('Please enter a valid tax rate between 0 and 100');
    return;
  }

  currentTaxRate = newTaxRate;
  localStorage.setItem('taxRate', newTaxRate.toString());
  updateFinancialDisplays();
  alert(`Tax rate updated to ${newTaxRate}%`);
}

// Calculate financials for date range
function calculateFinancialsForDateRange(startDate, endDate) {
  const salesArray = JSON.parse(localStorage.getItem('sales')) || [];
  const purchasesArray = JSON.parse(localStorage.getItem('purchases')) || [];

  // Filter transactions within date range
  const filteredSales = salesArray.filter(sale => {
    const saleDate = new Date(sale.orderDate);
    return saleDate >= startDate && saleDate <= endDate;
  });

  const filteredPurchases = purchasesArray.filter(purchase => {
    const purchaseDate = new Date(purchase.date);
    return purchaseDate >= startDate && purchaseDate <= endDate;
  });

  // Calculate totals
  const totalIncome = filteredSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const totalExpenses = filteredPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
  const taxAmount = (totalIncome * currentTaxRate) / 100;
  const netProfit = totalIncome - totalExpenses - taxAmount;

  return {
    totalIncome,
    totalExpenses,
    taxAmount,
    netProfit,
    salesCount: filteredSales.length,
    purchasesCount: filteredPurchases.length
  };
}

// Initialize tax rate input
function initializeTaxRate() {
  taxRateInput.value = currentTaxRate;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Initialize
  initializeTaxRate();
  updateFinancialDisplays();

   // Add financial report form listener
   financialReportForm?.addEventListener('submit', generateFinancialReport);

   // Add export button listener
   exportFinancialReportBtn?.addEventListener('click', exportFinancialReport);

  // Add tax form listener
  taxForm.addEventListener('submit', handleTaxRateUpdate);

  // Add event listeners to sales and purchases
  document.addEventListener('salesUpdated', updateFinancialDisplays);
  document.addEventListener('purchasesUpdated', updateFinancialDisplays);
});

// Export functions
window.calculateFinancials = calculateFinancials;
window.updateFinancialDisplays = updateFinancialDisplays;
window.calculateFinancialsForDateRange = calculateFinancialsForDateRange;