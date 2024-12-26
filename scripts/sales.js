// 1. Class Definition
class Sale {
  constructor(orderId, customerId, category, quantity, orderDate, status, totalPrice, customWeight = null) {
    // Validate customer exists
    const customer = customersArray.find(c => c.id === customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    this.orderId = orderId;
    this.customerId = customerId;
    this.customerName = customer.name;
    this.customerPhone = customer.phone;
    this.customerEmail = customer.email;
    this.shippingInfo = customer.shippingInfo;
    this.category = category;
    this.quantity = quantity;
    this.orderDate = orderDate;
    this.status = status;
    this.totalPrice = totalPrice;
    this.customWeight = customWeight;
    this.unitPrice = this.calculateUnitPrice();
  }

  calculateUnitPrice() {
    return this.quantity > 0 ? this.totalPrice / this.quantity : 0;
  }
}

//2. Customer Class and Functions
class Customer {
  constructor(id, name, phone, email, shippingInfo) {
    this.id = id;
    this.name = name;
    this.phone = phone;
    this.email = email;
    this.shippingInfo = shippingInfo;
  }
}
// 3. Global Variables and DOM Elements
let salesArray = JSON.parse(localStorage.getItem("sales")) || [];
let customersArray = JSON.parse(localStorage.getItem("customers")) || [];
let lastCustomerId = parseInt(localStorage.getItem("lastCustomerId")) || 1000; // Starting customer ID
let lastOrderId = parseInt(localStorage.getItem("lastOrderId")) || 1000;


const salesForm = document.getElementById("sales-form");
const customerForm = document.getElementById("customer-form");
const selectCustomer = document.getElementById("select-customer");
const customerNameInput = document.getElementById("customer-name");
const customerPhoneInput = document.getElementById("customer-phone");
const customerEmailInput = document.getElementById("customer-email");
const shippingInfoInput = document.getElementById("shipping-info");
const orderIdInput = document.getElementById("order-id");
const productCategorySelect = document.getElementById("product-category");
const customWeightGroup = document.getElementById("custom-weight-group");
const customWeightInput = document.getElementById("custom-weight");
const orderDateInput = document.getElementById("order-date");
const quantityOrderedInput = document.getElementById("quantity-ordered");
const orderStatusSelect = document.getElementById("order-status");
const totalPriceInput = document.getElementById("total-price");
const salesTableBody = document.getElementById("sales-records-table");
//Filtering and Search Elements
const statusFilter = document.getElementById("status-filter");
const categoryFilter = document.getElementById("category-filter");
const salesSearchInput = document.getElementById("sales-search");
const searchSalesBtn = document.getElementById("search-sales-btn");
const clearSalesBtn = document.getElementById("clear-sales-btn");
//Customer Modal Elements
const customerModal = document.getElementById("customer-modal");
const customerDetails = document.getElementById("customer-details");
const customerOrders = document.getElementById("customer-orders");
const closeModalBtn = document.querySelector(".close");
//Report Elements



// 4. Order ID Generation
function generateOrderId() {
  lastOrderId++;
  localStorage.setItem("lastOrderId", lastOrderId);
  return "O" + lastOrderId;
}
// 5. Customer ID Generation
function generateCustomerId() {
  lastCustomerId++;
  localStorage.setItem("lastCustomerId", lastCustomerId);
  return "C" + lastCustomerId;
}


function handleNewCustomer(event) {
  event.preventDefault();
  
  const customerId = generateCustomerId();
  const newCustomer = new Customer(
    customerId,
    document.getElementById("new-customer-name").value,
    document.getElementById("new-customer-phone").value,
    document.getElementById("new-customer-email").value,
    document.getElementById("new-customer-address").value
  );
  
  customersArray.push(newCustomer);
  localStorage.setItem("customers", JSON.stringify(customersArray));
  
  populateCustomerSelect();
  document.getElementById("customer-form").reset();
  alert("Customer added successfully!");
  
  // Display the new customer ID in the input field
  document.getElementById("new-customer-id").value = generateCustomerId();
}

//handleFormSubmission function
function handleFormSubmission(event) {
  event.preventDefault();

  // Get form values
  const customerId = selectCustomer.value;
  const category = productCategorySelect.value;
  const quantity = parseInt(quantityOrderedInput.value);
  const orderDate = orderDateInput.value;
  const status = orderStatusSelect.value;
  const totalPrice = parseFloat(totalPriceInput.value);
  const customWeight = category === "premium" ? parseFloat(customWeightInput.value) : null;

  // Validate stock availability
  if (category === "premium") {
    if (!checkCustomWeightStock(customWeight * quantity)) {
      alert("Not enough raw stock available for this custom weight order");
      return;
    }
  } else {
    if (!checkPacketStock(category, quantity)) {
      alert("Not enough packets in stock for this category");
      return;
    }
  }

  try {
    // Create new sale record
    const sale = new Sale(
      generateOrderId(),
      customerId,
      category,
      quantity,
      orderDate,
      status,
      totalPrice,
      customWeight
    );

    // Update inventory based on sale type
    if (category === "premium") {
      // For custom weight orders, update raw stock
      let customWeightOrders = JSON.parse(localStorage.getItem("customWeightOrders")) || [];
      customWeightOrders.push({
        orderId: sale.orderId,
        customWeight: customWeight,
        quantity: quantity
      });
      localStorage.setItem("customWeightOrders", JSON.stringify(customWeightOrders));
      
      // Update current stock only for custom weight orders
      currentStock = calculateCurrentStock();
      localStorage.setItem(STATE_KEYS.CURRENT_STOCK, currentStock.toString());
    } else {
      // For packaged products, only update packet inventory
      const categoryData = categories.find(cat => cat.id === category);
      const inventoryItem = inventory.find(item => item.category === categoryData.name);
      if (inventoryItem) {
        inventoryItem.packets -= quantity;
        saveInventoryToLocalStorage();
      }
    }

    // Save sale and update displays
    salesArray.push(sale);
    localStorage.setItem("sales", JSON.stringify(salesArray));
    document.dispatchEvent(new Event('salesUpdated'));
    
    // Update displays
    updateSalesTable();
    updateInventoryTable();
    // Only update currentStock display, don't recalculate
    if (currentStockAmount) {
      currentStockAmount.textContent = `${currentStock.toFixed(2)} kg`;
    }
    updateRevenueDisplays();
    updateCategoryRevenue();
    
    // Reset form
    salesForm.reset();
    orderIdInput.value = generateOrderId();
    document.getElementById("selected-customer-details").innerHTML = "";
    
    alert("Sale recorded successfully!");
  } catch (error) {
    alert("Error recording sale: " + error.message);
  }
}
function populateCustomerSelect() {
  const selectCustomer = document.getElementById("select-customer");
  selectCustomer.innerHTML = '<option value="">-- Select Customer --</option>';
  
  customersArray.forEach(customer => {
    const option = document.createElement("option");
    option.value = customer.id;
    option.textContent = `${customer.id} - ${customer.name}`;
    selectCustomer.appendChild(option);
  });
}

function showSelectedCustomerDetails() {
  const customerId = document.getElementById("select-customer").value;
  const customer = customersArray.find(c => c.id === customerId);
  const detailsDiv = document.getElementById("selected-customer-details");
  
  if (customer) {
    detailsDiv.innerHTML = `
      <p><strong>Name:</strong> ${customer.name}</p>
      <p><strong>Phone:</strong> ${customer.phone}</p>
      <p><strong>Email:</strong> ${customer.email}</p>
      <p><strong>Address:</strong> ${customer.shippingInfo}</p>
    `;
  } else {
    detailsDiv.innerHTML = '';
  }
}

// 8. Helper Function: Add Input Listener
function addInputListener(element, ...callbacks) {
  element?.addEventListener("input", () => callbacks.forEach(cb => cb()));
}

// 9. Toggle Custom Weight Input
function toggleCustomWeightInput() {
  const isCustomWeight = productCategorySelect.value === "premium";
  customWeightGroup.style.display = isCustomWeight ? "block" : "none";
  if (!isCustomWeight) customWeightInput.value = "";
  calculateTotalPrice();
}

// 10. Calculate Price Based on Season
function getPriceForSeason(category) {
  const inventory = JSON.parse(localStorage.getItem("inventory")) || [];
  const categoryName = categories.find(cat => cat.id === category)?.name;
  const item = inventory.find(item => item.category === categoryName);
  
  if (!item) return 0;

  const month = new Date(orderDateInput.value).getMonth() + 1;
  const price = month >= 9 || month <= 3 ? 
    parseFloat(item.fallPrice) : 
    parseFloat(item.springPrice);
    
  return price || 0;
}

// 11. Calculate Total Price
function calculateTotalPrice() {
  if (!orderDateInput.value) return;
  const category = productCategorySelect.value;
  const quantity = parseInt(quantityOrderedInput.value) || 0;
  const unitPrice = getPriceForSeason(category);
  let total = 0;

  if (category === "premium") {
    const weight = parseFloat(customWeightInput.value) || 0;
    total = unitPrice * weight * quantity;
  } else if (unitPrice) {
    total = unitPrice * quantity;
  }

  totalPriceInput.value = total.toFixed(2);
}



// 12. Validate Form
function validateForm() {
  const requiredFields = [
    { field: orderIdInput, name: "Order ID" },
    { field: customerNameInput, name: "Customer Name" },
    { field: customerPhoneInput, name: "Customer Phone" },
    { field: customerEmailInput, name: "Customer Email" },
    { field: orderDateInput, name: "Order Date" },
    { field: quantityOrderedInput, name: "Quantity" },
  ];

  for (const { field, name } of requiredFields) {
    if (!field.value.trim()) {
      alert(`Please fill in the ${name} field.`);
      field.focus();
      return false;
    }
  }

  if (parseInt(quantityOrderedInput.value) <= 0) {
    alert("Please enter a valid quantity.");
    quantityOrderedInput.focus();
    return false;
  }

  if (productCategorySelect.value === "premium" && (!customWeightInput.value || parseFloat(customWeightInput.value) <= 0)) {
    alert("Please enter a valid custom weight.");
    customWeightInput.focus();
    return false;
  }

  return true;
}
//13.Filter and Seach Functions
function filterSales() {
  const status = statusFilter.value;
  const category = categoryFilter.value;
  const searchTerm = salesSearchInput.value.toLowerCase();

  const filteredSales = salesArray.filter(sale => {
    const statusMatch = !status || sale.status === status;
    const categoryMatch = !category || sale.category === category;
    const searchMatch = !searchTerm || 
      sale.orderId.toLowerCase().includes(searchTerm) ||
      sale.customerName.toLowerCase().includes(searchTerm);
    
    return statusMatch && categoryMatch && searchMatch;
  });

  updateSalesTable(filteredSales);
}

//14. Update Status Function
function updateOrderStatus(orderId, newStatus) {
  const saleIndex = salesArray.findIndex(s => s.orderId === orderId);
  if (saleIndex === -1) return;

  salesArray[saleIndex].status = newStatus;
  localStorage.setItem("sales", JSON.stringify(salesArray));
  filterSales(); // Refresh table with current filters
}

//15. View Customer Details Function
function viewCustomerDetails(orderId) {
  const sale = salesArray.find(s => s.orderId === orderId);
  if (!sale) return;

  // Get all orders for this customer
  const customerOrders = salesArray.filter(s => 
    s.customerEmail === sale.customerEmail || 
    s.customerPhone === sale.customerPhone
  );

  // Populate customer details
  customerDetails.innerHTML = `
    <div class="customer-info">
      <h4>Customer Information</h4>
      <p><strong>Name:</strong> ${sale.customerName}</p>
      <p><strong>Phone:</strong> ${sale.customerPhone}</p>
      <p><strong>Email:</strong> ${sale.customerEmail}</p>
      <p><strong>Shipping Address:</strong> ${sale.shippingInfo}</p>
    </div>
  `;

  // Populate order history
  document.getElementById("customer-orders").innerHTML = `
    <div class="order-history">
      ${customerOrders.map(order => `
        <div class="order-item">
          <h5>Order #${order.orderId}</h5>
          <p><strong>Date:</strong> ${order.orderDate}</p>
          <p><strong>Category:</strong> ${order.category}</p>
          <p><strong>Quantity:</strong> ${order.quantity}</p>
          <p><strong>Total:</strong> $${order.totalPrice.toFixed(2)}</p>
          <p><strong>Status:</strong> ${order.status}</p>
        </div>
      `).join('<hr>')}
    </div>
  `;

  customerModal.style.display = "block";
}



// 16. Update Sales Table
function updateSalesTable(sales = salesArray) {
  const tableBody = document.getElementById("sales-records-table");
  tableBody.innerHTML = "";

  sales.forEach((sale, index) => {
    const row = document.createElement("tr");
    const pricePerUnit = sale.category === "premium" ? 
      `$${(sale.totalPrice / (sale.quantity * sale.customWeight)).toFixed(2)}/kg` :
      `$${(sale.totalPrice / sale.quantity).toFixed(2)}/packet`;

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${sale.orderId}</td>
      <td>${sale.customerName}</td>
      <td>${sale.category}</td>
      <td>${sale.quantity}${sale.customWeight ? ` (${sale.customWeight}kg each)` : ''}</td>
      <td>${sale.orderDate}</td>
      <td>${pricePerUnit}</td>
      <td>$${sale.totalPrice.toFixed(2)}</td>
      <td class="status-${sale.status.toLowerCase()}">${sale.status}</td>
      <td>
        <button onclick="viewCustomerDetails('${sale.orderId}')" class="btn-view-details">
          View Details
        </button>
        ${getStatusButtons(sale)}
      </td>
    `;
    tableBody.appendChild(row);
  });
}
//17. Helper function to generate status update buttons
function getStatusButtons(sale) {
  const buttons = [];
  
  switch(sale.status.toLowerCase()) {
    case 'pending':
      buttons.push(`
        <button class="btn-process" onclick="updateOrderStatus('${sale.orderId}', 'processed')">
          Process
        </button>
      `);
      break;
    case 'processed':
      buttons.push(`
        <button class="btn-ship" onclick="updateOrderStatus('${sale.orderId}', 'shipped')">
          Ship
        </button>
      `);
      break;
    case 'shipped':
      buttons.push(`
        <button class="btn-deliver" onclick="updateOrderStatus('${sale.orderId}', 'delivered')">
          Deliver
        </button>
      `);
      break;
  }
  
  return buttons.join('');
}
//18. Populate category filter
function populateCategoryFilter() {
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    categoryFilter.appendChild(option);
  });
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
  salesForm.addEventListener('submit', handleFormSubmission);
  updateRevenueDisplays();
  updateCategoryRevenue();
  
});


// Check packet stock availability
function checkPacketStock(category, quantity) {
  const inventoryItem = inventory.find(item => {
    const categoryData = categories.find(cat => cat.id === category);
    return item.category === categoryData.name;
  });
  
  return inventoryItem && inventoryItem.packets >= quantity;
}

function checkCustomWeightStock(weight) {
  return currentStock >= weight;
}


// 3. Event Listeners
function initializeSalesModule() {
  try {
    // 1. Form Submission Listeners
    customerForm?.addEventListener('submit', handleNewCustomer);
    salesForm?.addEventListener('submit', handleFormSubmission);

    // 2. Input Change Listeners
    productCategorySelect?.addEventListener('change', () => {
      toggleCustomWeightInput();
      calculateTotalPrice();
    });

    quantityOrderedInput?.addEventListener('input', calculateTotalPrice);
    orderDateInput?.addEventListener('input', calculateTotalPrice);
    customWeightInput?.addEventListener('input', calculateTotalPrice);
    selectCustomer?.addEventListener('change', showSelectedCustomerDetails);

    // 3. Filter and Search Listeners
    statusFilter?.addEventListener('change', filterSales);
    categoryFilter?.addEventListener('change', filterSales);
    salesSearchInput?.addEventListener('input', filterSales);
    searchSalesBtn?.addEventListener('click', filterSales);
    clearSalesBtn?.addEventListener('click', () => {
      salesSearchInput.value = '';
      statusFilter.value = '';
      categoryFilter.value = '';
      updateSalesTable();
    });

    // 4. Modal Listeners
    closeModalBtn?.addEventListener('click', () => {
      customerModal.style.display = "none";
    });

    window.addEventListener('click', (event) => {
      if (event.target === customerModal) {
        customerModal.style.display = "none";
      }
    });

    // 5. Report Form Listeners
    const salesReportForm = document.getElementById('sales-report-form');
    if (salesReportForm) {
      salesReportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const startDate = new Date(reportStartDate.value);
        const endDate = new Date(reportEndDate.value);
        const category = reportCategory.value;
        const type = reportType.value;

        const reportData = generateReportData(startDate, endDate, category);
        updateCharts(reportData);
        
        const reportHtml = generateReportHTML(reportData, type);
        document.getElementById('report-summary').innerHTML = reportHtml;
      });
    }

    // 6. Export Button Listener
    const exportButton = document.getElementById('export-pdf');
    if (exportButton) {
      exportButton.addEventListener('click', () => {
        const startDate = new Date(reportStartDate.value);
        const endDate = new Date(reportEndDate.value);
        const category = reportCategory.value;
        const reportData = generateReportData(startDate, endDate, category);
        exportReport('csv', reportData);
      });
    }

    // 7. Initialize Charts and Categories
    if (typeof initializeCharts === 'function') {
      initializeCharts();
    }
    if (typeof populateReportCategories === 'function') {
      populateReportCategories();
    }

  } catch (error) {
    console.error('Error initializing sales module:', error);
  }
}

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Initialize data
    salesArray = JSON.parse(localStorage.getItem("sales")) || [];
    customersArray = JSON.parse(localStorage.getItem("customers")) || [];
    
    // Initialize UI
    populateCustomerSelect();
    populateCategoryFilter();
    updateSalesTable();
    initializeSalesAnalytics();
    
    // Initialize reports if function exists
    if (typeof populateReportCategories === 'function') {
      populateReportCategories();
    }
    
    // Set initial values
    document.getElementById("new-customer-id").value = generateCustomerId();
    orderIdInput.value = generateOrderId();
    
    // Initialize event listeners
    initializeSalesModule();

    // Update inventory displays
    updateInventoryTable();
    updateCurrentStock();
  } catch (error) {
    console.error('Error initializing sales module:', error);
  }
});
// Make necessary functions globally accessible
window.viewCustomerDetails = viewCustomerDetails;
window.updateOrderStatus = updateOrderStatus;
window.filterSales = filterSales;
window.calculateTotalPrice = calculateTotalPrice;
window.toggleCustomWeightInput = toggleCustomWeightInput;
window.updateSalesTable = updateSalesTable;

