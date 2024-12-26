// 1. Categories and Data Structures
const categories = [
  { id: "small", name: "Small (100g)", weight: 0.1 },
  { id: "medium", name: "Medium (250g)", weight: 0.25 },
  { id: "large", name: "Large (500g)", weight: 0.5 },
  { id: "extra-large", name: "Extra Large (1kg)", weight: 1 },
  { id: "family-pack", name: "Family Pack (2kg)", weight: 2 },
  { id: "bulk-pack", name: "Bulk Pack (5kg)", weight: 5 },
  { id: "premium", name: "Premium (Custom Weight)", weight: null, minWeight: 5, maxWeight: 100  }
];

// 2. State Management
const STATE_KEYS = {
  INVENTORY: "inventory",
  CURRENT_STOCK: "currentStock",
  MIN_STOCK_LEVELS: "minimumStockLevels"
};

// 3. State Initialization
let inventory = JSON.parse(localStorage.getItem(STATE_KEYS.INVENTORY)) || [];
let currentStock = parseFloat(localStorage.getItem(STATE_KEYS.CURRENT_STOCK)) || 0;
let minimumStockLevels = JSON.parse(localStorage.getItem(STATE_KEYS.MIN_STOCK_LEVELS)) || {};
let alertsActive = JSON.parse(localStorage.getItem('alertsActive')) || {};
// Add threshold monitoring



// 4. State Management Functions
function loadState() {
  try {
    inventory = JSON.parse(localStorage.getItem(STATE_KEYS.INVENTORY)) || [];
    currentStock = parseFloat(localStorage.getItem(STATE_KEYS.CURRENT_STOCK)) || 0;
    minimumStockLevels = JSON.parse(localStorage.getItem(STATE_KEYS.MIN_STOCK_LEVELS)) || {};
    
    console.log("State loaded successfully:", {
      inventoryCount: inventory.length,
      currentStock,
      stockLevels: Object.keys(minimumStockLevels).length
    });
  } catch (error) {
    console.error("Error loading state:", error);
    resetState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STATE_KEYS.INVENTORY, JSON.stringify(inventory));
    localStorage.setItem(STATE_KEYS.CURRENT_STOCK, currentStock.toString());
    localStorage.setItem(STATE_KEYS.MIN_STOCK_LEVELS, JSON.stringify(minimumStockLevels));
    
    console.log("State saved successfully");
    return true;
  } catch (error) {
    console.error("Error saving state:", error);
    return false;
  }
}

function resetState() {
  inventory = [];
  currentStock = 0;
  minimumStockLevels = {};
  saveState();
}

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  
  if (inventory.length === 0) {
    initializeInventory();
  }
  
  updateInventoryTable();
  updateCurrentStock();
});

// 5. Initialize Inventory
function initializeInventory() {
  try {
    // Load saved data
    const savedInventory = JSON.parse(localStorage.getItem("inventory"));
    const savedStock = parseFloat(localStorage.getItem("currentStock"));
    const savedLevels = JSON.parse(localStorage.getItem("minimumStockLevels"));

    // Initialize with saved data or defaults
    inventory = savedInventory || [];
    currentStock = savedStock || 0;
    minimumStockLevels = savedLevels || {};

    // Create initial inventory if empty
    if (inventory.length === 0) {
      categories.forEach((category) => {
        inventory.push({
          category: category.name,
          weight: category.weight ? `${category.weight} kg` : "Custom",
          fallPrice: "--",
          springPrice: "--",
          packets: 0,
          stockDate: null,
          restockDate: null,
          lastUpdated: new Date().toISOString()
        });
      });
      // Save initial inventory
      saveInventoryToLocalStorage();
    }

    // Update displays
    populateCategoryDropdowns();
    updateInventoryTable();
    
    console.log("Inventory loaded:", {
      items: inventory.length,
      currentStock: currentStock,
      thresholds: Object.keys(minimumStockLevels).length
    });
  } catch (error) {
    console.error("Error initializing inventory:", error);
    alert("Failed to load inventory data. Starting with empty inventory.");
    
    // Reset to defaults on error
    inventory = [];
    currentStock = 0;
    minimumStockLevels = {};
  }
}

//6. DOM Elements
const currentStockAmount = document.getElementById("current-stock-amount");
const inventoryTableBody = document.getElementById("inventory-table");
const categorySelect = document.getElementById("category-select");
const packagingCategory = document.getElementById("packaging-category");
const packagingForm = document.getElementById("packaging-form");
const numberOfPacketsInput = document.getElementById("number-of-packets");
const fallPriceInput = document.getElementById("fall-price");
const springPriceInput = document.getElementById("spring-price");
const stockCategory = document.getElementById("stock-category");
const stockLevelInput = document.getElementById("stock-level");
const addPricingButton = document.getElementById("add-pricing-button");
const addPacketsButton = document.getElementById("add-packets-button");
const setStockLevelButton = document.getElementById("set-stock-level-button");
const stockDateInput = document.getElementById("stock-date");
const restockDateInput = document.getElementById("restock-date");

//Step 2: Implement Stock Management Functions
//7. Stock Management Functions
//calculateCurrentStock function
function calculateCurrentStock() {
  // Get all data
  const purchasesArray = JSON.parse(localStorage.getItem("purchases")) || [];
  const packagingUsage = JSON.parse(localStorage.getItem("packagingUsage")) || [];
  const customWeightOrders = JSON.parse(localStorage.getItem("customWeightOrders")) || [];
  
  // Calculate total purchased
  const totalPurchased = purchasesArray.reduce(
    (sum, purchase) => sum + parseFloat(purchase.quantity),
    0
  );

  // Calculate total used for packaging
  const totalUsedForPackaging = packagingUsage.reduce(
    (sum, usage) => sum + usage.weight,
    0
  );

  // Calculate total used for custom weight orders
  const totalUsedForCustom = customWeightOrders.reduce(
    (sum, order) => sum + (order.customWeight * order.quantity),
    0
  );

  // Return remaining stock
  return Math.max(0, totalPurchased - totalUsedForPackaging - totalUsedForCustom);
}
function updateCurrentStock() {
  currentStock = calculateCurrentStock();
  if (currentStockAmount) {
    currentStockAmount.textContent = `${currentStock.toFixed(2)} kg`;
  }
  saveInventoryToLocalStorage();
  checkInventoryLevels();
}
function calculateDaysDisplay(item) {
  const daysUntilRestock = item.category === "Premium (Custom Weight)"
    ? calculateDaysFromNow(item.restockDate)
    : calculateDaysUntilRestock(item.stockDate, item.restockDate);

  return daysUntilRestock === "Overdue" 
    ? `<span style="color: red;">${daysUntilRestock}</span>`
    : daysUntilRestock === "--" 
      ? "--" 
      : `${daysUntilRestock} days`;
}

function calculateDaysFromNow(restockDate) {
  if (!restockDate) return "--";
  const now = new Date();
  const restock = new Date(restockDate);
  const diffDays = Math.ceil((restock - now) / (1000 * 60 * 60 * 24));
  return diffDays < 0 ? "Overdue" : diffDays;
}

function calculateDaysUntilRestock(stockDate, restockDate) {
  if (!stockDate || !restockDate) return "--";
  const diffDays = Math.ceil((new Date(restockDate) - new Date(stockDate)) / (1000 * 60 * 60 * 24));
  return diffDays < 0 ? "Overdue" : diffDays;
}

// 8. Populate Category Dropdowns
function populateCategoryDropdowns() {
  const dropdowns = [categorySelect, packagingCategory, stockCategory];
  
  dropdowns.forEach(dropdown => {
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="">-- Choose a Category --</option>';
    categories.forEach(category => {
      if (category.id !== "premium" || dropdown === categorySelect) {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        dropdown.appendChild(option);
      }
    });
  });
}


// 9. Handle Packet Management
// Update the addPacketsButton event listener
addPacketsButton.addEventListener("click", () => {
  const category = packagingCategory.value;
  const numberOfPackets = parseInt(numberOfPacketsInput.value);
  const stockDate = stockDateInput.value;

  if (!category || isNaN(numberOfPackets) || numberOfPackets <= 0 || !stockDate) {
    alert("Please enter valid packaging details.");
    return;
  }

  const categoryData = categories.find((cat) => cat.id === category);
  const totalWeight = categoryData.weight * numberOfPackets;

  // Calculate current raw stock before packaging
  currentStock = calculateCurrentStock();

  if (totalWeight > currentStock) {
    alert(`Not enough stock! Need ${totalWeight.toFixed(2)} kg but only ${currentStock.toFixed(2)} kg available.`);
    return;
  }

  const inventoryItem = inventory.find(item => item.category === categoryData.name);
  if (inventoryItem) {
    // Update packets
    inventoryItem.packets += numberOfPackets;
    inventoryItem.stockDate = stockDate;
    inventoryItem.lastUpdated = new Date().toISOString();

    // Track packaging usage
    let packagingUsage = JSON.parse(localStorage.getItem("packagingUsage")) || [];
    packagingUsage.push({
      category: categoryData.name,
      packets: numberOfPackets,
      weight: totalWeight,
      date: new Date().toISOString()
    });
    localStorage.setItem("packagingUsage", JSON.stringify(packagingUsage));

    
    // Save both inventory and current stock
   
    saveInventoryToLocalStorage();

    // Update displays
    updateInventoryTable();
    currentStock = calculateCurrentStock(); // Recalculate current stock
    updateCurrentStock();
    
  
    // Reset form
    packagingForm.reset();
    
    alert(`Successfully added ${numberOfPackets} packets of ${categoryData.name}`);
  }
});

//10. Implement Pricing Management
addPricingButton.addEventListener("click", () => {
  const category = categorySelect.value;
  const fallPrice = parseFloat(fallPriceInput.value);
  const springPrice = parseFloat(springPriceInput.value);

  if (!category || isNaN(fallPrice) || isNaN(springPrice)) {
    alert("Please enter valid pricing details.");
    return;
  }

  const categoryData = categories.find((cat) => cat.id === category);
  const inventoryItem = inventory.find(item => item.category === categoryData.name);

  if (inventoryItem) {
    inventoryItem.fallPrice = fallPrice;
    inventoryItem.springPrice = springPrice;
    inventoryItem.lastUpdated = new Date().toISOString();
    
    saveInventoryToLocalStorage();
    updateInventoryTable();

     // Reset form
     categorySelect.value = "";
     fallPriceInput.value = "";
     springPriceInput.value = "";
    
    alert(`Pricing updated for ${categoryData.name}`);
    
  }
});

// 11. Implement Stock Level Management
setStockLevelButton.addEventListener("click", () => {
  const category = stockCategory.value;
  const stockLevel = parseInt(stockLevelInput.value);
  const restockDate = restockDateInput.value;

  if (!category || isNaN(stockLevel) || stockLevel <= 0 || !restockDate) {
    alert("Please enter valid stock level and restock date.");
    return;
  }

  const categoryData = categories.find((cat) => cat.id === category);
  const inventoryItem = inventory.find(item => item.category === categoryData.name);
  
  if (inventoryItem) {
    minimumStockLevels[categoryData.name] = stockLevel;
    inventoryItem.restockDate = restockDate;
    inventoryItem.lastUpdated = new Date().toISOString();
    
    saveInventoryToLocalStorage();
    updateInventoryTable();
    
    stockCategory.value = "";
    stockLevelInput.value = "";
    restockDateInput.value = "";
    alert(`Stock level and restock date set for ${categoryData.name}`);
  }
});

//Step 5: Implement Stock Level Management
// 12. Update updateInventoryTable function
function updateInventoryTable() {
  if (!inventoryTableBody) return;
  
  inventoryTableBody.innerHTML = "";
  checkInventoryLevels(); // Check levels on every update
  
  
  inventory.forEach((item) => {
      const isPremium = item.category === "Premium (Custom Weight)";
      const threshold = minimumStockLevels[item.category] || "--";
      
      let stockStatus = "";
      if (threshold !== "--") {
          if (isPremium) {
              stockStatus = currentStock < threshold ? 
                  '<span class="stock-warning">Low Stock</span>' : 
                  '<span class="stock-ok">Stock OK</span>';
          } else {
              stockStatus = item.packets < threshold ? 
                  '<span class="stock-warning">Low Stock</span>' : 
                  '<span class="stock-ok">Stock OK</span>';
          }
      }

      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${item.category}</td>
          <td>${item.weight}</td>
          <td>${item.springPrice || "--"}</td>
          <td>${item.fallPrice || "--"}</td>
          <td>
              ${isPremium ? `${currentStock.toFixed(2)} kg` : item.packets}
              ${stockStatus}
          </td>
          <td>${threshold}${isPremium ? " kg" : ""}</td>
          <td>${item.stockDate ? new Date(item.stockDate).toLocaleDateString() : "--"}</td>
          <td>${item.restockDate ? new Date(item.restockDate).toLocaleDateString() : "--"}</td>
          <td>${calculateDaysDisplay(item)}</td>
      `;
      inventoryTableBody.appendChild(row);
  });
}
// Add threshold monitoring
let stockAlerts = new Map();

// Update checkInventoryLevels function
function checkInventoryLevels() {
  const alerts = [];
  
  inventory.forEach(item => {
    const threshold = minimumStockLevels[item.category];
    if (!threshold) return;

    const currentAmount = item.category === "Premium (Custom Weight)" ? 
      currentStock : 
      item.packets;
    const unit = item.category === "Premium (Custom Weight)" ? "kg" : "packets";

    if (currentAmount <= threshold && !stockAlerts.has(item.category)) {
      const alert = {
        category: item.category,
        current: currentAmount,
        threshold: threshold,
        unit: unit
      };
      alerts.push(alert);
      stockAlerts.set(item.category, alert);
      showStockAlert(alert);
    } else if (currentAmount > threshold && stockAlerts.has(item.category)) {
      stockAlerts.delete(item.category);
      removeStockAlert(item.category);
    }
  });
  return alerts;
}
// Add immediate alert display
function showStockAlert(alert) {
  const alertsContainer = document.getElementById('inventory-alerts-container');
  const alertDiv = document.createElement('div');
  alertDiv.className = 'stock-alert';
  alertDiv.id = `alert-${alert.category.toLowerCase().replace(/\s+/g, '-')}`;
  
  alertDiv.innerHTML = `
    <div class="alert-content">
      <h4>⚠️ Low Stock Alert: ${alert.category}</h4>
      <p>Current stock: ${alert.current} ${alert.unit}</p>
      <p>Minimum threshold: ${alert.threshold} ${alert.unit}</p>
      <div class="alert-actions">
        <button onclick="navigateToSupplier('${alert.category}')">Order More</button>
        <button onclick="dismissAlert('${alert.category}')" class="dismiss-btn">Dismiss</button>
      </div>
    </div>
  `;
  
  alertsContainer.appendChild(alertDiv);
}

// Add navigation to supplier section
function navigateToSupplier(category) {
  // Switch to supplier section
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById('supplier-section').classList.add('active');
  
  // Pre-fill purchase form
  document.getElementById('purchase-form').scrollIntoView({ behavior: 'smooth' });
  
  // Highlight the form
  document.getElementById('purchase-form').classList.add('highlight-form');
  setTimeout(() => {
    document.getElementById('purchase-form').classList.remove('highlight-form');
  }, 3000);
}
// Add alert dismissal
function dismissAlert(category) {
  stockAlerts.delete(category);
  const alertElement = document.getElementById(`alert-${category.toLowerCase().replace(/\s+/g, '-')}`);
  if (alertElement) {
    alertElement.remove();
  }
}
// Update removeStockAlert function
function removeStockAlert(category) {
  const alertElement = document.getElementById(`alert-${category.toLowerCase().replace(/\s+/g, '-')}`);
  if (alertElement) {
    alertElement.remove();
  }
}


// Add function to display alerts
function displayInventoryAlerts() {
  const alerts = checkInventoryLevels();
  const alertContainer = document.createElement('div');
  alertContainer.className = 'inventory-alerts';
  
  if (alerts.length > 0) {
      alerts.forEach(alert => {
          const alertElement = document.createElement('div');
          alertElement.className = 'alert-item';
          
          const daysUntilRestock = alert.restockDate ? 
              calculateDaysFromNow(alert.restockDate) : 
              'No restock date set';

          alertElement.innerHTML = `
              <div class="alert-content">
                  <h4>⚠️ Low Stock Alert: ${alert.category}</h4>
                  <p>Current stock: ${alert.current} ${alert.unit}</p>
                  <p>Minimum threshold: ${alert.threshold} ${alert.unit}</p>
                  <p>Days until scheduled restock: ${daysUntilRestock}</p>
                  ${getReorderSuggestion(alert)}
              </div>
          `;
          alertContainer.appendChild(alertElement);
      });
  }

  // Update alerts in the UI
  const existingAlerts = document.querySelector('.inventory-alerts');
  if (existingAlerts) {
      existingAlerts.remove();
  }
  
  const inventorySection = document.getElementById('product-categorization-section');
  if (inventorySection && alerts.length > 0) {
      inventorySection.insertBefore(alertContainer, inventorySection.firstChild);
  }
}

// Generate reorder suggestion
function getReorderSuggestion(alert) {
  const suggestedAmount = calculateSuggestedReorderAmount(alert);
  return `
      <div class="reorder-suggestion">
          <h5>Reorder Suggestion:</h5>
          <p>Suggested reorder amount: ${suggestedAmount} ${alert.unit}</p>
          <button onclick="initiateReorder('${alert.category}', ${suggestedAmount})">
              Initiate Reorder
          </button>
      </div>
  `;
}

// Calculate suggested reorder amount
function calculateSuggestedReorderAmount(alert) {
  // Basic calculation: 2x the difference between threshold and current amount
  const difference = alert.threshold - alert.current;
  return Math.ceil(difference * 2);
}

// Initiate reorder process
function initiateReorder(category, amount) {
  // Here you could integrate with your supplier management system
  alert(`Reorder initiated for ${category}: ${amount} units`);
}


// 13.Save to localStorage
function saveInventoryToLocalStorage() {
  if (saveState()) {
    updateInventoryTable();
    if (currentStockAmount) {
      currentStockAmount.textContent = `${currentStock.toFixed(2)} kg`;
    }
  }
}




// Add event listener for page load
document.addEventListener("DOMContentLoaded", () => {
  // Add stylesheet link if not already present
  if (!document.querySelector('link[href*="inventoryAlerts.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './styles/inventoryAlerts.css';
    document.head.appendChild(link);
  }
  initializeInventory();
  updateCurrentStock();
  currentStock = calculateCurrentStock(); // Stok hesaplama
  updateCurrentStock(); // DOM güncellemesi
  displayInventoryAlerts(); // Add initial alerts check
  // Check inventory levels periodically
  setInterval(displayInventoryAlerts, 300000); // Check every 5 minutes
});
  



// Make functions globally accessible
window.saveInventoryToLocalStorage = saveInventoryToLocalStorage;
window.updateInventoryTable = updateInventoryTable;
window.updateCurrentStock = updateCurrentStock;