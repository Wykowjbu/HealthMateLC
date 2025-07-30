// ============================================================================
// GLOBAL VARIABLES
// ============================================================================
let navItems = document.querySelectorAll(".nav-item");
let panelItems = document.querySelectorAll(".panel");
let listPharmacy = [];
let allProducts = [];
let allStores = [];
let currentPage = 1; // dùng cho sản phẩm (1-based), stores sẽ convert về 0-based khi cần
const pageSize = 6; // dùng cho nhà thuốc, mỗi trang 6 nhà thuốc
let totalPages = 0;
let totalProducts = 0;
let isSearching = false;
let currentSearchParams = {};
let listUsersByPharmacy = {}; // Store users data by pharmacy
let currentEditingUser = null; // Store the user being edited

// Initialize the admin dashboard
// Add session check on dashboard load
async function checkSessionOnLoad() {
  const ok = await checkSessionOrRedirect();
  if (!ok) return;
}

document.addEventListener("DOMContentLoaded", function () {
  checkSessionOnLoad(); // <--- Add this line
  loadInitialData();
  initializeNavigation();
  initializeUserDropdown();
  initializeProductSearch();
  initializeStoreSearch();
  attachAddStoreButtonEvent();
  initializeModals();
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
  // console.log("Load init data");
  // renderListAccounts();
  // document.querySelectorAll(".nav-item")[0].classList.add("active");
  // document.querySelectorAll(".panel")[0].classList.add("active");
  // document.querySelectorAll(".nav-item")[0].click();
  const firstNavItem = document.querySelector(
    ".nav-item[data-type='list-accounts']"
  );

  if (firstNavItem) {
    // Activate the first nav item
    navItems.forEach((item) => item.classList.remove("active"));
    firstNavItem.classList.add("active");

    // Activate the corresponding panel
    panelItems.forEach((panel) => panel.classList.remove("active"));
    const panel = document.getElementById("panel-list-accounts");
    if (panel) {
      panel.classList.add("active");
    }

    // Update header title
    updateHeaderTitle("list-accounts");

    // Load data for the first panel
    renderListAccounts();
  }
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
      console.log("List pharmacies:", listPharmacyData);
      const listUser = data.listUsersByPharmacy;
      console.log("List users by pharmacy:", listUser);

      // Store pharmacy data globally
      listPharmacy = listPharmacyData;

      // Store users data globally
      listUsersByPharmacy = { ...listUser };

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
    storeItem.setAttribute("data-pharmacy-id", pharmacy.pharmacyId); // Add pharmacy ID

    // Use updated data from cache
    const userCount = listUsersByPharmacy[pharmacy.pharmacyId]
      ? listUsersByPharmacy[pharmacy.pharmacyId].length
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

      // Show users for selected pharmacy using updated data
      showUsersForPharmacy(listUsersByPharmacy[pharmacy.pharmacyId] || []);
      const usersWrapper = document.querySelector(".list-users-wrapper");
      const detailsWrapper = document.querySelector(".user-details-wrapper");
      usersWrapper.classList.remove("slide-left");
      detailsWrapper.classList.remove("slide-right");
    });

    listPharContainer.appendChild(storeItem);
  });
}

// Update employee count display for pharmacy items
function updatePharmacyEmployeeCount() {
  const storeItems = document.querySelectorAll(".store-item");
  storeItems.forEach((storeItem) => {
    const pharmacyId = storeItem.getAttribute("data-pharmacy-id");
    if (pharmacyId && listUsersByPharmacy[pharmacyId]) {
      const userCount = listUsersByPharmacy[pharmacyId].length;
      const employeeCountElement = storeItem.querySelector(".employee-count");
      if (employeeCountElement) {
        employeeCountElement.textContent = `${userCount} Tài khoản`;
      }
    }
  });
}

// Show users for selected pharmacy
function showUsersForPharmacy(users) {
  const usersList = document.querySelector(".list-users");
  if (!usersList) return;

  // Clear existing content
  usersList.innerHTML = "";

  // Reset user search input
  const userSearchInput = document.querySelector(".user-search-input");
  if (userSearchInput) {
    userSearchInput.value = "";
    userSearchInput.classList.remove("searching");
  }

  // Reset user search select
  const userSearchSelect = document.querySelector(".user-search-select");
  if (userSearchSelect) {
    userSearchSelect.value = "all";
  }

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
      <div class="user-role ${
        user.role === "manager" ? "manager" : "employee"
      }">
        ${user.role === "manager" ? "Quản lý" : "Nhân viên"}
      </div>
    `;

    // Store click handler for potential removal later
    userItem.clickHandler = () => showUserDetails(user);
    userItem.addEventListener("click", userItem.clickHandler);
    usersList.appendChild(userItem);
  });
}

function showUserDetails(user) {
  const usersWrapper = document.querySelector(".list-users-wrapper");
  const detailsWrapper = document.querySelector(".user-details-wrapper");
  console.log("Showing details for user:", user);
  if (!usersWrapper || !detailsWrapper) return;
  const initials = user.fullName
    .split(" ")
    .map((name) => name.charAt(0))
    .join("")
    .substring(0, 2)
    .toUpperCase();
  detailsWrapper.innerHTML = `
    <div class="back-button">
      <span class="material-icons">arrow_back</span>
      <span>Quay lại</span>
    </div>
    <div class="user-details">
      <div class="user-details-header">
        <div class="user-details-avatar">${initials}</div>
        <div class="user-details-info">
          <h2>${user.fullName}</h2>
          <div class="user-details-role ${
            user.role === "manager" ? "manager" : "employee"
          }">
            ${user.role === "manager" ? "Quản lý" : "Nhân viên"}
          </div>
        </div>
      </div>

      <div class="user-details-field">
        <label>Email</label>
        <p>${user.email}</p>
      </div>

      <div class="user-details-field">
        <label>Số điện thoại</label>
        <p>${user.phone}</p>
      </div>

      <div class="user-details-field">
        <label>Tên đăng nhập</label>
        <p>${user.username || "N/A"}</p>
      </div>

      <div class="user-details-field">
        <label>Trạng thái</label>
        <p>${user.active ? "Hoạt động" : "Vô hiệu hóa"}</p>
      </div>

      <div class="user-actions">
        <button id="edit-user-btn" class="btn btn-primary">
          <span class="material-icons">edit</span>
          Sửa thông tin
        </button>
        <button id="reset-password-btn" class="btn btn-secondary">
          <span class="material-icons">lock</span>
          Đặt lại mật khẩu
        </button>
      </div>
    </div>
  `;
  //Add back button event listener
  detailsWrapper.querySelector(".back-button").addEventListener("click", () => {
    usersWrapper.classList.remove("slide-left");
    detailsWrapper.classList.remove("slide-right");
  });

  // Add edit user button event listener
  const editBtn = detailsWrapper.querySelector("#edit-user-btn");
  if (editBtn) {
    editBtn.clickHandler = () => openEditUserModal(user);
    editBtn.addEventListener("click", editBtn.clickHandler);
  }

  // Add reset password button event listener
  const resetPasswordBtn = detailsWrapper.querySelector("#reset-password-btn");
  if (resetPasswordBtn) {
    resetPasswordBtn.addEventListener("click", () => {
      openResetPasswordModal(user);
    });
  }
  // Apply sliding effect
  usersWrapper.classList.add("slide-left");
  detailsWrapper.classList.add("slide-right");
}

function initializeModals() {
  // Close modal when clicking X or cancel button
  document
    .querySelectorAll(".close-modal, .close-modal-btn")
    .forEach((element) => {
      element.addEventListener("click", function () {
        document.querySelectorAll(".modal").forEach((modal) => {
          modal.style.display = "none";
        });
        // Reset current editing user when closing modal
        currentEditingUser = null;
      });
    });

  // Close modal when clicking outside
  window.addEventListener("click", function (event) {
    document.querySelectorAll(".modal").forEach((modal) => {
      if (event.target === modal) {
        modal.style.display = "none";
        // Reset current editing user when closing modal
        currentEditingUser = null;
      }
    });
  });

  // Handle edit user form submission
  document
    .getElementById("editUserForm")
    .addEventListener("submit", handleEditUser);

  // Handle reset password form submission
  document
    .getElementById("resetPasswordForm")
    .addEventListener("submit", handleResetPassword);
}

// Open edit user modal
function openEditUserModal(user) {
  // Store the user being edited
  currentEditingUser = { ...user };

  const modal = document.querySelector("#editUserModal");
  modal.style.display = "block";

  // Add form submission handler
  const editUserForm = document.getElementById("editUserForm");
  if (editUserForm) {
    editUserForm.addEventListener("submit", handleEditUser);
  }

  // Populate form fields
  document.getElementById("edit-user-id").value = user.userId;
  document.getElementById("edit-username").value = user.username || "";
  document.getElementById("edit-fullname").value = user.fullName || "";
  document.getElementById("edit-email").value = user.email || "";
  document.getElementById("edit-phone").value = user.phone || "";
  document.getElementById("edit-role").value = user.role;
  document.getElementById("edit-status").value = user.active
    ? "active"
    : "inactive";
}

// Initialize password validation when modal opens
function openResetPasswordModal(user) {
  const modal = document.querySelector("#resetPasswordModal");
  modal.style.display = "block";

  // Populate form fields
  document.getElementById("reset-user-id").value = user.userId;
  document.getElementById("user-display").value = `${user.fullName} (${
    user.username || user.email
  })`;

  // Clear password fields
  document.getElementById("new-password").value = "";
  document.getElementById("confirm-password").value = "";

  // Reset field styles
  document.getElementById("new-password").style.borderColor = "";
  document.getElementById("confirm-password").style.borderColor = "";

  // Reset password strength indicator
  const strengthIndicator = document.getElementById("password-strength");
  const strengthBar = document.querySelector(".strength-bar");
  const strengthText = document.querySelector(".strength-text");

  if (strengthIndicator) {
    strengthIndicator.classList.remove("show");
  }
  if (strengthBar) {
    strengthBar.className = "strength-bar";
  }
  if (strengthText) {
    strengthText.className = "strength-text";
    strengthText.textContent = "";
  }

  // Clear any previous error messages
  const errorDiv = document.querySelector("#resetPasswordForm .error-message");
  if (errorDiv) {
    errorDiv.style.display = "none";
  }

  // Initialize password validation
  initializePasswordValidation();
}

// Toggle password visibility
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  const button = input.parentElement.querySelector(".password-toggle");
  const icon = button.querySelector(".material-icons");

  if (input.type === "password") {
    input.type = "text";
    icon.textContent = "visibility_off";
  } else {
    input.type = "password";
    icon.textContent = "visibility";
  }
}

// Add password validation and UX improvements
function initializePasswordValidation() {
  const newPasswordInput = document.getElementById("new-password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const strengthIndicator = document.getElementById("password-strength");
  const strengthBar = document.querySelector(".strength-bar");
  const strengthText = document.querySelector(".strength-text");

  if (newPasswordInput && confirmPasswordInput) {
    // Real-time password matching validation
    confirmPasswordInput.addEventListener("input", function () {
      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      if (confirmPassword && newPassword !== confirmPassword) {
        confirmPasswordInput.setCustomValidity("Mật khẩu xác nhận không khớp");
        confirmPasswordInput.style.borderColor = "#e53e3e";
      } else {
        confirmPasswordInput.setCustomValidity("");
        confirmPasswordInput.style.borderColor = "";
      }
    });

    // Password strength validation
    newPasswordInput.addEventListener("input", function () {
      const password = newPasswordInput.value;

      if (password.length === 0) {
        strengthIndicator.classList.remove("show");
        newPasswordInput.setCustomValidity("");
        newPasswordInput.style.borderColor = "";
        return;
      }

      // Show strength indicator
      strengthIndicator.classList.add("show");

      // Calculate password strength
      const strength = calculatePasswordStrength(password);

      // Update strength bar and text
      strengthBar.className = "strength-bar";
      strengthText.className = "strength-text";

      if (strength.score < 30) {
        strengthBar.classList.add("weak");
        strengthText.classList.add("weak");
        strengthText.textContent = "Yếu - " + strength.feedback;
        newPasswordInput.setCustomValidity("Mật khẩu quá yếu");
        newPasswordInput.style.borderColor = "#e53e3e";
      } else if (strength.score < 70) {
        strengthBar.classList.add("medium");
        strengthText.classList.add("medium");
        strengthText.textContent = "Trung bình - " + strength.feedback;
        newPasswordInput.setCustomValidity("");
        newPasswordInput.style.borderColor = "#f6ad55";
      } else {
        strengthBar.classList.add("strong");
        strengthText.classList.add("strong");
        strengthText.textContent = "Mạnh - Mật khẩu tốt";
        newPasswordInput.setCustomValidity("");
        newPasswordInput.style.borderColor = "#38a169";
      }

      // Recheck confirm password when new password changes
      if (confirmPasswordInput.value) {
        confirmPasswordInput.dispatchEvent(new Event("input"));
      }
    });
  }
}

// Calculate password strength
function calculatePasswordStrength(password) {
  let score = 0;
  let feedback = "";

  // Length check
  if (password.length >= 8) {
    score += 25;
  } else if (password.length >= 6) {
    score += 10;
    feedback = "Nên dài hơn 8 ký tự";
  } else {
    feedback = "Quá ngắn";
    return { score, feedback };
  }

  // Character variety checks
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;

  // Additional complexity
  if (password.length >= 12) score += 10;

  // Feedback based on missing elements
  const missing = [];
  if (!/[a-z]/.test(password)) missing.push("chữ thường");
  if (!/[A-Z]/.test(password)) missing.push("chữ hoa");
  if (!/[0-9]/.test(password)) missing.push("số");
  if (!/[^A-Za-z0-9]/.test(password)) missing.push("ký tự đặc biệt");

  if (missing.length > 0 && feedback === "") {
    feedback = "Thêm " + missing.join(", ");
  }

  if (feedback === "") {
    feedback = "Mật khẩu mạnh";
  }

  return { score: Math.min(score, 100), feedback };
}

// Handle edit user form submission
function handleEditUser(e) {
  e.preventDefault();

  // Get form data
  const userId = document.getElementById("edit-user-id").value;
  const userData = {
    fullName: document.getElementById("edit-fullname").value,
    email: document.getElementById("edit-email").value,
    phone: document.getElementById("edit-phone").value,
    role: document.getElementById("edit-role").value,
    isActive: document.getElementById("edit-status").value === "active",
  };
  console.log("User data:", userData);

  // Validate form data
  if (!userData.fullName || !userData.email || !userData.phone) {
    showFormError("editUserForm", "Vui lòng nhập đầy đủ thông tin");
    return;
  }
  // Send API request to update user
  updateUser(userId, userData);
}

// Update user via API
function updateUser(userId, userData) {
  showLoading("editUserModal");

  fetch(`http://localhost:8080/admin/update-account/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Lỗi khi cập nhật thông tin tài khoản");
      }
      return response.json();
    })
    .then((data) => {
      // Close modal
      document.getElementById("editUserModal").style.display = "none";

      // Show success message
      showToast("Cập nhật thông tin tài khoản thành công");

      // Update user info in real-time instead of reloading all data
      updateUserInRealTime(userId, userData);
    })
    .catch((error) => {
      console.error("Error updating user:", error);
      showFormError("editUserForm", "Lỗi khi cập nhật thông tin tài khoản");
    })
    .finally(() => {
      hideLoading("editUserModal");
    });
}

// Update user info in real-time without reloading
function updateUserInRealTime(userId, updatedData) {
  if (!currentEditingUser) return;

  // Update user data in the global cache
  updateUserInCache(userId, updatedData);

  // Update pharmacy employee count display
  updatePharmacyEmployeeCount();

  // Store the updated user info for reference
  let updatedUser = null;

  // Find the current user details view to get original data
  const userDetailsWrapper = document.querySelector(".user-details-wrapper");
  if (
    userDetailsWrapper &&
    userDetailsWrapper.classList.contains("slide-right")
  ) {
    // Create updated user object with all necessary data
    updatedUser = {
      userId: userId,
      fullName: updatedData.fullName,
      email: updatedData.email,
      phone: updatedData.phone,
      role: updatedData.role,
      username: currentEditingUser.username || "",
      status: updatedData.isActive ? "active" : "inactive",
    };

    // Update the user details view
    updateUserDetailsView(updatedUser);
  }

  // Find and update user in the currently displayed user list
  // Use the original user data before update to find the correct user
  const userItems = document.querySelectorAll(".user-item");
  userItems.forEach((userItem) => {
    const userInfo = userItem.querySelector(".user-info");
    const emailElement = userInfo?.querySelector("p:first-of-type");
    const nameElement = userInfo?.querySelector("h4");

    // Find user by original email and name combination
    if (
      emailElement &&
      nameElement &&
      emailElement.textContent === currentEditingUser.email &&
      nameElement.textContent === currentEditingUser.fullName
    ) {
      // Update user info in the list
      nameElement.textContent = updatedData.fullName;
      emailElement.textContent = updatedData.email;

      // Update phone
      const phoneElement = userInfo.querySelector("p:last-of-type");
      if (phoneElement) phoneElement.textContent = updatedData.phone;

      // Update role
      const roleElement = userItem.querySelector(".user-role");
      if (roleElement) {
        roleElement.textContent =
          updatedData.role === "manager" ? "Quản lý" : "Nhân viên";
        roleElement.className = `user-role ${updatedData.role}`;
      }

      // Update avatar
      const avatarElement = userItem.querySelector(".user-avatar");
      if (avatarElement) {
        const initials = updatedData.fullName
          .split(" ")
          .map((name) => name.charAt(0))
          .join("")
          .substring(0, 2)
          .toUpperCase();
        avatarElement.textContent = initials;
      }

      // Update the click handler with new user data
      if (updatedUser) {
        userItem.removeEventListener("click", userItem.clickHandler);
        userItem.clickHandler = () => showUserDetails(updatedUser);
        userItem.addEventListener("click", userItem.clickHandler);
      }
    }
  });

  // Clear the current editing user
  currentEditingUser = null;
}

// Helper function to update user details view
function updateUserDetailsView(updatedUser) {
  const userDetails = document.querySelector(".user-details");
  if (!userDetails) return;

  // Update name and avatar
  const nameElement = userDetails.querySelector(".user-details-info h2");
  const avatarElement = userDetails.querySelector(".user-details-avatar");

  if (nameElement) nameElement.textContent = updatedUser.fullName;
  if (avatarElement) {
    const initials = updatedUser.fullName
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
    avatarElement.textContent = initials;
  }

  // Update role
  const roleElement = userDetails.querySelector(".user-details-role");
  if (roleElement) {
    roleElement.textContent =
      updatedUser.role === "manager" ? "Quản lý" : "Nhân viên";
    roleElement.className = `user-details-role ${updatedUser.role}`;
  }

  // Update contact info
  const emailField = userDetails.querySelector(
    ".user-details-field:nth-child(3) p"
  );
  const phoneField = userDetails.querySelector(
    ".user-details-field:nth-child(4) p"
  );

  if (emailField) emailField.textContent = updatedUser.email;
  if (phoneField) phoneField.textContent = updatedUser.phone;

  // Update the edit button click handler with new user data
  const editBtn = userDetails.querySelector("#edit-user-btn");
  if (editBtn) {
    editBtn.removeEventListener("click", editBtn.clickHandler);
    editBtn.clickHandler = () => openEditUserModal(updatedUser);
    editBtn.addEventListener("click", editBtn.clickHandler);
  }
}

// Update user data in the global cache
function updateUserInCache(userId, updatedData) {
  // Find and update user in all pharmacy caches
  Object.keys(listUsersByPharmacy).forEach((pharmacyId) => {
    const users = listUsersByPharmacy[pharmacyId];
    const userIndex = users.findIndex((user) => user.userId === userId);

    if (userIndex !== -1) {
      // Update user data in cache
      listUsersByPharmacy[pharmacyId][userIndex] = {
        ...listUsersByPharmacy[pharmacyId][userIndex],
        fullName: updatedData.fullName,
        email: updatedData.email,
        phone: updatedData.phone,
        role: updatedData.role,
        status: updatedData.isActive ? "active" : "inactive",
      };
    }
  });
}

// Show loading state in modal
function showLoading(modalId) {
  const modal = document.getElementById(modalId);
  const submitBtn = modal.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="material-icons spinning">refresh</span> Đang xử lý...';
  }
}

// Hide loading state in modal
function hideLoading(modalId) {
  const modal = document.getElementById(modalId);
  const submitBtn = modal.querySelector('button[type="submit"]');

  if (submitBtn) {
    submitBtn.disabled = false;

    if (modalId === "editUserModal") {
      submitBtn.innerHTML = "Lưu thay đổi";
    } else if (modalId === "resetPasswordModal") {
      submitBtn.innerHTML = "Đặt lại mật khẩu";
    }
  }
}

// Toast notification
function showToast(message) {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector(".toast-container");

  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  // Create toast
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <div class="toast-content">
      <span class="material-icons toast-icon">check_circle</span>
      <span class="toast-message">${message}</span>
    </div>
    <span class="toast-close">&times;</span>
  `;

  // Add toast to container
  toastContainer.appendChild(toast);

  // Animation
  setTimeout(() => toast.classList.add("show"), 10);

  // Close button functionality
  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Utility functions for handling forms
function showFormError(formId, message) {
  const form = document.getElementById(formId);
  let errorDiv = form.querySelector(".error-message");

  if (!errorDiv) {
    errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    form.insertBefore(errorDiv, form.firstChild);
  }

  errorDiv.textContent = message;
  errorDiv.style.display = "block";

  // Hide error after 5 seconds
  setTimeout(() => {
    errorDiv.style.display = "none";
  }, 5000);
}

// close edit user modal
function closeEditUserModal() {
  const modal = document.querySelector("#editUserModal");
  modal.style.display = "none";
}

// Initialize search functionality
function initializeSearch() {
  const searchInput = document.querySelector(".search-input");
  const searchSelect = document.querySelector(".search-select");

  if (searchInput) {
    // Real-time search as the user types
    searchInput.addEventListener("input", function () {
      performSearch();
    });
  }
  // Search when search type changes
  if (searchSelect) {
    searchSelect.addEventListener("change", function () {
      performSearch();
    });
  }

  // Initialize account search
  const userSearchInput = document.querySelector(".user-search-input");
  const userSearchSelect = document.querySelector(".user-search-select");

  if (userSearchInput) {
    userSearchInput.addEventListener("input", function () {
      performUserSearch();
    });
  }

  if (userSearchSelect) {
    userSearchSelect.addEventListener("change", function () {
      performUserSearch();
    });
  }
}

// Variable to store search timeout
let searchTimeout = null;

// Perform search functionality for accounts
function performSearch() {
  // Clear previous timeout to prevent multiple rapid searches
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  // Set a small delay to avoid excessive searching while typing
  searchTimeout = setTimeout(() => {
    const searchType = document.querySelector(".search-select")?.value || "all";
    const searchContent = document.querySelector(".search-input")?.value || "";

    // Add searching indicator to search input
    const searchInput = document.querySelector(".search-input");
    if (searchInput) {
      searchInput.classList.add("searching");
    }

    if (!listPharmacy.length) {
      if (searchInput) {
        searchInput.classList.remove("searching");
      }
      return;
    }

    // Hide all store items initially
    document.querySelectorAll(".store-item").forEach((item) => {
      item.style.display = "none";

      // Remove any previously highlighted text
      const nameElement = item.querySelector(".store-info h4");
      const addressElement = item.querySelector(".store-info p:first-of-type");
      const phoneElement = item.querySelector(".store-info p:last-of-type");

      if (nameElement) nameElement.innerHTML = nameElement.textContent;
      if (addressElement) addressElement.innerHTML = addressElement.textContent;
      if (phoneElement) phoneElement.innerHTML = phoneElement.textContent;
    });

    // Clear user list
    const usersList = document.querySelector(".list-users");
    if (usersList) {
      usersList.innerHTML = "Chọn nhà thuốc để xem nhân viên";
    }

    // Filter and show matching pharmacies
    let matchCount = 0;

    listPharmacy.forEach((pharmacy, index) => {
      let isMatch = false;
      const searchTerm = searchContent.toLowerCase();

      // Skip filtering if search term is empty
      if (searchTerm === "") {
        isMatch = true;
      } else {
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
      }
      const storeItem = document.querySelectorAll(".store-item")[index];
      if (storeItem) {
        storeItem.style.display = isMatch ? "flex" : "none";
      }
    });
  }, 300);
}
// ============================================================================
// PRODUCTS MANAGEMENT
// ============================================================================

// Render list products with pagination
function renderListProducts() {
  fetch(`http://localhost:8080/admin/list-products-paginated?page=${currentPage - 1}&size=${pageSize}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      allProducts = data.products || [];
      totalPages = data.totalPages || 0;
      currentPage = data.currentPage + 1; // Convert to 1-based for display
      renderProductTable();
      renderPagination();
    })
    .catch((error) => {
      console.error("Error loading products:", error);
      const tbody = document.querySelector("#product-list-table tbody");
      if (tbody)
        tbody.innerHTML =
          '<tr><td colspan="9" style="color:red;text-align:center;">Không thể tải danh sách sản phẩm</td></tr>';
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

  let html = "";
  allProducts.forEach((p, idx) => {
    // Tạo HTML cho ảnh sản phẩm
    let imageHtml = '';
    if (p.imageUrl) {
      imageHtml = `<img src="http://localhost:8080${p.imageUrl}" alt="${p.productName}" class="product-image" title="${p.productName}" onclick="openImageModal('http://localhost:8080${p.imageUrl}', '${p.productName}')" />`;
    } else {
      imageHtml = `<div class="product-image-placeholder">No img</div>`;
    }

    html += `
      <tr>
        <td>${(currentPage - 1) * pageSize + idx + 1}</td>
        <td>${imageHtml}</td>
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
            <button class="btn-edit" onclick="editProduct(${p.productId})" title="Sửa">
              <span class='material-icons' style='font-size:20px;vertical-align:middle;'>edit</span>
            </button>
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
  if (totalPages <= 1) {
    container.innerHTML = `<span style="color: #718096; font-size: 14px; font-weight: 500;">Trang ${currentPage} / ${totalPages || 1}</span>`;
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
        renderListProducts(); // Gọi lại API để load dữ liệu mới
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
    `http://localhost:8080/admin/search-products-paginated?keyword=${encodeURIComponent(
      keyword
    )}&type=${searchType}&page=${currentPage - 1}&size=${pageSize}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
    .then((response) => response.json())
    .then((data) => {
      allProducts = data.products || [];
      totalPages = data.totalPages || 0;
      currentPage = data.currentPage + 1; // Convert to 1-based for display
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

      // Fill form with product data after a longer delay to ensure options are loaded
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

        // Handle image display
        const editImagePreview = document.getElementById("edit-image-preview");
        const editPreviewImg = document.getElementById("edit-preview-img");
        if (product.imageUrl) {
          editPreviewImg.src = "http://localhost:8080" + product.imageUrl;
          editImagePreview.style.display = "block";
        } else {
          editImagePreview.style.display = "none";
          editPreviewImg.src = "";
        }
      }, 300);
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
  if (!keepPage) currentPage = 1;
  loadStoresFromAPI(currentPage - 1, pageSize); // Convert to 0-based for API
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
      currentPage = data.currentPage + 1; // Convert to 1-based for display
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
    const globalIndex = (currentPage - 1) * pageSize + idx + 1;
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
            ${store.isActive ? `<button class="btn-edit" data-id="${store.pharmacyId}" title="Sửa"><span class='material-icons' style='font-size:20px;vertical-align:middle;'>edit</span></button>` : ''}
            ${store.isActive
              ? `<button class="btn-disable" data-id="${store.pharmacyId}" title="Vô hiệu hóa"><span class='material-icons' style='font-size:20px;vertical-align:middle;'>block</span></button>`
              : `<button class="btn-enable" data-id="${store.pharmacyId}" title="Kích hoạt"><span class='material-icons' style='font-size:20px;vertical-align:middle;'>check_circle</span></button>`
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
    container.innerHTML = `<span style="color: #718096; font-size: 14px; font-weight: 500;">Trang ${currentPage} / ${totalPages || 1}</span>`;
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
        loadStoresFromAPI(currentPage - 1, pageSize); // Convert to 0-based for API
      }
    });
  });
}

function performStoreSearch() {
  const keyword = document.getElementById("store-search-input")?.value?.trim() || "";
  const searchType = document.getElementById("store-search-type")?.value || "all";
  if (!keyword) {
    isSearching = false;
    currentPage = 1;
    loadStoresFromAPI(currentPage - 1, pageSize); // Convert to 0-based for API
    return;
  }
  isSearching = true;
  currentSearchParams = { keyword, type: searchType };
  currentPage = 1;
  loadStoresFromAPI(currentPage - 1, pageSize); // Convert to 0-based for API
}

function clearStoreSearch() {
  const searchInput = document.getElementById("store-search-input");
  const searchType = document.getElementById("store-search-type");
  if (searchInput) searchInput.value = "";
  if (searchType) searchType.value = "all";
  isSearching = false;
  currentPage = 1;
  loadStoresFromAPI(currentPage - 1, pageSize); // Convert to 0-based for API
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
  const productImageInput = document.getElementById("product-image");
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

  // Xử lý ảnh
  let imageBase64 = null;
  if (productImageInput.files.length > 0) {
    const file = productImageInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      imageBase64 = e.target.result;
      submitProductData();
    };
    reader.readAsDataURL(file);
  } else {
    submitProductData();
  }

  function submitProductData() {
    const formData = {
      productName: productName,
      productType: productType,
      unit: productUnit,
      description: description,
      price: price.toFixed(2),
      quantity: quantity, // Gửi số lượng lên backend
      imageBase64: imageBase64
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
            // Reset image preview
            const imagePreview = document.getElementById("image-preview");
            const previewImg = document.getElementById("preview-img");
            if (imagePreview) imagePreview.style.display = "none";
            if (previewImg) previewImg.src = "";
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
  const productImageInput = document.getElementById("edit-product-image");

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

  // Xử lý ảnh
  let imageBase64 = null;
  if (productImageInput.files.length > 0) {
    const file = productImageInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      imageBase64 = e.target.result;
      submitEditData();
    };
    reader.readAsDataURL(file);
  } else {
    submitEditData();
  }

  function submitEditData() {
    const formData = {
      productName: productName,
      productType: productType,
      unit: productUnit,
      price: productPrice,
      description: productDescription,
      imageBase64: imageBase64
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
// Render add account panel
function renderAddAccount() {
  loadPharmacyOptions();
  loadRoles();
  updateHeaderTitle("add-account");
}

function showToast(message, type = 'info', callback = null) {
  let toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  let icon = 'check_circle';
  let buttons = '';

  if (type === 'confirm') {
    icon = 'help';
    buttons = `
      <div class="toast-actions">
        <button class="toast-btn toast-btn-cancel">Hủy</button>
        <button class="toast-btn toast-btn-confirm">Xác nhận</button>
      </div>
    `;
  }

  toast.innerHTML = `
    <div class="toast-content">
      <span class="material-icons toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
    </div>
    ${buttons}
    <span class="toast-close">×</span>
  `;

  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);

  // Handle close button
  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  });

  // Handle confirm dialog buttons
  if (type === 'confirm') {
    const cancelBtn = toast.querySelector(".toast-btn-cancel");
    const confirmBtn = toast.querySelector(".toast-btn-confirm");

    cancelBtn.addEventListener("click", () => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    });

    confirmBtn.addEventListener("click", () => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
      if (callback) callback();
    });
  } else {
    // Auto remove for regular toasts
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }
}

function attachAddStoreButtonEvent() {
  // Gắn sự kiện cho nút "Thêm nhà thuốc" trong panel list-stores
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
      // Reload lại danh sách sản phẩm với phân trang để đồng bộ số lượng
      fetch(`http://localhost:8080/admin/list-products-paginated?page=${currentPageBefore - 1}&size=6`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          allProducts = data.products || [];
          totalPages = data.totalPages || 0;
          totalProducts = data.totalProducts || 0;
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

// Image modal functionality
function openImageModal(imageSrc, productName) {
  const modal = document.getElementById("imageModal");
  const modalImage = document.getElementById("modalImage");
  modalImage.src = imageSrc;
  modalImage.alt = productName;
  modal.style.display = "block";
}

function closeImageModal() {
  const modal = document.getElementById("imageModal");
  modal.style.display = "none";
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById("imageModal");
  if (event.target === modal) {
    closeImageModal();
  }
}

// Close modal when clicking X
document.addEventListener("DOMContentLoaded", function() {
  const closeBtn = document.querySelector(".image-modal-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeImageModal);
  }
});

// Image preview functionality
document.addEventListener("DOMContentLoaded", function() {
  // Add product image preview
  const productImageInput = document.getElementById("product-image");
  if (productImageInput) {
    productImageInput.addEventListener("change", function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const preview = document.getElementById("image-preview");
          const previewImg = document.getElementById("preview-img");
          previewImg.src = e.target.result;
          preview.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Edit product image preview
  const editProductImageInput = document.getElementById("edit-product-image");
  if (editProductImageInput) {
    editProductImageInput.addEventListener("change", function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const preview = document.getElementById("edit-image-preview");
          const previewImg = document.getElementById("edit-preview-img");
          previewImg.src = e.target.result;
          preview.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    });
  }
});
