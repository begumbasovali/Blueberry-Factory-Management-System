/**
Farmer Management System
 Handles supplier (farmer) operations including CRUD, search, filter and export functionality
 **/

// 1. Class Definition
class Farmer {
  constructor(id, name, phone, email, address, country) {
    this.id = id;
    this.name = name;
    this.phone = phone;
    this.email = email;
    this.address = address;
    this.country = country;
  }
}

// 2. Global State
let farmersArray = JSON.parse(localStorage.getItem('farmers')) || [];
let editingFarmer = null; // For editing farmer

//3. DOM Elements for Farmer
const farmerForm = document.getElementById("supplier-form");
const farmerIdInput = document.getElementById("farmer-id");
const farmerNameInput = document.getElementById("farmer-name");
const farmerPhoneInput = document.getElementById("farmer-phone");
const farmerEmailInput = document.getElementById("farmer-email");
const farmerAddressInput = document.getElementById("farmer-address");
const farmerCountryInput = document.getElementById("farmer-country");
const farmerTableBody = document.getElementById("farmer-list");
const searchInput = document.getElementById("search-farmer-input");
const exportButton = document.getElementById("export-btn");
const selectFarmer = document.getElementById("select-farmer");
const countryDropdown = document.getElementById("country-dropdown");
const farmerNameDropdown = document.getElementById("farmer-name-dropdown");
const clearFiltersButton = document.getElementById("clear-filters-btn");

// 4. Core CRUD Operations
/**
 Add or Update Farmer
 Handles both creation and updating of farmer records
**/

// Update addOrUpdateFarmer function
function addOrUpdateFarmer(event) {
  event.preventDefault();

  const id = farmerIdInput.value.trim();
  const name = farmerNameInput.value.trim();
  const phone = farmerPhoneInput.value.trim();
  const email = farmerEmailInput.value.trim();
  const address = farmerAddressInput.value.trim();
  const country = farmerCountryInput.value.trim();

  if (editingFarmer) {
    // Update Existing Farmer
    editingFarmer.name = name;
    editingFarmer.phone = phone;
    editingFarmer.email = email;
    editingFarmer.address = address;
    editingFarmer.country = country;

    localStorage.setItem('farmers', JSON.stringify(farmersArray));
    showMessage("The farmer has been successfully updated!", "success");
  } else {
    // Check for existing farmer
    if (farmersArray.some((farmer) => farmer.id === id)) {
      showMessage("A farmer with this ID already exists!", "error");
      return;
    }

    // Create new farmer
    const newFarmer = new Farmer(id, name, phone, email, address, country);
    farmersArray.push(newFarmer);
    localStorage.setItem('farmers', JSON.stringify(farmersArray));
    showMessage("New farmer added successfully!", "success");
  }

  // Update UI
  renderFarmers();
  populateCountryDropdown();
  populateFarmerDropdown();
  populateFarmerOptions();
  resetFarmerForm();
}
// 5. UI Update Functions
/**
Render Farmers Table
 Displays all farmers or filtered results
 **/
 function renderFarmers(farmers = farmersArray) {
  farmerTableBody.innerHTML = farmers.length === 0 
    ? '<tr><td colspan="8" class="no-data">No farmers available</td></tr>'
    : farmers.map((farmer, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${farmer.id}</td>
        <td>${farmer.name}</td>
        <td>${farmer.phone}</td>
        <td>${farmer.email}</td>
        <td>${farmer.address}</td>
        <td>${farmer.country}</td>
        <td>
          <button class="btn-update" onclick="loadFarmerToForm(${index})">Update</button>
          <button class="btn-delete" onclick="deleteFarmer(${index})">Delete</button>
        </td>
      </tr>
    `).join('');
}
// Attach event listener to the Clear Filters button
document.getElementById("clear-filters-btn")?.addEventListener("click", clearFilters);


/**
 Show Message
  Displays feedback messages to user
 **/
 // Modify showMessage function
function showMessage(message, type) {
  const messageDiv = document.getElementById("farmerMessage");
  if (!messageDiv) return;

  messageDiv.textContent = message;
  messageDiv.style.display = "block";
  messageDiv.className = `message-div message ${type}`;

  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 3000);
}

// 6. Form Operations
/**
 * Load Farmer to Form
 * Populates form with farmer data for editing
 */


// Load Farmer to Form for Editing
function loadFarmerToForm(index) {
  const farmer = farmersArray[index];
  editingFarmer = farmer; // Set the editing farmer

  farmerIdInput.value = farmer.id;
  farmerIdInput.disabled = true; // Disable Farmer ID input
  farmerNameInput.value = farmer.name;
  farmerPhoneInput.value = farmer.phone;
  farmerEmailInput.value = farmer.email;
  farmerAddressInput.value = farmer.address;
  farmerCountryInput.value = farmer.country;

  
  farmerForm.querySelector("button[type='submit']").textContent = "Update Farmer";
}

/**
 * Reset Farmer Form
 * Clears form and resets to add mode
 */
// Reset Farmer Form
function resetFarmerForm() {
  farmerForm.reset();
  farmerIdInput.disabled = false; // Enable Farmer ID field
  editingFarmer = null; // Exit edit mode
  farmerForm.querySelector("button[type='submit']").textContent = "Add Farmer"; // Reset button text
}

// Delete Farmer
function deleteFarmer(index) {
  farmersArray.splice(index, 1);
  localStorage.setItem('farmers', JSON.stringify(farmersArray));
  renderFarmers();
  populateCountryDropdown();
  populateFarmerDropdown();
  populateFarmerOptions(); // Update farmer options in purchase records
}


// 7. Search and Filter Functions
/**
 Search Farmers
 Filters farmers based on search input
 */

// Search Farmers
function searchFarmers() {
  const query = searchInput.value.toLowerCase();
  const filteredFarmers = farmersArray.filter(farmer => 
    farmer.name.toLowerCase().includes(query) || 
    farmer.address.toLowerCase().includes(query) ||
    farmer.country.toLowerCase().includes(query)
  );
  renderFarmers(filteredFarmers);
}

// Filter Farmers by Country
function filterFarmersByCountry() {
  const selectedCountry = countryDropdown.value;
  const filteredFarmers = selectedCountry === 'all' ? farmersArray : farmersArray.filter(farmer => farmer.country === selectedCountry);
  renderFarmers(filteredFarmers);
}

// Filter Farmers by Name
function filterFarmersByName() {
  const selectedFarmerName = farmerNameDropdown.value;
  const filteredFarmers = selectedFarmerName === 'all' ? farmersArray : farmersArray.filter(farmer => farmer.name === selectedFarmerName);
  renderFarmers(filteredFarmers);
}

// Clear Filters
function clearFilters() {
  countryDropdown.value = 'all';
  farmerNameDropdown.value = 'all';
  renderFarmers();
}

// 8. Data Management
/**
 Export Farmers
 Exports farmer data to CSV
 **/
// Export Farmers
function exportFarmers() {
  const csvContent = "data:text/csv;charset=utf-8," 
    + "ID,Name,Phone,Email,Address,Country\n" 
    + farmersArray.map(farmer => 
      `${farmer.id},${farmer.name},${farmer.phone},${farmer.email},${farmer.address},${farmer.country}`
    ).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "farmers.csv");
  document.body.appendChild(link); // Required for FF
  link.click();
  document.body.removeChild(link);
}

// Populate Country Dropdown
function populateCountryDropdown() {
  const countries = [...new Set(farmersArray.map(farmer => farmer.country))];
  countryDropdown.innerHTML = '<option value="all" selected>All Countries</option>';
  countries.forEach(country => {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = country;
    countryDropdown.appendChild(option);
  });
}

// Populate Farmer Dropdown
function populateFarmerDropdown() {
  farmerNameDropdown.innerHTML = '<option value="all" selected>All Farmers</option>';
  farmersArray.forEach(farmer => {
    const option = document.createElement('option');
    option.value = farmer.name;
    option.textContent = farmer.name;
    farmerNameDropdown.appendChild(option);
  });
}

// Populate Farmer Options for Purchases
function populateFarmerOptions() {
  selectFarmer.innerHTML = '<option value="">Select Farmer ID</option>';
  farmersArray.forEach(farmer => {
    const option = document.createElement('option');
    option.value = farmer.id;
    option.textContent = `${farmer.id} - ${farmer.name}`;
    selectFarmer.appendChild(option);
  });
}



/// 9. Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  renderFarmers();
  populateCountryDropdown();
  populateFarmerDropdown();
  populateFarmerOptions();
  
  farmerForm.addEventListener('submit', addOrUpdateFarmer);
  searchInput.addEventListener('input', searchFarmers);
  exportButton.addEventListener('click', exportFarmers);
  countryDropdown.addEventListener('change', filterFarmersByCountry);
  farmerNameDropdown.addEventListener('change', filterFarmersByName);
  clearFiltersButton.addEventListener('click', clearFilters);
});

// Make necessary functions globally accessible
window.loadFarmerToForm = loadFarmerToForm;
window.deleteFarmer = deleteFarmer;
window.filterFarmersByCountry = filterFarmersByCountry;
window.filterFarmersByName = filterFarmersByName;
window.clearFilters = clearFilters;