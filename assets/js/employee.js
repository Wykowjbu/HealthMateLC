// Global variables
let customers = [];
let currentCustomer = null;
let currentSection = "customers"; // Track current active section

// Order Management Variables
let selectedCustomerForOrder = null;
let orderItems = [];
let orderTotal = 0;

// Product Management Variables
let products = [];
let filteredProducts = [];
let inventory = [];

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
  initializeApp();
});

function initializeApp() {
  // Lấy và hiển thị User ID từ localStorage
  const userId = localStorage.getItem("currentUserId");
  const userRole = localStorage.getItem("userRole");

  if (userId) {
    console.log("Current User ID from employee.js:", userId);
    console.log("Current User Role from employee.js:", userRole);
  } else {
    console.warn("No User ID found in localStorage");
  }

  fetchCustomers();
  fetchProducts(); // Thêm fetch products
  setupEventListeners();
  setupNavigation();
  setupMainEditForm(); // Thêm dòng này
  setupOrderFormEventListeners(); // Thêm dòng này
  setupUserProfileDropdown(); // Thêm setup dropdown
  showCustomerSection(); // Show customer section by default

  // Fetch and display current employee info - cải thiện
  loadEmployeeInfo();
}

function setupEventListeners() {
  // Customer form submission
  const customerForm = document.getElementById("customerForm");
  if (customerForm) {
    customerForm.addEventListener("submit", handleAddCustomer);
  }

  // Search functionality - sử dụng đúng ID từ HTML
  const searchInput = document.getElementById("customerSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
    console.log("Customer search event listener added successfully");
  } else {
    console.error("Customer search input not found!");
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
      setActiveNavItem(navCreateCustomer);
      showCreateCustomerForm();
    });
  }

  if (navCustomerList) {
    navCustomerList.addEventListener("click", () => {
      setActiveNavItem(navCustomerList);
      showCustomerSection();
    });
  }

  if (navCreateOrder) {
    navCreateOrder.addEventListener("click", () => {
      setActiveNavItem(navCreateOrder);
      showCreateOrderForm();
    });
  }

  if (navOrderList) {
    navOrderList.addEventListener("click", () => {
      setActiveNavItem(navOrderList);
      showOrderListSection();
    });
  }

  if (navSchedule) {
    navSchedule.addEventListener("click", () => {
      setActiveNavItem(navSchedule);
      showScheduleSection();
    });
  }

  if (navMedicineInfo) {
    navMedicineInfo.addEventListener("click", () => {
      setActiveNavItem(navMedicineInfo);
      showMedicineInfoSection();
    });
  }
}

// Set active navigation item
function setActiveNavItem(activeItem) {
  // Remove active class from all nav items
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });

  // Add active class to the clicked item
  activeItem.classList.add("active");
}

// Show different sections
function showCustomerSection() {
  const customerContainer = document.querySelector(".customer-container");
  const createOrderForm = document.getElementById("createOrderForm");
  const orderListContainer = document.getElementById("orderListContainer");
  const scheduleContainer = document.getElementById("scheduleContainer");

  if (customerContainer) customerContainer.style.display = "block";
  if (createOrderForm) createOrderForm.style.display = "none";
  if (orderListContainer) orderListContainer.style.display = "none";
  if (scheduleContainer) scheduleContainer.style.display = "none";

  // Hide any open forms
  closeAddCustomerForm();
  closeCustomerDetails();
  closeMainEditCustomer();

  currentSection = "customers";
}

function showOrderListSection() {
  hideAllSections();
  currentSection = "orders";

  const orderListContainer = document.getElementById("orderListContainer");
  if (orderListContainer) {
    orderListContainer.style.display = "block";
  }

  // Reset all filters when showing order list section
  resetOrderFilters();

  // Load orders when showing the section
  loadOrders();
}

function showScheduleSection() {
  hideAllSections();
  currentSection = "schedule";

  const scheduleContainer = document.getElementById("scheduleContainer");
  if (scheduleContainer) {
    scheduleContainer.style.display = "block";
  }
}

function showCreateCustomerForm() {
  showCustomerSection();
  openAddCustomerForm();
}

// Order List Management
let allOrders = [];
let filteredOrders = [];
let currentOrderPage = 1;
let ordersPerPage = 10;
let selectedOrderForDetail = null;

// Load Orders from Backend
async function loadOrders() {
  try {
    showOrdersLoading(true);

    console.log("=== LOADING ALL PHARMACY ORDERS ===");
    console.log("Displaying all orders from the pharmacy");
    console.log("====================================");

    const response = await fetch(
      "http://localhost:8080/employee/danh-sach-don-hang",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const allOrdersFromAPI = await response.json();
      console.log("All pharmacy orders from API:", allOrdersFromAPI);
      console.log(`Total orders found: ${allOrdersFromAPI.length}`);

      // Hiển thị TẤT CẢ đơn hàng của nhà thuốc
      allOrders = allOrdersFromAPI;
      filteredOrders = [...allOrdersFromAPI];

      displayOrders();
      updateOrderStats();
      setupOrderFilters();
    } else {
      throw new Error(`HTTP Error: ${response.status}`);
    }
  } catch (error) {
    console.error("Error loading orders:", error);
    showNotification(
      "Lỗi khi tải danh sách đơn hàng: " + error.message,
      "error"
    );
  } finally {
    showOrdersLoading(false);
  }
}

// Display Orders in Table
function displayOrders() {
  const tableBody = document.getElementById("ordersTableBody");
  const ordersEmpty = document.getElementById("ordersEmpty");
  const ordersTableContainer = document.getElementById("ordersTableContainer");

  if (filteredOrders.length === 0) {
    ordersEmpty.style.display = "flex";
    ordersTableContainer.style.display = "none";
    return;
  }

  ordersEmpty.style.display = "none";
  ordersTableContainer.style.display = "block";

  // Calculate pagination
  const startIndex = (currentOrderPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const ordersToShow = filteredOrders.slice(startIndex, endIndex);

  tableBody.innerHTML = ordersToShow
    .map((order) => {
      return `
            <tr>
                <td onclick="viewOrderDetail(${order.invoiceId})">
                    <span class="order-id">#${order.invoiceId}</span>
                </td>
                <td onclick="viewOrderDetail(${order.invoiceId})">
                    <div class="customer-info">
                        <div class="customer-name">${
                          order.customerName || "N/A"
                        }</div>
                    </div>
                </td>
                <td onclick="viewOrderDetail(${order.invoiceId})">
                    <div class="order-date">${formatDateTime(
                      order.invoiceDate
                    )}</div>
                </td>
                <td onclick="viewOrderDetail(${order.invoiceId})">
                    <div class="order-amount">${formatCurrency(
                      order.totalAmount
                    )}</div>
                </td>
                <td onclick="viewOrderDetail(${order.invoiceId})">
                    <span class="payment-method payment-${
                      order.payment
                    }">${getPaymentDisplayName(order.payment)}</span>
                </td>
                <td onclick="viewOrderDetail(${order.invoiceId})">
                    <span class="order-status status-${
                      order.status
                    }">${getStatusDisplayName(order.status)}</span>
                </td>
                <td onclick="viewOrderDetail(${order.invoiceId})">
                    <div class="employee-name">${
                      order.employeeName || "N/A"
                    }</div>
                </td>
                <td>
                    <div class="order-actions-cell">
                        <button class="action-btn view-btn" onclick="viewOrderDetail(${
                          order.invoiceId
                        })">
                            <span class="material-icons">visibility</span>
                            Xem
                        </button>
                    </div>
                </td>
            </tr>
        `;
    })
    .join("");

  updatePagination();
}

// Update Order Statistics
function updateOrderStats() {
  const today = new Date().toDateString();
  const todayOrders = allOrders.filter(
    (order) => new Date(order.invoiceDate).toDateString() === today
  );

  const pendingCount = allOrders.filter(
    (order) => order.status === "pending"
  ).length;
  const completedCount = allOrders.filter(
    (order) => order.status === "paid"
  ).length;
  const totalCount = allOrders.length;

  document.getElementById("pendingOrdersCount").textContent = pendingCount;
  document.getElementById("completedOrdersCount").textContent = completedCount;
  document.getElementById("totalOrdersCount").textContent = totalCount;
}

// Setup Order Filters
function setupOrderFilters() {
  const statusFilter = document.getElementById("orderStatusFilter");
  const paymentFilter = document.getElementById("orderPaymentFilter");
  const dateFilter = document.getElementById("orderDateFilter");
  const searchInput = document.getElementById("orderSearchInput");

  if (statusFilter) {
    statusFilter.addEventListener("change", filterOrders);
  }

  if (paymentFilter) {
    paymentFilter.addEventListener("change", filterOrders);
  }

  if (dateFilter) {
    dateFilter.addEventListener("change", filterOrders);
  }

  if (searchInput) {
    searchInput.addEventListener("input", filterOrders);
  }
}

// Filter Orders
function filterOrders() {
  const statusFilter = document.getElementById("orderStatusFilter").value;
  const paymentFilter = document.getElementById("orderPaymentFilter").value;
  const dateFilter = document.getElementById("orderDateFilter").value;
  const searchTerm = document
    .getElementById("orderSearchInput")
    .value.toLowerCase();

  filteredOrders = allOrders.filter((order) => {
    // Status filter
    if (statusFilter !== "all" && order.status !== statusFilter) {
      return false;
    }

    // Payment filter
    if (paymentFilter !== "all" && order.payment !== paymentFilter) {
      return false;
    }

    // Date filter
    if (dateFilter) {
      const orderDate = new Date(order.invoiceDate).toDateString();
      const filterDate = new Date(dateFilter).toDateString();
      if (orderDate !== filterDate) {
        return false;
      }
    }

    // Search filter
    if (searchTerm) {
      const orderIdMatch = order.invoiceId.toString().includes(searchTerm);
      const customerNameMatch = (order.customerName || "")
        .toLowerCase()
        .includes(searchTerm);

      if (!orderIdMatch && !customerNameMatch) {
        return false;
      }
    }

    return true;
  });

  currentOrderPage = 1;
  displayOrders();
}

// Clear All Order Filters
function clearOrderFilters() {
  // Reset all filter inputs
  document.getElementById("orderStatusFilter").value = "all";
  document.getElementById("orderPaymentFilter").value = "all";
  document.getElementById("orderDateFilter").value = "";
  document.getElementById("orderSearchInput").value = "";

  // Reset filtered orders to show all orders
  filteredOrders = [...allOrders];

  currentOrderPage = 1;
  displayOrders();
  updatePagination();

  showNotification("Đã xóa tất cả bộ lọc", "success");
}

// Reset Order Filters (Silent - no notification)
function resetOrderFilters() {
  // Reset all filter inputs silently
  const statusFilter = document.getElementById("orderStatusFilter");
  const paymentFilter = document.getElementById("orderPaymentFilter");
  const dateFilter = document.getElementById("orderDateFilter");
  const searchInput = document.getElementById("orderSearchInput");

  if (statusFilter) statusFilter.value = "all";
  if (paymentFilter) paymentFilter.value = "all";
  if (dateFilter) dateFilter.value = "";
  if (searchInput) searchInput.value = "";

  // Reset filtered orders to show all orders (will be set by loadOrders)
  // Note: We don't call displayOrders here because loadOrders will do it
}

// View Order Detail
function viewOrderDetail(orderId) {
  const order = allOrders.find((o) => o.invoiceId === orderId);
  if (!order) {
    showNotification("Không tìm thấy đơn hàng", "error");
    return;
  }

  selectedOrderForDetail = order;
  populateOrderDetailModal(order);
  document.getElementById("orderDetailModal").style.display = "flex";
}

// Populate Order Detail Modal
function populateOrderDetailModal(order) {
  // Order info
  document.getElementById("orderDetailId").textContent = order.invoiceId;
  document.getElementById("detailOrderId").textContent = `#${order.invoiceId}`;
  document.getElementById("detailOrderDate").textContent = formatDateTime(
    order.invoiceDate
  );
  document.getElementById("detailOrderStatus").textContent =
    getStatusDisplayName(order.status);
  document.getElementById(
    "detailOrderStatus"
  ).className = `info-value status status-${order.status}`;
  document.getElementById("detailOrderPayment").textContent =
    getPaymentDisplayName(order.payment);
  document.getElementById("detailOrderEmployee").textContent =
    order.employeeName || "N/A";
  document.getElementById("detailOrderPoints").textContent =
    order.pointsEarned || 0;

  // Customer info
  document.getElementById("detailCustomerName").textContent =
    order.customerName || "N/A";
  document.getElementById("detailCustomerAvatar").textContent = (
    order.customerName || "KH"
  )
    .charAt(0)
    .toUpperCase();

  // Order notes
  const orderNotesSection = document.getElementById("orderNotesSection");
  const detailOrderNotes = document.getElementById("detailOrderNotes");
  if (order.notes && order.notes.trim()) {
    orderNotesSection.style.display = "block";
    detailOrderNotes.textContent = order.notes;
  } else {
    orderNotesSection.style.display = "none";
  }

  // Order items
  const orderItemsBody = document.getElementById("detailOrderItems");
  if (order.invoiceDetails && order.invoiceDetails.length > 0) {
    orderItemsBody.innerHTML = order.invoiceDetails
      .map(
        (item) => `
            <tr>
                <td>${item.productName || "N/A"}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(item.quantity * item.price)}</td>
            </tr>
        `
      )
      .join("");
  } else {
    orderItemsBody.innerHTML =
      '<tr><td colspan="4">Không có sản phẩm</td></tr>';
  }

  // Totals
  document.getElementById("detailSubTotal").textContent = formatCurrency(
    order.totalAmount
  );
  document.getElementById("detailTotalAmount").textContent = formatCurrency(
    order.totalAmount
  );
}

// Close Order Detail Modal
function closeOrderDetail() {
  document.getElementById("orderDetailModal").style.display = "none";
  selectedOrderForDetail = null;
}

// Print Invoice
function printInvoice() {
  if (!selectedOrderForDetail) return;

  // Implementation for printing invoice
  console.log("Printing invoice for order:", selectedOrderForDetail);
  showNotification("Chức năng in hóa đơn sẽ được cập nhật", "info");
}

// Edit Order
function editOrder() {
  if (!selectedOrderForDetail) return;

  // Implementation for editing order
  console.log("Editing order:", selectedOrderForDetail);
  showNotification("Chi Quan Ly Moi Duoc Chinh Sua", "info");
}

// Pagination Functions
function updatePagination() {
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const pagination = document.getElementById("ordersPagination");
  const currentPageSpan = document.getElementById("currentOrdersPage");
  const totalPagesSpan = document.getElementById("totalOrdersPages");
  const prevBtn = document.getElementById("prevOrdersPage");
  const nextBtn = document.getElementById("nextOrdersPage");

  if (totalPages <= 1) {
    pagination.style.display = "none";
    return;
  }

  pagination.style.display = "flex";
  currentPageSpan.textContent = currentOrderPage;
  totalPagesSpan.textContent = totalPages;

  prevBtn.disabled = currentOrderPage <= 1;
  nextBtn.disabled = currentOrderPage >= totalPages;
}

function changeOrdersPage(direction) {
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  if (direction === -1 && currentOrderPage > 1) {
    currentOrderPage--;
  } else if (direction === 1 && currentOrderPage < totalPages) {
    currentOrderPage++;
  }

  displayOrders();
}

// Show/Hide Loading State
function showOrdersLoading(show) {
  const loading = document.getElementById("ordersLoading");
  const tableContainer = document.getElementById("ordersTableContainer");

  if (show) {
    loading.style.display = "flex";
    tableContainer.style.display = "none";
  } else {
    loading.style.display = "none";
  }
}

// Utility Functions for Orders
function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount) {
  if (!amount) return "0 VND";
  return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
}

function getStatusDisplayName(status) {
  const statusMap = {
    pending: "Chờ xử lý",
    paid: "Hoàn thành",
    cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
}

function getPaymentDisplayName(payment) {
  const paymentMap = {
    "Tiền mặt": "Tiền mặt",
    "Thẻ tín dụng": "Thẻ",
    "Chuyên khoản": "Chuyển khoản",
  };
  return paymentMap[payment] || payment;
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
  const orderListContainer = document.getElementById("orderListContainer");
  const scheduleContainer = document.getElementById("scheduleContainer");
  const mainEditCustomerSection = document.getElementById(
    "mainEditCustomerSection"
  );
  const medicineInfoContainer = document.getElementById(
    "medicineInfoContainer"
  );

  if (customerContainer) customerContainer.style.display = "none";
  if (createOrderForm) createOrderForm.style.display = "none";
  if (orderListContainer) orderListContainer.style.display = "none";
  if (scheduleContainer) scheduleContainer.style.display = "none";
  if (mainEditCustomerSection) mainEditCustomerSection.style.display = "none";
  if (medicineInfoContainer) medicineInfoContainer.style.display = "none";
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

function resetCustomerSectionStates() {
  // Reset all customer section states
  const customersList = document.querySelector(".customers-list");
  const createCustomerForm = document.getElementById("createCustomerForm");
  const customerDetailView = document.getElementById("customerDetailView");
  const editCustomerInfo = document.getElementById("editCustomerInfo");

  if (customersList) {
    customersList.classList.remove("shrink", "hide");
  }

  if (createCustomerForm) {
    createCustomerForm.classList.remove("active");
  }

  if (customerDetailView) {
    customerDetailView.classList.remove("active");
  }

  if (editCustomerInfo) {
    editCustomerInfo.classList.remove("active");
  }
}

// Customer Management Functions (updated)
function openAddCustomerForm() {
  if (currentSection !== "customers") {
    showCustomerSection();
  }

  // Close other customer forms
  document.getElementById("customerDetailView").classList.remove("active");
  document.getElementById("editCustomerInfo").classList.remove("active");

  // Show create form and shrink customer list
  const customersList = document.querySelector(".customers-list");
  if (customersList) {
    customersList.classList.add("shrink");
  }
  document.getElementById("createCustomerForm").classList.add("active");

  // Clear form
  const customerForm = document.getElementById("customerForm");
  if (customerForm) {
    customerForm.reset();
  }
}

function closeAddCustomerForm() {
  const customersList = document.querySelector(".customers-list");
  if (customersList) {
    customersList.classList.remove("shrink");
  }
  document.getElementById("createCustomerForm").classList.remove("active");

  const customerForm = document.getElementById("customerForm");
  if (customerForm) {
    customerForm.reset();
  }
}

function openCustomerDetails() {
  if (currentSection !== "customers") {
    showCustomerSection();
  }

  document.getElementById("createCustomerForm").classList.remove("active");
  document.getElementById("editCustomerInfo").classList.remove("active");
  const customersList = document.querySelector(".customers-list");
  if (customersList) {
    customersList.classList.add("shrink");
  }
  document.getElementById("customerDetailView").classList.add("active");
}

function closeCustomerDetails() {
  document.getElementById("customerDetailView").classList.remove("active");
  const customersList = document.querySelector(".customers-list");
  if (customersList) {
    customersList.classList.remove("shrink");
  }
}

function openEditCustomerInfoForm() {
  openMainEditCustomer(); // Use the new main edit form instead
}

function closeEditCustomerForm() {
  document.getElementById("editCustomerInfo").classList.remove("active");
  const customersList = document.querySelector(".customers-list");
  if (customersList) {
    customersList.classList.remove("hide", "shrink");
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
    console.log("Fetching customers...");
    const response = await fetch(
      "http://localhost:8080/employee/danh-sach-khach-hang",
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    customers = await response.json();
    console.log("Received customers:", customers);
    displayCustomers(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
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

    // Format ngày tạo
    const createdDate = customer.createdDate
      ? new Date(customer.createdDate).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "N/A";

    customerItem.innerHTML = `
            <div class="customer-avatar">${initials}</div>
            <div class="customer-info">
                <h4>${customer.fullName}</h4>
                <p>${customer.phone || "N/A"} ${
      customer.email ? " • " + customer.email : ""
    }</p>
            </div>
            <div class="customer-meta">
                <div class="customer-points">${
                  customer.totalPoints || 0
                } điểm</div>
                <div class="customer-date">${createdDate}</div>
            </div>
        `;

    customerItem.addEventListener("click", () => showCustomerDetails(customer));
    customerListContainer.appendChild(customerItem);
  });
}

// hiển thị chi tiết thông tin khách hàng khi mình click vao khach hàng bat kì
function showCustomerDetails(customer) {
  currentCustomer = customer;

  // Populate customer details
  document.getElementById("detailFullName").textContent =
    customer.fullName || "N/A";
  document.getElementById("detailPhone").textContent = customer.phone || "N/A";
  document.getElementById("detailEmail").textContent = customer.email || "N/A";
  document.getElementById("detailGender").textContent =
    customer.gender || "Không xác định";
  document.getElementById("detailDateOfBirth").textContent =
    formatDate(customer.dateOfBirth) || "N/A";
  document.getElementById("detailMedicalHistory").textContent =
    customer.medicalHistory || "Không có";
  document.getElementById("detailAllergies").textContent =
    customer.allergies || "Không có";
  document.getElementById("detailTotalPoints").textContent =
    customer.totalPoints || 0;
  document.getElementById("detailCreatedDate").textContent = formatDate(
    customer.createdDate
  );

  openCustomerDetails();
}

// Event Handlers
async function handleAddCustomer(event) {
  event.preventDefault();

  const formData = {
    fullName: document.getElementById("fullName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    gender: document.getElementById("gender").value,
    dateOfBirth: document.getElementById("dateOfBirth").value,
    medicalHistory: document.getElementById("medicalHistory").value.trim(),
    allergies: document.getElementById("allergies").value.trim(),
  };

  try {
    const response = await fetch(
      "http://localhost:8080/employee/tao-moi-khach-hang",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      }
    );

    if (response.ok) {
      console.log("Customer added successfully");
      closeAddCustomerForm();
      fetchCustomers(); // Refresh the customer list
      showNotification("Thêm khách hàng thành công!", "success");
    } else {
      throw new Error("Failed to add customer");
    }
  } catch (error) {
    console.error("Error adding customer:", error);
    showNotification("Lỗi khi thêm khách hàng: " + error.message, "error");
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
  console.log("Opening main edit customer form"); // Debug log

  if (!currentCustomer) {
    console.error("No current customer selected");
    showNotification("Vui lòng chọn khách hàng trước", "error");
    return;
  }

  // Chèn data vào các ô thông tin của khách hàng
  populateMainEditForm(currentCustomer);

  // Show main edit section
  const mainEditSection = document.getElementById("mainEditCustomerSection");
  if (mainEditSection) {
    mainEditSection.style.display = "flex"; // Thay đổi từ classList.add("active")
    mainEditSection.classList.add("active");
    console.log("Đã hiển thị form để chỉnh sửa khách hàng!");
  } else {
    console.error("Hiển thị form chỉnh sủa bị lỗi!!");
  }

  // Close other forms
  closeCustomerDetails();
  closeEditCustomerForm();
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

// Form validation functions

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

// Handle main edit form submission

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

// Setup main edit form
function setupMainEditForm() {
  const mainEditForm = document.getElementById("mainEditCustomerForm");
  if (mainEditForm) {
    mainEditForm.addEventListener("submit", handleMainEditCustomer);
  }
}

// Populate main edit form with current customer data
function populateMainEditForm(customer) {
  if (!customer) return;

  // Populate form fields
  const fullNameInput = document.getElementById("mainEditFullName");
  const phoneInput = document.getElementById("mainEditPhone");
  const emailInput = document.getElementById("mainEditEmail");
  const genderInput = document.getElementById("mainEditGender");
  const dateOfBirthInput = document.getElementById("mainEditDateOfBirth");
  const medicalHistoryInput = document.getElementById("mainEditMedicalHistory");
  const allergiesInput = document.getElementById("mainEditAllergies");
  const totalPointsInput = document.getElementById("mainEditTotalPoints");

  if (fullNameInput) fullNameInput.value = customer.fullName || "";
  if (phoneInput) phoneInput.value = customer.phone || "";
  if (emailInput) emailInput.value = customer.email || "";
  if (genderInput) genderInput.value = customer.gender || "";
  if (dateOfBirthInput) dateOfBirthInput.value = customer.dateOfBirth || "";
  if (medicalHistoryInput)
    medicalHistoryInput.value = customer.medicalHistory || "";
  if (allergiesInput) allergiesInput.value = customer.allergies || "";
  if (totalPointsInput) totalPointsInput.value = customer.totalPoints || 0;

  // Update preview
  updateCustomerPreview(customer);
}

// Update customer preview in edit form
function updateCustomerPreview(customer) {
  const previewName = document.getElementById("previewName");
  const previewPhone = document.getElementById("previewPhone");
  const previewAvatar = document.getElementById("previewAvatar");

  if (previewName)
    previewName.textContent = customer.fullName || "Tên khách hàng";
  if (previewPhone)
    previewPhone.textContent = customer.phone || "Số điện thoại";

  if (previewAvatar && customer.fullName) {
    const initials = customer.fullName
      .split(" ")
      .map((word) => word.charAt(0))
      .slice(-2)
      .join("")
      .toUpperCase();
    previewAvatar.textContent = initials;
  }
}

// Handle main edit form submission
async function handleMainEditCustomer(event) {
  event.preventDefault();

  if (!currentCustomer) {
    showNotification("Không tìm thấy thông tin khách hàng", "error");
    return;
  }

  // Clear previous errors
  clearFormErrors();

  // Get form data
  const formData = {
    id: currentCustomer.customerId,
    fullName: document.getElementById("mainEditFullName").value.trim(),
    phone: document.getElementById("mainEditPhone").value.trim(),
    email: document.getElementById("mainEditEmail").value.trim(),
    gender: document.getElementById("mainEditGender").value,
    dateOfBirth: document.getElementById("mainEditDateOfBirth").value,
    medicalHistory: document
      .getElementById("mainEditMedicalHistory")
      .value.trim(),
    allergies: document.getElementById("mainEditAllergies").value.trim(),
  };

  // Validate form data
  const errors = validateMainEditForm(formData);
  if (Object.keys(errors).length > 0) {
    showFormErrors(errors);
    return;
  }

  try {
    // Show loading state
    const submitBtn = document.querySelector(
      "#mainEditCustomerForm button[type='submit']"
    );
    const originalText = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Đang xử lý...";
    }

    // Send update request to backend
    const response = await fetch(
      `http://localhost:8080/employee/cap-nhat-khach-hang/${formData.id}`,
      {
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
          allergies: formData.allergies,
        }),
      }
    );
    if (response.ok) {
      const updatedCustomer = await response.json();

      // Update current customer data
      currentCustomer = { ...currentCustomer, ...updatedCustomer };

      // Update customers array
      const customerIndex = customers.findIndex(
        (c) =>
          c.customerID === currentCustomer.customerID ||
          c.id === currentCustomer.id
      );
      if (customerIndex !== -1) {
        customers[customerIndex] = currentCustomer;
      }

      // Refresh UI
      fetchCustomers();
      displayCustomers(customers);
      showCustomerDetails(currentCustomer);
      closeMainEditCustomer();

      showNotification("Cập nhật thông tin khách hàng thành công!", "success");
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Số điện thoại hoặc email đã tồn tại! Vui lòng kiểm tra lại.`
      );
    }
  } catch (error) {
    console.error("Error updating customer:", error);
    showNotification(
      "Số điện thoại hoặc email đã tồn tại! Vui lòng kiểm tra lại.",
      "error"
    );
  } finally {
    // Reset button state
    const submitBtn = document.querySelector(
      "#mainEditCustomerForm button[type='submit']"
    );
    submitBtn.disabled = false;
    submitBtn.textContent = "Lưu thay đổi";
  }
}

// Validate main edit form
function validateMainEditForm(formData) {
  const errors = {};

  // Validate full name
  if (!formData.fullName) {
    errors.fullName = "Tên khách hàng không được để trống";
  } else if (formData.fullName.length < 2) {
    errors.fullName = "Tên khách hàng phải có ít nhất 2 ký tự";
  } else if (formData.fullName.length > 100) {
    errors.fullName = "Tên khách hàng không được vượt quá 100 ký tự";
  }

  // Validate phone
  if (!formData.phone) {
    errors.phone = "Số điện thoại không được để trống";
  } else if (!/^[0-9]{10,11}$/.test(formData.phone)) {
    errors.phone = "Số điện thoại phải có 10-11 chữ số";
  }

  // Validate email (optional but must be valid if provided)
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Email không hợp lệ";
  }

  // Validate date of birth (optional but must be valid if provided)
  if (formData.dateOfBirth) {
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    if (birthDate >= today) {
      errors.dateOfBirth = "Ngày sinh phải nhỏ hơn ngày hiện tại";
    }
  }

  // Validate medical history (optional, max length check)
  if (formData.medicalHistory && formData.medicalHistory.length > 1000) {
    errors.medicalHistory = "Tiền sử bệnh lý không được vượt quá 1000 ký tự";
  }

  // Validate allergies (optional, max length check)
  if (formData.allergies && formData.allergies.length > 500) {
    errors.allergies = "Thông tin dị ứng không được vượt quá 500 ký tự";
  }

  return errors;
}

// Show Create Order Form
function showCreateOrderForm() {
  // Hide other sections first
  hideAllSections();
  currentSection = "create-order";

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

  // Clear order notes
  const orderNotesField = document.getElementById("orderNotes");
  if (orderNotesField) {
    orderNotesField.value = "";
  }

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
  const filteredCustomers = customers.filter(
    (customer) =>
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

  resultsContainer.innerHTML = customerList
    .map((customer) => {
      const initials = customer.fullName
        .split(" ")
        .map((word) => word.charAt(0))
        .slice(-2)
        .join("")
        .toUpperCase();

      // Kiểm tra các field ID có thể có
      const customerId =
        customer.id ||
        customer.customerId ||
        customer.customerID ||
        customer.userId;
      console.log("Customer data for search:", customer); // Debug log
      console.log("Customer ID found:", customerId); // Debug log

      return `
            <div class="customer-result-item" onclick="selectCustomerForOrder(${customerId}, '${
        customer.fullName
      }', '${customer.phone}', ${customer.totalPoints || 0})">
                <div class="customer-avatar">${initials}</div>
                <div class="customer-info">
                    <h6>${customer.fullName}</h6>
                    <p>${customer.phone} • Điểm: ${
        customer.totalPoints || 0
      }</p>
                </div>
            </div>
        `;
    })
    .join("");

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
    totalPoints: totalPoints,
  };

  console.log("selectedCustomerForOrder object:", selectedCustomerForOrder);

  // Update selected customer display
  const initials = fullName
    .split(" ")
    .map((word) => word.charAt(0))
    .slice(-2)
    .join("")
    .toUpperCase();

  document.getElementById("selectedCustomerAvatar").textContent = initials;
  document.getElementById("selectedCustomerName").textContent = fullName;
  document.getElementById("selectedCustomerPhone").textContent = phone;
  document.getElementById("selectedCustomerPoints").textContent = `Điểm: ${
    totalPoints || 0
  }`;

  // Show selected customer and hide search results
  document.getElementById("selectedCustomer").style.display = "flex";
  document.getElementById("customerSearchResults").style.display = "none";
  document.getElementById("orderCustomerSearch").value = "";

  // Hide customer search elements
  hideCustomerSearchElements();
}

// Hide Customer Search Elements when a customer is selected
function hideCustomerSearchElements() {
  const customerSearchContainer = document.querySelector(
    ".customer-search-container"
  );

  if (customerSearchContainer) {
    customerSearchContainer.style.display = "none";
  }
}

// Show Customer Search Elements when customer is removed
function showCustomerSearchElements() {
  const customerSearchContainer = document.querySelector(
    ".customer-search-container"
  );

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

  const item = orderItems.find((item) => item.id === productId);
  if (item) {
    item.quantity = newQuantity;
    item.total = item.quantity * item.price;
    updateOrderSummary();
  }
}

// Remove Product from Order (renamed from Medicine)
function removeProductFromOrder(productId) {
  orderItems = orderItems.filter((item) => item.id !== productId);
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
    orderItemsList.innerHTML = orderItems
      .map(
        (item) => `
            <div class="order-item">
                <div class="order-item-info">
                    <h6>${item.name}</h6>
                    <p>${formatCurrency(item.price)} x ${item.quantity}</p>
                </div>
                <div class="order-item-controls">
                    <button class="quantity-btn" onclick="updateProductQuantity(${
                      item.id
                    }, ${item.quantity - 1})">
                        <span class="material-icons" style="font-size: 14px;">remove</span>
                    </button>
                    <input type="number" class="quantity-input" value="${
                      item.quantity
                    }" 
                           onchange="updateProductQuantity(${
                             item.id
                           }, parseInt(this.value) || 0)" min="1">
                    <button class="quantity-btn" onclick="updateProductQuantity(${
                      item.id
                    }, ${item.quantity + 1})">
                        <span class="material-icons" style="font-size: 14px;">add</span>
                    </button>
                    <button class="remove-item-btn" onclick="removeProductFromOrder(${
                      item.id
                    })">
                        <span class="material-icons" style="font-size: 14px;">delete</span>
                    </button>
                </div>
                <div class="order-item-total">
                    ${formatCurrency(item.total)}
                </div>
            </div>
        `
      )
      .join("");

    orderTotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  }

  // Update totals
  document.getElementById("orderSubtotal").textContent =
    formatCurrency(orderTotal);
  document.getElementById("orderTotal").textContent =
    formatCurrency(orderTotal);
}

// Format Currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
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
    email: document.getElementById("quickEmail").value.trim(),
  };

  try {
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Đang thêm...";

    // Send request to backend
    const response = await fetch(
      "http://localhost:8080/employee/tao-moi-khach-hang",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    if (response.ok) {
      const newCustomer = await response.json();
      console.log("New customer created:", newCustomer); // Debug log

      // Add to customers array
      customers.push(newCustomer);

      // Determine customer ID field
      const customerId =
        newCustomer.id ||
        newCustomer.customerId ||
        newCustomer.customerID ||
        newCustomer.userId;
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

  // Cảnh báo nếu không chọn khách hàng nhưng vẫn cho phép tiếp tục
  if (!selectedCustomerForOrder) {
    const continueWithoutCustomer = confirm(
      "Bạn chưa chọn khách hàng cho đơn hàng này.\n\n" +
        "Đơn hàng sẽ được tạo như đơn hàng khách vãng lai.\n" +
        "Bạn có muốn tiếp tục không?"
    );

    if (!continueWithoutCustomer) {
      return;
    }
  }

  const paymentMethod =
    document.querySelector('input[name="paymentMethod"]:checked')?.value ||
    "Tiền Mặt";
  const orderNotes = document.getElementById("orderNotes")?.value?.trim() || "";

  // Debug log để kiểm tra selectedCustomerForOrder
  console.log("=== DEBUG CREATE ORDER ===");
  console.log("selectedCustomerForOrder:", selectedCustomerForOrder);
  console.log("selectedCustomerForOrder.id:", selectedCustomerForOrder?.id);
  console.log("getCurrentUserId():", getCurrentUserId());
  console.log("orderItems:", orderItems);
  console.log("orderNotes:", orderNotes);
  console.log("=========================");

  // Xử lý customerId - nếu không có khách hàng được chọn thì set null
  const customerId = selectedCustomerForOrder
    ? selectedCustomerForOrder.id
    : null;

  console.log("Final customerId being sent:", customerId);
  if (customerId === null) {
    console.log("⚠️  Tạo đơn hàng khách vãng lai (không có khách hàng)");
  } else {
    console.log(
      "✅  Tạo đơn hàng cho khách hàng:",
      selectedCustomerForOrder.fullName
    );
  }

  // Prepare order data for backend
  const orderData = {
    employeeId: getCurrentUserId(),
    customerId: customerId,
    orderItems: orderItems.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
      unitPrice: item.price,
    })),
    totalAmount: orderTotal,
    paymentMethod: paymentMethod,
    status: "paid", // Trạng thái pending cho invoice
    invoiceDate: new Date().toISOString(),
    notes: orderNotes, // Thêm ghi chú đơn hàng
  };

  try {
    // Show loading state
    const createBtn = document.querySelector(".create-order-btn");
    const originalText = createBtn.innerHTML;
    createBtn.disabled = true;
    createBtn.innerHTML =
      '<span class="material-icons">refresh</span> Đang tạo...';

    // Log order data for debugging
    console.log("Sending order data to backend:", orderData);

    // Send to backend
    const response = await fetch(
      "http://localhost:8080/employee/tao-don-hang",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      }
    );

    if (response.ok) {
      const result = await response.json();

      if (result.status === "success") {
        console.log("Order created successfully:", result);
        showNotification("Tạo đơn hàng và thanh toán thành công!", "success");
        closeCreateOrderForm();
        // Ask if user wants to print receipt
        setTimeout(() => {
          if (
            confirm(
              "Đơn hàng đã được tạo thành công! Bạn có muốn in hóa đơn không?"
            )
          ) {
            printReceipt(result);
          }
        }, 1000);
      } else {
        showNotification(
          "Tạo đơn hàng thành công! Chuyển đến trang thanh toán ",
          "success"
        );
        console.log("Redirecting to checkout URL:", result);
        window.location.href = result.response.checkoutUrl;
      }
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
    const createBtn = document.querySelector(".create-order-btn");
    if (createBtn) {
      createBtn.disabled = false;
      createBtn.innerHTML =
        '<span class="material-icons">add_shopping_cart</span> Tạo đơn hàng';
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
    console.log("Fetching products...");
    const response = await fetch(
      "http://localhost:8080/employee/danh-sach-san-pham",
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    products = await response.json();
    filteredProducts = [...products]; // Copy all products initially
    console.log("Received products:", products);
    displayProducts(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    console.log("Using sample products as fallback");
    displaySampleProducts();
    showNotification(
      "Đang sử dụng dữ liệu mẫu - Không thể kết nối API",
      "info"
    );
  }
}

function displayProducts(productList) {
  const productListContainer = document.getElementById("medicineSearchResults");
  if (!productListContainer) {
    console.error("Medicine search results container not found!");
    return;
  }

  // Clear existing static content but keep structure
  productListContainer.innerHTML = "";

  if (productList.length === 0) {
    productListContainer.innerHTML = `
            <div class="no-products" style="text-align: center; padding: 20px; color: #718096;">
                <span class="material-icons">inventory_2</span>
                <p>Không có sản phẩm nào</p>
            </div>
        `;
    return;
  }

  productList.forEach((product) => {
    const productItem = document.createElement("div");
    productItem.className = "medicine-item";

    productItem.innerHTML = `
            <div class="medicine-info">
                <h6>${product.productName}</h6>
                <p>${product.description || product.productType}</p>
                <span class="medicine-price">${formatCurrency(
                  product.price
                )}</span>
            </div>
            <button class="add-medicine-btn" onclick="addProductToOrder(${
              product.productId
            }, '${product.productName}', ${product.price})">
                <span class="material-icons">add</span>
            </button>
        `;

    productListContainer.appendChild(productItem);
  });
}
// lay so luong san pham trong kho
async function fetchInventory() {
  try {
    console.log("Fetching inventory...");
    const response = await fetch("http://localhost:8080/employee/inventory", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    inventory = await response.json();
    console.log("Received inventory:", inventory);
    //displayInventory(inventory)
  } catch (error) {
    console.error("Error fetching customers:", error);
  }
}

function searchProducts(searchTerm) {
  console.log("Searching products with term:", searchTerm);
  console.log("Current products array:", products);

  if (!searchTerm) {
    filteredProducts = [...products];
  } else {
    filteredProducts = products.filter(
      (product) =>
        product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description &&
          product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }
  console.log("Filtered products:", filteredProducts);
  displayProducts(filteredProducts);
}

function filterProductsByType(productType) {
  if (!productType || productType === "all") {
    filteredProducts = [...products];
  } else {
    filteredProducts = products.filter(
      (product) =>
        product.productType.toLowerCase() === productType.toLowerCase()
    );
  }
  displayProducts(filteredProducts);
}

function addProductToOrder(productId, productName, price) {
  // Check if product already exists in order
  const existingItem = orderItems.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
    existingItem.total = existingItem.quantity * existingItem.price;
  } else {
    orderItems.push({
      id: productId,
      name: productName,
      price: price,
      quantity: 1,
      total: price,
    });
  }

  updateOrderSummary();
  showNotification(`Đã thêm ${productName} vào đơn hàng`, "success");
}

// Employee Information Functions
async function fetchEmployeeInfo(employeeId) {
  try {
    console.log(`Fetching employee info for ID: ${employeeId}`);

    const response = await fetch(
      `http://localhost:8080/employee/thong-tin-nhan-vien/${employeeId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const employeeInfo = await response.json();
    console.log("Employee info received:", employeeInfo);

    return employeeInfo;
  } catch (error) {
    console.error("Error fetching employee info:", error);
    showNotification(
      "Lỗi khi lấy thông tin nhân viên: " + error.message,
      "error"
    );
    return null;
  }
}

// Fetch employee work history
async function fetchEmployeeWorkHistory(userId) {
  try {
    const response = await fetch(
      `http://localhost:8080/employee/lich-su-cong-tac/${userId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );
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
      .map((word) => word.charAt(0))
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
    year: "numeric",
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
    assignedDate: new Date(),
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
      fetchEmployeeWorkHistory(userId),
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
    .map((word) => word.charAt(0))
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
                    <span class="detail-value">${
                      employeeInfo.pharmacyName
                    }</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Ngày vào làm:</span>
                    <span class="detail-value">${formatEmployeeDate(
                      employeeInfo.assignedDate
                    )}</span>
                </div>
            </div>
            <div class="work-history-section">
                <h4 style="margin:24px 0 8px 0; color:#4facfe; font-size:16px;">Lịch sử công tác</h4>
                <div class="work-history-list">
                    ${
                      workHistory && workHistory.length > 0
                        ? workHistory
                            .map(
                              (item) => `
                        <div class="work-history-item">
                            <span class="work-pharmacy">${
                              item.pharmacyName
                            }</span>
                            <span class="work-date">${formatEmployeeDate(
                              item.startDate
                            )} - ${
                                item.endDate
                                  ? formatEmployeeDate(item.endDate)
                                  : "Hiện tại"
                              }</span>
                        </div>
                    `
                            )
                            .join("")
                        : `<div style='color:#718096;'>Chưa có lịch sử công tác</div>`
                    }
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
    const response = await fetch(
      `http://localhost:8080/employee/doi-mat-khau`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          currentPassword: currentPassword,
          newPassword: newPassword,
        }),
      }
    );

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

// ====================== MEDICINE INFO MANAGEMENT ======================

// Medicine Info Variables
let allMedicines = [];
let filteredMedicines = [];
let currentMedicinePage = 1;
let medicinesPerPage = 12;

// Show Medicine Info Section
function showMedicineInfoSection() {
  hideAllSections();
  currentSection = "medicine-info";

  const medicineInfoContainer = document.getElementById(
    "medicineInfoContainer"
  );
  if (medicineInfoContainer) {
    medicineInfoContainer.style.display = "block";
  }
  //fetchInventory();
  //Load medicine info when showing the section
  loadMedicineInfo();
  setupMedicineFilters();
}

// Load Medicine Info from Backend

async function loadMedicineInfo() {
  try {
    showMedicineLoading(true);

    // Fetch products and inventory data
    const [productsResponse, inventoryResponse] = await Promise.all([
      fetch("http://localhost:8080/employee/danh-sach-san-pham", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }),
      fetch("http://localhost:8080/employee/inventory", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }),
    ]);
    // const productsResponse=products;
    // const inventoryResponse = await fetch("http://localhost:8080/employee/inventory", {
    //     method: "GET",
    //     headers: {
    //         "Content-Type": "application/json",
    //     },
    // });

    if (inventoryResponse.ok) {
      inventory = await inventoryResponse.json();
      products = await productsResponse.json(); // Assuming productsResponse is already an array
      console.log("Products:", products);
      console.log("Inventory:", inventory);
      medicine = products;
      // Map inventory data to products
      const medicinesWithInventory = products.map((product) => {
        const inventoryItem = inventory.find(
          (inv) => inv.productId === product.id
        );
        return {
          ...product,
          quantity: inventoryItem ? inventoryItem.number : 0,
        };
      });

      allMedicines = medicinesWithInventory;
      filteredMedicines = [...medicinesWithInventory];

      displayMedicines();
    } else {
      throw new Error(
        `HTTP Error: ${productsResponse.status} or ${inventoryResponse.status}`
      );
    }
  } catch (error) {
    console.error("Error loading medicine info:", error);
    showNotification("Lỗi khi tải thông tin thuốc: " + error.message, "error");
  } finally {
    showMedicineLoading(false);
  }
}

// Display Medicines in Grid
function displayMedicines() {
  const medicineGrid = document.getElementById("medicineGrid");
  const medicineEmpty = document.getElementById("medicineEmpty");

  if (filteredMedicines.length === 0) {
    medicineEmpty.style.display = "flex";
    medicineGrid.style.display = "none";
    return;
  }

  medicineEmpty.style.display = "none";
  medicineGrid.style.display = "grid";

  // Calculate pagination
  const startIndex = (currentMedicinePage - 1) * medicinesPerPage;
  const endIndex = startIndex + medicinesPerPage;
  const medicinesToShow = filteredMedicines.slice(startIndex, endIndex);

  medicineGrid.innerHTML = medicinesToShow
    .map((medicine) => {
      const stockStatus = getStockStatus(inventory.number);

      return `
            <div class="medicine-card">
                <div class="medicine-card-header">
                    <div class="medicine-icon">
                        <span class="material-icons">medication</span>
                    </div>
                    <div class="stock-status ${stockStatus.class}">
                        ${stockStatus.text}
                    </div>
                </div>
                <div class="medicine-name">${
                  medicine.productName || "Tên thuốc"
                }</div>
                <div class="medicine-id">ID: ${medicine.productType}</div>
                <div class="medicine-details">
                    <div class="medicine-price">
                        ${formatCurrency(medicine.price || 0)}
                    </div>
                    <div class="medicine-quantity">
                        <span class="material-icons">inventory</span>
                        <span class="quantity-number">${inventory.number}</span>
                    </div>
                </div>
            </div>
        `;
    })
    .join("");

  updateMedicinePagination();
}

// Get Stock Status
function getStockStatus(quantity) {
  if (quantity === 0) {
    return { class: "out-of-stock", text: "Hết hàng" };
  } else if (quantity <= 10) {
    return { class: "low-stock", text: "Sắp hết" };
  } else {
    return { class: "in-stock", text: "Còn hàng" };
  }
}

// Setup Medicine Filters
function setupMedicineFilters() {
  const stockFilter = document.getElementById("stockStatusFilter");
  const searchInput = document.getElementById("medicineSearchInput");

  if (stockFilter) {
    stockFilter.addEventListener("change", filterMedicines);
  }

  if (searchInput) {
    searchInput.addEventListener("input", filterMedicines);
  }
}

// Filter Medicines
function filterMedicines() {
  const stockFilter = document.getElementById("stockStatusFilter").value;
  const searchTerm = document
    .getElementById("medicineSearchInput")
    .value.toLowerCase();

  filteredMedicines = allMedicines.filter((medicine) => {
    // Stock filter
    if (stockFilter !== "all") {
      const stockStatus = getStockStatus(inventory.number);
      if (stockFilter === "in-stock" && stockStatus.class !== "in-stock")
        return false;
      if (stockFilter === "low-stock" && stockStatus.class !== "low-stock")
        return false;
      if (
        stockFilter === "out-of-stock" &&
        stockStatus.class !== "out-of-stock"
      )
        return false;
    }

    // Search filter
    if (searchTerm) {
      const nameMatch = (medicine.productName || "")
        .toLowerCase()
        .includes(searchTerm);
      const idMatch = medicine.productType.toString().includes(searchTerm);

      if (!nameMatch && !idMatch) return false;
    }

    return true;
  });

  currentMedicinePage = 1;
  displayMedicines();
}

// Refresh Medicine Info
function refreshMedicineInfo() {
  showNotification("Đang làm mới thông tin thuốc...", "info");
  loadMedicineInfo();
}

// Medicine Pagination Functions
function updateMedicinePagination() {
  const totalPages = Math.ceil(filteredMedicines.length / medicinesPerPage);
  const pagination = document.getElementById("medicinePagination");
  const currentPageSpan = document.getElementById("currentMedicinePage");
  const totalPagesSpan = document.getElementById("totalMedicinePages");
  const prevBtn = document.getElementById("prevMedicinePage");
  const nextBtn = document.getElementById("nextMedicinePage");

  if (totalPages <= 1) {
    pagination.style.display = "none";
    return;
  }

  pagination.style.display = "flex";
  currentPageSpan.textContent = currentMedicinePage;
  totalPagesSpan.textContent = totalPages;

  prevBtn.disabled = currentMedicinePage <= 1;
  nextBtn.disabled = currentMedicinePage >= totalPages;
}

function changeMedicinePage(direction) {
  const totalPages = Math.ceil(filteredMedicines.length / medicinesPerPage);

  if (direction === -1 && currentMedicinePage > 1) {
    currentMedicinePage--;
  } else if (direction === 1 && currentMedicinePage < totalPages) {
    currentMedicinePage++;
  }

  displayMedicines();
}

// Show/Hide Medicine Loading State
function showMedicineLoading(show) {
  const loading = document.getElementById("medicineLoading");
  const grid = document.getElementById("medicineGrid");

  if (show) {
    loading.style.display = "flex";
    grid.style.display = "none";
  } else {
    loading.style.display = "none";
  }
}

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
  setupUserProfileDropdown();
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

async function loadSchedules(month = null, year = null) {
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

    // Xác định tháng/năm cần hiển thị
    const today = new Date();
    const currentMonth = month !== null ? month : today.getMonth();
    const currentYear = year !== null ? year : today.getFullYear();

    // Hiển thị tên tháng/năm
    const monthNames = [
      "Tháng 1",
      "Tháng 2",
      "Tháng 3",
      "Tháng 4",
      "Tháng 5",
      "Tháng 6",
      "Tháng 7",
      "Tháng 8",
      "Tháng 9",
      "Tháng 10",
      "Tháng 11",
      "Tháng 12",
    ];
    const currentMonthYearElem = document.getElementById("currentMonthYear");
    if (currentMonthYearElem) {
      currentMonthYearElem.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }

    // Số ngày trong tháng
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // Ngày đầu tháng là thứ mấy (0 = CN, 1 = T2, ...)
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

    // Tạo grid calendar
    let calendarHtml = "";

    // Số ô (cell) cần hiển thị: có thể dư sang tuần tiếp theo nên là 42 ô (6 dòng x 7 ngày)
    let dayCounter = 1;
    for (let cell = 0; cell < 42; cell++) {
      let cellDate = "";
      let cellClass = "calendar-day";
      let isToday = false;
      let shiftHtml = "";

      if (cell >= firstDayOfWeek && dayCounter <= daysInMonth) {
        // Định dạng yyyy-mm-dd cho ngày
        cellDate = `${currentYear}-${(currentMonth + 1)
          .toString()
          .padStart(2, "0")}-${dayCounter.toString().padStart(2, "0")}`;
        // Lấy lịch làm việc của ngày này
        const daySchedules = schedules.filter((s) => s.date === cellDate);

        // Xác định có phải hôm nay không
        const now = new Date();
        if (
          dayCounter === now.getDate() &&
          currentMonth === now.getMonth() &&
          currentYear === now.getFullYear()
        ) {
          cellClass += " today";
          isToday = true;
        }
        if (daySchedules.length > 0) {
          cellClass += " has-schedule";
          shiftHtml =
            `<div class="day-schedules">` +
            daySchedules
              .map(
                (s) =>
                  `<div class="schedule-item">
                ${s.fullName} (${formatTime(s.startTime)} - ${formatTime(
                    s.endTime
                  )})
              </div>`
              )
              .join("") +
            `</div>`;
        }
        // Nội dung chính của ngày
        calendarHtml += `<div class="${cellClass}">
          <div class="day-number">${dayCounter}</div>
          ${shiftHtml}
        </div>`;
        dayCounter++;
      } else {
        // Ô trống hoặc ngày ngoài tháng
        calendarHtml += `<div class="calendar-day other-month"></div>`;
      }
    }

    const calendarGrid = document.getElementById("calendarGrid");
    if (calendarGrid) {
      calendarGrid.innerHTML = calendarHtml;
    } else {
      console.error("Element calendarGrid not found");
    }

    // Lưu biến tháng/năm hiện tại để dùng cho chuyển tháng
    window.currentCalendarMonth = currentMonth;
    window.currentCalendarYear = currentYear;
  } catch (error) {
    console.error("Lỗi khi lấy lịch làm việc:", error);
    showNotification(
      "Không thể tải lịch làm việc. Vui lòng thử lại. Lỗi: " + error.message,
      "error"
    );
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

// Thêm sự kiện chuyển tháng
window.navigateMonth = function (delta) {
  let month = window.currentCalendarMonth ?? new Date().getMonth();
  let year = window.currentCalendarYear ?? new Date().getFullYear();
  month += delta;
  if (month < 0) {
    month = 11;
    year -= 1;
  } else if (month > 11) {
    month = 0;
    year += 1;
  }
  loadSchedules(month, year);
};

// Add to window for debugging
if (typeof window !== "undefined") {
  window.refreshEmployeeInfo = refreshEmployeeInfo;
  window.showSampleEmployeeData = showSampleEmployeeData;
  window.loadEmployeeInfo = loadEmployeeInfo;
  window.clearOrderFilters = clearOrderFilters;
  window.resetOrderFilters = resetOrderFilters;
  window.showMedicineInfoSection = showMedicineInfoSection;
  window.loadMedicineInfo = loadMedicineInfo;
  window.refreshMedicineInfo = refreshMedicineInfo;
  window.changeMedicinePage = changeMedicinePage;
}
