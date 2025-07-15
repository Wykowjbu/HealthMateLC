// ============================================================================
// GLOBAL VARIABLES
// ============================================================================
let navItems = document.querySelectorAll(".nav-item");
let panelItems = document.querySelectorAll(".panel");
let listPharmacy = [];
let allProducts = [];
let allStores = [];
let currentPage = 0; // dùng cho nhà thuốc
const pageSize = 6; // dùng cho nhà thuốc, mỗi trang 6 nhà thuốc
let totalPages = 0;
let isSearching = false;
let currentSearchParams = {};

// Initialize the admin dashboard
// Add session check on dashboard load
async function checkSessionOnLoad() {
  const ok = await checkSessionOrRedirect();
  if (!ok) return;
}

document.addEventListener("DOMContentLoaded", function () {
  checkSessionOnLoad(); // <--- Add this line
  initializeNavigation();
  initializeUserDropdown();
  initializeProductSearch();
  initializeStoreSearch();
  loadInitialData();
  attachAddStoreButtonEvent();
});

window.addEventListener("pageshow", function(event) {
  checkSessionOnLoad();
});

// Form submission handlers
document.addEventListener("DOMContentLoaded", function () {
  // Add Account form
  const addAccountForm = document.querySelector("#panel-add-account .panel-form");
  if (addAccountForm) {
    addAccountForm.addEventListener("submit", handleAddAccount);
  }

  // Add Product form
  const addProductForm = document.querySelector("#panel-add-product .panel-form");
  if (addProductForm) {
    addProductForm.addEventListener("submit", handleAddProduct);
  }

  // Edit Product form
  const editProductForm = document.querySelector("#panel-edit-product .panel-form");
  if (editProductForm) {
    editProductForm.addEventListener("submit", handleEditProduct);
  }

  // Create Store form
  const createStoreForm = document.querySelector("#panel-create-store .panel-form");
  if (createStoreForm) {
    createStoreForm.addEventListener("submit", handleCreateStore);
  }

  // Edit Store form
  const editStoreForm = document.querySelector("#panel-edit-store .panel-form");
  if (editStoreForm) {
    editStoreForm.addEventListener("submit", handleEditStore);
  }
});

// NAVIGATION & UI COMPONENTS

// Navigation handling
function initializeNavigation() {
  navItems.forEach((item) => {
    item.addEventListener("click", async () => {
      // Remove active class from all nav items and panels
      navItems.forEach((el) => el.classList.remove("active"));
      panelItems.forEach((el) => el.classList.remove("active"));

      // Add active class to clicked item
      item.classList.add("active");

      // Find and activate the corresponding panel
      const type = item.getAttribute("data-type");
      const panel = document.getElementById(`panel-${type}`);
      if (panel) {
        panel.classList.add("active");
      } else {
        console.error(`Panel not found for type: ${type}`);
      }

      // Update header title
      updateHeaderTitle(type);

      // Render content based on panel type
      renderContent(type);
    });
  });
}

// Update header title based on panel type
function updateHeaderTitle(type) {
  const headerTitle = document.querySelector(".header-title");
  if (!headerTitle) return;

  const titleMap = {
    "list-accounts": "Danh Sách Tài Khoản",
    "add-account": "Tạo Tài Khoản",
    "list-products": "Danh Sách Sản Phẩm",
    "add-product": "Thêm Sản Phẩm",
    "edit-product": "Chỉnh Sửa Sản Phẩm",
    "create-store": "Tạo Nhà Thuốc Mới",
    "list-stores": "Danh Sách Nhà Thuốc",
    "edit-store": "Chỉnh Sửa Nhà Thuốc",
    "revenue-report": "Báo Cáo Doanh Thu",
  };

  headerTitle.textContent = titleMap[type] || "Admin Dashboard";
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

// Initialize store search functionality
function initializeStoreSearch() {
  const storeSearchBtn = document.querySelector("#store-search-btn");
  const storeSearchInput = document.querySelector("#store-search-input");
  const storeClearBtn = document.querySelector("#store-clear-btn");

  if (storeSearchBtn) {
    storeSearchBtn.addEventListener("click", performStoreSearch);
  }

  if (storeSearchInput) {
    storeSearchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        performStoreSearch();
      }
    });
  }

  if (storeClearBtn) {
    storeClearBtn.addEventListener("click", clearStoreSearch);
  }
}

// ============================================================================
// CONTENT RENDERING
// ============================================================================

// Content rendering based on panel type
function renderContent(type) {
  // Ẩn tất cả pagination sections trước
  document.querySelectorAll('.pagination-section').forEach(section => {
    section.style.display = 'none';
  });

  switch (type) {
    case "list-accounts":
      renderListAccounts();
      break;
    case "add-account":
      renderAddAccount();
      break;
    case "list-products":
      renderListProducts();
      // Hiện pagination-section cho sản phẩm
      const productPagSection = document.querySelector('#product-list-pagination')?.parentElement;
      if (productPagSection && productPagSection.classList.contains('pagination-section')) {
        productPagSection.style.display = 'block';
      }
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
    case "revenue-report":
      renderRevenueReport();
      break;
    case "edit-product":
      renderEditProduct();
      break;
    case "edit-store":
      renderEditStore();
      break;
    default:
      console.log(`Panel type ${type} not implemented yet`);
  }
}

// Load initial data for list-accounts panel
function loadInitialData() {
  renderListAccounts();
}

// ============================================================================
// ACCOUNTS MANAGEMENT
// ============================================================================

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
      showToast("Không thể tải dữ liệu tài khoản");
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
      document
        .querySelectorAll(".store-item")
        .forEach((item) => item.classList.remove("active"));
      storeItem.classList.add("active");
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
      <div class="user-role ${user.role === "manager" ? "manager" : "employee"}">
        ${user.role === "manager" ? "Quản lý" : "Nhân viên"}
      </div>
    `;

    usersList.appendChild(userItem);
  });
}

// Render add account panel
function renderAddAccount() {
  loadPharmacyOptions();
  loadRoles();
}

// ============================================================================
// SEARCH FUNCTIONALITY
// ============================================================================

// Initialize search functionality for accounts
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

// Perform search functionality for accounts
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

// ============================================================================
// PRODUCTS MANAGEMENT
// ============================================================================

// Render list products with pagination
function renderListProducts() {
  fetch("http://localhost:8080/admin/list-products", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((products) => {
      allProducts = products || [];
      currentPage = 1;
      renderProductTable();
      renderPagination();
    })
    .catch((error) => {
      console.error("Error loading products:", error);
      const tbody = document.querySelector("#product-list-table tbody");
      if (tbody)
        tbody.innerHTML =
          '<tr><td colspan="7" style="color:red;text-align:center;">Không thể tải danh sách sản phẩm</td></tr>';
    });
}

function renderProductTable() {
  const table = document.getElementById("product-list-table");
  const emptyDiv = document.getElementById("product-list-empty");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  if (!allProducts || allProducts.length === 0) {
    tbody.innerHTML = "";
    if (emptyDiv) emptyDiv.style.display = "block";
    return;
  }
  if (emptyDiv) emptyDiv.style.display = "none";

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageProducts = allProducts.slice(start, end);

  let html = "";
  pageProducts.forEach((p, idx) => {
    html += `
      <tr>
        <td>${start + idx + 1}</td>
        <td title="${p.productName}">${p.productName}</td>
        <td title="${p.productType}">${p.productType}</td>
        <td title="${p.unit}">${p.unit}</td>
        <td>
          <div class="quantity-control" data-product-id="${p.productId}">
            <button class="btn-qty btn-qty-minus" data-action="subtract">-</button>
            <input type="number" class="input-qty" value="${p.quantity ?? 0}" min="0" style="width:60px;text-align:center;" />
            <button class="btn-qty btn-qty-plus" data-action="add">+</button>
          </div>
        </td>
        <td>${Number(p.price).toLocaleString("vi-VN")}</td>
        <td title="${p.description || ''}">${p.description || ""}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-edit" onclick="editProduct(${p.productId})">Sửa</button>
          </div>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
  attachQuantityEvents();
}

function renderPagination() {
  const container = document.getElementById("product-list-pagination");
  if (!container) return;
  const totalPages = Math.ceil(allProducts.length / pageSize);
  if (totalPages <= 1) {
    container.innerHTML = '<span style="color: #718096; font-size: 14px; font-weight: 500;">Trang 1 / 1</span>';
    return;
  }
  let html = "";
  if (currentPage > 1) {
    html += `<button class="pagination-btn" data-page="${currentPage - 1}">‹</button>`;
  }
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pagination-btn${i === currentPage ? " active" : ""}" data-page="${i}">${i}</button>`;
  }
  if (currentPage < totalPages) {
    html += `<button class="pagination-btn" data-page="${currentPage + 1}">›</button>`;
  }
  container.innerHTML = html;
  container.querySelectorAll(".pagination-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const page = parseInt(this.getAttribute("data-page"));
      if (page && page !== currentPage) {
        currentPage = page;
        renderProductTable();
        renderPagination();
      }
    });
  });
}

// Search products functionality
function initializeProductSearch() {
  const searchBtn = document.getElementById("product-search-btn");
  const searchInput = document.getElementById("product-search-input");
  const clearBtn = document.getElementById("product-clear-btn");

  if (searchBtn) {
    searchBtn.addEventListener("click", performProductSearch);
  }

  if (searchInput) {
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        performProductSearch();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", clearProductSearch);
  }
}

function performProductSearch() {
  const keyword = document.getElementById("product-search-input")?.value?.trim() || "";
  const searchType = document.getElementById("product-search-type")?.value || "all";

  if (!keyword) {
    renderListProducts();
    return;
  }

  fetch(
    `http://localhost:8080/admin/search-products?keyword=${encodeURIComponent(
      keyword
    )}&type=${searchType}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
    .then((response) => response.json())
    .then((products) => {
      allProducts = products || [];
      currentPage = 1;
      renderProductTable();
      renderPagination();
    })
    .catch((error) => {
      console.error("Error searching products:", error);
      showToast("Có lỗi xảy ra khi tìm kiếm sản phẩm");
    });
}

function clearProductSearch() {
  const searchInput = document.getElementById("product-search-input");
  const searchType = document.getElementById("product-search-type");
  if (searchInput) {
    searchInput.value = "";
  }
  if (searchType) {
    searchType.value = "all";
  }
  renderListProducts();
}

// Edit product functionality
function editProduct(productId) {
  fetch(`http://localhost:8080/admin/product/${productId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Sản phẩm không tồn tại");
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      return response.json();
    })
    .then((product) => {
      // Switch to edit panel
      document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
      document.getElementById("panel-edit-product").classList.add("active");

      // Update sidebar
      document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
      document.querySelector('.nav-item[data-type="list-products"]').classList.add("active");

      // Update header title
      updateHeaderTitle("edit-product");

      // Load product types and units first
      loadProductTypes();
      loadProductUnits();

      // Fill form with product data after a short delay to ensure options are loaded
      setTimeout(() => {
        document.getElementById("edit-product-id").value = product.productId;
        document.getElementById("edit-product-name").value = product.productName;
        document.getElementById("edit-product-price").value = product.price;
        document.getElementById("edit-product-description").value = product.description || "";

        // Handle product type
        const productTypeSelect = document.getElementById("edit-product-type");
        const productTypeCustom = document.getElementById("edit-product-type-custom");

        const typeOptions = Array.from(productTypeSelect.options).map((opt) => opt.value);
        if (typeOptions.includes(product.productType)) {
          productTypeSelect.value = product.productType;
          productTypeCustom.style.display = "none";
          productTypeCustom.classList.remove("show");
          productTypeCustom.required = false;
        } else {
          productTypeSelect.value = "other";
          productTypeCustom.style.display = "block";
          productTypeCustom.classList.add("show");
          productTypeCustom.required = true;
          productTypeCustom.value = product.productType;
        }

        // Handle product unit
        const productUnitSelect = document.getElementById("edit-product-unit");
        const productUnitCustom = document.getElementById("edit-product-unit-custom");

        const unitOptions = Array.from(productUnitSelect.options).map((opt) => opt.value);
        if (unitOptions.includes(product.unit)) {
          productUnitSelect.value = product.unit;
          productUnitCustom.style.display = "none";
          productUnitCustom.classList.remove("show");
          productUnitCustom.required = false;
        } else {
          productUnitSelect.value = "other";
          productUnitCustom.style.display = "block";
          productUnitCustom.classList.add("show");
          productUnitCustom.required = true;
          productUnitCustom.value = product.unit;
        }

        // Initialize custom inputs for edit form
        initializeEditProductCustomInputs();
      }, 100);
    })
    .catch((error) => {
      console.error("Error loading product:", error);
      let errorMessage = "Không thể tải thông tin sản phẩm";
      if (error.message.includes("Sản phẩm không tồn tại")) {
        errorMessage = "Sản phẩm không tồn tại";
      } else if (error.message.includes("Failed to fetch")) {
        errorMessage = "Không thể kết nối đến server";
      }
      showToast(errorMessage);
    });
}

function cancelEditProduct() {
  // Switch back to product list
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
  document.getElementById("panel-list-products").classList.add("active");

  // Update navigation back to list-products
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
  document.querySelector('.nav-item[data-type="list-products"]').classList.add("active");

  // Update header
  updateHeaderTitle("list-products");

  // Clear form and hide custom inputs
  const form = document.getElementById("edit-product-form");
  if (form) {
    form.reset();
    const customInputs = form.querySelectorAll(".custom-input");
    customInputs.forEach((input) => {
      input.style.display = "none";
      input.classList.remove("show");
      input.required = false;
      input.value = "";
    });
  }
}

function cancelEditStore() {
  // Switch back to store list
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
  document.getElementById("panel-list-stores").classList.add("active");

  // Update navigation back to list-stores
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
  document.querySelector('.nav-item[data-type="list-stores"]').classList.add("active");

  // Update header
  updateHeaderTitle("list-stores");

  // Clear form
  const form = document.querySelector("#panel-edit-store .panel-form");
  if (form) {
    form.reset();
    document.getElementById("edit-store-id").value = "";
  }
}

function initializeEditProductCustomInputs() {
  const productTypeSelect = document.getElementById("edit-product-type");
  const productTypeCustom = document.getElementById("edit-product-type-custom");
  const productUnitSelect = document.getElementById("edit-product-unit");
  const productUnitCustom = document.getElementById("edit-product-unit-custom");

  if (productTypeSelect && productTypeCustom) {
    productTypeSelect.removeEventListener("change", handleProductTypeChange);
    productTypeSelect.addEventListener("change", handleProductTypeChange);
  }

  if (productUnitSelect && productUnitCustom) {
    productUnitSelect.removeEventListener("change", handleProductUnitChange);
    productUnitSelect.addEventListener("change", handleProductUnitChange);
  }
}

function handleProductTypeChange() {
  const productTypeCustom = document.getElementById("edit-product-type-custom");
  if (this.value === "other") {
    productTypeCustom.style.display = "block";
    productTypeCustom.classList.add("show");
    productTypeCustom.required = true;
    productTypeCustom.focus();
  } else {
    productTypeCustom.classList.remove("show");
    setTimeout(() => {
      productTypeCustom.style.display = "none";
      productTypeCustom.required = false;
    }, 300);
    productTypeCustom.value = "";
  }
}

function handleProductUnitChange() {
  const productUnitCustom = document.getElementById("edit-product-unit-custom");
  if (this.value === "other") {
    productUnitCustom.style.display = "block";
    productUnitCustom.classList.add("show");
    productUnitCustom.required = true;
    productUnitCustom.focus();
  } else {
    productUnitCustom.classList.remove("show");
    setTimeout(() => {
      productUnitCustom.style.display = "none";
      productUnitCustom.required = false;
    }, 300);
    productUnitCustom.value = "";
  }
}

// Render add product panel
function renderAddProduct() {
  loadProductTypes();
  loadProductUnits();
  initializeCustomInputs();
  updateHeaderTitle("add-product");
}

// Initialize custom input handlers for product type and unit
function initializeCustomInputs() {
  const productTypeSelect = document.getElementById("product-type");
  const productTypeCustom = document.getElementById("product-type-custom");
  const productUnitSelect = document.getElementById("product-unit");
  const productUnitCustom = document.getElementById("product-unit-custom");

  if (productTypeSelect && productTypeCustom) {
    productTypeSelect.addEventListener("change", function () {
      if (this.value === "other") {
        productTypeCustom.style.display = "block";
        productTypeCustom.classList.add("show");
        productTypeCustom.required = true;
        productTypeCustom.focus();
      } else {
        productTypeCustom.classList.remove("show");
        setTimeout(() => {
          productTypeCustom.style.display = "none";
          productTypeCustom.required = false;
        }, 300);
        productTypeCustom.value = "";
      }
    });
  }

  if (productUnitSelect && productUnitCustom) {
    productUnitSelect.addEventListener("change", function () {
      if (this.value === "other") {
        productUnitCustom.style.display = "block";
        productUnitCustom.classList.add("show");
        productUnitCustom.required = true;
        productUnitCustom.focus();
      } else {
        productUnitCustom.classList.remove("show");
        setTimeout(() => {
          productUnitCustom.style.display = "none";
          productUnitCustom.required = false;
        }, 300);
        productUnitCustom.value = "";
      }
    });
  }
}

// ========== STORES MANAGEMENT (SERVER-SIDE PAGINATION) =============

function renderCreateStore() {
  loadManagerOptions();
  updateHeaderTitle("create-store");
}

function renderListStores(keepPage = false) {
  if (!keepPage) currentPage = 0;
  loadStoresFromAPI(currentPage, pageSize);
  const paginationSection = document.getElementById('store-pagination-section');
  if (paginationSection) {
    paginationSection.style.display = 'block';
  }
  updateHeaderTitle("list-stores");
  attachAddStorePanelButtonEvent();
}

function loadStoresFromAPI(page, size) {
  const url = isSearching
    ? `http://localhost:8080/admin/search-pharmacies-paginated?keyword=${encodeURIComponent(currentSearchParams.keyword)}&type=${currentSearchParams.type}&page=${page}&size=${size}`
    : `http://localhost:8080/admin/list-pharmacies-paginated?page=${page}&size=${size}`;

  fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => response.json())
    .then((data) => {
      allStores = data.pharmacies || [];
      totalPages = data.totalPages || 0;
      currentPage = data.currentPage || 0;
      renderStoreTable();
      renderStorePagination();
    })
    .catch((error) => {
      const tbody = document.getElementById("store-list-tbody");
      if (tbody)
        tbody.innerHTML =
          '<tr><td colspan="8" style="color:red;text-align:center;">Không thể tải danh sách nhà thuốc (API lỗi)</td></tr>';
    });
}

function renderStoreTable() {
  const tbody = document.getElementById("store-list-tbody");
  if (!tbody) return;
  if (!allStores || allStores.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center;color:#888;">Không có nhà thuốc nào</td></tr>';
    return;
  }
  let html = "";
  allStores.forEach((store, idx) => {
    const globalIndex = currentPage * pageSize + idx + 1;
    html += `
      <tr>
        <td>${globalIndex}</td>
        <td title="${store.pharmacyName}"><span title="${store.pharmacyName}">${store.pharmacyName}</span></td>
        <td title="${store.address || ''}"><span title="${store.address || ''}">${store.address || ""}</span></td>
        <td title="${store.phone || ''}"><span title="${store.phone || ''}">${store.phone || ""}</span></td>
        <td title="${store.email || ''}"><span title="${store.email || ''}">${store.email || ""}</span></td>
        <td title="${store.manager || 'Chưa gán'}"><span title="${store.manager || 'Chưa gán'}">${store.manager || "Chưa gán"}</span></td>
        <td>
          <span class="status ${store.isActive ? 'active' : 'inactive'}" title="${store.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}">
            ${store.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
          </span>
        </td>
        <td>
          <div class="action-buttons">
            ${store.isActive ? `<button class="btn-edit" data-id="${store.pharmacyId}">Sửa</button>` : ''}
            ${store.isActive
              ? `<button class="btn-disable" data-id="${store.pharmacyId}">Vô hiệu hóa</button>`
              : `<button class="btn-enable" data-id="${store.pharmacyId}">Kích hoạt</button>`
            }
          </div>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
  attachStoreActionEvents();
}

function renderStorePagination() {
  const container = document.getElementById("store-list-pagination");
  if (!container) return;
  if (totalPages <= 1) {
    container.innerHTML = `<span style="color: #718096; font-size: 14px; font-weight: 500;">Trang ${currentPage + 1} / ${totalPages || 1}</span>`;
    return;
  }
  let html = "";
  if (currentPage > 0) {
    html += `<button class="pagination-btn" data-page="${currentPage - 1}">‹</button>`;
  }
  for (let i = 0; i < totalPages; i++) {
    html += `<button class="pagination-btn${i === currentPage ? " active" : ""}" data-page="${i}">${i + 1}</button>`;
  }
  if (currentPage < totalPages - 1) {
    html += `<button class="pagination-btn" data-page="${currentPage + 1}">›</button>`;
  }
  container.innerHTML = html;
  container.querySelectorAll(".pagination-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const page = parseInt(this.getAttribute("data-page"));
      if (page !== null && page !== currentPage) {
        currentPage = page;
        loadStoresFromAPI(currentPage, pageSize);
      }
    });
  });
}

function performStoreSearch() {
  const keyword = document.getElementById("store-search-input")?.value?.trim() || "";
  const searchType = document.getElementById("store-search-type")?.value || "all";
  if (!keyword) {
    isSearching = false;
    currentPage = 0;
    loadStoresFromAPI(currentPage, pageSize);
    return;
  }
  isSearching = true;
  currentSearchParams = { keyword, type: searchType };
  currentPage = 0;
  loadStoresFromAPI(currentPage, pageSize);
}

function clearStoreSearch() {
  const searchInput = document.getElementById("store-search-input");
  const searchType = document.getElementById("store-search-type");
  if (searchInput) searchInput.value = "";
  if (searchType) searchType.value = "all";
  isSearching = false;
  currentPage = 0;
  loadStoresFromAPI(currentPage, pageSize);
}

function attachStoreActionEvents() {
  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      showEditStorePanel(id);
    });
  });

  document.querySelectorAll(".btn-disable").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      const confirmDialog = document.createElement("div");
      confirmDialog.className = "confirm-dialog";
      confirmDialog.innerHTML = `
        <div class="confirm-content">
          <h3>Xác nhận vô hiệu hóa</h3>
          <p>Bạn có chắc chắn muốn vô hiệu hóa nhà thuốc này?</p>
          <div class="confirm-actions"></div>
            <button class="btn btn-secondary btn-cancel-disable">Hủy</button>
            <button class="btn btn-danger btn-confirm-disable">Vô hiệu hóa</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmDialog);

      confirmDialog.querySelector(".btn-cancel-disable").addEventListener("click", closeConfirmDialog);
      confirmDialog.querySelector(".btn-confirm-disable").addEventListener("click", function () {
        closeConfirmDialog();
        updatePharmacyStatus(id, false);
      });
    });
  });

  document.querySelectorAll(".btn-enable").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      updatePharmacyStatus(id, true);
    });
  });
}

function showEditStorePanel(id) {
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
  document.getElementById("panel-edit-store").classList.add("active");
  document.getElementById("panel-edit-store").setAttribute("data-edit-id", id);

  document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
  document.querySelector('.nav-item[data-type="list-stores"]').classList.add("active");

  updateHeaderTitle("edit-store");

  fetch(`http://localhost:8080/admin/pharmacy/${id}`)
    .then((res) => res.json())
    .then((store) => {
      document.getElementById("edit-store-id").value = store.pharmacyId;
      document.getElementById("edit-store-name").value = store.pharmacyName || "";
      document.getElementById("edit-store-address").value = store.address || "";
      document.getElementById("edit-store-phone").value = store.phone || "";
      document.getElementById("edit-store-email").value = store.email || "";

      const isActive = store.isActive === true || store.isActive === "true";
      if (!isActive) {
        document
          .querySelectorAll("#panel-edit-store .form-input, #panel-edit-store .form-select")
          .forEach((input) => (input.disabled = true));
        document.querySelector("#panel-edit-store button[type='submit']").disabled = true;
      } else {
        document
          .querySelectorAll("#panel-edit-store .form-input, #panel-edit-store .form-select")
          .forEach((input) => (input.disabled = false));
        document.querySelector("#panel-edit-store button[type='submit']").disabled = false;
      }
    })
    .catch((error) => {
      console.error("Error loading pharmacy:", error);
      showToast("Không thể tải thông tin nhà thuốc");
    });
}

function updatePharmacyStatus(id, isActive) {
  fetch(`http://localhost:8080/admin/update-pharmacy/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  })
    .then((res) => res.json())
    .then((res) => {
      showToast(res.message || (isActive ? "Kích hoạt thành công!" : "Vô hiệu hóa thành công!"));
      renderListStores(true);
      fetch("http://localhost:8080/admin/list-pharmacies")
        .then((res) => res.json())
        .then((pharmacies) => {
          listPharmacy = pharmacies || [];
          if (document.getElementById("panel-add-account").classList.contains("active")) {
            loadPharmacyOptions();
          }
        });
      document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
      document.querySelector('.nav-item[data-type="list-stores"]').classList.add("active");
      updateHeaderTitle("list-stores");
    })
    .catch(() => showToast("Có lỗi xảy ra khi cập nhật trạng thái!"));
}

// Render edit store panel
function renderEditStore() {
  const form = document.querySelector("#panel-edit-store .panel-form");
  if (form) {
    form.reset();
    document.getElementById("edit-store-id").value = "";
  }
  updateHeaderTitle("edit-store");
}

// ============================================================================
// REVENUE REPORT
// ============================================================================

// Render revenue report panel
function renderRevenueReport() {
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
  document.getElementById("panel-revenue-report").classList.add("active");
  updateHeaderTitle("revenue-report");
  loadRevenueData();
}

// ============================================================================
// FORM SUBMISSION HANDLERS
// ============================================================================

function handleAddAccount(e) {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const fullName = document.getElementById("fullname").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const role = document.getElementById("role").value;
  const pharmacyId = Number(document.getElementById("pharmacy").value);

  if (!username || !password || !fullName || !role || !pharmacyId) {
    showToast("Vui lòng điền đầy đủ thông tin bắt buộc");
    return;
  }

  const formData = {
    username: username,
    password: password,
    role: role,
    isActive: true,
    fullName: fullName,
    phone: phone,
    email: email,
    pharmacyId: pharmacyId,
  };

  fetch(`http://localhost:8080/admin/add-account`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        showToast(data.message);
        if (data.message.includes("thành công")) {
          e.target.reset();
          renderListAccounts();
        }
      }
    })
    .catch((error) => {
      console.error("Error creating account:", error);
      showToast("Có lỗi xảy ra khi tạo tài khoản");
    });
}

function handleAddProduct(e) {
  e.preventDefault();
  const productNameInput = document.getElementById("product-name");
  const productTypeSelect = document.getElementById("product-type");
  const productTypeCustom = document.getElementById("product-type-custom");
  const productUnitSelect = document.getElementById("product-unit");
  const productUnitCustom = document.getElementById("product-unit-custom");
  const productPriceInput = document.getElementById("product-price");
  const productQuantityInput = document.getElementById("product-quantity"); // Lấy input số lượng
  const productDescriptionInput = document.getElementById("product-description");
  const productName = productNameInput.value.trim();

  if (!productName) {
    showToast("Vui lòng nhập tên sản phẩm");
    productNameInput.focus();
    return;
  }

  let productType = productTypeSelect.value;
  if (productType === "other") {
    productType = productTypeCustom.value.trim();
    if (!productType) {
      showToast("Vui lòng nhập loại sản phẩm khi chọn 'Khác'");
      productTypeCustom.focus();
      return;
    }
  } else if (!productType) {
    showToast("Vui lòng chọn loại sản phẩm");
    productTypeSelect.focus();
    return;
  }

  let productUnit = productUnitSelect.value;
  if (productUnit === "other") {
    productUnit = productUnitCustom.value.trim();
    if (!productUnit) {
      showToast("Vui lòng nhập đơn vị khi chọn 'Khác'");
      productUnitCustom.focus();
      return;
    }
  } else if (!productUnit) {
    showToast("Vui lòng chọn đơn vị");
    productUnitSelect.focus();
    return;
  }

  const price = parseFloat(productPriceInput.value);
  if (!price || price <= 0) {
    showToast("Vui lòng nhập giá bán hợp lệ (phải lớn hơn 0)");
    productPriceInput.focus();
    return;
  }

  const quantity = parseInt(productQuantityInput.value) || 0;
  if (quantity < 0) {
    showToast("Số lượng không được âm");
    productQuantityInput.focus();
    return;
  }

  const description = productDescriptionInput.value.trim();
  const formData = {
    productName: productName,
    productType: productType,
    unit: productUnit,
    description: description,
    price: price.toFixed(2),
    quantity: quantity // Gửi số lượng lên backend
  };

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Đang thêm...";
  submitBtn.disabled = true;

  fetch(`http://localhost:8080/admin/add-product`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        showToast(data.message);
        if (data.message.includes("thành công")) {
          e.target.reset();
          if (productTypeCustom) {
            productTypeCustom.style.display = "none";
            productTypeCustom.required = false;
          }
          if (productUnitCustom) {
            productUnitCustom.style.display = "none";
            productUnitCustom.required = false;
          }
        }
      }
    })
    .catch((error) => {
      console.error("Error creating product:", error);
      showToast("Có lỗi xảy ra khi thêm sản phẩm. Vui lòng thử lại.");
    })
    .finally(() => {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    });
}

function handleEditProduct(e) {
  e.preventDefault();
  const productId = document.getElementById("edit-product-id").value;
  const productName = document.getElementById("edit-product-name").value.trim();
  const productTypeSelect = document.getElementById("edit-product-type");
  const productTypeCustom = document.getElementById("edit-product-type-custom");
  const productUnitSelect = document.getElementById("edit-product-unit");
  const productUnitCustom = document.getElementById("edit-product-unit-custom");
  const productPrice = parseFloat(document.getElementById("edit-product-price").value);
  const productDescription = document.getElementById("edit-product-description").value.trim();

  if (!productName) {
    showToast("Vui lòng nhập tên sản phẩm");
    return;
  }

  let productType = productTypeSelect.value;
  if (productType === "other") {
    productType = productTypeCustom.value.trim();
    if (!productType) {
      showToast("Vui lòng nhập loại sản phẩm khi chọn 'Khác'");
      return;
    }
  }

  let productUnit = productUnitSelect.value;
  if (productUnit === "other") {
    productUnit = productUnitCustom.value.trim();
    if (!productUnit) {
      showToast("Vui lòng nhập đơn vị khi chọn 'Khác'");
      return;
    }
  }

  if (!productPrice || productPrice <= 0) {
    showToast("Vui lòng nhập giá bán hợp lệ");
    return;
  }

  const formData = {
    productName: productName,
    productType: productType,
    unit: productUnit,
    price: productPrice,
    description: productDescription,
  };

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Đang cập nhật...";
  submitBtn.disabled = true;

  fetch(`http://localhost:8080/admin/edit-product/${productId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  })
    .then((response) => response.json())
    .then((data) => {
      showToast(data.message);
      if (data.message.includes("thành công")) {
        cancelEditProduct();
        renderListProducts();
      }
    })
    .catch((error) => {
      console.error("Error updating product:", error);
      showToast("Có lỗi xảy ra khi cập nhật sản phẩm");
    })
    .finally(() => {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    });
}

function handleCreateStore(e) {
  e.preventDefault();
  const name = document.getElementById("store-name").value.trim();
  const address = document.getElementById("store-address").value.trim();
  const phone = document.getElementById("store-phone").value.trim();
  const email = document.getElementById("store-email").value.trim();

  if (!name || !phone) {
    showToast("Vui lòng nhập đầy đủ thông tin bắt buộc");
    return;
  }

  const data = {
    pharmacyName: name,
    address: address,
    phone: phone,
    email: email,
  };

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Đang tạo...";

  fetch("http://localhost:8080/admin/create-pharmacy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .then((res) => {
      showToast(res.message || (res.message && res.message.includes("thành công") ? res.message : "Có lỗi xảy ra"));
      if (res.message && res.message.includes("thành công")) {
        e.target.reset();
        document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
        document.getElementById("panel-list-stores").classList.add("active");
        document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
        document.querySelector('.nav-item[data-type="list-stores"]').classList.add("active");
        updateHeaderTitle("list-stores");
        renderListStores();
      }
    })
    .catch(() => showToast("Có lỗi xảy ra, vui lòng thử lại"))
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Tạo nhà thuốc";
    });
}

function handleEditStore(e) {
  e.preventDefault();
  const id = document.getElementById("edit-store-id").value;
  if (!id) {
    showToast("Vui lòng tìm và chọn nhà thuốc trước khi cập nhật!", "warning");
    return;
  }

  const data = {
    pharmacyName: document.getElementById("edit-store-name").value.trim(),
    address: document.getElementById("edit-store-address").value.trim(),
    phone: document.getElementById("edit-store-phone").value.trim(),
    email: document.getElementById("edit-store-email").value.trim(),
  };

  fetch(`http://localhost:8080/admin/update-pharmacy/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then(async (res) => {
      const result = await res.json();
      if (res.ok) {
        showToast(result.message || "Cập nhật thành công!");
        document.getElementById("panel-edit-store").classList.remove("active");
        document.getElementById("panel-list-stores").classList.add("active");
        document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
        document.querySelector('.nav-item[data-type="list-stores"]').classList.add("active");
        updateHeaderTitle("list-stores");
        renderListStores();
        document.getElementById("edit-store-id").value = "";
        document.getElementById("edit-store-name").value = "";
        document.getElementById("edit-store-address").value = "";
        document.getElementById("edit-store-phone").value = "";
        document.getElementById("edit-store-email").value = "";
      } else {
        showToast(result.message || "Có lỗi xảy ra khi cập nhật!");
      }
    })
    .catch(() => showToast("Có lỗi xảy ra khi cập nhật!"));
}

function loadPharmacyOptions() {
  const pharmacySelect = document.getElementById("pharmacy");
  if (pharmacySelect && listPharmacy.length > 0) {
    pharmacySelect.innerHTML = '<option value="">Chọn nhà thuốc</option>';
    listPharmacy
      .filter((pharmacy) => pharmacy.isActive)
      .forEach((pharmacy) => {
        const option = document.createElement("option");
        option.value = pharmacy.pharmacyId;
        option.textContent = pharmacy.pharmacyName;
        pharmacySelect.appendChild(option);
      });
  }
}

function loadManagerOptions() {
  // Placeholder: Implement fetching managers if needed
}

function loadRevenueData() {
  // Placeholder: Implement fetching revenue data if needed
}


async function logout() {
    showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    const response = await fetch('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
    });

    const data = await response.json();
    console.log('Logout response:', data);

    // Controller trả về JSON, JS phải tự redirect
    if (data.success) {
        window.location.href = data.redirectUrl || '/HealthMateLC/index.html';
    }
}

async function checkSessionOrRedirect() {
    try {
        const response = await fetch('http://localhost:8080/admin/profile', {
            method: 'GET',
            credentials: 'include'
        });

        // Nếu server trả về 401
        if (response.status === 401) {
            showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            console.log('Redirecting to login (401)...');
            setTimeout(() => {
                window.location.replace('/HealthMateLC/index.html');
            }, 1000);
            return false;
        }

        // Nếu server trả về 200 nhưng nội dung báo lỗi
        if (response.ok) {
            const data = await response.json();
            if (data && (data.error === 'Unauthorized access' || (data.message && data.message.includes('hết hạn')))) {
                showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                console.log('Redirecting to login (expired session in JSON)...');
                setTimeout(() => {
                    window.location.replace('/HealthMateLC/index.html');
                }, 1000);
                return false;
            }
        }

        return true;
    } catch (e) {
        // Lỗi mạng hoặc fetch lỗi
        showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        console.log('Redirecting to login (network error)...');
        setTimeout(() => {
            window.location.replace('/HealthMateLC/index.html');
        }, 1000);
        return false;
    }
}

function loadRoles() {
  const roleSelect = document.getElementById("role");
  if (roleSelect) {
    fetch(`http://localhost:8080/admin/list-roles`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((roles) => {
        roleSelect.innerHTML = '<option value="">Chọn vai trò</option>';
        const filteredRoles = roles.filter((role) => role !== "admin");
        filteredRoles.forEach((role) => {
          const option = document.createElement("option");
          option.value = role;
          option.textContent = getRoleDisplayName(role);
          roleSelect.appendChild(option);
        });
      })
      .catch((error) => {
        console.error("Error loading roles:", error);
        const fallbackRoles = ["manager", "employee", "customer-service"];
        roleSelect.innerHTML = '<option value="">Chọn vai trò</option>';
        fallbackRoles.forEach((role) => {
          const option = document.createElement("option");
          option.value = role;
          option.textContent = getRoleDisplayName(role);
          roleSelect.appendChild(option);
        });
      });
  }
}

function getRoleDisplayName(role) {
  const roleNames = {
    manager: "Quản lý",
    employee: "Nhân viên",
    "customer-service": "Chăm sóc khách hàng"
  };
  return roleNames[role] || role;
}

function showToast(message) {
  let toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <div class="toast-content">
      <span class="material-icons toast-icon">check_circle</span>
      <span class="toast-message">${message}</span>
    </div>
    <span class="toast-close">×</span>
  `;

  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);

  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function attachAddStoreButtonEvent() {
  if (form) {
    form.reset();
    const customInputs = form.querySelectorAll(".custom-input");
    customInputs.forEach((input) => {
      input.style.display = "none";
      input.classList.remove("show");
      input.required = false;
      input.value = "";
    });
  }
  loadProductTypes();
  loadProductUnits();
  initializeEditProductCustomInputs();
  updateHeaderTitle("edit-product");
}

function loadProductTypes() {
  fetch("http://localhost:8080/admin/list-products")
    .then((response) => response.json())
    .then((products) => {
      const types = [...new Set(products.map((p) => p.productType))];
      updateProductTypeOptions(types);
    })
    .catch((error) => {
      console.error("Error loading product types:", error);
      const fallbackTypes = ["Thuốc", "Thực phẩm chức năng", "Dụng cụ y tế", "Mỹ phẩm"];
      updateProductTypeOptions(fallbackTypes);
    });
}

function loadProductUnits() {
  fetch("http://localhost:8080/admin/list-products")
    .then((response) => response.json())
    .then((products) => {
      const units = [...new Set(products.map((p) => p.unit))];
      updateProductUnitOptions(units);
    })
    .catch((error) => {
      console.error("Error loading product units:", error);
      const fallbackUnits = ["Viên", "Hộp", "Chai", "Tuýp", "Cái", "Vỉ"];
      updateProductUnitOptions(fallbackUnits);
    });
}

function updateProductTypeOptions(types) {
  const addProductTypeSelect = document.getElementById("product-type");
  if (addProductTypeSelect) {
    addProductTypeSelect.innerHTML = '<option value="">Chọn loại sản phẩm</option>';
    types.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      addProductTypeSelect.appendChild(option);
    });
    addProductTypeSelect.innerHTML += '<option value="other">Khác</option>';
  }

  const editProductTypeSelect = document.getElementById("edit-product-type");
  if (editProductTypeSelect) {
    editProductTypeSelect.innerHTML = '<option value="">Chọn loại sản phẩm</option>';
    types.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      editProductTypeSelect.appendChild(option);
    });
    editProductTypeSelect.innerHTML += '<option value="other">Khác</option>';
  }
}

function updateProductUnitOptions(units) {
  const addProductUnitSelect = document.getElementById("product-unit");
  if (addProductUnitSelect) {
    addProductUnitSelect.innerHTML = '<option value="">Chọn đơn vị</option>';
    units.forEach((unit) => {
      const option = document.createElement("option");
      option.value = unit;
      option.textContent = unit;
      addProductUnitSelect.appendChild(option);
    });
    addProductUnitSelect.innerHTML += '<option value="other">Khác</option>';
  }

  const editProductUnitSelect = document.getElementById("edit-product-unit");
  if (editProductUnitSelect) {
    editProductUnitSelect.innerHTML = '<option value="">Chọn đơn vị</option>';
    units.forEach((unit) => {
      const option = document.createElement("option");
      option.value = unit;
      option.textContent = unit;
      editProductUnitSelect.appendChild(option);
    });
    editProductUnitSelect.innerHTML += '<option value="other">Khác</option>';
  }
}

function closeConfirmDialog() {
  const dialog = document.querySelector(".confirm-dialog");
  if (dialog) dialog.remove();
}

// Sau khi renderListStores, gắn lại sự kiện cho nút Thêm nhà thuốc
function attachAddStorePanelButtonEvent() {
  const addBtn = document.querySelector('#panel-list-stores .panel-header .btn.btn-primary');
  if (addBtn) {
    addBtn.onclick = function() {
      // Ẩn tất cả panel
      document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));
      // Hiện panel tạo nhà thuốc
      document.getElementById('panel-create-store').classList.add('active');
      // Cập nhật sidebar
      document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
      document.querySelector('.nav-item[data-type="create-store"]').classList.add('active');
      // Cập nhật header
      updateHeaderTitle('create-store');
      // Render lại nội dung nếu cần
      renderCreateStore();
    };
  }
};

function attachQuantityEvents() {
  document.querySelectorAll(".quantity-control").forEach((container) => {
    const productId = container.getAttribute("data-product-id");
    const input = container.querySelector(".input-qty");
    const btnMinus = container.querySelector(".btn-qty-minus");
    const btnPlus = container.querySelector(".btn-qty-plus");

    btnMinus.onclick = function () {
      let val = parseInt(input.value) || 0;
      if (val > 0) {
        updateProductQuantity(productId, 1, "subtract", input);
      }
    };
    btnPlus.onclick = function () {
      updateProductQuantity(productId, 1, "add", input);
    };
    input.onchange = function () {
      let val = parseInt(input.value) || 0;
      updateProductQuantity(productId, val, "set", input);
    };
  });
}

function updateProductQuantity(productId, quantity, operation, inputEl) {
  fetch("http://localhost:8080/admin/update-product-quantity", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: Number(productId), quantity: Number(quantity), operation }),
  })
    .then((res) => res.json())
    .then((data) => {
      showToast(data.message || "Cập nhật số lượng thành công");
      // Lưu trang hiện tại
      const currentPageBefore = currentPage;
      // Reload lại danh sách sản phẩm để đồng bộ số lượng
      fetch("http://localhost:8080/admin/list-products", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((products) => {
          allProducts = products || [];
          // Khôi phục lại trang hiện tại
          currentPage = currentPageBefore;
          renderProductTable();
          renderPagination();
        })
        .catch((error) => {
          console.error("Error reloading products:", error);
          // Nếu reload thất bại, vẫn giữ nguyên trang hiện tại
          currentPage = currentPageBefore;
          renderProductTable();
          renderPagination();
        });
    })
    .catch(() => {
      showToast("Có lỗi xảy ra khi cập nhật số lượng!");
      if (inputEl) inputEl.value = inputEl.defaultValue;
    });
}

async function handleUserProfile() {
    console.log('Đang hiển thị thông tin user...');
    try {
        const response = await fetch('http://localhost:8080/admin/profile?detail=true', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                window.location.href = '/HealthMateLC/index.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Dữ liệu user profile:', data);

        const userFullNameElement = document.getElementById('userFullName');
        if (userFullNameElement && data.fullName) {
            userFullNameElement.textContent = data.fullName;
        }

        console.log('Thông tin người dùng đã được tải và hiển thị.');

    } catch (error) {
        console.error('Lỗi khi lấy thông tin user profile:', error);
        alert('Không thể tải thông tin người dùng. Vui lòng thử lại. Lỗi: ' + error.message);
        window.location.href = '/HealthMateLC/index.html';
    }
}

async function showUserInfo() {
    try {
        const response = await fetch('http://localhost:8080/admin/showprofile', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                window.location.href = '/HealthMateLC/index.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Dữ liệu hồ sơ đầy đủ:', data);

        let modal = document.getElementById('userInfoModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'userInfoModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close">×</span>
                    <h2>Thông tin cá nhân</h2>
                    <div id="userInfoContent"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const userInfoContent = document.getElementById('userInfoContent');
        userInfoContent.innerHTML = `
                <p><strong>Họ và tên:</strong> ${data.fullName || 'Chưa cập nhật'}</p>
            <p><strong>Số điện thoại:</strong> ${data.phone || 'Chưa cập nhật'}</p>
            <p><strong>Email:</strong> ${data.email || 'Chưa cập nhật'}</p>
        `;

        modal.style.display = 'block';

        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };

        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };

        console.log('Thông tin cá nhân đã được hiển thị.');

    } catch (error) {
        console.error('Lỗi khi lấy thông tin cá nhân:', error);
        showToast('Không thể tải thông tin cá nhân. Vui lòng thử lại. Lỗi: ' + error.message);
        window.location.href = '/HealthMateLC/index.html';
    }
}
