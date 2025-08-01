/**
 * Customer Service Dashboard - Long Châu
 * Data and API Module - Quản lý dữ liệu và API
 */

// =============================
// #region IMPORTS & GLOBALS
// =============================

// Import các API từ module API
import {
  pharmacyAPI,
  reviewAPI,
  customerAPI,
  invoiceAPI,
} from "./customer-service-api.js";

// Global variable for selected customer ID - accessible to both modules
window.selectedCustomerId = null;

// #endregion

// =============================
// #region DEBUG & DROPDOWN HELPERS
// =============================

// Debug Functions - Embedded in this file instead of separate file
// Function to log the current state of the dropdown
function logDropdownState(selectElement) {
  if (!selectElement) return;
  const options = Array.from(selectElement.options);

  // Create a map to identify duplicates
  const optionMap = new Map();

  options.forEach((option, index) => {
    const key = `${option.value}:${option.textContent}`;
    if (optionMap.has(key)) {
      console.warn(
        `DUPLICATE FOUND: Option "${option.textContent}" (value: ${
          option.value
        }) appears multiple times at positions ${optionMap.get(
          key
        )} and ${index}`
      );
    } else {
      optionMap.set(key, index);
    }
  });
}

// Observer to monitor changes to the pharmacy dropdown
function monitorPharmacyDropdown() {
  const pharmacyFilter = document.getElementById("pharmacyFilter");
  if (!pharmacyFilter) {
    console.error("monitorPharmacyDropdown: pharmacyFilter element not found");
    return;
  }

  // Log current state
  logDropdownState(pharmacyFilter);

  // Set up an observer to monitor changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        logDropdownState(pharmacyFilter);
      }
    });
  });

  // Start observing
  observer.observe(pharmacyFilter, { childList: true });
}

// #endregion

// =============================
// #region DATA STRUCTURES & INITIAL LOAD
// =============================

// Biến để lưu trữ dữ liệu từ API
let pharmacies = [];
let reviewsData = [];
let customers = [];
// NOTE: upgradedCustomers removed - rank upgrade functionality not available to customer service

// Tải dữ liệu khi khởi động
(async function loadInitialData() {
  try {
    // Tải dữ liệu nhà thuốc
    pharmacies = await pharmacyAPI.getAll();
    // Hiển thị các phần tử UI phụ thuộc vào pharmacies
    populatePharmacyFilters();
  } catch (error) {
    console.error("Failed to load pharmacy data:", error);
    // Dữ liệu mẫu dự phòng khi API gặp sự cố
    pharmacies = []; // Set to empty array on error
    populatePharmacyFilters(); // Still try to populate (will show "no data" message)
  }

  // Tải dữ liệu đánh giá
  try {
    reviewsData = await reviewAPI.getAll();
  } catch (error) {
    console.error("Failed to load reviews data:", error);
    // Dữ liệu đánh giá sẽ là mảng rỗng nếu có lỗi
    reviewsData = [];
  }

  // Tải dữ liệu khách hàng
  try {
    customers = await customerAPI.getAll();
  } catch (error) {
    customers = [];
  }

  // Cập nhật UI sau khi tải dữ liệu
  updateUI();
})();

// Hàm cập nhật UI sau khi tải dữ liệu
function updateUI() {
  // Hiển thị danh sách đánh giá
  if (document.getElementById("reviewsTable")) {
    loadReviews();
  }

  // NOTE: Upgraded customers functionality removed - not available to customer service staff

  // Cập nhật số liệu thống kê trên dashboard
  // Nếu không có hàm updateDashboardStats, bỏ qua lỗi này
  if (typeof updateDashboardStats === "function") {
    updateDashboardStats();
  }

  // Start monitoring pharmacy dropdown for debugging
  try {
    monitorPharmacyDropdown();
  } catch (error) {
    console.error("Error setting up pharmacy dropdown monitoring:", error);
  }
}

// Điền các dropdown lọc nhà thuốc
function populatePharmacyFilters() {
  const pharmacyFilter = document.getElementById("pharmacyFilter");
  if (pharmacyFilter) {
    // Clear existing options first
    pharmacyFilter.innerHTML = '<option value="all">Tất cả cửa hàng</option>';

    // Check if pharmacies array exists and has items
    if (!Array.isArray(pharmacies) || pharmacies.length === 0) {
      const option = document.createElement("option");
      option.value = "none";
      option.textContent = "(Không có dữ liệu nhà thuốc)";
      pharmacyFilter.appendChild(option);
      console.warn("Không có dữ liệu nhà thuốc để hiển thị trong dropdown!");
      return;
    }

    // Create a set to track unique IDs already added
    const addedPharmacyIds = new Set();

    // Add each pharmacy only once based on ID
    pharmacies.forEach((pharmacy) => {
      if (!addedPharmacyIds.has(pharmacy.id)) {
        addedPharmacyIds.add(pharmacy.id);
        const option = document.createElement("option");
        option.value = pharmacy.id;
        option.textContent = pharmacy.name;
        pharmacyFilter.appendChild(option);
      }
    });

    // Use the debug helper to log the current state of the dropdown
    try {
      logDropdownState(pharmacyFilter);
    } catch (error) {
      console.error("Error using logDropdownState:", error);
    }
  }
}

// Hàm kiểm tra kết nối API server
async function checkApiConnection() {
  try {
    const response = await fetch(
      "https://healthmate-lc-83d3cba0821e.herokuapp.com/customer-service/pharmacies",
      {
        method: "GET",
      }
    );
    return response.ok;
  } catch (error) {
    return false;
  }
}

// #endregion

// =============================
// #region REVENUE REPORT
// =============================

/**
 * Fetch and render revenue report for dashboard
 * @param {string|number} pharmacyId - Pharmacy ID or 'all'
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 */
async function loadRevenueReport(
  pharmacyId = "all",
  startDate = "",
  endDate = ""
) {
  const revenueSummaryEl = document.getElementById("totalRevenue");
  const revenueTableBody = document.getElementById("revenueTableBody");
  if (!revenueSummaryEl || !revenueTableBody) return;

  // Show loading state
  revenueSummaryEl.textContent = "Đang tải...";
  revenueTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#718096;">Đang tải dữ liệu...</td></tr>`;

  try {
    // Build API URL with query params
    let url = "https://healthmate-lc-83d3cba0821e.herokuapp.com/customer-service/stats/revenue-report?";
    if (pharmacyId !== "all" && pharmacyId) url += `pharmacyId=${pharmacyId}&`;
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}&`;
    url = url.replace(/&$/, ""); // Remove trailing &

    const res = await fetch(url);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();

    // Update total revenue stat
    revenueSummaryEl.textContent = formatCurrency(data.totalRevenue);

    // Render table rows
    const rows =
      (data.pharmacyReports || [])
        .map(
          (report) => `
      <tr>
        <td>${report.pharmacyName}</td>
        <td>${formatCurrency(report.revenue)}</td>
        <td>${report.orderCount}</td>
      </tr>
    `
        )
        .join("") ||
      `<tr><td colspan="3" style="text-align:center;color:#718096;">Không có dữ liệu</td></tr>`;
    revenueTableBody.innerHTML = rows;
  } catch (err) {
    revenueSummaryEl.textContent = "Lỗi";
    revenueTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#e53e3e;">Không thể tải dữ liệu</td></tr>`;
  }
}

// Format currency for VND
function formatCurrency(amount) {
  if (typeof amount !== "number") amount = parseFloat(amount) || 0;
  return amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}

// Populate pharmacy filter dropdown for revenue report
async function populateRevenuePharmacyFilter() {
  const filter = document.getElementById("revenuePharmacyFilter");
  if (!filter) return;
  filter.innerHTML = `<option value="all">Tất cả nhà thuốc</option>`;
  try {
    const res = await fetch(
      "https://healthmate-lc-83d3cba0821e.herokuapp.com/customer-service/pharmacies"
    );
    if (!res.ok) throw new Error("API error");
    const pharmacies = await res.json();
    pharmacies.forEach((ph) => {
      const opt = document.createElement("option");
      opt.value = ph.pharmacyId || ph.id;
      opt.textContent = ph.name || ph.pharmacyName;
      filter.appendChild(opt);
    });
  } catch (err) {
    // fallback: only 'all' option
  }
}

// Event listener for pharmacy filter (revenue)
const revenuePharmacyFilter = document.getElementById("revenuePharmacyFilter");
if (revenuePharmacyFilter) {
  revenuePharmacyFilter.addEventListener("change", function () {
    loadRevenueReport(this.value);
  });
}

// Event listener for time range filter
const revenueFilterBtn = document.getElementById("revenueFilterBtn");
if (revenueFilterBtn) {
  revenueFilterBtn.addEventListener("click", function () {
    const pharmacyId =
      document.getElementById("revenuePharmacyFilter")?.value || "all";
    const startDate = document.getElementById("revenueStartDate")?.value || "";
    const endDate = document.getElementById("revenueEndDate")?.value || "";
    loadRevenueReport(pharmacyId, startDate, endDate);
  });
}

// Update initial load to use current filter values
populateRevenuePharmacyFilter().then(() => {
  const filter = document.getElementById("revenuePharmacyFilter");
  const startDate = document.getElementById("revenueStartDate")?.value || "";
  const endDate = document.getElementById("revenueEndDate")?.value || "";
  loadRevenueReport(filter ? filter.value : "all", startDate, endDate);
});

// #endregion

// =============================
// #region CUSTOMER INFO MODAL
// =============================

// Hiển thị thông tin khách hàng trong modal
async function showCustomerInfo(customerId) {
  // Hiển thị loading state
  const modalContent = document.querySelector(".modal-content");
  const loadingIndicator = document.createElement("div");
  loadingIndicator.className = "loading-indicator";
  loadingIndicator.innerHTML =
    '<span class="material-icons spin">refresh</span> Đang tải thông tin...';
  modalContent.prepend(loadingIndicator);

  try {
    // Tìm thông tin khách hàng từ API
    const customer = await customerAPI.getCustomerDetail(customerId);

    if (!customer) {
      console.error(`Không tìm thấy thông tin khách hàng ID: ${customerId}`);
      alert("Không tìm thấy thông tin khách hàng");
      return;
    }

    // Lưu ID khách hàng đang xem để sử dụng sau này (gửi tin nhắn)
    window.selectedCustomerId = customerId;

    // Cập nhật thông tin trong modal
    document.getElementById("modalCustomerName").textContent = customer.name;
    document.getElementById("modalCustomerPhone").textContent = customer.phone;
    document.getElementById("modalCustomerEmail").textContent =
      customer.email || "(Chưa cập nhật)";
    document.getElementById("modalCustomerRank").textContent = customer.rank;

    // Hiển thị cửa hàng ưa thích
    const favoriteStore = pharmacies.find(
      (p) => p.id === customer.favoriteStore
    );
    document.getElementById("modalCustomerStore").textContent = favoriteStore
      ? favoriteStore.name
      : "(Chưa có)";

    // Hiển thị lịch sử đánh giá
    await displayCustomerReviewHistory(customerId);

    // Hiển thị đơn hàng gần nhất
    await displayCustomerRecentOrder(customerId);
  } catch (error) {
    console.error("Error fetching customer info:", error);
    alert("Có lỗi khi tải thông tin khách hàng. Vui lòng thử lại sau.");
  } finally {
    // Xóa loading indicator
    if (loadingIndicator) {
      loadingIndicator.remove();
    }

    // Hiển thị modal
    document.getElementById("customerInfoModal").style.display = "flex";
  }
}

// Hiển thị lịch sử đánh giá của khách hàng
async function displayCustomerReviewHistory(customerId) {
  const reviewHistoryContainer = document.getElementById(
    "customerReviewHistory"
  );

  // Hiển thị loading state
  reviewHistoryContainer.innerHTML =
    '<div class="loading-state"><span class="material-icons spin">refresh</span> Đang tải đánh giá...</div>';

  try {
    // Gọi API để lấy đánh giá của khách hàng
    const customerReviews = await reviewAPI.getCustomerReviews(
      parseInt(customerId)
    );

    // Nếu không có đánh giá, hiển thị thông báo
    if (!customerReviews || customerReviews.length === 0) {
      reviewHistoryContainer.innerHTML =
        '<div class="empty-state">Khách hàng chưa có đánh giá nào</div>';
      return;
    }

    // Hiển thị lịch sử đánh giá
    let reviewsHtml = "";
    for (const review of customerReviews) {
      // Tìm tên cửa hàng
      let pharmacyName = "Cửa hàng không xác định";

      // Nếu có ID nhà thuốc, tìm tên nhà thuốc từ danh sách đã tải
      if (review.pharmacy) {
        const pharmacy = pharmacies.find((p) => p.id === review.pharmacy);
        if (pharmacy) {
          pharmacyName = pharmacy.name;
        }
      }

      reviewsHtml += `
        <div class="review-item">
          <div class="review-header">
            <div class="review-rating">
              ${getRatingStars(review.rating)}
            </div>
            <div class="review-date">${review.date}</div>
          </div>
          <div class="review-store">${pharmacyName}</div>
          <div class="review-content">${review.content}</div>
          <div class="review-status status-badge ${
            review.status === "Đã xử lý" ? "status-success" : ""
          }">${review.status}</div>
        </div>
      `;
    }

    reviewHistoryContainer.innerHTML = reviewsHtml;
  } catch (error) {
    console.error("Error loading customer reviews:", error);
    reviewHistoryContainer.innerHTML =
      '<div class="error-state">Không thể tải đánh giá. Vui lòng thử lại sau.</div>';
  }
}

// Hiển thị đơn hàng gần nhất của khách hàng
async function displayCustomerRecentOrder(customerId) {
  const recentOrderContainer = document.getElementById("customerRecentOrder");

  // Hiển thị loading state
  recentOrderContainer.innerHTML =
    '<div class="loading-state"><span class="material-icons spin">refresh</span> Đang tải đơn hàng...</div>';

  try {
    // Lấy đơn hàng gần nhất từ API
    const recentInvoice = await invoiceAPI.getLatestInvoice(
      parseInt(customerId)
    );

    // Nếu không có đơn hàng, hiển thị thông báo
    if (!recentInvoice) {
      recentOrderContainer.innerHTML =
        '<div class="empty-state">Không có đơn hàng gần đây</div>';
      return;
    }

    // Hiển thị đơn hàng gần nhất
    recentOrderContainer.innerHTML = `
      <div class="order-item">
        <div class="order-date">
          <span class="material-icons">calendar_today</span>
          ${recentInvoice.date}
        </div>
        <div class="order-items">
          <div class="order-header">Thuốc đã mua:</div>
          <ul class="order-list">
            ${recentInvoice.items.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>
        <div class="order-notes">
          <div class="order-header">Hướng dẫn sử dụng:</div>
          <p>${recentInvoice.takeNote || "Không có hướng dẫn"}</p>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error loading recent order:", error);
    recentOrderContainer.innerHTML =
      '<div class="error-state">Không thể tải đơn hàng. Vui lòng thử lại sau.</div>';
  }
}

// Tạo HTML cho sao đánh giá
function getRatingStars(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars += '<span class="material-icons star-filled">star</span>';
    } else {
      stars += '<span class="material-icons star-empty">star_border</span>';
    }
  }
  return stars;
}

// Đóng modal thông tin khách hàng
function closeCustomerInfoModal() {
  document.getElementById("customerInfoModal").style.display = "none";

  // Xóa ID khách hàng đang chọn
  window.selectedCustomerId = null;
}

// Gửi tin nhắn cho khách hàng từ modal
function sendMessageToCustomer() {
  // Nếu không có khách hàng được chọn, hiển thị thông báo lỗi
  if (!window.selectedCustomerId) {
    alert("Vui lòng chọn khách hàng để gửi tin nhắn");
    return;
  }

  // Tìm thông tin khách hàng
  const customer = customerAPI.getCustomerDetail(window.selectedCustomerId);

  if (!customer) {
    console.error("Không tìm thấy thông tin khách hàng");
    return;
  }

  // Đóng modal thông tin khách hàng
  closeCustomerInfoModal();

  // Hiển thị composer tin nhắn và tự động điền tên khách hàng
  document.getElementById("messageTemplate").value = "";
  document.getElementById("messageCustomerType").value = "individual";
  toggleCustomerInput(document.getElementById("messageCustomerType"));

  // Tự động điền tên khách hàng vào ô tìm kiếm
  const customerSearchInput = document.getElementById("customerSearch");
  customerSearchInput.value = customer.name;

  // Mô phỏng sự kiện search để hiển thị khách hàng
  selectCustomer(customer.id, customer.name);

  // Focus vào ô nhập tin nhắn
  document.getElementById("messageContent").focus();

  // Cuộn trang đến khu vực soạn tin nhắn
  document
    .querySelector(".message-composer")
    .scrollIntoView({ behavior: "smooth" });
}

// Add debugging
const originalShowCustomerInfo = showCustomerInfo;
showCustomerInfo = function (customerId) {
  originalShowCustomerInfo(customerId);
};

// #endregion

// =============================
// #region UTILS & EXPORTS
// =============================

// Kiểm tra trạng thái kết nối API khi khởi động
(async function checkApiStatus() {
  // Kiểm tra kết nối đến API server
  const isConnected = await checkApiConnection();

  // Hiển thị thông báo trạng thái
  const apiStatusElement = document.createElement("div");
  apiStatusElement.className = isConnected
    ? "api-status connected"
    : "api-status disconnected";
  apiStatusElement.innerHTML = `
    <div class="status-icon">
      <span class="material-icons">${
        isConnected ? "check_circle" : "error"
      }</span>
    </div>
    <div class="status-text">
      ${
        isConnected
          ? "Kết nối máy chủ thành công"
          : "Không thể kết nối đến máy chủ. Đang sử dụng dữ liệu offline."
      }
    </div>
  `;

  document.body.appendChild(apiStatusElement);
  // Ẩn thông báo sau 5 giây
  setTimeout(() => {
    apiStatusElement.classList.add("fade-out");
    setTimeout(() => apiStatusElement.remove(), 500);
  }, 500);
})();

// Export các hàm cần thiết
export { showCustomerInfo };
