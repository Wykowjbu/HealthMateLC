// Global variables
let customers = [];
let currentCustomer = null;
let currentSection = "customers"; // Track current active section

// Thêm vào đầu file, sau phần khai báo biến
// Hàm định dạng thời gian
function formatTime(time) {
  try {
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Lỗi khi định dạng thời gian:", time, error);
    return time;
  }
}

// Hàm định dạng ngày
function formatDateLocal(date) {
  try {
    return date.toISOString().split("T")[0];
  } catch (error) {
    console.error("Lỗi khi định dạng ngày:", date, error);
    return "";
  }
}

// Order Management Variables
let selectedCustomerForOrder = null;
let orderItems = [];
let orderTotal = 0;

// Product Management Variables
let products = [];
let filteredProducts = [];

// Utility functions to get current user info
function getCurrentUserId() {
    const userId = localStorage.getItem("currentUserId");
    if (userId) {
        console.log("Getting current User ID:", userId);
        return userId;
    } else {
        console.warn("No User ID found in localStorage");
        return null;
    }
}

function getCurrentUserRole() {
    return localStorage.getItem("userRole");
}

function getCurrentEmployeeId() {
    return getCurrentUserId(); // Alias for employee context
}

// Log user info whenever this function is called
function logCurrentUserInfo() {
    const userId = getCurrentUserId();
    const userRole = getCurrentUserRole();
    
    console.log("=== Current User Info ===");
    console.log("User ID:", userId);
    console.log("User Role:", userRole);
    console.log("========================");
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  handleUserProfile();
  initializeUserDropdown();
  initializeApp();
});

async function handleUserProfile() {
  console.log("Đang hiển thị thông tin user...");
  try {
    const response = await fetch(
      "http://localhost:8080/employee/profile?detail=true",
      {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        window.location.href = "/HealthMateLC/index.html";
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Dữ liệu user profile:", data);

    const userFullNameElement = document.getElementById("userFullName");
    const userPharmacyNameElement = document.getElementById("userPharmacyName");
    const branchElement = document.getElementById("branch");

    if (userFullNameElement)
      userFullNameElement.textContent = data.fullName || "Chưa cập nhật";
    if (userPharmacyNameElement)
      userPharmacyNameElement.textContent =
        data.pharmacyName || data.branch || "Chưa gán chi nhánh";
    if (branchElement)
      branchElement.textContent = data.branch || "Chưa gán chi nhánh";

    console.log("Thông tin người dùng đã được tải và hiển thị.");
    return data.userId; // Trả về userId để sử dụng trong loadSchedules
  } catch (error) {
    console.error("Lỗi khi lấy thông tin user profile:", error);
    showNotification(
      "Không thể tải thông tin người dùng. Vui lòng thử lại. Lỗi: " +
        error.message,
      "error"
    );
    window.location.href = "/HealthMateLC/index.html";
    return null;
  }
}

async function loadSchedules() {
  try {
    console.log("Fetching schedules from /employee/schedules...");
    const response = await fetch("http://localhost:8080/employee/schedules", {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, Details: ${errorText}`
      );
    }
    const schedules = await response.json();
    console.log("Schedules data:", schedules);

    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(
      today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
    );
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const weekSchedules = schedules.filter((s) => {
      const d = new Date(s.date);
      return d >= startOfWeek && d <= endOfWeek;
    });

    console.log("Week schedules:", weekSchedules);

    const dayNames = [
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
      "Chủ nhật",
    ];
    let gridHtml = "";
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);

      const dayStr = dayNames[i];
      const dateStr = `${currentDay.getDate().toString().padStart(2, "0")}/${(
        currentDay.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${currentDay.getFullYear()}`;
      const dayDateStr = formatDateLocal(currentDay);

      const daySchedules = weekSchedules.filter((s) => s.date === dayDateStr);
      const shiftsHtml =
        daySchedules.length > 0
          ? daySchedules
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map(
                (schedule) => `
                <div class="employee-shift">${schedule.fullName} (${formatTime(
                  schedule.startTime
                )} - ${formatTime(schedule.endTime)})</div>
            `
              )
              .join("")
          : "";

      gridHtml += `
                <div class="schedule-day">
                    <div class="day-name">${dayStr}</div>
                    <div class="day-date">${dateStr}</div>
                    ${shiftsHtml}
                </div>
            `;
    }

    const scheduleSection = document.getElementById("scheduleContainer");
    if (scheduleSection) {
      console.log("Updating scheduleContainer with HTML:", gridHtml);
      scheduleSection.querySelector(".schedule-grid").innerHTML =
        gridHtml || "<p>Không có lịch làm việc.</p>";
    } else {
      console.error("Element scheduleContainer not found");
    }
  } catch (error) {
    console.error("Lỗi khi lấy lịch làm việc:", error);
    showNotification(
      "Không thể tải lịch làm việc. Vui lòng thử lại. Lỗi: " + error.message,
      "error"
    );
  }
}

function initializeUserDropdown() {
  const userProfile = document.querySelector(".user-profile");
  const userDropdown = document.getElementById("userDropdown");

  if (userProfile && userDropdown) {
    userProfile.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (!userProfile.contains(e.target)) {
        userDropdown.classList.remove("show");
      }
    });

    userDropdown.addEventListener("click", (e) => e.stopPropagation());

    // Bind click handlers for dropdown items
    const profileItem = userDropdown.querySelector("li:nth-child(1)"); // Thông tin cá nhân
    const logoutItem = userDropdown.querySelector("li:nth-child(2)"); // Đăng xuất

    if (profileItem) {
      profileItem.addEventListener("click", () => {
        showUserInfo();
        userDropdown.classList.remove("show");
      });
    }

    if (logoutItem) {
      logoutItem.addEventListener("click", () => {
        logout();
        userDropdown.classList.remove("show");
      });
    }
  } else {
    console.error("userProfile or userDropdown not found");
  }
}

async function showUserInfo() {
  console.log("Hiển thị thông tin cá nhân...");
  try {
    // Fetch user profile
    const response = await fetch("http://localhost:8080/employee/showprofile", {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      if (response.status === 401) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        window.location.href = "/HealthMateLC/index.html";
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Dữ liệu hồ sơ đầy đủ:", data);

    // Fetch work history for logged-in user
    let history = [];
    try {
      const historyRes = await fetch("http://localhost:8080/employee/history", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (historyRes.ok) {
        history = await historyRes.json();
      } else {
        console.warn("Không thể lấy lịch sử làm việc:", historyRes.status);
      }
    } catch (err) {
      console.error("Lỗi khi lấy lịch sử làm việc:", err);
    }

    // Modal UI
    let modal = document.getElementById("userInfoModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "userInfoModal";
      modal.className = "modal";
      modal.innerHTML = `
                <div class="modal-content" style="max-width: 480px; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.12); padding: 32px 24px; font-family: 'Inter', sans-serif;">
                    <span class="close" style="position: absolute; top: 18px; right: 24px; font-size: 28px; cursor: pointer;">×</span>
                    <h2 style="margin-bottom: 18px; color: #2B6CB0; font-weight: 600; font-size: 1.4rem;">Thông tin cá nhân</h2>
                    <div id="userInfoContent"></div>
                    <div id="userWorkHistory" style="margin-top: 32px;"></div>
                </div>
            `;
      document.body.appendChild(modal);
    }

    const userInfoContent = document.getElementById("userInfoContent");
    userInfoContent.innerHTML = `
            <div style="margin-bottom: 12px;">
                <span style="font-weight: 500; color: #2B6CB0;">Họ và tên:</span> ${
                  data.fullName || "Chưa cập nhật"
                }
            </div>
            <div style="margin-bottom: 12px;">
                <span style="font-weight: 500; color: #2B6CB0;">Số điện thoại:</span> ${
                  data.phone || "Chưa cập nhật"
                }
            </div>
            <div style="margin-bottom: 12px;">
                <span style="font-weight: 500; color: #2B6CB0;">Email:</span> ${
                  data.email || "Chưa cập nhật"
                }
            </div>
            <div style="margin-bottom: 12px;">
                <span style="font-weight: 500; color: #2B6CB0;">Chi nhánh:</span> ${
                  data.pharmacyName || "Chưa gán"
                }
            </div>
            <div style="margin-bottom: 12px;">
                <span style="font-weight: 500; color: #2B6CB0;">Địa chỉ chi nhánh:</span> ${
                  data.pharmacyAddress || "Chưa gán"
                }
            </div>
            <div style="margin-bottom: 12px;">
                <span style="font-weight: 500; color: #2B6CB0;">SĐT chi nhánh:</span> ${
                  data.pharmacyPhone || "Chưa gán"
                }
            </div>
        `;
    // Work history UI
    const userWorkHistory = document.getElementById("userWorkHistory");
    if (history && history.length > 0) {
      userWorkHistory.innerHTML = `
        <h3 style="color: #2B6CB0; font-size: 1.1rem; font-weight: 600; margin-bottom: 12px;">Lịch sử làm việc</h3>
        <div style="max-height: 220px; overflow-y: auto;">
          ${history
            .map(
              (item) => `
                <div class="employee-shift" style="background: #E3F2FD; border-radius: 8px; padding: 10px 16px; margin-bottom: 8px; color: #2B6CB0; font-size: 15px;">
                  <span style="font-weight: 500;">${
                    item.pharmacyName
                  }</span> &bull; <span>${item.startDate}${
                item.endDate ? " - " + item.endDate : ""
              }</span>
                </div>
              `
            )
            .join("")}
        </div>
      `;
    } else {
      userWorkHistory.innerHTML = `<h3 style="color: #2B6CB0; font-size: 1.1rem; font-weight: 600; margin-bottom: 12px;">Lịch sử làm việc</h3><p style="color: #718096;">Không có dữ liệu lịch sử làm việc.</p>`;
    }
    modal.style.display = "block";
    modal.querySelector(".close").onclick = () =>
      (modal.style.display = "none");
    window.onclick = (event) =>
      event.target === modal && (modal.style.display = "none");
    console.log("Thông tin cá nhân và lịch sử làm việc đã được hiển thị.");
  } catch (error) {
    console.error("Lỗi khi lấy thông tin cá nhân:", error);
    alert(
      "Không thể tải thông tin cá nhân. Vui lòng thử lại. Lỗi: " + error.message
    );
    window.location.href = "/HealthMateLC/index.html";
  }
}

async function logout() {
  console.log("Đang đăng xuất...");
  const response = await fetch("http://localhost:8080/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json();
  console.log("Logout response:", data);
  if (data.success)
    window.location.href = data.redirectUrl || "/HealthMateLC/index.html";
}

// Sửa hàm initializeApp để tải lịch khi khởi tạo
async function initializeApp() {
  const userId = await handleUserProfile();
  if (userId) {
    await loadSchedules(); // Tải lịch làm việc khi khởi tạo
  }
  fetchCustomers();
  setupEventListeners();
  setupNavigation();
  setupMainEditForm();
  showCustomerSection();
}

function setupEventListeners() {
  // Customer form submission
  const customerForm = document.getElementById("customerForm");
  if (customerForm) {
    customerForm.addEventListener("submit", handleAddCustomer);
  }

  // Edit customer form submission
  const editCustomerForm = document.getElementById("editCustomerForm");
  if (editCustomerForm) {
    editCustomerForm.addEventListener("submit", handleEditCustomer);
  }

  // Search functionality
  const searchInput = document.getElementById("searchCustomer");
  if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
  }
}

function setupNavigation() {
  // Customer navigation
  const navCreateCustomer = document.getElementById("nav-create-customer");
  const navCustomerList = document.getElementById("nav-customer-list");

  // Order navigation
  const navCreateOrder = document.getElementById("nav-create-order");
  const navOrderList = document.getElementById("nav-order-list");

  // Personal navigation
  const navSchedule = document.getElementById("nav-schedule");
  const navMedicineInfo = document.getElementById("nav-medicine-info");

  if (navCreateCustomer) {
    navCreateCustomer.addEventListener("click", () => {
      setActiveNav(navCreateCustomer);
      showCustomerSection();
      openAddCustomerForm();
    });
  }

  if (navCustomerList) {
    navCustomerList.addEventListener("click", () => {
      setActiveNav(navCustomerList);
      showCustomerSection();
      openCustomerList();
    });
  }

  if (navCreateOrder) {
    navCreateOrder.addEventListener("click", () => {
      setActiveNav(navCreateOrder);
      showCreateOrderForm();
    });
  }

  if (navOrderList) {
    navOrderList.addEventListener("click", () => {
      setActiveNav(navOrderList);
      showNotification(
        "Chức năng danh sách đơn hàng đang được phát triển",
        "info"
      );
    });
  }

  if (navSchedule) {
    navSchedule.addEventListener("click", () => {
      setActiveNav(navSchedule);
      showSchedule();
    });
  }

  if (navMedicineInfo) {
    navMedicineInfo.addEventListener("click", () => {
      setActiveNav(navMedicineInfo);
      showNotification(
        "Chức năng thông tin thuốc đang được phát triển",
        "info"
      );
    });
  }
}

function setActiveNav(activeElement) {
  // Remove active class from all nav items
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => item.classList.remove("active"));

  // Add active class to clicked item
  if (activeElement) {
    activeElement.classList.add("active");
  }
}

// Section Management Functions
function hideAllSections() {
  // Ẩn tất cả các section
  const customerContainer = document.querySelector(".customer-container");
  const createOrderForm = document.getElementById("createOrderForm");
  const scheduleContainer = document.getElementById("scheduleContainer");
  const mainEditCustomerSection = document.getElementById(
    "mainEditCustomerSection"
  );

  if (customerContainer) customerContainer.style.display = "none";
  if (createOrderForm) createOrderForm.style.display = "none";
  if (scheduleContainer) scheduleContainer.style.display = "none";
  if (mainEditCustomerSection) mainEditCustomerSection.style.display = "none";
}
//
function showCustomerSection() {
  hideAllSections();
  currentSection = "customers";

  const customerContainer = document.querySelector(".customer-container");
  if (customerContainer) {
    customerContainer.style.display = "block";
  }

  // Reset customer section states
  resetCustomerSectionStates();
}

function showCreateOrderForm() {
  hideAllSections();
  currentSection = "orders";

    const createOrderForm = document.getElementById("createOrderForm")
    if (createOrderForm) {
        createOrderForm.style.display = "flex"
    }
    
    // Reset form and ensure all elements are visible
    resetOrderForm()
    
    // Display products when form opens
    if (products.length > 0) {
        displayProducts(products)
    } else {
        // If products not loaded yet, fetch them
        fetchProducts()
    }

}

async function showSchedule() {
  hideAllSections();
  currentSection = "schedule";

  const scheduleContainer = document.getElementById("scheduleContainer");
  if (scheduleContainer) {
    scheduleContainer.style.display = "block";
    await loadSchedules(); // Tải lịch làm việc
  }
}

function resetCustomerSectionStates() {
    // Reset all customer section states
    const customersList = document.querySelector(".customers-list")
    const createCustomerForm = document.getElementById("createCustomerForm")
    const customerDetailView = document.getElementById("customerDetailView")
    const editCustomerInfo = document.getElementById("editCustomerInfo")

    if (customersList) {
        customersList.classList.remove("shrink", "hide")
    }

    if (createCustomerForm) {
        createCustomerForm.classList.remove("active")
    }

    if (customerDetailView) {
        customerDetailView.classList.remove("active")
    }

    if (editCustomerInfo) {
        editCustomerInfo.classList.remove("active")
    }
}

// Customer Management Functions (updated)
function openAddCustomerForm() {

    if (currentSection !== "customers") {
        showCustomerSection()
    }

    // Close other customer forms
    document.getElementById("customerDetailView").classList.remove("active")
    document.getElementById("editCustomerInfo").classList.remove("active")

    // Show create form and shrink customer list
    const customersList = document.querySelector(".customers-list")
    if (customersList) {
        customersList.classList.add("shrink")
    }
    document.getElementById("createCustomerForm").classList.add("active")

    // Clear form
    const customerForm = document.getElementById("customerForm")
    if (customerForm) {
        customerForm.reset()
    }
}

function closeAddCustomerForm() {
    const customersList = document.querySelector(".customers-list")
    if (customersList) {
        customersList.classList.remove("shrink")
    }
    document.getElementById("createCustomerForm").classList.remove("active")


  const customerForm = document.getElementById("customerForm");
  if (customerForm) {
    customerForm.reset();
  }
}

function openCustomerDetails() {

    if (currentSection !== "customers") {
        showCustomerSection()
    }

    document.getElementById("createCustomerForm").classList.remove("active")
    document.getElementById("editCustomerInfo").classList.remove("active")
    const customersList = document.querySelector(".customers-list")
    if (customersList) {
        customersList.classList.add("shrink")
    }
    document.getElementById("customerDetailView").classList.add("active")
}

function closeCustomerDetails() {
    document.getElementById("customerDetailView").classList.remove("active")
    const customersList = document.querySelector(".customers-list")
    if (customersList) {
        customersList.classList.remove("shrink")
    }

}

function openEditCustomerInfoForm() {
  openMainEditCustomer(); // Use the new main edit form instead
}

function closeEditCustomerForm() {

    document.getElementById("editCustomerInfo").classList.remove("active")
    const customersList = document.querySelector(".customers-list")
    if (customersList) {
        customersList.classList.remove("hide", "shrink")
    }


  const editForm = document.getElementById("editCustomerForm");
  if (editForm) {
    editForm.reset();
  }
}

function openCustomerList() {
  if (currentSection !== "customers") {
    showCustomerSection();
  }

  resetCustomerSectionStates();
}

// Customer Management Functions
async function fetchCustomers() {

    try {
        console.log("Fetching customers...")
        const response = await fetch("http://localhost:8080/employee/danh-sach-khach-hang", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        })

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
        }

        customers = await response.json()
        console.log("Received customers:", customers)
        displayCustomers(customers)
    } catch (error) {
        console.error("Error fetching customers:", error)

    }

    customers = await response.json();
    console.log("Received customers:", customers);
    displayCustomers(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    // Display mock data for demo purposes
    displayMockCustomers();
  }
}



function displayCustomers(customerList) {
  const customerListContainer = document.getElementById("customer-list");
  if (!customerListContainer) return;

  customerListContainer.innerHTML = "";

  customerList.forEach((customer) => {
    const customerItem = document.createElement("div");
    customerItem.className = "customer-item";

    const initials = customer.fullName
      .split(" ")
      .map((word) => word.charAt(0))
      .slice(-2)
      .join("")
      .toUpperCase();

    customerItem.innerHTML = `
            <div class="customer-avatar">${initials}</div>
            <div class="customer-info">
                <h4>${customer.fullName}</h4>
                <p>${customer.phone || "N/A"} • Điểm: ${
      customer.totalPoints || 0
    }</p>
            </div>
        `;

    customerItem.addEventListener("click", () => showCustomerDetails(customer));
    customerListContainer.appendChild(customerItem);
  });
}

// hiển thị chi tiết thông tin khách hàng khi mình click vao khach hàng bat kì
function showCustomerDetails(customer) {

    currentCustomer = customer

    // Populate customer details
    document.getElementById("detailFullName").textContent = customer.fullName || "N/A"
    document.getElementById("detailPhone").textContent = customer.phone || "N/A"
    document.getElementById("detailEmail").textContent = customer.email || "N/A"
    document.getElementById("detailGender").textContent = customer.gender || "Không xác định"
    document.getElementById("detailDateOfBirth").textContent = formatDate(customer.dateOfBirth) || "N/A"
    document.getElementById("detailMedicalHistory").textContent = customer.medicalHistory || "Không có"
    document.getElementById("detailAllergies").textContent = customer.allergies || "Không có"
    document.getElementById("detailTotalPoints").textContent = customer.totalPoints || 0
    document.getElementById("detailCreatedDate").textContent = formatDate(customer.createdDate)

    openCustomerDetails()

}


// Event Handlers
async function handleAddCustomer(event) {

    event.preventDefault()

    const formData = {
        fullName: document.getElementById("fullName").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim(),
        gender: document.getElementById("gender").value,
        dateOfBirth: document.getElementById("dateOfBirth").value,
        medicalHistory: document.getElementById("medicalHistory").value.trim(),
        allergies: document.getElementById("allergies").value.trim(),
    }

    try {
        const response = await fetch("http://localhost:8080/employee/tao-moi-khach-hang", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        })

        if (response.ok) {
            console.log("Customer added successfully")
            closeAddCustomerForm()
            fetchCustomers() // Refresh the customer list
            showNotification("Thêm khách hàng thành công!", "success")
        } else {
            throw new Error("Failed to add customer")
        }
    } catch (error) {
        console.error("Error adding customer:", error)
        showNotification("Lỗi khi thêm khách hàng: " + error.message, "error") ;

    }
  } catch (error) {
    console.error("Error adding customer:", error);
    // For demo purposes, add to local array
    const newCustomer = {
      id: customers.length + 1,
      ...formData,
      totalPoints: 0,
      createdDate: new Date().toISOString().split("T")[0],
    };
  }
}

async function handleEditCustomer(event) {
  event.preventDefault();

  if (!currentCustomer) return;

  const formData = {
    id: currentCustomer.id,
    fullName: document.getElementById("editFullName").value,
    phone: document.getElementById("editPhone").value,
    email: document.getElementById("editEmail").value,
    allergies: document.getElementById("editAllergies").value,
    totalPoints:
      Number.parseInt(document.getElementById("editTotalPoints").value) || 0,
  };

  try {
    const response = await fetch(
      `http://localhost:8080/employee/cap-nhat-khach-hang/${currentCustomer.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      }
    );

    if (response.ok) {
      console.log("Customer updated successfully");
      closeEditCustomerForm();
      fetchCustomers(); // Refresh the customer list
      showNotification("Cập nhật thông tin thành công!", "success");
    } else {
      throw new Error("Failed to update customer");
    }
  } catch (error) {
    console.error("Error updating customer:", error);
    // For demo purposes, update local array
    const customerIndex = customers.findIndex(
      (c) => c.id === currentCustomer.id
    );
    if (customerIndex !== -1) {
      customers[customerIndex] = { ...customers[customerIndex], ...formData };
      displayCustomers(customers);
      currentCustomer = customers[customerIndex];
      showCustomerDetails(currentCustomer);
    }
    closeEditCustomerForm();
    showNotification("Cập nhật thông tin thành công! (Demo mode)", "success");
  }
}

function handleSearch(event) {
  const searchTerm = event.target.value.toLowerCase();
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.fullName.toLowerCase().includes(searchTerm) ||
      customer.phone.includes(searchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm))
  );
  displayCustomers(filteredCustomers);
}

// hàm chỉnh sua thong tin khách hàng(hiển thị, điền thông tin và chỉnh sửa)
function openMainEditCustomer() {
    console.log("Opening main edit customer form") // Debug log

    if (!currentCustomer) {
        console.error("No current customer selected")
        showNotification("Vui lòng chọn khách hàng trước", "error")
        return
    }

    // Chèn data vào các ô thông tin của khách hàng
    populateMainEditForm(currentCustomer)

    // Show main edit section
    const mainEditSection = document.getElementById("mainEditCustomerSection")
    if (mainEditSection) {
        mainEditSection.style.display = "flex" // Thay đổi từ classList.add("active")
        mainEditSection.classList.add("active")
        console.log("Đã hiển thị form để chỉnh sửa khách hàng!")
    } else {
        console.error("Hiển thị form chỉnh sủa bị lỗi!!")
    }

    // Close other forms
    closeCustomerDetails()
    closeEditCustomerForm()

}

function closeMainEditCustomer() {
  const mainEditSection = document.getElementById("mainEditCustomerSection");
  if (mainEditSection) {
    mainEditSection.style.display = "none";
    mainEditSection.classList.remove("active");
  }

  clearFormErrors();

  // Reset form
  const form = document.getElementById("mainEditCustomerForm");
  if (form) {
    form.reset();
  }
}


function populateMainEditForm(customer) {
  console.log("Populating form with customer:", customer);

  try {
    // Update preview
    const initials = customer.fullName
      .split(" ")
      .map((word) => word.charAt(0))
      .slice(-2)
      .join("")
      .toUpperCase();

    const previewAvatar = document.getElementById("previewAvatar");
    const previewName = document.getElementById("previewName");
    const previewPhone = document.getElementById("previewPhone");

    if (previewAvatar) previewAvatar.textContent = initials;
    if (previewName) previewName.textContent = customer.fullName || "N/A";
    if (previewPhone) previewPhone.textContent = customer.phone || "N/A";

    // Populate form fields
    const fields = [
      { id: "mainEditFullName", value: customer.fullName || "" },
      { id: "mainEditPhone", value: customer.phone || "" },
      { id: "mainEditEmail", value: customer.email || "" },
      { id: "mainEditBirthDate", value: customer.birthDate || "" },
      { id: "mainEditGender", value: customer.gender || "" },
      { id: "mainEditTotalPoints", value: customer.totalPoints || 0 },
      { id: "mainEditAddress", value: customer.address || "" },
      { id: "mainEditMedicalHistory", value: customer.medicalHistory || "" },
      { id: "mainEditAllergies", value: customer.allergies || "" },
    ];

    fields.forEach((field) => {
      const element = document.getElementById(field.id);
      if (element) {
        element.value = field.value;
      } else {
        console.warn(`Element ${field.id} not found`);
      }
    });

    console.log("Form populated successfully");
  } catch (error) {
    console.error("Error populating form:", error);
  }
}

// Form validation functions
function validateCustomerForm(formData) {
  const errors = {};

  // Validate full name
  if (!formData.fullName || formData.fullName.trim().length < 2) {
    errors.fullName = "Họ tên phải có ít nhất 2 ký tự";
  }

  // Validate phone
  const phoneRegex = /^[0-9]{10,11}$/;
  if (!formData.phone || !phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
    errors.phone = "Số điện thoại không hợp lệ (10-11 số)";
  }

  // Validate email if provided
  if (formData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = "Email không hợp lệ";
    }
  }

  return errors;
}


function showFormErrors(errors) {
  // Clear previous errors
  clearFormErrors();

  // Show new errors
  Object.keys(errors).forEach((field) => {
    const input = document.getElementById(
      `mainEdit${field.charAt(0).toUpperCase() + field.slice(1)}`
    );
    const errorElement = document.getElementById(`${field}Error`);

    if (input && errorElement) {
      input.classList.add("error");
      errorElement.textContent = errors[field];
      errorElement.classList.add("show");
    }
  });
}

function clearFormErrors() {
  const errorElements = document.querySelectorAll(".error-message");
  const inputElements = document.querySelectorAll(
    ".form-group input, .form-group textarea, .form-group select"
  );

  errorElements.forEach((el) => {
    el.classList.remove("show");
    el.textContent = "";
  });

  inputElements.forEach((el) => {
    el.classList.remove("error");
  });
}

// Process data before sending to server

function processCustomerData(formData) {
  return {
    id: currentCustomer.id,
    fullName: formData.fullName.trim(),
    phone: formData.phone.replace(/\s/g, ""), // Remove spaces
    email: formData.email ? formData.email.trim().toLowerCase() : null,
    birthDate: formData.birthDate || null,
    gender: formData.gender || null,
    totalPoints: Number.parseInt(formData.totalPoints) || 0,
    address: formData.address ? formData.address.trim() : null,
    medicalHistory: formData.medicalHistory
      ? formData.medicalHistory.trim()
      : null,
    allergies: formData.allergies ? formData.allergies.trim() : null,
    updatedAt: new Date().toISOString(),
  };
}

// Handle main edit form submission
async function handleMainEditCustomer(event) {
  event.preventDefault();

  if (!currentCustomer) return;

  const form = event.target;
  const formData = new FormData(form);
  const customerData = {};

  // Convert FormData to object
  for (const [key, value] of formData.entries()) {
    customerData[key] = value;
  }

  // Validate form data
  const errors = validateCustomerForm(customerData);
  if (Object.keys(errors).length > 0) {
    showFormErrors(errors);
    return;
  }

  // Process data before sending
  const processedData = processCustomerData(customerData);

  // Show loading state
  const saveBtn = document.getElementById("saveCustomerBtn");
  const btnText = saveBtn.querySelector(".btn-text");
  const loadingSpinner = saveBtn.querySelector(".loading-spinner");

  saveBtn.disabled = true;
  btnText.style.display = "none";
  loadingSpinner.style.display = "flex";

  try {
    console.log("Sending customer data:", processedData);

    const response = await fetch("http://localhost:8080/HealthMateLC", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(processedData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! Status: ${response.status}`
      );
    }

    const result = await response.json();
    console.log("Server response:", result);

    // Update local customer data
    currentCustomer = { ...currentCustomer, ...processedData };

    // Update customer in the list
    const customerIndex = customers.findIndex(
      (c) => c.id === currentCustomer.id
    );
    if (customerIndex !== -1) {
      customers[customerIndex] = currentCustomer;
      displayCustomers(customers);
    }

    // Close form and show success
    closeMainEditCustomer();
    showNotification("Cập nhật thông tin khách hàng thành công!", "success");

    // Refresh customer details if it was open
    if (
      document.getElementById("customerDetailView").classList.contains("active")
    ) {
      showCustomerDetails(currentCustomer);
    }
  } catch (error) {
    console.error("Error updating customer:", error);
    showNotification(`Lỗi cập nhật: ${error.message}`, "error");
  } finally {
    // Reset loading state
    saveBtn.disabled = false;
    btnText.style.display = "inline";
    loadingSpinner.style.display = "none";
  }
}


// Utility Functions
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN");
}

function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Style the notification
  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "15px 20px",
    borderRadius: "8px",
    color: "white",
    fontWeight: "500",
    zIndex: "9999",
    transform: "translateX(100%)",
    transition: "transform 0.3s ease",
  });

  // Set background color based on type
  switch (type) {
    case "success":
      notification.style.background =
        "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)";
      break;
    case "error":
      notification.style.background =
        "linear-gradient(135deg, #fa709a 0%, #fee140 100%)";
      break;
    default:
      notification.style.background =
        "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)";
  }

  // Add to DOM
  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 100);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Additional feature functions (placeholders)
function historyOrderByCustomer() {
  if (!currentCustomer) return;
  showNotification(
    `Xem lịch sử đơn hàng của ${currentCustomer.fullName}`,
    "info"
  );
  // Implement order history functionality here
}


// Setup main edit form
function setupMainEditForm() {
    const mainEditForm = document.getElementById("mainEditCustomerForm")
    if (mainEditForm) {
        mainEditForm.addEventListener("submit", handleMainEditCustomer)
    }
}

// Populate main edit form with current customer data
function populateMainEditForm(customer) {
    if (!customer) return

    // Populate form fields
    const fullNameInput = document.getElementById("mainEditFullName")
    const phoneInput = document.getElementById("mainEditPhone")
    const emailInput = document.getElementById("mainEditEmail")
    const genderInput = document.getElementById("mainEditGender")
    const dateOfBirthInput = document.getElementById("mainEditDateOfBirth")
    const medicalHistoryInput = document.getElementById("mainEditMedicalHistory")
    const allergiesInput = document.getElementById("mainEditAllergies")
    const totalPointsInput = document.getElementById("mainEditTotalPoints")

    if (fullNameInput) fullNameInput.value = customer.fullName || ""
    if (phoneInput) phoneInput.value = customer.phone || ""
    if (emailInput) emailInput.value = customer.email || ""
    if (genderInput) genderInput.value = customer.gender || ""
    if (dateOfBirthInput) dateOfBirthInput.value = customer.dateOfBirth || ""
    if (medicalHistoryInput) medicalHistoryInput.value = customer.medicalHistory || ""
    if (allergiesInput) allergiesInput.value = customer.allergies || ""
    if (totalPointsInput) totalPointsInput.value = customer.totalPoints || 0

    // Update preview
    updateCustomerPreview(customer)
}

// Update customer preview in edit form
function updateCustomerPreview(customer) {
    const previewName = document.getElementById("previewName")
    const previewPhone = document.getElementById("previewPhone")
    const previewAvatar = document.getElementById("previewAvatar")

    if (previewName) previewName.textContent = customer.fullName || "Tên khách hàng"
    if (previewPhone) previewPhone.textContent = customer.phone || "Số điện thoại"
    
    if (previewAvatar && customer.fullName) {
        const initials = customer.fullName
            .split(" ")
            .map((word) => word.charAt(0))
            .slice(-2)
            .join("")
            .toUpperCase()
        previewAvatar.textContent = initials
    }
}

// Handle main edit form submission
async function handleMainEditCustomer(event) {
    event.preventDefault()

    if (!currentCustomer) {
        showNotification("Không tìm thấy thông tin khách hàng", "error")
        return
    }

    // Clear previous errors
    clearFormErrors()

    // Get form data
    const formData = {
        id: currentCustomer.customerId,
        fullName: document.getElementById("mainEditFullName").value.trim(),
        phone: document.getElementById("mainEditPhone").value.trim(),
        email: document.getElementById("mainEditEmail").value.trim(),
        gender: document.getElementById("mainEditGender").value,
        dateOfBirth: document.getElementById("mainEditDateOfBirth").value,
        medicalHistory: document.getElementById("mainEditMedicalHistory").value.trim(),
        allergies: document.getElementById("mainEditAllergies").value.trim(),
    }

    // Validate form data
    const errors = validateMainEditForm(formData)
    if (Object.keys(errors).length > 0) {
        showFormErrors(errors)
        return
    }

    try {
        // Show loading state
        const submitBtn = document.querySelector("#mainEditCustomerForm button[type='submit']")
        const originalText = submitBtn?.textContent
        if (submitBtn) {
            submitBtn.disabled = true
            submitBtn.textContent = "Đang xử lý..."
        }

        // Send update request to backend
        const response = await fetch(`http://localhost:8080/employee/cap-nhat-khach-hang/${formData.id}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                fullName: formData.fullName,
                phone: formData.phone,
                email: formData.email,
                gender: formData.gender,
                dateOfBirth: formData.dateOfBirth,
                medicalHistory: formData.medicalHistory,
                allergies: formData.allergies
            }),
        })
        if (response.ok) {
            const updatedCustomer = await response.json()
            
            // Update current customer data
            currentCustomer = { ...currentCustomer, ...updatedCustomer }
            
            // Update customers array
            const customerIndex = customers.findIndex(c => c.customerID === currentCustomer.customerID || c.id === currentCustomer.id)
            if (customerIndex !== -1) {
                customers[customerIndex] = currentCustomer
            }

            // Refresh UI
            fetchCustomers();
            displayCustomers(customers)
            showCustomerDetails(currentCustomer)
            closeMainEditCustomer()
            
            showNotification("Cập nhật thông tin khách hàng thành công!", "success")

        } else {
            
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `Số điện thoại hoặc email đã tồn tại! Vui lòng kiểm tra lại.`)
        }
    } catch (error) {
        console.error("Error updating customer:", error)
        showNotification("Số điện thoại hoặc email đã tồn tại! Vui lòng kiểm tra lại.", "error")
    } finally {
        // Reset button state
        const submitBtn = document.querySelector("#mainEditCustomerForm button[type='submit']")
        submitBtn.disabled = false
        submitBtn.textContent = "Lưu thay đổi"
        
    }
}

// Validate main edit form
function validateMainEditForm(formData) {
    const errors = {}

    // Validate full name
    if (!formData.fullName) {
        errors.fullName = "Tên khách hàng không được để trống"
    } else if (formData.fullName.length < 2) {
        errors.fullName = "Tên khách hàng phải có ít nhất 2 ký tự"
    } else if (formData.fullName.length > 100) {
        errors.fullName = "Tên khách hàng không được vượt quá 100 ký tự"
    }

    // Validate phone
    if (!formData.phone) {
        errors.phone = "Số điện thoại không được để trống"
    } else if (!/^[0-9]{10,11}$/.test(formData.phone)) {
        errors.phone = "Số điện thoại phải có 10-11 chữ số"
    }

    // Validate email (optional but must be valid if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = "Email không hợp lệ"
    }

    // Validate date of birth (optional but must be valid if provided)
    if (formData.dateOfBirth) {
        const birthDate = new Date(formData.dateOfBirth)
        const today = new Date()
        if (birthDate >= today) {
            errors.dateOfBirth = "Ngày sinh phải nhỏ hơn ngày hiện tại"
        }
    }

    // Validate medical history (optional, max length check)
    if (formData.medicalHistory && formData.medicalHistory.length > 1000) {
        errors.medicalHistory = "Tiền sử bệnh lý không được vượt quá 1000 ký tự"
    }

    // Validate allergies (optional, max length check)
    if (formData.allergies && formData.allergies.length > 500) {
        errors.allergies = "Thông tin dị ứng không được vượt quá 500 ký tự"
    }

    return errors
}

// Show Create Order Form
function showCreateOrderForm() {
    // Hide other sections first
    hideAllSections();
    
    // Show the create order form
    document.getElementById("createOrderForm").style.display = "flex";
    
    // Reset form and ensure all elements are visible
    resetOrderForm();
}

// Close Create Order Form
function closeCreateOrderForm() {
    document.getElementById("createOrderForm").style.display = "none";
    resetOrderForm();
    
    // Show customer section by default
    showCustomerSection();
}

// Reset Order Form
function resetOrderForm() {
    selectedCustomerForOrder = null;
    orderItems = [];
    orderTotal = 0;
    
    // Clear form fields
    document.getElementById("orderCustomerSearch").value = "";
    document.getElementById("medicineSearch").value = "";
    
    // Hide selected customer
    document.getElementById("selectedCustomer").style.display = "none";
    document.getElementById("customerSearchResults").style.display = "none";
    
    // Show customer search elements
    showCustomerSearchElements();
    
    // Reset order summary
    updateOrderSummary();
}

// Search Customers for Order
function searchCustomersForOrder(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
        document.getElementById("customerSearchResults").style.display = "none";
        return;
    }
    
    // Filter customers based on search term
    const filteredCustomers = customers.filter(customer => 
        customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
    );
    
    displayCustomerSearchResults(filteredCustomers);
}

// Display Customer Search Results
function displayCustomerSearchResults(customerList) {
    const resultsContainer = document.getElementById("customerSearchResults");
    
    if (customerList.length === 0) {
        resultsContainer.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #718096;">
                <span class="material-icons">search_off</span>
                <p>Không tìm thấy khách hàng</p>
            </div>
        `;
        resultsContainer.style.display = "block";
        return;
    }
    
    resultsContainer.innerHTML = customerList.map(customer => {
        const initials = customer.fullName
            .split(" ")
            .map(word => word.charAt(0))
            .slice(-2)
            .join("")
            .toUpperCase();
        
        // Kiểm tra các field ID có thể có
        const customerId = customer.id || customer.customerId || customer.customerID || customer.userId;
        console.log("Customer data for search:", customer); // Debug log
        console.log("Customer ID found:", customerId); // Debug log
            
        return `
            <div class="customer-result-item" onclick="selectCustomerForOrder(${customerId}, '${customer.fullName}', '${customer.phone}', ${customer.totalPoints || 0})">
                <div class="customer-avatar">${initials}</div>
                <div class="customer-info">
                    <h6>${customer.fullName}</h6>
                    <p>${customer.phone} • Điểm: ${customer.totalPoints || 0}</p>
                </div>
            </div>
        `;
    }).join("");
    
    resultsContainer.style.display = "block";
}

// Select Customer for Order
function selectCustomerForOrder(customerId, fullName, phone, totalPoints) {
    console.log("Selecting customer for order:");
    console.log("Customer ID:", customerId);
    console.log("Full Name:", fullName);
    console.log("Phone:", phone);
    console.log("Total Points:", totalPoints);
    
    selectedCustomerForOrder = {
        id: customerId,
        fullName: fullName,
        phone: phone,
        totalPoints: totalPoints
    };
    
    console.log("selectedCustomerForOrder object:", selectedCustomerForOrder);
    
    // Update selected customer display
    const initials = fullName
        .split(" ")
        .map(word => word.charAt(0))
        .slice(-2)
        .join("")
        .toUpperCase();
    
    document.getElementById("selectedCustomerAvatar").textContent = initials;
    document.getElementById("selectedCustomerName").textContent = fullName;
    document.getElementById("selectedCustomerPhone").textContent = phone;
    document.getElementById("selectedCustomerPoints").textContent = `Điểm: ${totalPoints || 0}`;
    
    // Show selected customer and hide search results
    document.getElementById("selectedCustomer").style.display = "flex";
    document.getElementById("customerSearchResults").style.display = "none";
    document.getElementById("orderCustomerSearch").value = "";
    
    // Hide customer search elements
    hideCustomerSearchElements();
}

// Hide Customer Search Elements when a customer is selected
function hideCustomerSearchElements() {
    const customerSearchContainer = document.querySelector(".customer-search-container");
    
    if (customerSearchContainer) {
        customerSearchContainer.style.display = "none";
    }
}

// Show Customer Search Elements when customer is removed
function showCustomerSearchElements() {
    const customerSearchContainer = document.querySelector(".customer-search-container");
    
    if (customerSearchContainer) {
        customerSearchContainer.style.display = "flex";
    }
}

// Remove Selected Customer
function removeSelectedCustomer() {
    selectedCustomerForOrder = null;
    document.getElementById("selectedCustomer").style.display = "none";
    document.getElementById("orderCustomerSearch").value = "";
    
    // Show customer search elements again
    showCustomerSearchElements();
}

// Update Medicine Quantity (renamed to Product)
function updateProductQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeProductFromOrder(productId);
        return;
    }
    
    const item = orderItems.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        item.total = item.quantity * item.price;
        updateOrderSummary();
    }
}

// Remove Product from Order (renamed from Medicine)
function removeProductFromOrder(productId) {
    orderItems = orderItems.filter(item => item.id !== productId);
    updateOrderSummary();
}

// Update Order Summary
function updateOrderSummary() {
    const orderItemsList = document.getElementById("orderItemsList");
    
    if (orderItems.length === 0) {
        orderItemsList.innerHTML = `
            <div class="empty-order">
                <span class="material-icons">shopping_cart_outlined</span>
                <p>Chưa có sản phẩm nào</p>
            </div>
        `;
        orderTotal = 0;
    } else {
        orderItemsList.innerHTML = orderItems.map(item => `
            <div class="order-item">
                <div class="order-item-info">
                    <h6>${item.name}</h6>
                    <p>${formatCurrency(item.price)} x ${item.quantity}</p>
                </div>
                <div class="order-item-controls">
                    <button class="quantity-btn" onclick="updateProductQuantity(${item.id}, ${item.quantity - 1})">
                        <span class="material-icons" style="font-size: 14px;">remove</span>
                    </button>
                    <input type="number" class="quantity-input" value="${item.quantity}" 
                           onchange="updateProductQuantity(${item.id}, parseInt(this.value) || 0)" min="1">
                    <button class="quantity-btn" onclick="updateProductQuantity(${item.id}, ${item.quantity + 1})">
                        <span class="material-icons" style="font-size: 14px;">add</span>
                    </button>
                    <button class="remove-item-btn" onclick="removeProductFromOrder(${item.id})">
                        <span class="material-icons" style="font-size: 14px;">delete</span>
                    </button>
                </div>
                <div class="order-item-total">
                    ${formatCurrency(item.total)}
                </div>
            </div>
        `).join("");
        
        orderTotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    }
    
    // Update totals
    document.getElementById("orderSubtotal").textContent = formatCurrency(orderTotal);
    document.getElementById("orderTotal").textContent = formatCurrency(orderTotal);
}

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Open Quick Add Customer Popup
function openQuickAddCustomer() {
    document.getElementById("quickAddCustomerPopup").style.display = "block";
}

// Close Quick Add Customer Popup
function closeQuickAddCustomer() {
    document.getElementById("quickAddCustomerPopup").style.display = "none";
    document.getElementById("quickAddCustomerForm").reset();
}

// Handle Quick Add Customer Form
async function handleQuickAddCustomer(event) {
    event.preventDefault();
    
    const formData = {
        fullName: document.getElementById("quickFullName").value.trim(),
        phone: document.getElementById("quickPhone").value.trim(),
        email: document.getElementById("quickEmail").value.trim()
    };
    
    try {
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Đang thêm...";
        
        // Send request to backend
        const response = await fetch("http://localhost:8080/employee/tao-moi-khach-hang", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });
        
        if (response.ok) {
            const newCustomer = await response.json();
            console.log("New customer created:", newCustomer); // Debug log
            
            // Add to customers array
            customers.push(newCustomer);
            
            // Determine customer ID field
            const customerId = newCustomer.id || newCustomer.customerId || newCustomer.customerID || newCustomer.userId;
            console.log("Using customer ID:", customerId); // Debug log
            
            // Select the new customer
            selectCustomerForOrder(
                customerId,
                newCustomer.fullName,
                newCustomer.phone,
                newCustomer.totalPoints || 0
            );
            
            closeQuickAddCustomer();
            showNotification("Thêm khách hàng thành công!", "success");
        } else {
            throw new Error("Không thể thêm khách hàng");
        }
    } catch (error) {
        console.error("Error adding customer:", error);
        showNotification("Lỗi khi thêm khách hàng: " + error.message, "error");
    } finally {
        // Reset button state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = "Thêm và chọn";
    }
}

// Cancel Order
function cancelOrder() {
    if (orderItems.length > 0) {
        if (confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
            closeCreateOrderForm();
        }
    } else {
        closeCreateOrderForm();
    }
}

// Create Order
async function createOrder() {
    if (orderItems.length === 0) {
        showNotification("Vui lòng thêm ít nhất một sản phẩm", "error");
        return;
    }
    
    if (!selectedCustomerForOrder) {
        showNotification("Vui lòng chọn khách hàng", "error");
        return;
    }
    
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || "cash";
    
    // Debug log để kiểm tra selectedCustomerForOrder
    console.log("=== DEBUG CREATE ORDER ===");
    console.log("selectedCustomerForOrder:", selectedCustomerForOrder);
    console.log("selectedCustomerForOrder.id:", selectedCustomerForOrder?.id);
    console.log("getCurrentUserId():", getCurrentUserId());
    console.log("orderItems:", orderItems);
    console.log("=========================");
    
    // Prepare order data for backend
    const orderData = {
        employeeId: getCurrentUserId(),
        customerId: selectedCustomerForOrder.id,
        orderItems: orderItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
            
        })),
        totalAmount: orderTotal,
        paymentMethod: paymentMethod,
        status: "pending", // Trạng thái pending cho invoice
        invoiceDate: new Date().toISOString(),
        
    };
    
    try {
        // Show loading state
        const createBtn = document.querySelector('.create-order-btn');
        const originalText = createBtn.innerHTML;
        createBtn.disabled = true;
        createBtn.innerHTML = '<span class="material-icons">refresh</span> Đang tạo...';
        
        // Log order data for debugging
        console.log("Sending order data to backend:", orderData);
        
        // Send to backend
        const response = await fetch("http://localhost:8080/employee/tao-don-hang", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(orderData),
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log("Order created successfully:", result);
            
            showNotification("Tạo đơn hàng thành công!", "success");
            closeCreateOrderForm();
            
            // Ask if user wants to print receipt
            setTimeout(() => {
                if (confirm("Đơn hàng đã được tạo thành công! Bạn có muốn in hóa đơn không?")) {
                    printReceipt(result);
                }
            }, 1000);
            
        } else {
            // Handle error response
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || `Lỗi HTTP: ${response.status}`;
            throw new Error(errorMessage);
        }
        
    } catch (error) {
        console.error("Error creating order:", error);
        showNotification("Lỗi khi tạo đơn hàng: " + error.message, "error");
    } finally {
        // Reset button state
        const createBtn = document.querySelector('.create-order-btn');
        if (createBtn) {
            createBtn.disabled = false;
            createBtn.innerHTML = '<span class="material-icons">add_shopping_cart</span> Tạo đơn hàng';
        }
    }
}

// Print Receipt
function printReceipt(orderData) {
    // Implementation for printing receipt
    console.log("Printing receipt for order:", orderData);
    showNotification("Chức năng in hóa đơn sẽ được cập nhật", "info");
}

// Setup Order Form Event Listeners
function setupOrderFormEventListeners() {
    // Customer search
    const customerSearchInput = document.getElementById("orderCustomerSearch");
    if (customerSearchInput) {
        customerSearchInput.addEventListener("input", (e) => {
            searchCustomersForOrder(e.target.value);
        });
    }
    
    // Product search
    const productSearchInput = document.getElementById("medicineSearch");
    if (productSearchInput) {
        productSearchInput.addEventListener("input", (e) => {
            console.log("Product search input detected:", e.target.value);
            searchProducts(e.target.value);
        });
        console.log("Product search event listener added successfully");
    } else {
        console.error("Product search input (medicineSearch) not found!");
    }
    
    // Product type filter
    const productTypeFilter = document.getElementById("productTypeFilter");
    if (productTypeFilter) {
        productTypeFilter.addEventListener("change", (e) => {
            filterProductsByType(e.target.value);
        });
    }
    
    // Quick add customer form
    const quickAddForm = document.getElementById("quickAddCustomerForm");
    if (quickAddForm) {
        quickAddForm.addEventListener("submit", handleQuickAddCustomer);
    }
}

// Refresh products display when needed
function refreshProductsDisplay() {
    if (products.length > 0) {
        filteredProducts = [...products];
        displayProducts(filteredProducts);
    }
}

// Product Management Functions
async function fetchProducts() {
    try {
        console.log("Fetching products...")
        const response = await fetch("http://localhost:8080/employee/danh-sach-san-pham", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        })

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
        }

        products = await response.json()
        filteredProducts = [...products] // Copy all products initially
        console.log("Received products:", products)
        displayProducts(products)
    } catch (error) {
        console.error("Error fetching products:", error)
        console.log("Using sample products as fallback")
        displaySampleProducts()
        showNotification("Đang sử dụng dữ liệu mẫu - Không thể kết nối API", "info")
    }
}

function displayProducts(productList) {
    const productListContainer = document.getElementById("medicineSearchResults")
    if (!productListContainer) {
        console.error("Medicine search results container not found!")
        return
    }

    // Clear existing static content but keep structure
    productListContainer.innerHTML = ""

    if (productList.length === 0) {
        productListContainer.innerHTML = `
            <div class="no-products" style="text-align: center; padding: 20px; color: #718096;">
                <span class="material-icons">inventory_2</span>
                <p>Không có sản phẩm nào</p>
            </div>
        `
        return
    }

    productList.forEach((product) => {
        const productItem = document.createElement("div")
        productItem.className = "medicine-item"
        
        productItem.innerHTML = `
            <div class="medicine-info">
                <h6>${product.productName}</h6>
                <p>${product.description || product.productType}</p>
                <span class="medicine-price">${formatCurrency(product.price)}</span>
            </div>
            <button class="add-medicine-btn" onclick="addProductToOrder(${product.productId}, '${product.productName}', ${product.price})">
                <span class="material-icons">add</span>
            </button>
        `

        productListContainer.appendChild(productItem)
    })
}

function searchProducts(searchTerm) {
    console.log("Searching products with term:", searchTerm);
    console.log("Current products array:", products);
    
    if (!searchTerm) {
        filteredProducts = [...products]
    } else {
        filteredProducts = products.filter(product => 
            product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.productType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
    }
    console.log("Filtered products:", filteredProducts);
    displayProducts(filteredProducts)
}

function filterProductsByType(productType) {
    if (!productType || productType === 'all') {
        filteredProducts = [...products]
    } else {
        filteredProducts = products.filter(product => 
            product.productType.toLowerCase() === productType.toLowerCase()
        )
    }
    displayProducts(filteredProducts)
}

function addProductToOrder(productId, productName, price) {
    // Check if product already exists in order
    const existingItem = orderItems.find(item => item.id === productId)
    
    if (existingItem) {
        existingItem.quantity += 1
        existingItem.total = existingItem.quantity * existingItem.price
    } else {
        orderItems.push({
            id: productId,
            name: productName,
            price: price,
            quantity: 1,
            total: price
        })
    }
    
    updateOrderSummary()
    showNotification(`Đã thêm ${productName} vào đơn hàng`, "success")
}

// Function to display sample products if API is not available
function displaySampleProducts() {
    const sampleProducts = [
        {
            productId: 1,
            productName: "Paracetamol 500mg",
            productType: "Thuốc",
            unit: "Viên",
            description: "Giảm đau, hạ sốt",
            price: 2500
        },
        {
            productId: 2,
            productName: "Amoxicillin 250mg",
            productType: "Thuốc",
            unit: "Viên", 
            description: "Kháng sinh",
            price: 3500
        },
        {
            productId: 3,
            productName: "Vitamin C 1000mg",
            productType: "Thuốc",
            unit: "Viên",
            description: "Bổ sung vitamin",
            price: 1500
        }
    ];
    
    products = sampleProducts;
    filteredProducts = [...products];
    displayProducts(filteredProducts);
    console.log("Displaying sample products as fallback");
}

// Employee Information Functions
async function fetchEmployeeInfo(employeeId) {
    try {
        console.log(`Fetching employee info for ID: ${employeeId}`);
        
        const response = await fetch(`http://localhost:8080/employee/thong-tin-nhan-vien/${employeeId}`, {
            method: "GET",
            headers: { 
                "Content-Type": "application/json" 
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const employeeInfo = await response.json();
        console.log("Employee info received:", employeeInfo);
        
        return employeeInfo;
    } catch (error) {
        console.error("Error fetching employee info:", error);
        showNotification("Lỗi khi lấy thông tin nhân viên: " + error.message, "error");
        return null;
    }
}

// Fetch employee work history
async function fetchEmployeeWorkHistory(userId) {
    try {
        const response = await fetch(`http://localhost:8080/employee/lich-su-cong-tac/${userId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching work history:", error);
        return [];
    }
}

// Display Employee Information
function displayEmployeeInfo(employeeInfo) {
    if (!employeeInfo) {
        console.warn("No employee info to display");
        return;
    }
    
    console.log("=== Employee Information ===");
    console.log("User ID:", employeeInfo.userId);
    console.log("Full Name:", employeeInfo.fullName);
    console.log("Phone:", employeeInfo.phone);
    console.log("Email:", employeeInfo.email);
    console.log("Pharmacy Name:", employeeInfo.pharmacyName);
    console.log("Assigned Date:", employeeInfo.assignedDate);
    console.log("===========================");
    
    // Update UI elements if they exist
    updateEmployeeInfoInUI(employeeInfo);
}

// Update Employee Info in UI
function updateEmployeeInfoInUI(employeeInfo) {
    // Update header user profile using specific IDs
    const userProfileName = document.getElementById("employeeName");
    const userProfileRole = document.getElementById("employeeRole");
    const avatar = document.getElementById("employeeAvatar");
    
    if (userProfileName && employeeInfo.fullName) {
        userProfileName.textContent = employeeInfo.fullName;
        console.log("Updated employee name:", employeeInfo.fullName);
    }
    
    if (userProfileRole && employeeInfo.pharmacyName) {
        userProfileRole.textContent = `Nhân viên - ${employeeInfo.pharmacyName}`;
        console.log("Updated employee role:", employeeInfo.pharmacyName);
    }
    
    // Update avatar initials
    if (avatar && employeeInfo.fullName) {
        const initials = employeeInfo.fullName
            .split(" ")
            .map(word => word.charAt(0))
            .slice(-2)
            .join("")
            .toUpperCase();
        avatar.textContent = initials;
        console.log("Updated avatar initials:", initials);
    }
    
    console.log("UI updated successfully with employee info:", employeeInfo);
}

// Load employee info and display on page load
async function loadEmployeeInfo() {
    const userId = getCurrentUserId();
    
    if (!userId) {
        console.warn("No user ID found to fetch employee info");
        showNotification("Không tìm thấy thông tin đăng nhập", "error");
        return null;
    }
    
    try {
        // Show loading state in header
        const userProfileName = document.getElementById("employeeName");
        if (userProfileName) {
            userProfileName.textContent = "Đang tải...";
        }
        
        console.log("Loading employee info for userId:", userId);
        const employeeInfo = await fetchEmployeeInfo(userId);
        
        if (employeeInfo) {
            displayEmployeeInfo(employeeInfo);
            return employeeInfo;
        } else {
            // Fallback to show default info if API fails
            const userProfileName = document.getElementById("employeeName");
            const userProfileRole = document.getElementById("employeeRole");
            
            if (userProfileName) {
                userProfileName.textContent = "Nhân viên";
            }
            if (userProfileRole) {
                userProfileRole.textContent = "Long Châu";
            }
        }
    } catch (error) {
        console.error("Error loading employee info:", error);
        showNotification("Không thể tải thông tin nhân viên", "error");
        
        // Show error state
        const userProfileName = document.getElementById("employeeName");
        if (userProfileName) {
            userProfileName.textContent = "Lỗi tải dữ liệu";
        }
    }
    
    return null;
}

// Get current employee info and display (kept for backward compatibility)
async function getCurrentEmployeeInfo() {
    return await loadEmployeeInfo();
}

// Utility function to format date
function formatEmployeeDate(dateString) {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit", 
        year: "numeric"
    });
}

// Manual refresh employee info function (for testing)
function refreshEmployeeInfo() {
    console.log("Manually refreshing employee info...");
    loadEmployeeInfo();
}

// Test function to show sample employee data
function showSampleEmployeeData() {
    const sampleEmployee = {
        userId: 12,
        fullName: "Nguyễn Văn An",
        phone: "0987654321",
        email: "an.nguyen@longchau.com",
        pharmacyName: "Long Châu Quận 1",
        assignedDate: new Date()
    };
    
    console.log("Showing sample employee data:", sampleEmployee);
    updateEmployeeInfoInUI(sampleEmployee);
    showNotification("Hiển thị dữ liệu mẫu nhân viên", "info");
}

// User Profile Dropdown Functions
function setupUserProfileDropdown() {
    const userProfile = document.getElementById("userProfileDropdown");
    const dropdownMenu = document.getElementById("userDropdownMenu");
    const dropdownIcon = document.getElementById("dropdownIcon");
    
    if (userProfile && dropdownMenu) {
        userProfile.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleDropdown();
        });
        
        // Close dropdown when clicking outside
        document.addEventListener("click", (e) => {
            if (!userProfile.contains(e.target)) {
                closeDropdown();
            }
        });
    }
}

function toggleDropdown() {
    const dropdownMenu = document.getElementById("userDropdownMenu");
    const dropdownIcon = document.getElementById("dropdownIcon");
    
    if (dropdownMenu.classList.contains("show")) {
        closeDropdown();
    } else {
        openDropdown();
    }
}

function openDropdown() {
    const dropdownMenu = document.getElementById("userDropdownMenu");
    const dropdownIcon = document.getElementById("dropdownIcon");
    
    dropdownMenu.classList.add("show");
    dropdownIcon.classList.add("rotate");
}

function closeDropdown() {
    const dropdownMenu = document.getElementById("userDropdownMenu");
    const dropdownIcon = document.getElementById("dropdownIcon");
    
    dropdownMenu.classList.remove("show");
    dropdownIcon.classList.remove("rotate");
}

// Dropdown Menu Actions
function showEmployeeDetails() {
    closeDropdown();
    
    // Create and show employee details modal
    showEmployeeDetailsModal();
}

function showEmployeeSchedule() {
    closeDropdown();
    
    // Navigate to schedule section
    const navSchedule = document.getElementById("nav-schedule");
    if (navSchedule) {
        navSchedule.click();
    }
    showNotification("Chuyển đến lịch làm việc", "info");
}

function changePassword() {
    closeDropdown();
    
    // Show change password modal
    showChangePasswordModal();
}

function logout() {
    closeDropdown();
    
    // Show confirmation dialog
    if (confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
        performLogout();
    }
}

// Employee Details Modal
function showEmployeeDetailsModal() {
    const userId = getCurrentUserId();
    
    if (!userId) {
        showNotification("Không tìm thấy thông tin đăng nhập", "error");
        return;
    }
    
    // Create modal
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
        <div class="modal-content employee-details-modal">
            <div class="modal-header">
                <h3>Thông tin cá nhân</h3>
                <button class="close-btn" onclick="closeEmployeeDetailsModal()">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <div class="modal-body" id="employeeDetailsBody">
                <div class="loading-state">
                    <span class="material-icons">refresh</span>
                    <p>Đang tải thông tin...</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load employee details
    loadEmployeeDetailsForModal(userId);
}

// Load employee details and work history for modal
async function loadEmployeeDetailsForModal(userId) {
    try {
        const [employeeInfo, workHistory] = await Promise.all([
            fetchEmployeeInfo(userId),
            fetchEmployeeWorkHistory(userId)
        ]);
        if (employeeInfo) {
            displayEmployeeDetailsInModal(employeeInfo, workHistory);
        } else {
            throw new Error("Không thể tải thông tin nhân viên");
        }
    } catch (error) {
        console.error("Error loading employee details:", error);
        const modalBody = document.getElementById("employeeDetailsBody");
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="error-state">
                    <span class="material-icons">error</span>
                    <p>Lỗi khi tải thông tin: ${error.message}</p>
                </div>
            `;
        }
    }
}

// Hiển thị thông tin cá nhân và lịch sử công tác
function displayEmployeeDetailsInModal(employeeInfo, workHistory) {
    const modalBody = document.getElementById("employeeDetailsBody");
    if (!modalBody) return;
    const initials = employeeInfo.fullName
        .split(" ")
        .map(word => word.charAt(0))
        .slice(-2)
        .join("")
        .toUpperCase();
    modalBody.innerHTML = `
        <div class="employee-info-card">
            <div class="employee-avatar-large">${initials}</div>
            <div class="employee-details">
                <div class="detail-row">
                    <span class="detail-label">Mã nhân viên:</span>
                    <span class="detail-value">${employeeInfo.userId}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Họ và tên:</span>
                    <span class="detail-value">${employeeInfo.fullName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Số điện thoại:</span>
                    <span class="detail-value">${employeeInfo.phone}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${employeeInfo.email}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Cửa hàng hiện tại:</span>
                    <span class="detail-value">${employeeInfo.pharmacyName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Ngày vào làm:</span>
                    <span class="detail-value">${formatEmployeeDate(employeeInfo.assignedDate)}</span>
                </div>
            </div>
            <div class="work-history-section">
                <h4 style="margin:24px 0 8px 0; color:#4facfe; font-size:16px;">Lịch sử công tác</h4>
                <div class="work-history-list">
                    ${workHistory && workHistory.length > 0 ? workHistory.map(item => `
                        <div class="work-history-item">
                            <span class="work-pharmacy">${item.pharmacyName}</span>
                            <span class="work-date">${formatEmployeeDate(item.startDate)} - ${item.endDate ? formatEmployeeDate(item.endDate) : 'Hiện tại'}</span>
                        </div>
                    `).join("") : `<div style='color:#718096;'>Chưa có lịch sử công tác</div>`}
                </div>
            </div>
        </div>
    `;
}

function closeEmployeeDetailsModal() {
    const modal = document.querySelector(".modal-overlay");
    if (modal) {
        modal.remove();
    }
}

// Change Password Modal
function showChangePasswordModal() {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
        <div class="modal-content change-password-modal">
            <div class="modal-header">
                <h3>Đổi mật khẩu</h3>
                <button class="close-btn" onclick="closeChangePasswordModal()">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <div class="modal-body">
                <form id="changePasswordForm" onsubmit="handleChangePassword(event)">
                    <div class="form-group">
                        <label>Mật khẩu hiện tại</label>
                        <input type="password" id="currentPassword" required>
                    </div>
                    <div class="form-group">
                        <label>Mật khẩu mới</label>
                        <input type="password" id="newPassword" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label>Xác nhận mật khẩu mới</label>
                        <input type="password" id="confirmPassword" required>
                    </div>
                    <div class="form-actions">
                        <button type="button" onclick="closeChangePasswordModal()">Hủy</button>
                        <button type="submit" class="primary-button">Đổi mật khẩu</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeChangePasswordModal() {
    const modal = document.querySelector(".modal-overlay");
    if (modal) {
        modal.remove();
    }
}

async function handleChangePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    
    if (newPassword !== confirmPassword) {
        showNotification("Mật khẩu xác nhận không khớp", "error");
        return;
    }
    
    try {
        const userId = getCurrentUserId();
        const response = await fetch(`http://localhost:8080/employee/doi-mat-khau`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: userId,
                currentPassword: currentPassword,
                newPassword: newPassword
            }),
        });
        
        if (response.ok) {
            showNotification("Đổi mật khẩu thành công!", "success");
            closeChangePasswordModal();
        } else {
            throw new Error("Mật khẩu hiện tại không đúng");
        }
    } catch (error) {
        console.error("Error changing password:", error);
        showNotification("Lỗi: " + error.message, "error");
    }
}

// Logout Function
function performLogout() {
    // Clear localStorage
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("currentUser");
    
    // Show logout message
    showNotification("Đăng xuất thành công!", "success");
    
    // Redirect to login page after short delay
    setTimeout(() => {
        window.location.href = "index.html";
    }, 1000);
}

// Add to window for debugging
if (typeof window !== 'undefined') {
    window.refreshEmployeeInfo = refreshEmployeeInfo;
    window.showSampleEmployeeData = showSampleEmployeeData;
    window.loadEmployeeInfo = loadEmployeeInfo;
}



