/**
  Purchase Management System
 Handles purchase operations including CRUD, filtering, search and reporting
 **/
 // 1. Class Definition
class Purchase {
  constructor(id, farmerId, date, quantity, pricePerKg) {
    this.id = id;
    this.farmerId = farmerId;
    this.date = date;
    this.quantity = quantity;
    this.pricePerKg = pricePerKg;
    this.totalCost = quantity * pricePerKg;
  }
}

// 2. State Management
let purchasesArray = JSON.parse(localStorage.getItem("purchases")) || [];

//3. DOM Elements for Purchase
const purchaseForm = document.getElementById("purchase-form");
const purchaseIdInput = document.getElementById("purchase-id");
const selectFarmerInput = document.getElementById("select-farmer");
const quantityInput = document.getElementById("quantity");
const pricePerKgInput = document.getElementById("price-per-kg");
const purchaseDateInput = document.getElementById("purchase-date");
const totalCostDisplay = document.getElementById("total-cost");
const purchaseTableBody = document.getElementById("purchase-list");
//Filter Elements
const sortPurchasesSelect = document.getElementById("sort-purchases");
const sortOrderSelect = document.getElementById("sort-order");
const minCostInput = document.getElementById("min-cost");
const maxCostInput = document.getElementById("max-cost");
// Summary Elements
const summaryForm = document.getElementById("summary-form");
const summaryResult = document.getElementById("summary-result");
const summaryFarmerSelect = document.getElementById("summary-farmer");
const summaryPeriodSelect = document.getElementById("summary-period");
// Expense Overview Elements
const expenseToday = document.getElementById("expense-today");
const expenseWeek = document.getElementById("expense-week");
const expenseMonth = document.getElementById("expense-month");
const expenseYear = document.getElementById("expense-year");
const expenseTotal = document.getElementById("expense-total");
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");

// 4. Core Purchase Functions- Handles creation of new purchase records

// Add or Update Purchase
function addOrUpdatePurchase(event) {
  event.preventDefault();

  const purchaseData = {
    id: purchaseIdInput.value.trim(),
    farmerId: selectFarmerInput.value.trim(),
    date: purchaseDateInput.value.trim(),
    quantity: parseFloat(quantityInput.value.trim()),
    pricePerKg: parseFloat(pricePerKgInput.value.trim())
  };
  if (!validatePurchaseData(purchaseData)) return;
  const newPurchase = new Purchase(
    purchaseData.id, 
    purchaseData.farmerId,
    purchaseData.date,
    purchaseData.quantity,
    purchaseData.pricePerKg
  );

  purchasesArray.push(newPurchase);
  savePurchases();
  resetPurchaseForm();
}

  /**
 * Validate Purchase Data
 * Ensures all required fields are filled correctly
 */
function validatePurchaseData(data) {
  if (!data.farmerId) {
      alert("Please select a valid Farmer ID.");
      return false;
  }
  
  if (purchasesArray.some(p => p.id === data.id)) {
      alert("A purchase with this ID already exists!");
      return false;
  }

  return true;
}

// 5. Data Management Functions
/**
 * Save Purchases to LocalStorage
 * Updates localStorage and triggers UI updates
 */

// Save Purchases to LocalStorage
function savePurchases() {
  localStorage.setItem("purchases", JSON.stringify(purchasesArray));
  document.dispatchEvent(new Event('purchasesUpdated'));
  
  updatePurchaseTable(); // Update the purchase table
  calculateTotalQuantity();
  calculateAndDisplayOverview(); // Update Expense Overview
  generatePurchaseSummary(); // Update Summary
  calculateDateRangeExpenses(); // Update date range expenses
}

// Calculate and Update Total Quantity
function calculateTotalQuantity() {
  const totalQuantity = purchasesArray.reduce(
    (sum, purchase) => sum + purchase.quantity,
    0
  );
  localStorage.setItem("totalQuantity", totalQuantity);
}

// Update Purchase Table
function updatePurchaseTable(purchases = purchasesArray) {
  purchaseTableBody.innerHTML = "";
  purchases.forEach((purchase, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${purchase.id}</td>
      <td>${purchase.farmerId}</td>
      <td>${purchase.quantity}</td>
      <td>$${purchase.pricePerKg.toFixed(2)}</td>
      <td>$${purchase.totalCost.toFixed(2)}</td>
      <td>${purchase.date}</td>
     
    `;
    purchaseTableBody.appendChild(row);
  });
  // Update total quantity
  calculateTotalQuantity();
  calculateAndDisplayOverview(); // Update Expense Overview
  generatePurchaseSummary(); // Update Summary
  calculateDateRangeExpenses(); // Update date range expenses
  updateCurrentStock();
}

// Reset Purchase Form
function resetPurchaseForm() {
  purchaseForm.reset();
  calculateTotalCost();
}

// Calculate Total Cost
function calculateTotalCost() {
  const quantity = parseFloat(quantityInput.value) || 0;
  const pricePerKg = parseFloat(pricePerKgInput.value) || 0;
  totalCostDisplay.textContent = `$${(quantity * pricePerKg).toFixed(2)}`;
}

// 7. Search and Filter Functions
/**
 * Search Purchases
 * Filters purchases based on search input
 */
// Search Purchases
function searchPurchases() {
  const searchTerm = document
    .getElementById("search-purchases-input")
    .value.toLowerCase();
  const filteredPurchases = purchasesArray.filter(
    (purchase) =>
      purchase.id.toLowerCase().includes(searchTerm) ||
      purchase.farmerId.toLowerCase().includes(searchTerm) ||
      purchase.quantity.toString().includes(searchTerm) ||
      purchase.totalCost.toString().includes(searchTerm)
  );

  updatePurchaseTable(filteredPurchases);
}
// Sort Purchases
function sortPurchases() {
  const sortBy = sortPurchasesSelect.value;
  const sortOrder = sortOrderSelect.value;
  if (sortBy === "none") return updatePurchaseTable();

  const sortedPurchases = [...purchasesArray].sort((a, b) => {
      switch(sortBy) {
          case "date": return new Date(a.date) - new Date(b.date);
          case "farmer": return a.farmerId.localeCompare(b.farmerId);
          case "amount": return a.quantity - b.quantity;
          default: return 0;
      }
  });

  if (sortOrder === "desc") sortedPurchases.reverse();
  updatePurchaseTable(sortedPurchases);
}

// Filter by Cost Range
function filterByCostRange() {
  const minCost = parseFloat(minCostInput.value) || 0;
  const maxCost = parseFloat(maxCostInput.value) || Number.MAX_VALUE;

  const filteredPurchases = purchasesArray.filter(
    (purchase) => purchase.totalCost >= minCost && purchase.totalCost <= maxCost
  );

  updatePurchaseTable(filteredPurchases);
}
document.getElementById("apply-cost-filter").addEventListener("click", filterByCostRange);

// Clear Filters
function clearFilters() {
  // Reset filter inputs to their default values
  sortPurchasesSelect.value = "none";
  sortOrderSelect.value = "none";
  minCostInput.value = "";
  maxCostInput.value = "";

  // Reset search input
  //document.getElementById("search-purchases-input").value = "";

  // Update the table with the original purchases array
  updatePurchaseTable(purchasesArray);
}

// Attach event listener to the Clear Filters button
document.getElementById("clear-purchases-filters-btn").addEventListener("click", clearFilters);


document.getElementById("search-purchases-btn").addEventListener("click", searchPurchases);
document.getElementById("clear-purchases-btn").addEventListener("click", () => {
document.getElementById("search-purchases-input").value = "";
  updatePurchaseTable();
});

// Populate Farmer Options
function populateFarmerOptions() {
  const farmersArray = JSON.parse(localStorage.getItem("farmers")) || [];
  selectFarmerInput.innerHTML = '<option value="">Select Farmer ID</option>';
  summaryFarmerSelect.innerHTML = '<option value="">All Farmers</option>';
  farmersArray.forEach((farmer) => {
    const option = document.createElement("option");
    option.value = farmer.id;
    option.textContent = `${farmer.id} - ${farmer.name}`;
    selectFarmerInput.appendChild(option);
    summaryFarmerSelect.appendChild(option.cloneNode(true));
  });
}

// Generate Purchase Summary
function generatePurchaseSummary(event) {
  if (event) event.preventDefault();

  const selectedFarmerId = summaryFarmerSelect.value;
  const selectedPeriod = summaryPeriodSelect.value;
  const today = new Date();

  let filteredPurchases = purchasesArray;
  let farmerName = "All Farmers";

  if (selectedFarmerId) {
    filteredPurchases = filteredPurchases.filter(
      (purchase) => purchase.farmerId === selectedFarmerId
    );
    const selectedFarmer = JSON.parse(localStorage.getItem("farmers")).find(
      (farmer) => farmer.id === selectedFarmerId
    );
    farmerName = `${selectedFarmer.id} - ${selectedFarmer.name}`;
  }

  if (selectedPeriod !== "all") {
    filteredPurchases = filteredPurchases.filter((purchase) => {
      const purchaseDate = new Date(purchase.date);
      const timeDifference = (today - purchaseDate) / (1000 * 60 * 60 * 24);

      if (selectedPeriod === "daily" && timeDifference <= 1) {
        return true;
      } else if (selectedPeriod === "weekly" && timeDifference <= 7) {
        return true;
      } else if (selectedPeriod === "monthly" && timeDifference <= 30) {
        return true;
      }
      return false;
    });
  }

  const totalQuantity = filteredPurchases.reduce(
    (sum, purchase) => sum + purchase.quantity,
    0
  );
  const totalCost = filteredPurchases.reduce(
    (sum, purchase) => sum + purchase.totalCost,
    0
  );

  summaryResult.innerHTML = `
  <div class="summary-card">
    <h4>Summary for ${farmerName} (${selectedPeriod})</h4>
    <p><strong>Total Quantity:</strong> ${totalQuantity} kg</p>
    <p><strong>Total Cost:</strong> $${totalCost.toFixed(2)}</p>
  </div>
`;
}

// 8. Report Generation Functions
/**
 * Calculate and Display Expense Overview
 * Generates overview of expenses for different time periods
 */
// Calculate and Display Expense Overview
function calculateAndDisplayOverview() {
  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0));
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const totals = {
      today: 0, week: 0, month: 0, year: 0, allTime: 0
  };

  purchasesArray.forEach(purchase => {
      const purchaseDate = new Date(purchase.date);
      if (purchaseDate >= startOfToday) totals.today += purchase.totalCost;
      if (purchaseDate >= startOfWeek) totals.week += purchase.totalCost;
      if (purchaseDate >= startOfMonth) totals.month += purchase.totalCost;
      if (purchaseDate >= startOfYear) totals.year += purchase.totalCost;
      totals.allTime += purchase.totalCost;
  });

  // Update displays
  expenseToday.textContent = `$${totals.today.toFixed(2)}`;
  expenseWeek.textContent = `$${totals.week.toFixed(2)}`;
  expenseMonth.textContent = `$${totals.month.toFixed(2)}`;
  expenseYear.textContent = `$${totals.year.toFixed(2)}`;
  expenseTotal.textContent = `$${totals.allTime.toFixed(2)}`;
}


// Calculate Expenses for Date Range
function calculateDateRangeExpenses() {
  const startDate = new Date(startDateInput.value);
  const endDate = new Date(endDateInput.value);
  let total = 0;

  purchasesArray.forEach((purchase) => {
    const purchaseDate = new Date(purchase.date);
    if (purchaseDate >= startDate && purchaseDate <= endDate) {
      total += purchase.totalCost;
    }
  });

  // Update the total expenses display
  document.getElementById("total-expenses").textContent = `$${total.toFixed(
    2
  )}`;
}

// Handle Expense Calculation Form Submission
document.getElementById("expense-calculation-form").addEventListener("submit", (e) => {
    e.preventDefault();
    calculateDateRangeExpenses();
  });



//9. Event Listeners 
document.addEventListener("DOMContentLoaded", () => {
  populateFarmerOptions();
  updatePurchaseTable();
  calculateAndDisplayOverview();
  calculateTotalQuantity();
  calculateDateRangeExpenses();
   // Form submissions
  purchaseForm.addEventListener("submit", addOrUpdatePurchase);
  summaryForm.addEventListener("submit", generatePurchaseSummary);
// Input changes
  quantityInput.addEventListener("input", calculateTotalCost);
  pricePerKgInput.addEventListener("input", calculateTotalCost);
// Filtering and sorting
sortPurchasesSelect.addEventListener("change", sortPurchases);
document.getElementById("sort-order").addEventListener("change", sortPurchases);
 // Date range changes
 startDateInput.addEventListener("change", calculateDateRangeExpenses);
endDateInput.addEventListener("change", calculateDateRangeExpenses);
currentStock = calculateCurrentStock(); // Stok hesaplama
  updateCurrentStock(); // DOM güncellemesi
  // Ensure purchasesArray is loaded from localStorage
  purchasesArray = JSON.parse(localStorage.getItem("purchases")) || [];
});
