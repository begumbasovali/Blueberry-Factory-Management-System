//Revenue Display Elements
const dailyRevenueElement = document.getElementById("daily-revenue");
const weeklyRevenueElement = document.getElementById("weekly-revenue");
const monthlyRevenueElement = document.getElementById("monthly-revenue");
const totalRevenueElement = document.getElementById("total-revenue");
const categoryRevenueTable = document.getElementById("category-revenue-table");

//1. Revenue Calculation
function calculateRevenue(sales, startDate, endDate) {
  try {
    if (!Array.isArray(sales)) return 0;
    
  return sales
    .filter(sale => {
      const saleDate = new Date(sale.orderDate);
      return saleDate >= startDate && saleDate <= endDate;
    })
    .reduce((total, sale) => total + sale.totalPrice, 0);
  } catch (error) {
    console.error('Error calculating revenue:', error);
    return 0;
  }
}

//2. Revenue Calculation Displaying
function updateRevenueDisplays() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);


  const dailyRevenue = calculateRevenue(salesArray, today, now);
  const weeklyRevenue = calculateRevenue(salesArray, weekStart, now);
  const monthlyRevenue = calculateRevenue(salesArray, monthStart, now);
   // Calculate total revenue from all sales
   const totalRevenue = salesArray.reduce((total, sale) => total + sale.totalPrice, 0);


  dailyRevenueElement.textContent = `$${dailyRevenue.toFixed(2)}`;
  weeklyRevenueElement.textContent = `$${weeklyRevenue.toFixed(2)}`;
  monthlyRevenueElement.textContent = `$${monthlyRevenue.toFixed(2)}`;
  totalRevenueElement.textContent = `$${totalRevenue.toFixed(2)}`;

}


function updateCategoryRevenue() {
  const categoryStats = {};
  
  salesArray.forEach(sale => {
    if (!categoryStats[sale.category]) {
      categoryStats[sale.category] = {
        units: 0,
        revenue: 0
      };
    }
    categoryStats[sale.category].units += sale.quantity;
    categoryStats[sale.category].revenue += sale.totalPrice;
  });

  categoryRevenueTable.innerHTML = Object.entries(categoryStats)
    .map(([category, stats]) => `
      <tr>
        <td>${category}</td>
        <td>${stats.units}</td>
        <td>$${stats.revenue.toFixed(2)}</td>
      </tr>
    `).join('');
}

// Initialize analytics
function initializeSalesAnalytics() {
  try {
  const salesArray = JSON.parse(localStorage.getItem("sales")) || [];
  updateRevenueDisplays(salesArray);
  updateCategoryRevenue(salesArray);
} catch (error) {
  console.error('Error initializing sales analytics:', error);
}
}

// Make functions globally accessible
window.updateRevenueDisplays = updateRevenueDisplays;
window.updateCategoryRevenue = updateCategoryRevenue;
window.initializeSalesAnalytics = initializeSalesAnalytics;