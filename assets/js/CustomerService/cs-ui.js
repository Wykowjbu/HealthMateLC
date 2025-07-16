/**
 * Customer Service - UI Module
 * Quản lý các thao tác người dùng và giao diện
 */

// Import các API từ module API
import {
  pharmacyAPI,
  reviewAPI,
  customerAPI,
  chartAPI,
  statsAPI,
  messageAPI,
  invoiceAPI,
  userAPI,
} from "./customer-service-api.js";

// Import các hàm từ customer-service.js
import { showCustomerInfo } from "./customer-service.js";

// Các biến UI
let currentPage = 1;
const reviewsPerPage = 5;
// Use the selectedCustomerId variable from customer-service.js
window.currentReviewId = null; // ID của đánh giá đang được xử lý

// Biến để lưu trữ dữ liệu từ API
let reviewsData = [];

// Khởi tạo khi DOM load xong
document.addEventListener("DOMContentLoaded", function () {
  // Khởi tạo biểu đồ
  initSatisfactionChart();

  // Thiết lập các sự kiện
  setupEventListeners();
  // Thiết lập hiển thị ban đầu
  setupInitialDisplay();

  // Đảm bảo dropdown filter nhà thuốc luôn được populate
  const pharmacyFilter = document.getElementById("pharmacyFilter");
  if (pharmacyFilter) {
    populatePharmacies(pharmacyFilter);
  }

  // Thiết lập global handlers
  setupGlobalHandlers();

  // Hiển thị thông tin người đăng nhập lên header
  displayCurrentUserHeader();

  // Tải lịch sử tin nhắn
  loadMessageHistory();
});

// ====================================
//#region INIT & GLOBAL UI HANDLERS
// ====================================

// Hiển thị thông tin người đăng nhập lên header
async function displayCurrentUserHeader() {
  try {
    const user = await userAPI.getCurrentUser();
    // Avatar
    const avatarDiv = document.querySelector(".user-profile .avatar");
    if (avatarDiv && user.name) {
      const initials = user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
      avatarDiv.textContent = initials;
    }
    // Tên
    const nameDiv = document.querySelector(
      '.user-profile div > div[style*="font-weight"]'
    );
    if (nameDiv) nameDiv.textContent = user.name || "";
    // Vai trò
    const roleDiv = document.querySelector(
      '.user-profile div > div[style*="font-size"]'
    );
    if (roleDiv) roleDiv.textContent = user.role || "";
    // KHÔNG cập nhật các trường modal ở đây!
  } catch (e) {
    console.error("Không thể lấy thông tin người dùng:", e);
  }
}

// Lọc biểu đồ theo thời gian
document.getElementById("chartFilter").addEventListener("change", function () {
  updateSatisfactionChart(this.value);
});

// Pagination
const prevBtn = document.getElementById("prevBtn");
if (prevBtn) {
  prevBtn.onclick = async function () {
    const filteredReviews = await getFilteredReviews();
    const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
    if (currentPage > 1) {
      currentPage--;
      // Nếu sau khi giảm currentPage mà vượt quá số trang hiện tại (do dữ liệu lọc thay đổi), set về trang cuối
      if (currentPage > totalPages) currentPage = totalPages;
      loadReviews();
    }
  };
}
const nextBtn = document.getElementById("nextBtn");
if (nextBtn) {
  nextBtn.onclick = async function () {
    const filteredReviews = await getFilteredReviews();
    const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      loadReviews();
    }
  };
}
// Removed upgraded customers navigation since the section was deleted

// Quay lại xem đánh giá
document.querySelector(".nav-item.active").onclick = function () {
  document.getElementById("reviewsContainer").style.display = "";

  // Làm nổi bật tab đang chọn
  document.querySelector(".nav-item.active").classList.remove("active");
  this.classList.add("active");

  // Cuộn đến phần đánh giá
  document
    .getElementById("reviewsContainer")
    .scrollIntoView({ behavior: "smooth" });
};

// Đăng ký sự kiện cho nút soạn tin nhắn
const messageComposerBtn = document.querySelector(
  '[data-action="focusMessageComposer"]'
);
if (messageComposerBtn) {
  messageComposerBtn.addEventListener("click", function () {
    document
      .querySelector(".message-composer")
      .scrollIntoView({ behavior: "smooth" });
  });
}

// Đăng ký sự kiện cho nút gửi khảo sát
const sendSurveyBtn = document.querySelector('[data-action="sendSurvey"]');
if (sendSurveyBtn) {
  sendSurveyBtn.addEventListener("click", function () {
    document.getElementById("messageType").value = "survey";
    loadMessageTemplate("survey");
    document
      .querySelector(".message-composer")
      .scrollIntoView({ behavior: "smooth" });
  });
}

// Đăng ký sự kiện cho nút gửi tin riêng tư
const individualMsgBtn = document.querySelector(
  '[data-action="showIndividualMessage"]'
);
if (individualMsgBtn) {
  individualMsgBtn.addEventListener("click", function () {
    document.getElementById("messageType").value = "custom";
    loadMessageTemplate("custom");
    document.querySelector(
      '.message-composer form select[onchange="toggleCustomerInput(this)"]'
    ).value = "individual";
    toggleCustomerInput(
      document.querySelector(
        '.message-composer form select[onchange="toggleCustomerInput(this)"]'
      )
    );
    document
      .querySelector(".message-composer")
      .scrollIntoView({ behavior: "smooth" });
  });
}
// Đăng ký sự kiện cho nút cuộn đến biểu đồ
const chartBtn = document.querySelector('[data-action="scrollToChart"]');
if (chartBtn) {
  chartBtn.addEventListener("click", function () {
    document
      .querySelector(".chart-container")
      .scrollIntoView({ behavior: "smooth" });
  });
}

// Đăng ký sự kiện cho nút trả lời đánh giá
const replyModalBtn = document.querySelector('[data-action="showReplyModal"]');
if (replyModalBtn) {
  replyModalBtn.addEventListener("click", function () {
    document.getElementById("replyModal").style.display = "flex";
  });
}

// Đăng ký sự kiện cho tất cả các nút đóng modal
const closeButtons = document.querySelectorAll(".modal-close, .btn-secondary");
closeButtons.forEach((button) => {
  button.addEventListener("click", function () {
    // Tìm modal gần nhất và đóng nó
    const modal = this.closest(".modal");
    if (modal) {
      modal.style.display = "none";
    }
  });
});

//#endregion

// ====================================
//#region USER INFO & LOGOUT
// ====================================

// Hiển thị thông tin người dùng
export async function showUserInfo() {
  // Hiển thị modal
  const modal = document.getElementById("userInfoModal");
  if (!modal) {
    console.error("Không tìm thấy element với ID 'userInfoModal'");
    return;
  }
  modal.classList.add("show");

  // Xóa thông báo lỗi cũ nếu có
  const oldError = document.querySelector("#modalEmployeeError");
  if (oldError) {
    oldError.style.display = "none";
    oldError.textContent = "";
  }

  try {
    // Lấy thông tin người dùng từ API
    const currentUser = await userAPI.getCurrentUser();
    console.log("[showUserInfo] currentUser từ backend:", currentUser);
    if (!currentUser || typeof currentUser !== "object")
      throw new Error("Không có dữ liệu người dùng từ backend");

    // Cập nhật thông tin cơ bản
    document.getElementById("modalEmployeeName").textContent =
      currentUser.name || "";
    document.getElementById("modalEmployeeRole").textContent =
      currentUser.role || "";
    document.getElementById("modalEmployeeEmail").textContent =
      currentUser.email || "";
    document.getElementById("modalEmployeePhone").textContent =
      currentUser.phone || "";
    document.getElementById("modalEmployeeUsername").textContent =
      currentUser.username || "";
    // Cập nhật trạng thái
    const statusElement = document.getElementById("modalEmployeeStatus");
    if (currentUser.isActive) {
      statusElement.className = "status-badge active";
      statusElement.innerHTML =
        '<span class="status-dot"></span>Đang hoạt động';
    } else {
      statusElement.className = "status-badge inactive";
      statusElement.innerHTML =
        '<span class="status-dot"></span>Không hoạt động';
    }
  } catch (error) {
    console.error("Lỗi khi tải thông tin người dùng (showUserInfo):", error);
    // Hiển thị thông báo lỗi rõ ràng
    const errorDiv = document.getElementById("modalEmployeeError");
    if (errorDiv) {
      errorDiv.style.display = "block";
      errorDiv.textContent =
        "Không thể tải thông tin người dùng. Vui lòng thử lại sau.";
    }
  }
}

// Đóng modal thông tin cá nhân
export function closeUserInfoModal() {
  const modal = document.getElementById("userInfoModal");
  if (!modal) {
    console.error("Không tìm thấy element với ID 'userInfoModal'");
    return;
  }
  modal.classList.remove("show");
}

// Đăng xuất
export function logout() {
  if (confirm("Bạn có chắc muốn đăng xuất?")) {
    window.location.href = "index.html"; // Chuyển về trang đăng nhập
  }
}

// ====================================
//#region INITIAL DISPLAY & EVENT LISTENERS
// ====================================

// Thiết lập hiển thị ban đầu
function setupInitialDisplay() {
  // Hiển thị mặc định template nhắc uống thuốc
  loadMessageTemplate("reminder");

  // Tải dữ liệu đánh giá
  loadReviews();

  // Cập nhật thống kê dashboard
  updateDashboardStats();

  // Đảm bảo hiển thị phần reviews
  document.getElementById("reviewsContainer").style.display = "";
}

// Thiết lập các sự kiện listener
function setupEventListeners() {
  // Tìm kiếm đánh giá
  document
    .getElementById("reviewSearch")
    .addEventListener("input", filterReviews);

  // Lọc đánh giá theo cửa hàng
  const pharmacyFilter = document.getElementById("pharmacyFilter");
  pharmacyFilter.addEventListener("change", filterReviews);

  // Lọc đánh giá theo số sao
  const ratingFilter = document.getElementById("ratingFilter");
  ratingFilter.addEventListener("change", filterReviews); // Hiển thị dropdown người dùng

  // Lọc đánh giá theo trạng thái xử lý
  const statusFilter = document.getElementById("statusFilter");
  statusFilter.addEventListener("change", filterReviews);

  document
    .querySelector(".user-profile")
    .addEventListener("click", function (e) {
      e.stopPropagation();
      const dropdown = document.getElementById("userDropdown");
      dropdown.classList.toggle("show");
    });

  // Ẩn dropdown khi click bên ngoài
  document.addEventListener("click", function () {
    const dropdown = document.getElementById("userDropdown");
    if (dropdown.classList.contains("show")) {
      dropdown.classList.remove("show");
    }
  });

  // Form gửi tin nhắn
  document
    .querySelector(".message-composer form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      sendMessage();
    });

  // Thêm sự kiện click cho các đánh giá để hiển thị thông tin khách hàng
  document.addEventListener("click", function (e) {
    // Kiểm tra nếu user click vào thông tin khách hàng
    if (
      e.target.closest(".customer-info") ||
      e.target.closest(".clickable-customer")
    ) {
      // Nếu đã có ID trong thuộc tính onclick, không cần làm gì
      if (
        e.target.onclick ||
        (e.target.closest(".customer-info") &&
          e.target.closest(".customer-info").onclick)
      ) {
        return;
      }

      // Tìm ID khách hàng từ phần tử gần nhất có data-customer-id
      const parent = e.target.closest("[data-customer-id]");
      if (parent) {
        const customerId = parent.dataset.customerId;
        if (customerId) {
          showCustomerInfo(customerId);
        }
      }
    }
  });

  // Lọc biểu đồ theo thời gian
  document
    .getElementById("chartFilter")
    .addEventListener("change", function () {
      updateSatisfactionChart(this.value);
    });

  // Pagination
  const prevBtn = document.getElementById("prevBtn");
  if (prevBtn) {
    prevBtn.onclick = async function () {
      const filteredReviews = await getFilteredReviews();
      const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
      if (currentPage > 1) {
        currentPage--;
        // Nếu sau khi giảm currentPage mà vượt quá số trang hiện tại (do dữ liệu lọc thay đổi), set về trang cuối
        if (currentPage > totalPages) currentPage = totalPages;
        loadReviews();
      }
    };
  }
  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) {
    nextBtn.onclick = async function () {
      const filteredReviews = await getFilteredReviews();
      const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        loadReviews();
      }
    };
  }

  // Đăng ký sự kiện cho nút soạn tin nhắn
  const messageComposerBtn = document.querySelector(
    '[data-action="focusMessageComposer"]'
  );
  if (messageComposerBtn) {
    messageComposerBtn.addEventListener("click", function () {
      document
        .querySelector(".message-composer")
        .scrollIntoView({ behavior: "smooth" });
    });
  }

  // Đăng ký sự kiện cho nút gửi khảo sát
  const sendSurveyBtn = document.querySelector('[data-action="sendSurvey"]');
  if (sendSurveyBtn) {
    sendSurveyBtn.addEventListener("click", function () {
      document.getElementById("messageType").value = "survey";
      loadMessageTemplate("survey");
      document
        .querySelector(".message-composer")
        .scrollIntoView({ behavior: "smooth" });
    });
  }

  // Đăng ký sự kiện cho nút gửi tin riêng tư
  const individualMsgBtn = document.querySelector(
    '[data-action="showIndividualMessage"]'
  );
  if (individualMsgBtn) {
    individualMsgBtn.addEventListener("click", function () {
      document.getElementById("messageType").value = "custom";
      loadMessageTemplate("custom");
      document.querySelector(
        '.message-composer form select[onchange="toggleCustomerInput(this)"]'
      ).value = "individual";
      toggleCustomerInput(
        document.querySelector(
          '.message-composer form select[onchange="toggleCustomerInput(this)"]'
        )
      );
      document
        .querySelector(".message-composer")
        .scrollIntoView({ behavior: "smooth" });
    });
  }
  // Đăng ký sự kiện cho nút cuộn đến biểu đồ
  const chartBtn = document.querySelector('[data-action="scrollToChart"]');
  if (chartBtn) {
    chartBtn.addEventListener("click", function () {
      document
        .querySelector(".chart-container")
        .scrollIntoView({ behavior: "smooth" });
    });
  }

  // Đăng ký sự kiện cho nút trả lời đánh giá
  const replyModalBtn = document.querySelector(
    '[data-action="showReplyModal"]'
  );
  if (replyModalBtn) {
    replyModalBtn.addEventListener("click", function () {
      document.getElementById("replyModal").style.display = "flex";
    });
  }

  // Đăng ký sự kiện cho tất cả các nút đóng modal
  const closeButtons = document.querySelectorAll(
    ".modal-close, .btn-secondary"
  );
  closeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Tìm modal gần nhất và đóng nó
      const modal = this.closest(".modal");
      if (modal) {
        modal.style.display = "none";
      }
    });
  });
}

// Cập nhật số liệu trên Dashboard stats cards
async function updateDashboardStats() {
  try {
    // Số tin nhắn đã gửi
    const messagesSent = await statsAPI.getMessagesSent();
    document.getElementById("statMessagesSent").textContent = messagesSent;

    // Số đánh giá cần xử lý (tổng đánh giá từ 3 sao trở xuống)
    const allReviews = await reviewAPI.getAll();
    const reviewsPending = allReviews.filter((r) => {
      const rating = parseInt(r.rating);
      return !isNaN(rating) && rating <= 3;
    }).length;
    document.getElementById("statReviewsPending").textContent = reviewsPending;

    // Tổng số khách hàng đã được chăm sóc
    const customersServed = await statsAPI.getCustomersServed();
    document.getElementById("statCustomersServed").textContent =
      customersServed;

    // Tỷ lệ hài lòng tính từ điểm trung bình
    const avgRating = await statsAPI.getAverageRating();
    const satisfactionRate = Math.round((avgRating / 5) * 100);
    document.getElementById("statSatisfactionRate").textContent =
      satisfactionRate + "%";
  } catch (error) {
    console.error("Error updating dashboard stats:", error);
  } finally {
    // Reload message history as well
    loadMessageHistory();
  }
}

// Load message history and render into table
async function loadMessageHistory() {
  try {
    const messages = await messageAPI.getAllMessages();
    const tbody = document.getElementById("messageHistoryBody");
    tbody.innerHTML = "";
    messages.forEach((msg) => {
      const tr = document.createElement("tr");
      const timeTd = document.createElement("td");
      timeTd.textContent = new Date(msg.sentAt).toLocaleString();
      const channelTd = document.createElement("td");
      channelTd.textContent = msg.channel;
      const contentTd = document.createElement("td");
      contentTd.textContent = msg.messageText;
      const customerTd = document.createElement("td");
      customerTd.textContent = msg.targetCustomerId || "Tất cả";
      tr.append(timeTd, channelTd, contentTd, customerTd);
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error loading message history:", error);
  }
}

// Đưa các hàm vào global scope để có thể gọi từ HTML nếu cần
function setupGlobalHandlers() {
  window.showUserInfo = showUserInfo;
  window.logout = logout;
  window.closeUserInfoModal = closeUserInfoModal;
  window.closeCustomerInfoModal = closeCustomerInfoModal;
  window.sendMessageToCustomer = sendMessageToCustomer;
  window.replyReview = replyReview;
  window.showCustomerInfo = showCustomerInfo;
  window.toggleCustomerInput = toggleCustomerInput;
  window.selectCustomer = selectCustomer;
  window.clearSelectedCustomer = clearSelectedCustomer;
  window.searchCustomers = searchCustomers;
  window.loadMessageTemplate = loadMessageTemplate;
  window.filterReviews = filterReviews; // Thêm các hàm cần thiết cho HTML

  // Đăng ký sự kiện cho nút thông tin cá nhân trong dropdown
  const userInfoBtn = document.getElementById("btnUserInfo");
  if (userInfoBtn) {
    userInfoBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById("userDropdown").classList.remove("show");
      setTimeout(() => {
        showUserInfo();
      }, 100);
    });
  } // Đăng ký sự kiện cho nút đăng xuất trong dropdown
  const logoutBtn = document.getElementById("btnLogout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      logout();
    });
  }
}

//#endregion

// ====================================
//#region PHARMACY FILTER & DROPDOWN
// ====================================

// Toggle hiển thị input tìm kiếm khách hàng
function toggleCustomerInput(selectElement) {
  const customerInputGroup = document.getElementById("customerInputGroup");
  if (selectElement.value === "individual") {
    customerInputGroup.style.display = "";
  } else {
    customerInputGroup.style.display = "none";
    clearSelectedCustomer();
  }
}

// Điền danh sách cửa hàng vào dropdown
async function populatePharmacies(selectElement) {
  if (!selectElement) {
    console.error("populatePharmacies: No select element provided");
    return;
  }

  // Clear the dropdown first
  selectElement.innerHTML = "";

  // Add default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "all";
  defaultOption.textContent = "Tất cả cửa hàng";
  selectElement.appendChild(defaultOption);

  let pharmacies = await pharmacyAPI.getAll();
  if (!Array.isArray(pharmacies) || pharmacies.length === 0) {
    console.error(
      "pharmacyAPI.getAll() không trả về dữ liệu hợp lệ:",
      pharmacies
    );
    const option = document.createElement("option");
    option.value = "none";
    option.textContent = "(Không có dữ liệu nhà thuốc)";
    selectElement.appendChild(option);
    return;
  }

  // Use a Set to track unique IDs
  const addedIds = new Set();

  pharmacies.forEach((pharmacy) => {
    if (!addedIds.has(pharmacy.id)) {
      addedIds.add(pharmacy.id);
      const option = document.createElement("option");
      option.value = pharmacy.id;
      option.textContent = pharmacy.name;
      selectElement.appendChild(option);
    }
  });
}

//#endregion

// ====================================
//#region REVIEWS (LOAD, FILTER, PAGINATION)
// ====================================

// Lọc đánh giá theo từ khóa, cửa hàng, số sao và trạng thái xử lý
function filterReviews(forceNoCache = false) {
  const ratingFilterValue = document.getElementById("ratingFilter").value;
  const statusFilterValue = document.getElementById("statusFilter").value;

  // Hiển thị biểu thị trực quan cho bộ lọc đang hoạt động
  const filterElement = document.getElementById("ratingFilter");
  if (ratingFilterValue !== "all") {
    filterElement.classList.add("active-filter");
    document.getElementById("activeFilters").style.display = "none";
  } else {
    filterElement.classList.remove("active-filter");
    document.getElementById("activeFilters").style.display = "none";
  }

  // Reset về trang đầu tiên khi lọc
  currentPage = 1;
  loadReviews(forceNoCache);
}

// Lấy đánh giá đã lọc
async function getFilteredReviews(forceNoCache = false) {
  // Lấy các giá trị filter
  const searchInput = document.getElementById("reviewSearch");
  const searchTerm = searchInput && searchInput.value ? searchInput.value : "";
  const pharmacyId = document.getElementById("pharmacyFilter").value;
  const ratingFilterValue = document.getElementById("ratingFilter").value;
  const statusFilterValue = document.getElementById("statusFilter").value;
  // Lấy tất cả đánh giá
  const allReviews = await reviewAPI.getAll(forceNoCache);

  // Nếu không nhập gì, trả về toàn bộ feedback (vẫn lọc theo cửa hàng và số sao)
  if (!searchTerm.trim()) {
    return allReviews.filter((review) => {
      const pharmacyMatch =
        pharmacyId === "all" ||
        (review.pharmacy &&
          parseInt(review.pharmacy.id) === parseInt(pharmacyId));
      let starMatch = true;
      if (ratingFilterValue !== "all") {
        starMatch = parseInt(review.rating) === parseInt(ratingFilterValue);
      }
      let statusMatch = true;
      if (statusFilterValue !== "all") {
        if (statusFilterValue === "processed") {
          statusMatch =
            review.status === "APPROVED" || review.status === "Đã xử lý";
        } else if (statusFilterValue === "unprocessed") {
          statusMatch =
            review.status === "REJECTED" || review.status === "Chưa xử lý";
        }
      }
      return pharmacyMatch && starMatch && statusMatch;
    });
  }

  // Chuẩn hóa searchTerm
  const normTermWord = searchTerm.trim().toLowerCase();
  const normTermNumber = searchTerm.replace(/\D/g, "");
  const isNumberQuery = /^\d{1,}$/.test(normTermNumber); // Cho phép tìm số từ 1 ký tự

  // Thực hiện lọc
  const filteredReviews = allReviews.filter((review) => {
    // Lọc theo từng từ trong fullname
    let name = "";
    if (review.customer) {
      name = review.customer.fullname || "";
    }
    // Tách tên thành từng từ, kiểm tra từng từ (cho phép tìm 1 ký tự)
    const allNameWords = name.toLowerCase().split(/\s+/).filter(Boolean);
    const phone =
      review.customer && review.customer.phone ? review.customer.phone : "";
    const normPhone = phone.replace(/\D/g, "");

    let match = false;
    if (isNumberQuery && normTermNumber.length > 0) {
      match = normPhone.includes(normTermNumber);
    } else if (normTermWord.length > 0) {
      match = allNameWords.some((word) => word.includes(normTermWord));
    }

    // Lọc theo cửa hàng
    const pharmacyMatch =
      pharmacyId === "all" ||
      (review.pharmacy &&
        parseInt(review.pharmacy.id) === parseInt(pharmacyId));
    // Lọc theo số sao
    let starMatch = true;
    if (ratingFilterValue !== "all") {
      starMatch = parseInt(review.rating) === parseInt(ratingFilterValue);
    }
    // Lọc theo trạng thái xử lý
    let statusMatch = true;
    if (statusFilterValue !== "all") {
      if (statusFilterValue === "processed") {
        statusMatch =
          review.status === "APPROVED" || review.status === "Đã xử lý";
      } else if (statusFilterValue === "unprocessed") {
        statusMatch =
          review.status === "REJECTED" || review.status === "Chưa xử lý";
      }
    }
    return match && pharmacyMatch && starMatch && statusMatch;
  });
  return filteredReviews;
}

// Tải dữ liệu đánh giá và hiển thị
async function loadReviews(forceNoCache = false) {
  const tableBody = document.getElementById("reviewsTableBody");

  // Hiển thị loading state
  tableBody.innerHTML = `
    <tr>
      <td colspan="5" class="loading-row">
        <div class="loading-indicator">
          <span class="material-icons spin">refresh</span>
          <span>Đang tải dữ liệu đánh giá...</span>
        </div>
      </td>
    </tr>
  `;

  try {
    reviewsData = []; // Xóa cache trước khi gọi API
    reviewsData = await reviewAPI.getAll(forceNoCache);

    const filteredReviews = await getFilteredReviews(forceNoCache);
    const startIndex = (currentPage - 1) * reviewsPerPage;
    const endIndex = Math.min(
      startIndex + reviewsPerPage,
      filteredReviews.length
    );
    const currentReviews = filteredReviews.slice(startIndex, endIndex);

    // Cập nhật thông tin phân trang
    document.getElementById("paginationInfo").textContent = `Hiển thị ${
      startIndex + 1
    }-${endIndex} của ${filteredReviews.length} đánh giá`;

    // Cập nhật số trang
    updatePagination(filteredReviews.length);

    // Xóa dữ liệu cũ
    tableBody.innerHTML = "";

    // Thêm dữ liệu mới
    currentReviews.forEach((review) => {
      const row = document.createElement("tr");
      // Tag row with review ID for direct updates
      row.setAttribute("data-review-id", review.id);

      // Cột khách hàng
      const customerCell = document.createElement("td");
      // Đảm bảo luôn lấy đúng tên khách hàng (fullname hoặc name)
      let customerName = "(Không xác định)";
      let customerPhone = "";
      if (review.customer) {
        customerName = review.customer.fullname;
        customerPhone = review.customer.phone || "";
      }
      customerCell.innerHTML = `
        <div class="customer-info" data-customer-id="${
          review.customer && review.customer.id ? review.customer.id : ""
        }" style="cursor: pointer;">
          <div class="customer-name">${customerName}</div>
          <div class="customer-phone">${customerPhone}</div>
        </div>
      `;
      customerCell.title = "Click để xem thông tin khách hàng";
      row.appendChild(customerCell);

      // Cột đánh giá
      const ratingCell = document.createElement("td");
      let rating = Number(review.rating);
      if (isNaN(rating) || rating < 1 || rating > 5) rating = 0;
      let stars = "";
      for (let i = 1; i <= 5; i++) {
        stars += `<span class="star${i <= rating ? " filled" : ""}">★</span>`;
      }
      ratingCell.innerHTML = stars;
      row.appendChild(ratingCell);

      // Cột nội dung
      const contentCell = document.createElement("td");
      contentCell.textContent = review.content;
      row.appendChild(contentCell);

      // Cột trạng thái
      const statusCell = document.createElement("td");
      let statusText = review.status || "Không rõ";
      console.log("statusText:", statusText);
      let statusClass = "status-badge ";
      if (statusText === "APPROVED") {
        statusText = "Đã xử lý";
        statusClass += "status-success";
      } else if (statusText === "REJECTED") {
        statusText = "Chưa xử lý";
        statusClass += "status-error";
      } else {
        statusClass += "status-error";
      }
      statusCell.innerHTML = `<span class="${statusClass}">${statusText}</span>`;
      row.appendChild(statusCell);

      // Cột thao tác
      const actionCell = document.createElement("td");
      // Tạo nút reply và gán sự kiện click
      const replyBtn = document.createElement("button");
      replyBtn.className = "btn-action";
      replyBtn.innerHTML = '<span class="material-icons">reply</span>';
      replyBtn.addEventListener("click", () => replyReview(review.id));
      actionCell.appendChild(replyBtn);
      row.appendChild(actionCell);

      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading reviews:", error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="error-row">
          <div class="error-message">
            <span class="material-icons">error</span>
            <span>Không thể tải dữ liệu đánh giá. Vui lòng thử lại sau.</span>
          </div>
        </td>
      </tr>
    `;
  }
}

// Cập nhật phân trang
function updatePagination(totalReviews) {
  const pageNumbers = document.getElementById("pageNumbers");
  pageNumbers.innerHTML = "";

  const totalPages = Math.ceil(totalReviews / reviewsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.classList.add("page-number");
    if (i === currentPage) {
      pageButton.classList.add("active");
    }
    pageButton.addEventListener("click", function () {
      currentPage = i;
      loadReviews();
    });
    pageNumbers.appendChild(pageButton);
  }

  // Enable/disable prev/next buttons
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
}

//#endregion

// ====================================
//#region CUSTOMER SEARCH & SELECTION
// ====================================

// Tìm kiếm khách hàng
async function searchCustomers(query) {
  if (!query || query.length < 2) {
    document.getElementById("customerSuggestions").style.display = "none";
    return;
  }

  // Lấy danh sách khách hàng từ API nếu chưa có
  if (
    !window.customers ||
    !Array.isArray(window.customers) ||
    window.customers.length === 0
  ) {
    window.customers = await customerAPI.getAll();
  }
  const customers = window.customers;

  // Chuẩn hóa query: bỏ khoảng trắng, về chữ thường, loại bỏ ký tự không phải số nếu là số điện thoại
  const normQuery = query.replace(/\s+/g, "").toLowerCase();
  const normQueryNumber = query.replace(/\D/g, "");
  const isNumberQuery = /^\d{4,}$/.test(normQueryNumber); // Query là số có ít nhất 4 ký tự

  // Lọc theo tên hoặc số điện thoại
  const filteredCustomers = customers.filter((customer) => {
    const name = (customer.name || customer.fullname || "")
      .replace(/\s+/g, "")
      .toLowerCase();
    const phone = (customer.phone || "").replace(/\D/g, "");
    if (isNumberQuery) {
      return phone.includes(normQueryNumber);
    } else {
      return name.includes(normQuery) || phone.includes(normQueryNumber);
    }
  });

  const suggestionBox = document.getElementById("customerSuggestions");
  suggestionBox.innerHTML = "";

  if (filteredCustomers.length === 0) {
    suggestionBox.innerHTML =
      '<div class="suggestion-item">Không tìm thấy khách hàng</div>';
  } else {
    filteredCustomers.forEach((customer) => {
      const item = document.createElement("div");
      item.classList.add("suggestion-item");
      item.innerHTML = `
        <div class="customer-name">${
          customer.name || customer.fullname || "(Không tên)"
        }</div>
        <div class="customer-phone">${customer.phone || ""}</div>
      `;
      item.addEventListener("click", function () {
        selectCustomer(customer);
      });
      suggestionBox.appendChild(item);
    });
  }

  suggestionBox.style.display = "block";
}

// Chọn khách hàng từ danh sách gợi ý
function selectCustomer(customer) {
  window.selectedCustomerId = customer.id || customer.customerId;

  // Hiển thị thông tin khách hàng đã chọn
  document.getElementById("selectedCustomer").style.display = "";
  document.getElementById("selectedCustomerName").textContent =
    customer.name || customer.fullname || "(Không tên)";
  document.getElementById("selectedCustomerPhone").textContent =
    customer.phone || "";
  document.getElementById("selectedCustomerEmail").textContent =
    customer.email || "";

  // Ẩn danh sách gợi ý và xóa nội dung tìm kiếm
  document.getElementById("customerSuggestions").style.display = "none";
  document.getElementById("customerSearch").value = "";
}

// Xóa khách hàng đã chọn
function clearSelectedCustomer() {
  window.selectedCustomerId = null;
  document.getElementById("selectedCustomer").style.display = "none";
  document.getElementById("customerSearch").value = "";

  // Reset nội dung tin nhắn về template mặc định
  loadMessageTemplate(document.getElementById("messageType").value);
}
// Đưa hàm vào global scope để gọi từ HTML
window.clearSelectedCustomer = clearSelectedCustomer;

//#endregion

// ====================================
//#region MESSAGING & NOTIFICATIONS
// ====================================

// Tải template tin nhắn dựa theo loại
function loadMessageTemplate(type) {
  document.getElementById("reminderNote").style.display =
    type === "reminder" ? "" : "none";

  // Không gọi API, chỉ dùng template mặc định
  let template = { content: "", hint: "" };
  if (type === "reminder") {
    template.content = "Đây là nội dung nhắc uống thuốc mặc định.";
    template.hint = "Nội dung nhắc uống thuốc cho khách hàng.";
  } else if (type === "custom") {
    template.content = "";
    template.hint = "Soạn nội dung tin nhắn tuỳ chỉnh cho khách hàng.";
  } else if (type === "survey") {
    template.content = "Bạn vui lòng đánh giá dịch vụ của Long Châu tại đây.";
    template.hint = "Gửi khảo sát đánh giá dịch vụ.";
  } else if (type === "promotion") {
    template.content =
      "Xin chào {Tên khách hàng},\nChúng tôi đang có chương trình khuyến mãi đặc biệt dành cho bạn. Vui lòng kiểm tra chi tiết tại Long Châu ngay hôm nay!";
    template.hint = "Nội dung thông báo khuyến mãi cho khách hàng.";
  }

  document.getElementById("messageContent").value = template.content;
  document.getElementById("templateHint").innerText = template.hint;

  // Nếu đã chọn khách hàng cụ thể và là tin nhắc thuốc, tự động cập nhật theo take note
  if (type === "reminder" && window.selectedCustomerId) {
    invoiceAPI
      .getReminders(window.selectedCustomerId)
      .then((data) => {
        const invoice = Array.isArray(data) ? data[0] : data;
        if (invoice && invoice.notes) {
          const greeting = `Xin chào ${invoice.customerName || ""},`;
          const noteText = invoice.notes;
          document.getElementById(
            "messageContent"
          ).value = `${greeting}\n\nLời nhắc uống thuốc:\n${noteText}\n\nChúc bạn mau khỏe!`;
        }
      })
      .catch((err) => console.error("Error fetching invoice note:", err));
  }
}

// Gửi tin nhắn hoặc email
async function sendMessage() {
  const messageType = document.getElementById("messageType").value;
  const messageContent = document.getElementById("messageContent").value;
  const targetType = document.querySelector(
    '.message-composer form select[onchange="toggleCustomerInput(this)"]'
  ).value;

  // Determine selected channels
  const channels = Array.from(document.querySelectorAll('input[name="sendChannel"]:checked')).map(
    (cb) => cb.value
  );

  // If reminder type, send based on target: individual or all
  if (messageType === "reminder") {
    try {
      // Fetch invoices: if individual, pass customerId, else get all
      const invoices = await invoiceAPI.getReminders(
        targetType === "individual" ? window.selectedCustomerId : null
      );
      let sentCount = 0;
      let failedCount = 0;
      for (const inv of invoices) {
        const email = inv.customerEmail;
        const name = inv.customerName;
        const content = `Xin chào ${name},\n\nLời nhắc uống thuốc:\n${inv.notes}\n\nChúc bạn mau khỏe!`;
        try {
          await messageAPI.sendEmail({
            to: email,
            subject: "Nhắc nhở uống thuốc - Long Châu",
            content,
            customerId: inv.customerId,
          });
          sentCount++;
        } catch (e) {
          failedCount++;
        }
      }
      alert(
        `Đã gửi ${sentCount} trong tổng số ${invoices.length} nhắc nhở. Thất bại: ${failedCount}`
      );
    } catch (e) {
      console.error("Error sending reminders:", e);
      alert("Có lỗi xảy ra khi gửi nhắc nhở. Vui lòng thử lại.");
    } finally {
      // Restore send button state
      sendButton.innerHTML = originalButtonText;
      sendButton.disabled = false;
    }
    // Refresh message history and exit
    loadMessageHistory();
    return;
  }

  if (!messageContent) {
    alert("Vui lòng nhập nội dung tin nhắn!");
    return;
  }

  // Hiển thị trạng thái đang gửi
  const sendButton = document.querySelector(
    '.message-composer form button[type="submit"]'
  );
  const originalButtonText = sendButton.innerHTML;
  sendButton.innerHTML =
    '<span class="material-icons spin">refresh</span> Đang gửi...';
  sendButton.disabled = true;

  // Lấy thời gian hiện tại (giờ gửi thực tế)
  const now = new Date();
  const sendTime = now.toISOString(); // ISO format, backend sẽ lưu đúng chuẩn

  const messageData = {
    type: messageType,
    content: messageContent,
    sendTime: sendTime, // luôn gửi thời gian hiện tại
    target: targetType,
    customerId: window.selectedCustomerId,
    channels: channels.join(", "),
  };

  try {
    // Nếu chọn kênh email, gửi qua API email
    if (channels.includes("email")) {
      // Lấy email từ trường đã hiển thị trên UI
      const customerEmail = document
        .getElementById("selectedCustomerEmail")
        ?.textContent?.trim();
      if (!customerEmail || customerEmail === "(Chưa cập nhật)") {
        alert("Không tìm thấy email khách hàng để gửi!");
        return;
      }
      await messageAPI.sendEmail({
        to: customerEmail,
        subject: "Thông báo từ Long Châu",
        content: messageContent,
        customerId: window.selectedCustomerId,
      });
    } else {
      // Gửi thông qua API thông thường (SMS, app, v.v.)
      if (messageType === "reminder" && targetType === "all") {
        const result = await invoiceAPI.sendBulkReminders();
        alert(`Đã gửi ${result.sentCount}/${result.total} nhắc nhở.`);
      } else {
        await messageAPI.send(messageData);
      }
    }

    // Nếu đang trả lời đánh giá, cập nhật trạng thái đánh giá thành "Đã xử lý"
    if (window.currentReviewId) {
      await reviewAPI.updateStatus(window.currentReviewId, "APPROVED");
      console.log("Đánh giá đã được cập nhật thành công.");
      // Update status in local data and directly update DOM row without full reload
      if (Array.isArray(reviewsData)) {
        const idx = reviewsData.findIndex(
          (r) => r.id === window.currentReviewId
        );
        if (idx !== -1) reviewsData[idx].status = "APPROVED";
      }
      updateReviewStatusInDOM(window.currentReviewId);
      window.currentReviewId = null;
    }

    // Hiển thị thông báo thành công
    alert("Đã gửi tin nhắn thành công!");
    // Xóa nội dung tin nhắn sau khi gửi thành công
    document.getElementById("messageContent").value = "";

    // Refresh message history to include the new message
    loadMessageHistory();
  } catch (error) {
    console.error("Error sending message:", error);
    // Hiển thị lỗi nếu có
    let userMessage = "Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.";
    if (error && error.status === 401) {
      userMessage = "Bạn cần đăng nhập để gửi email.";
      window.location.href = "/index.html"; // Chuyển hướng đến trang đăng nhập
    } else if (error && error.status === 403) {
    } else if (error && error.message) {
      userMessage = `Có lỗi xảy ra khi gửi: ${error.message}`;
    }
    alert(userMessage);
  } finally {
    // Khôi phục trạng thái ban đầu của nút gửi (bao gồm icon)
    sendButton.innerHTML =
      '<span class="material-icons">send</span>\n            Gửi';
    sendButton.disabled = false;
  }
}

// Trả lời đánh giá
async function replyReview(reviewId) {
  let review;
  try {
    review = await reviewAPI.getById(reviewId);
  } catch (err) {
    alert("Không tìm thấy dữ liệu đánh giá phù hợp!");
    return;
  }
  if (!review) {
    alert("Không tìm thấy dữ liệu đánh giá phù hợp!");
    return;
  }

  // Lưu ID đánh giá đang xử lý để cập nhật trạng thái sau
  window.currentReviewId = reviewId;

  // Tự động điền thông tin
  document.getElementById("messageType").value = "custom";
  loadMessageTemplate("custom");
  document.querySelector(
    '.message-composer form select[onchange="toggleCustomerInput(this)"]'
  ).value = "individual";
  toggleCustomerInput(
    document.querySelector(
      '.message-composer form select[onchange="toggleCustomerInput(this)"]'
    )
  );

  // Lấy tên và số điện thoại khách hàng an toàn (ưu tiên fullname, name, customerName)
  let customerName = null;
  let customerPhone = null;
  let customerEmail = null;
  try {
    if (review.customer && typeof review.customer === "object") {
      customerName = review.customer.fullname;
      customerPhone = review.customer.phone;
      customerEmail = review.customer.email || "";
    }
  } catch (err) {
    customerName = "Không có thông tin khách hàng";
    customerPhone = "";
    console.error("Lỗi lấy thông tin khách hàng từ review:", review, err);
  }
  // Hiển thị thông tin khách hàng đã chọn
  document.getElementById("selectedCustomer").style.display = "";
  document.getElementById("selectedCustomerName").textContent = customerName;
  document.getElementById("selectedCustomerPhone").textContent = customerPhone;
  document.getElementById("selectedCustomerEmail").textContent = customerEmail;

  // Điền nội dung tin nhắn phản hồi
  let replyContent = "";
  if (review.rating <= 3) {
    replyContent = `Kính gửi ${customerName},\n\nChúng tôi rất tiếc về trải nghiệm chưa tốt của bạn tại Long Châu. Chúng tôi đã ghi nhận phản hồi và sẽ cải thiện dịch vụ. Xin vui lòng liên hệ số 1800 XXXXX để được hỗ trợ thêm.\n\nTrân trọng,\nLong Châu`;
  } else {
    replyContent = `Kính gửi ${customerName},\n\nCảm ơn bạn đã đánh giá tích cực về dịch vụ của Long Châu. Chúng tôi rất vui khi được phục vụ và mong tiếp tục nhận được sự ủng hộ của bạn.\n\nTrân trọng,\nLong Châu`;
  }

  document.getElementById("messageContent").value = replyContent;
  // Lưu ID khách hàng
  window.selectedCustomerId = review.customer && review.customer.id;

  // Cuộn đến phần soạn tin nhắn
  document
    .querySelector(".message-composer")
    .scrollIntoView({ behavior: "smooth" });
}

// Manage visibility of bulk reminders button based on messageType and target
function toggleBulkReminderButton() {
  const sendAllBtn = document.getElementById("sendAllRemindersBtn");
  const type = document.getElementById("messageType").value;
  const targetSelect = document.querySelector(
    '.message-composer form select[onchange="toggleCustomerInput(this)"]'
  );
  const target = targetSelect ? targetSelect.value : null;
  if (type === "reminder" && (!target || target !== "individual")) {
    sendAllBtn.style.display = "";
  } else {
    sendAllBtn.style.display = "none";
  }
}

// Setup bulk reminder button toggle on relevant controls
document.getElementById("messageType").addEventListener("change", () => {
  loadMessageTemplate(document.getElementById("messageType").value);
  toggleBulkReminderButton();
});
const targetSelectElem = document.querySelector(
  '.message-composer form select[onchange="toggleCustomerInput(this)"]'
);
if (targetSelectElem) {
  targetSelectElem.addEventListener("change", toggleBulkReminderButton);
}

// After DOM and event listeners setup, initialize button state
toggleBulkReminderButton();

//#endregion

// ====================================
//#region CHARTS & DASHBOARD
// ====================================

// Khởi tạo biểu đồ
var satisfactionChart;
async function initSatisfactionChart(days = 30) {
  console.log("Initializing rating distribution chart for", days);
  const periodSpan = document.getElementById("chartPeriodInfo");
  periodSpan.textContent =
    days === "all" ? "Từ trước đến nay" : `${days} ngày qua`;

  const chartContainer = document.getElementById("satisfactionChartContainer");
  const canvas = document.getElementById("satisfactionChart");
  const ctx = canvas.getContext("2d");

  // Show loading
  const loadingIndicator = document.createElement("div");
  loadingIndicator.className = "chart-loading-indicator";
  loadingIndicator.innerHTML =
    '<span class="material-icons spin">refresh</span> Đang tải...';
  chartContainer.prepend(loadingIndicator);

  // Fetch all reviews
  const allReviews = await reviewAPI.getAll();

  // Always use full rating distribution, ignore `days` filter
  const counts = [0, 0, 0, 0, 0];
  allReviews.forEach((r) => {
    const rt = parseInt(r.rating);
    if (rt >= 1 && rt <= 5) counts[rt - 1]++;
  });

  // Destroy old chart
  if (satisfactionChart) satisfactionChart.destroy();

  // Create pie chart showing rating counts
  satisfactionChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["1 sao", "2 sao", "3 sao", "4 sao", "5 sao"],
      datasets: [
        {
          data: counts,
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
          ],
        },
      ],
    },
    options: { responsive: true, plugins: { legend: { position: "top" } } },
  });

  // Hide period options with no data
  const filterSelect = document.getElementById("chartFilter");
  // 7 days
  const cutoff7 = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const has7 = allReviews.some((r) => new Date(r.date).getTime() >= cutoff7);
  const opt7 = filterSelect.querySelector('option[value="7"]');
  if (opt7) opt7.style.display = has7 ? "" : "none";
  // 30 days
  const cutoff30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const has30 = allReviews.some((r) => new Date(r.date).getTime() >= cutoff30);
  const opt30 = filterSelect.querySelector('option[value="30"]');
  if (opt30) opt30.style.display = has30 ? "" : "none";

  // If current selected option hidden, reset to 'all'
  if (filterSelect.value === "7" && !has7) filterSelect.value = "all";
  if (filterSelect.value === "30" && !has30) filterSelect.value = "all";

  loadingIndicator.remove();
}

// Update listener for filter select
document
  .getElementById("chartFilter")
  .addEventListener("change", (e) => initSatisfactionChart(e.target.value));

// On load
document.addEventListener("DOMContentLoaded", () => initSatisfactionChart());

//#endregion

//#region autofill

// Đóng modal thông tin khách hàng
export function closeCustomerInfoModal() {
  const modal = document.getElementById("customerInfoModal");
  if (!modal) {
    console.error("Không tìm thấy element với ID 'customerInfoModal'");
    return;
  }
  modal.style.display = "none";
}

// Gửi tin nhắn cho khách hàng đã chọn trong modal
export function sendMessageToCustomer() {
  // Lấy thông tin khách hàng từ modal
  const customerName = document.getElementById("modalCustomerName").textContent;
  const customerPhone =
    document.getElementById("modalCustomerPhone").textContent;
  const customerEmail =
    document.getElementById("modalCustomerEmail").textContent;

  if (!customerName || customerName === "---") {
    alert("Không có thông tin khách hàng để gửi tin nhắn");
    return;
  }

  // Đóng modal khách hàng
  closeCustomerInfoModal();

  const targetSelect = document.querySelector(
    '.message-composer form select[onchange="toggleCustomerInput(this)"]'
  );
  targetSelect.value = "individual";
  toggleCustomerInput(targetSelect);

  // Hiển thị thông tin khách hàng đã chọn
  document.getElementById("selectedCustomer").style.display = "";
  document.getElementById("selectedCustomerName").textContent = customerName;
  document.getElementById("selectedCustomerPhone").textContent = customerPhone;
  document.getElementById("selectedCustomerEmail").textContent = customerEmail;

  // Cuộn đến phần soạn tin nhắn
  document
    .querySelector(".message-composer")
    .scrollIntoView({ behavior: "smooth" });
}
//#endregion

// Update a review's status in the table DOM
function updateReviewStatusInDOM(reviewId) {
  const row = document.querySelector(`tr[data-review-id="${reviewId}"]`);
  if (row) {
    const badge = row.querySelector(".status-badge");
    if (badge) {
      badge.className = "status-badge status-success";
      badge.textContent = "Đã xử lý";
    }
  }
}

// Alias for chart filter to call init
function updateSatisfactionChart(days) {
  initSatisfactionChart(days);
}
