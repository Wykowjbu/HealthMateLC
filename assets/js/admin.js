// Global variables
let navItems = document.querySelectorAll(".nav-item");
let panelItems = document.querySelectorAll(".panel");
let listPharmacy = [];

// Initialize the admin dashboard
document.addEventListener("DOMContentLoaded", function () {
  initializeNavigation();
  initializeUserDropdown();
  loadInitialData();
});

// Navigation handling
function initializeNavigation() {
  navItems.forEach((item, index) => {
    item.addEventListener("click", () => {
      // Remove active class from all nav items and panels
      navItems.forEach((el) => el.classList.remove("active"));
      panelItems.forEach((el) => el.classList.remove("active"));

      // Add active class to clicked item and corresponding panel
      item.classList.add("active");
      panelItems[index].classList.add("active");

      // Update header title
      const headerTitle = document.querySelector(".header-title");
      headerTitle.textContent = item.textContent.trim();

      // Render content based on panel type
      const type = item.getAttribute("data-type");
      renderContent(type);
    });
  });
}

// User dropdown functionality
function initializeUserDropdown() {
  const userProfile = document.querySelector(".user-profile");
  const userDropdown = document.getElementById("userDropdown");

  if (userProfile && userDropdown) {
    userProfile.addEventListener("click", function (e) {
      e.stopPropagation();
      userDropdown.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (e) {
      if (!userProfile.contains(e.target)) {
        userDropdown.classList.remove("show");
      }
    });

    // Prevent dropdown from closing when clicking inside it
    userDropdown.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }
}

// Content rendering based on panel type
function renderContent(type) {
  switch (type) {
    case "list-accounts":
      renderListAccounts();
      break;
    case "add-account":
      renderAddAccount();
      break;
    case "create-category":
      renderCreateCategory();
      break;
    case "add-product":
      renderAddProduct();
      break;
    case "create-store":
      renderCreateStore();
      break;
    case "list-stores":
      renderListStores();
      break;
    case "edit-store":
      renderEditStore();
      break;
    case "revenue-report":
      renderRevenueReport();
      break;
    default:
      console.log(`Panel type ${type} not implemented yet`);
  }
}

// Load initial data for list-accounts panel
function loadInitialData() {
  renderListAccounts();
}

// Render list accounts panel
function renderListAccounts() {
  fetch(`http://localhost:8080/admin/list-accounts`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      const listNumber = data.listNumbers;
      const listPharmacyData = data.listPharmacies;
      const listUser = data.listUsersByPharmacy;

      // Store pharmacy data globally
      listPharmacy = listPharmacyData;

      // Update statistics
      updateStatistics(listNumber);

      // Render pharmacy list
      renderPharmacyList(listPharmacyData, listUser);

      // Initialize search functionality
      initializeSearch();
    })
    .catch((error) => {
      console.error("Error loading accounts data:", error);
      showErrorMessage("Không thể tải dữ liệu tài khoản");
    });
}

// Update statistics cards
function updateStatistics(listNumber) {
  const numEmployees = document.querySelector("#num-employees");
  const numPharmacies = document.querySelector("#num-pharmacies");
  const numCustomers = document.querySelector("#num-customers");

  if (numEmployees) numEmployees.textContent = listNumber[0] || 0;
  if (numPharmacies) numPharmacies.textContent = listNumber[1] || 0;
  if (numCustomers) numCustomers.textContent = listNumber[2] || 0;
}

// Render pharmacy list
function renderPharmacyList(pharmacyData, userData) {
  const listPharContainer = document.querySelector(".list-stores");
  if (!listPharContainer) return;

  // Clear existing content
  listPharContainer.innerHTML = "";

  pharmacyData.forEach((pharmacy) => {
    const storeItem = document.createElement("div");
    storeItem.classList.add("store-item");

    const userCount = userData[pharmacy.pharmacyId]
      ? userData[pharmacy.pharmacyId].length
      : 0;

    storeItem.innerHTML = `
      <div class="store-info">
        <h4>${pharmacy.pharmacyName}</h4>
        <p>
          <span class="material-icons">location_on</span> 
          ${pharmacy.address}
        </p>
        <p>
          <span class="material-icons">phone</span> 
          ${pharmacy.phone}
        </p>
      </div>
      <div class="store-stats">
        <div class="employee-count">${userCount} Tài khoản</div>
        <div class="store-status">Hoạt động</div>
      </div>
    `;

    // Add click handler for pharmacy selection
    storeItem.addEventListener("click", () => {
      // Remove active class from other items
      document
        .querySelectorAll(".store-item")
        .forEach((item) => item.classList.remove("active"));

      // Add active class to clicked item
      storeItem.classList.add("active");

      // Show users for selected pharmacy
      showUsersForPharmacy(userData[pharmacy.pharmacyId] || []);
    });

    listPharContainer.appendChild(storeItem);
  });
}

// Show users for selected pharmacy
function showUsersForPharmacy(users) {
  const usersList = document.querySelector(".list-users");
  if (!usersList) return;

  // Clear existing content
  usersList.innerHTML = "";

  if (users.length === 0) {
    usersList.innerHTML =
      '<div style="text-align: center; color: #718096;">Không có nhân viên nào</div>';
    return;
  }

  users.forEach((user) => {
    const userItem = document.createElement("div");
    userItem.classList.add("user-item");

    // Generate initials for avatar
    const initials = user.fullName
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();

    userItem.innerHTML = `
      <div class="user-avatar">${initials}</div>
      <div class="user-info">
        <h4>${user.fullName}</h4>
        <p>${user.email}</p>
        <p>${user.phone}</p>
      </div>
      <div class="user-role ${
        user.role === "manager" ? "manager" : "employee"
      }">
        ${user.role === "manager" ? "Quản lý" : "Nhân viên"}
      </div>
    `;

    usersList.appendChild(userItem);
  });
}

// Initialize search functionality
function initializeSearch() {
  const searchBtn = document.querySelector(".btn-search");
  const searchInput = document.querySelector(".search-input");

  if (searchBtn) {
    searchBtn.addEventListener("click", performSearch);
  }

  if (searchInput) {
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        performSearch();
      }
    });
  }
}

// Perform search functionality
function performSearch() {
  const searchType = document.querySelector(".search-select")?.value || "all";
  const searchContent = document.querySelector(".search-input")?.value || "";

  if (!listPharmacy.length) return;

  // Hide all store items initially
  document.querySelectorAll(".store-item").forEach((item) => {
    item.style.display = "none";
  });

  // Clear user list
  const usersList = document.querySelector(".list-users");
  if (usersList) {
    usersList.innerHTML = "Chọn nhà thuốc để xem nhân viên";
  }

  // Filter and show matching pharmacies
  listPharmacy.forEach((pharmacy, index) => {
    let isMatch = false;
    const searchTerm = searchContent.toLowerCase();

    switch (searchType) {
      case "all":
        isMatch =
          pharmacy.pharmacyName.toLowerCase().includes(searchTerm) ||
          pharmacy.address.toLowerCase().includes(searchTerm) ||
          pharmacy.phone.toLowerCase().includes(searchTerm);
        break;
      case "name":
        isMatch = pharmacy.pharmacyName.toLowerCase().includes(searchTerm);
        break;
      case "address":
        isMatch = pharmacy.address.toLowerCase().includes(searchTerm);
        break;
      case "phone":
        isMatch = pharmacy.phone.includes(searchContent);
        break;
    }

    const storeItem = document.querySelectorAll(".store-item")[index];
    if (storeItem) {
      storeItem.style.display = isMatch ? "flex" : "none";
    }
  });
}

// Placeholder functions for other panels
function renderAddAccount() {
  console.log("Add Account panel loaded");
  // Load pharmacy options for the form
  loadPharmacyOptions();
}

function renderCreateCategory() {
  console.log("Create Category panel loaded");
}

function renderAddProduct() {
  console.log("Add Product panel loaded");
  // Load category options for the form
  loadCategoryOptions();
}

function renderCreateStore() {
  console.log("Create Store panel loaded");
  // Load manager options for the form
  loadManagerOptions();
}

function renderListStores() {
  console.log("List Stores panel loaded");
  // Load stores data
  loadStoresData();
}

function renderEditStore() {
  console.log("Edit Store panel loaded");
}

function renderRevenueReport() {
  console.log("Revenue Report panel loaded");
  // Load revenue data
  loadRevenueData();
}

// Helper functions
function loadPharmacyOptions() {
  // Load pharmacy options for form selects
  const pharmacySelect = document.getElementById("pharmacy");
  if (pharmacySelect && listPharmacy.length > 0) {
    pharmacySelect.innerHTML = '<option value="">Chọn nhà thuốc</option>';
    listPharmacy.forEach((pharmacy) => {
      const option = document.createElement("option");
      option.value = pharmacy.pharmacyId;
      option.textContent = pharmacy.pharmacyName;
      pharmacySelect.appendChild(option);
    });
  }
}

function loadCategoryOptions() {
  // TODO: Implement category loading
  console.log("Loading categories...");
}

function loadManagerOptions() {
  // TODO: Implement manager loading
  console.log("Loading managers...");
}

function loadStoresData() {
  // TODO: Implement stores data loading
  console.log("Loading stores data...");
}

function loadRevenueData() {
  // TODO: Implement revenue data loading
  console.log("Loading revenue data...");
}

function showErrorMessage(message) {
  // TODO: Implement proper error handling UI
  console.error(message);
}

// User profile functions
function showUserInfo() {
  // TODO: Implement user info modal
  console.log("Show user info");
}

function logout() {
  // Clear session/local storage
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {
    console.error("Error clearing storage:", e);
  }

  // Redirect to login page
  window.location.href = "index.html";
}

// Form submission handlers
document.addEventListener("DOMContentLoaded", function () {
  // Add Account form
  const addAccountForm = document.querySelector(
    "#panel-add-account .panel-form"
  );
  if (addAccountForm) {
    addAccountForm.addEventListener("submit", handleAddAccount);
  }

  // Create Category form
  const createCategoryForm = document.querySelector(
    "#panel-create-category .panel-form"
  );
  if (createCategoryForm) {
    createCategoryForm.addEventListener("submit", handleCreateCategory);
  }

  // Add Product form
  const addProductForm = document.querySelector(
    "#panel-add-product .panel-form"
  );
  if (addProductForm) {
    addProductForm.addEventListener("submit", handleAddProduct);
  }

  // Create Store form
  const createStoreForm = document.querySelector(
    "#panel-create-store .panel-form"
  );
  if (createStoreForm) {
    createStoreForm.addEventListener("submit", handleCreateStore);
  }
});

// Form handlers
function handleAddAccount(e) {
  e.preventDefault();
  // TODO: Implement add account logic
  console.log("Add account form submitted");
}

function handleCreateCategory(e) {
  e.preventDefault();
  // TODO: Implement create category logic
  console.log("Create category form submitted");
}

function handleAddProduct(e) {
  e.preventDefault();
  // TODO: Implement add product logic
  console.log("Add product form submitted");
}

function handleCreateStore(e) {
  e.preventDefault();
  // TODO: Implement create store logic
  console.log("Create store form submitted");
}
