// ============================================================================
// GLOBAL VARIABLES
// ============================================================================
let navItems = document.querySelectorAll(".nav-item");
let panelItems = document.querySelectorAll(".panel");
let listPharmacy = [];
let allProducts = [];
let allStores = [];
let currentPage = 1;
const pageSize = 6;

// ============================================================================
// INITIALIZATION & EVENT LISTENERS
// ============================================================================

// Initialize the admin dashboard
document.addEventListener("DOMContentLoaded", function () {
  initializeNavigation();
  initializeUserDropdown();
  loadInitialData();
  initializeCancelButtons();
});

// Form submission handlers
document.addEventListener("DOMContentLoaded", function () {
  // Add Account form
  const addAccountForm = document.querySelector("#panel-add-account .panel-form");
  if (addAccountForm) {
    addAccountForm.addEventListener("submit", handleAddAccount);
  }

  // Create Category form
  const createCategoryForm = document.querySelector("#panel-create-category .panel-form");
  if (createCategoryForm) {
    createCategoryForm.addEventListener("submit", handleCreateCategory);
  }

  // Add Product form
  const addProductForm = document.querySelector("#panel-add-product .panel-form");
  if (addProductForm) {
    addProductForm.addEventListener("submit", handleAddProduct);
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

// ============================================================================
// NAVIGATION & UI COMPONENTS
// ============================================================================

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

// ============================================================================
// CONTENT RENDERING
// ============================================================================

// Content rendering based on panel type
function renderContent(type) {
  switch (type) {
    case "list-accounts":
      renderListAccounts();
      break;
    case "add-account":
      renderAddAccount();
      break;
    case "list-products":
      renderListProducts();
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

// Render add account panel
function renderAddAccount() {
  console.log("Add Account panel loaded");
  loadPharmacyOptions();
  loadRoles();
}

// ============================================================================
// SEARCH FUNCTIONALITY
// ============================================================================

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
      case "auth":
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
  fetch('http://localhost:8080/admin/list-products', {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(response => response.json())
    .then(products => {
      allProducts = products || [];
      currentPage = 1;
      renderProductTable();
      renderPagination();
    })
    .catch(error => {
      console.error("Error loading products:", error);
      const tbody = document.querySelector("#product-list-table tbody");
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="color:red;text-align:center;">Không thể tải danh sách sản phẩm</td></tr>';
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
        <td>${p.productName}</td>
        <td>${p.productType}</td>
        <td>${p.unit}</td>
        <td>${Number(p.price).toLocaleString('vi-VN')}</td>
        <td>${p.description || ""}</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

function renderPagination() {
  const container = document.getElementById("product-list-pagination");
  if (!container) return;
  const totalPages = Math.ceil(allProducts.length / pageSize);
  console.log("Tổng số sản phẩm:", allProducts.length, "Số trang:", totalPages);
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }
  let html = "";
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pagination-btn${i === currentPage ? " active" : ""}" data-page="${i}">${i}</button>`;
  }
  container.innerHTML = html;

  container.querySelectorAll(".pagination-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      currentPage = parseInt(this.getAttribute("data-page"));
      renderProductTable();
      renderPagination();
    });
  });
}

// Render add product panel
function renderAddProduct() {
  console.log("Add Product panel loaded");
  loadCategoryOptions();
  initializeCustomInputs();
}

// Initialize custom input handlers for product type and unit
function initializeCustomInputs() {
  const productTypeSelect = document.getElementById("product-type");
  const productTypeCustom = document.getElementById("product-type-custom");
  const productUnitSelect = document.getElementById("product-unit");
  const productUnitCustom = document.getElementById("product-unit-custom");

  if (productTypeSelect && productTypeCustom) {
    productTypeSelect.addEventListener("change", function() {
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
    productUnitSelect.addEventListener("change", function() {
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

// ============================================================================
// STORES MANAGEMENT
// ============================================================================

// Render create store panel
function renderCreateStore() {
  console.log("Create Store panel loaded");
  loadManagerOptions();
}

// Render list stores with pagination
function renderListStores() {
  fetch('http://localhost:8080/admin/list-pharmacy')
    .then(res => res.json())
    .then(stores => {
      allStores = stores || [];
      currentPage = 1;
      renderStoreTable();
      renderStorePagination();
    })
    .catch(() => {
      const tbody = document.getElementById("store-list-tbody");
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="color:red;text-align:center;">Không thể tải danh sách nhà thuốc</td></tr>';
    });
}

function renderStoreTable() {
  const tbody = document.getElementById("store-list-tbody");
  if (!tbody) return;

  if (!allStores || allStores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#888;">Không có nhà thuốc nào</td></tr>';
    return;
  }
  let pageSize = 4;
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageStores = allStores.slice(start, end);

  let html = "";
  pageStores.forEach(store => {
    html += `
      <tr>
        <td>${store.pharmacyId}</td>
        <td>${store.pharmacyName}</td>
        <td>${store.address || ""}</td>
        <td>${store.phone || ""}</td>
        <td>${store.manager || "Chưa gán"}</td>
        <td>
          <span class="status ${store.isActive ? 'active' : 'inactive'}">
            ${store.isActive ? 'Hoạt động' : 'Tạm ngừng'}
          </span>
        </td>
        <td>
          <button class="btn-edit" data-id="${store.pharmacyId}">Sửa</button>
          <button class="btn-delete" data-id="${store.pharmacyId}">Xóa</button>
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

  const totalPages = Math.ceil(allStores.length / 4);
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pagination-btn${i === currentPage ? " active" : ""}" data-page="${i}">${i}</button>`;
  }
  container.innerHTML = html;

  container.querySelectorAll(".pagination-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      currentPage = parseInt(this.getAttribute("data-page"));
      renderStoreTable();
      renderStorePagination();
    });
  });
}

function attachStoreActionEvents() {
  // Sự kiện Sửa
  document.querySelectorAll(".btn-edit").forEach(btn => {
    btn.addEventListener("click", function() {
      const id = this.getAttribute("data-id");
      showEditStorePanel(id);
    });
  });

  // Sự kiện Xóa
  document.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", function() {
      const id = this.getAttribute("data-id");
      const name = this.closest("tr").querySelector("td:nth-child(2)").textContent;
      if (confirm(`Bạn có chắc chắn muốn xóa nhà thuốc "${name}" (ID: ${id})? Hành động này không thể hoàn tác!`)) {
        fetch(`http://localhost:8080/admin/delete-pharmacy/${id}`, { method: "DELETE" })
          .then(res => res.json())
          .then(res => {
            alert(res.message || "Đã xóa nhà thuốc!");
            renderListStores();
          })
          .catch(() => alert("Có lỗi xảy ra khi xóa nhà thuốc!"));
      }
    });
  });
}

// Hàm chuyển sang panel chỉnh sửa
function showEditStorePanel(id) {
  document.getElementById("panel-list-stores").style.display = "none";
  document.getElementById("panel-edit-store").style.display = "block";

  fetch(`http://localhost:8080/admin/pharmacy/${id}`)
    .then(res => res.json())
    .then(store => {
      document.getElementById("edit-store-name").value = store.pharmacyName || "";
      document.getElementById("edit-store-address").value = store.address || "";
      document.getElementById("edit-store-phone").value = store.phone || "";
      document.getElementById("edit-store-email").value = store.email || "";
      document.getElementById("panel-edit-store").setAttribute("data-edit-id", id);
    });
}

// Render edit store panel
function renderEditStore() {
  console.log("Edit Store panel loaded");
}

// ============================================================================
// REVENUE REPORT
// ============================================================================

// Render revenue report panel
function renderRevenueReport() {
  console.log("Revenue Report panel loaded");
  loadRevenueData();
}

// ============================================================================
// FORM CANCELLATION & NAVIGATION
// ============================================================================

// Function hủy chung cho tất cả form
function cancelForm(formId, targetPanelId) {
 const cancelAddProduct = document.getElementById("cancel-add-product");
 if (cancelAddProduct) {
   cancelAddProduct.addEventListener("click", function() {
     // Chỉ ẩn custom input, không reset, không chuyển panel
     const productTypeCustom = document.getElementById("product-type-custom");
     const productUnitCustom = document.getElementById("product-unit-custom");
     if (productTypeCustom) {
       productTypeCustom.style.display = "none";
       productTypeCustom.required = false;
     }
     if (productUnitCustom) {
       productUnitCustom.style.display = "none";
       productUnitCustom.required = false;
     }
     // KHÔNG gọi form.reset(), KHÔNG chuyển panel, KHÔNG ẩn panel
   });
    // Các form khác: reset và chuyển panel như cũ
    form.reset();
    if (targetPanelId) {
      document.querySelectorAll(".panel").forEach(panel => {
        panel.style.display = "none";
      });
      const targetPanel = document.getElementById(targetPanelId);
      if (targetPanel) {
        targetPanel.style.display = "block";
      }
    }
  }
}

// Initialize cancel buttons
function initializeCancelButtons() {
  // Nút hủy tạo tài khoản
  const cancelAddAccount = document.getElementById("cancel-add-account");
  if (cancelAddAccount) {
    cancelAddAccount.addEventListener("click", function() {
      cancelForm("#panel-add-account .panel-form", "panel-list-accounts");
    });
  }

  // Nút hủy thêm sản phẩm
  const cancelAddProduct = document.getElementById("cancel-add-product");
  if (cancelAddProduct) {
    cancelAddProduct.addEventListener("click", function() {
      cancelForm("#panel-add-product .panel-form"); // Không truyền targetPanelId
    });
  }

  // Nút hủy chỉnh sửa nhà thuốc
  const cancelEditStore = document.getElementById("cancel-edit-store");
  if (cancelEditStore) {
    cancelEditStore.addEventListener("click", function() {
      cancelForm("#panel-edit-store .panel-form", "panel-list-stores");
    });
  }

  // Nút hủy tạo nhà thuốc
  const cancelCreateStore = document.getElementById("cancel-create-store");
  if (cancelCreateStore) {
    cancelCreateStore.addEventListener("click", function() {
      cancelForm("#panel-create-store .panel-form", "panel-list-stores");
    });
  }
  // Nút thêm nhà thuốc từ danh sách
  const addStoreBtn = document.querySelector("#panel-list-stores .btn-primary");
  if (addStoreBtn) {
    addStoreBtn.addEventListener("click", function() {
      // Ẩn panel danh sách, hiện panel tạo nhà thuốc
      document.getElementById("panel-list-stores").style.display = "none";
      document.getElementById("panel-create-store").style.display = "block";
    });
  }
}

// ============================================================================
// FORM SUBMISSION HANDLERS
// ============================================================================

// Form handlers
function handleAddAccount(e) {
  e.preventDefault();

  const formData = {
    username: document.getElementById("username").value,
    password: document.getElementById("password").value,
    fullName: document.getElementById("fullname").value,
    phone: document.getElementById("phone").value,
    email: document.getElementById("email").value,
    role: document.getElementById("role").value,
    pharmacyId: document.getElementById("pharmacy").value || null
  };

  if (!formData.username || !formData.password || !formData.fullName || !formData.role) {
    alert("Vui lòng điền đầy đủ thông tin bắt buộc");
    return;
  }

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
        alert(data.message);
        if (data.message.includes("thành công")) {
          e.target.reset();
          renderListAccounts();
        }
      }
    })
    .catch((error) => {
      console.error("Error creating account:", error);
      alert("Có lỗi xảy ra khi tạo tài khoản");
    });
}

function handleCreateCategory(e) {
  e.preventDefault();
  console.log("Create category form submitted");
}

function handleAddProduct(e) {
  e.preventDefault();

  const productNameInput = document.getElementById("product-name");
  const productTypeSelect = document.getElementById("product-type");
  const productTypeCustom = document.getElementById("product-type-custom");
  const productUnitSelect = document.getElementById("product-unit");
  const productUnitCustom = document.getElementById("product-unit-custom");
  const productPriceInput = document.getElementById("product-price");
  const productDescriptionInput = document.getElementById("product-description");

  const productName = productNameInput.value.trim();
  if (!productName) {
    alert("Vui lòng nhập tên sản phẩm");
    productNameInput.focus();
    return;
  }

  let productType = productTypeSelect.value;
  if (productType === "other") {
    productType = productTypeCustom.value.trim();
    if (!productType) {
      alert("Vui lòng nhập loại sản phẩm khi chọn 'Khác'");
      productTypeCustom.focus();
      return;
    }
  } else if (!productType) {
    alert("Vui lòng chọn loại sản phẩm");
    productTypeSelect.focus();
    return;
  }

  let productUnit = productUnitSelect.value;
  if (productUnit === "other") {
    productUnit = productUnitCustom.value.trim();
    if (!productUnit) {
      alert("Vui lòng nhập đơn vị khi chọn 'Khác'");
      productUnitCustom.focus();
      return;
    }
  } else if (!productUnit) {
    alert("Vui lòng chọn đơn vị");
    productUnitSelect.focus();
    return;
  }

  const price = parseFloat(productPriceInput.value);
  if (!price || price <= 0) {
    alert("Vui lòng nhập giá bán hợp lệ (phải lớn hơn 0)");
    productPriceInput.focus();
    return;
  }

  const description = productDescriptionInput.value.trim();

  const formData = {
    productName: productName,
    productType: productType,
    unit: productUnit,
    description: description,
    price: price.toFixed(2)
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
        if (data.message.includes("thành công")) {
          alert("✅ " + data.message);
          e.target.reset();
          if (productTypeCustom) {
            productTypeCustom.style.display = "none";
            productTypeCustom.required = false;
          }
          if (productUnitCustom) {
            productUnitCustom.style.display = "none";
            productUnitCustom.required = false;
          }
        } else {
          alert("❌ " + data.message);
        }
      }
    })
    .catch((error) => {
      console.error("Error creating product:", error);
      alert("❌ Có lỗi xảy ra khi thêm sản phẩm. Vui lòng thử lại.");
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
  const isActive = document.getElementById("store-status").value === "active";

  if (!name || !phone) {
    showCreateStoreMessage("Vui lòng nhập đầy đủ thông tin bắt buộc", false);
    return;
  }

  const data = {
    pharmacyName: name,
    address: address,
    phone: phone,
    email: email,
    isActive: isActive
  };

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Đang tạo...";

  fetch('http://localhost:8080/admin/create-pharmacy', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(res => {
      if (res.message && res.message.includes("thành công")) {
        showCreateStoreMessage(res.message, true);
        e.target.reset();
      } else {
        showCreateStoreMessage((res.message || "Có lỗi xảy ra"), false);
      }
    })
    .catch(() => showCreateStoreMessage("Có lỗi xảy ra, vui lòng thử lại", false))
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Tạo nhà thuốc";
    });
}

function handleEditStore(e) {
  e.preventDefault();
  const id = document.getElementById("panel-edit-store").getAttribute("data-edit-id");
  const data = {
    pharmacyName: document.getElementById("edit-store-name").value.trim(),
    address: document.getElementById("edit-store-address").value.trim(),
    phone: document.getElementById("edit-store-phone").value.trim(),
    email: document.getElementById("edit-store-email").value.trim()
  };

  fetch(`http://localhost:8080/admin/update-pharmacy/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(res => {
      alert(res.message || "Cập nhật thành công!");
      document.getElementById("panel-edit-store").style.display = "none";
      document.getElementById("panel-list-stores").style.display = "block";
      renderListStores();
    })
    .catch(() => alert("Có lỗi xảy ra khi cập nhật!"));
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function loadPharmacyOptions() {
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
  console.log("Loading categories...");
}

function loadManagerOptions() {
  console.log("Loading managers...");
}

function loadStoresData() {
  console.log("Loading stores data...");
}

function loadRevenueData() {
  console.log("Loading revenue data...");
}

function showErrorMessage(message) {
  console.error(message);
}

// User profile functions
function showUserInfo() {
  console.log("Show user info");
}

function logout() {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {
    console.error("Error clearing storage:", e);
  }
  window.location.href = "index.html";
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
        const filteredRoles = roles.filter(role => role !== "admin");
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
    "manager": "Quản lý",
    "employee": "Nhân viên",
    "customer-service": "Chăm sóc khách hàng"
  };
  return roleNames[role] || role;
}

function showCreateStoreMessage(msg, success) {
  const div = document.getElementById("create-store-message");
  if (div) {
    div.textContent = msg;
    div.style.color = success ? "green" : "red";
  }
}