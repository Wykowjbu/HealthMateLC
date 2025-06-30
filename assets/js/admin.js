// Global variables
let navItems = document.querySelectorAll(".nav-item");
let panelItems = document.querySelectorAll(".panel");
let listPharmacy = [];
let listUsersByPharmacy = {}; // Store users data by pharmacy
let currentEditingUser = null; // Store the user being edited

// Initialize the admin dashboard
document.addEventListener("DOMContentLoaded", function () {
  initializeNavigation();
  initializeUserDropdown();
  loadInitialData();
  initializeModals();
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
      headerTitle.textContent = item.childNodes[2].textContent.trim();

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
  document.querySelectorAll(".nav-item")[0].classList.add("active");
  document.querySelectorAll(".panel")[0].classList.add("active");
  document.querySelector(".header-title").textContent = document
    .querySelector(".nav-item")
    .childNodes[2].textContent.trim();
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
      // Remove active class from other items
      document
        .querySelectorAll(".store-item")
        .forEach((item) => item.classList.remove("active"));

      // Add active class to clicked item
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

    // Store click handler for potential removal later
    userItem.clickHandler = () => showUserDetails(user);
    userItem.addEventListener("click", userItem.clickHandler);
    usersList.appendChild(userItem);
  });
}

function showUserDetails(user) {
  const usersWrapper = document.querySelector(".list-users-wrapper");
  const detailsWrapper = document.querySelector(".user-details-wrapper");
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
        <p>Hoạt động</p>
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
  document.getElementById("edit-role").value = user.role || "employee";
  document.getElementById("edit-status").value = user.status || "active";
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

// Handle reset password form submission
function handleResetPassword(e) {
  e.preventDefault();

  // Get form data
  const userId = document.getElementById("reset-user-id").value;
  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  // Validate form data
  if (!newPassword || !confirmPassword) {
    showFormError("resetPasswordForm", "Vui lòng nhập đầy đủ thông tin");
    return;
  }

  if (newPassword.length < 6) {
    showFormError("resetPasswordForm", "Mật khẩu phải có ít nhất 6 ký tự");
    return;
  }

  if (newPassword !== confirmPassword) {
    showFormError("resetPasswordForm", "Mật khẩu xác nhận không khớp");
    return;
  }

  // Check password strength
  const strength = calculatePasswordStrength(newPassword);
  if (strength.score < 30) {
    showFormError(
      "resetPasswordForm",
      "Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn."
    );
    return;
  }

  // Send API request to reset password
  resetUserPassword(userId, newPassword);
}

// Reset user password via API
function resetUserPassword(userId, newPassword) {
  showLoading("resetPasswordModal");

  fetch(`http://localhost:8080/admin/reset-password/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      newPassword: newPassword,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Lỗi khi đặt lại mật khẩu");
      }
      return response.json();
    })
    .then((data) => {
      // Close modal
      document.getElementById("resetPasswordModal").style.display = "none";

      // Show success message
      showToast("Đặt lại mật khẩu thành công");

      // Clear form
      document.getElementById("new-password").value = "";
      document.getElementById("confirm-password").value = "";
    })
    .catch((error) => {
      console.error("Error resetting password:", error);
      showFormError(
        "resetPasswordForm",
        "Lỗi khi đặt lại mật khẩu. Vui lòng thử lại."
      );
    })
    .finally(() => {
      hideLoading("resetPasswordModal");
    });
}
