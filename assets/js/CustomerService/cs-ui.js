/**
 * Customer Service - UI Module
 * Quản lý các thao tác người dùng và giao diện
 */

// Import các API từ module API
import {
  pharmacyAPI,
  reviewAPI,
  customerAPI,
  rankUpgradeAPI,
  chartAPI,
  statsAPI,
  messageAPI,
  invoiceAPI,
  userAPI,
} from "./customer-service-api.js";

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
// Hiển thị tất cả các section khi khởi tạo và chỉ làm nổi bật phần được chọn
document.getElementById("nav-upgrade-customers").onclick = function () {
  document.getElementById("reviewsContainer").style.display = "";
  document.getElementById("upgradedCustomersContainer").style.display = "";

  // Làm nổi bật tab đang chọn
  document.querySelector(".nav-item.active").classList.remove("active");
  this.classList.add("active");

  // Cuộn đến phần khách hàng thăng hạng
  document
    .getElementById("upgradedCustomersContainer")
    .scrollIntoView({ behavior: "smooth" });
};

// Quay lại xem đánh giá
document.querySelector(".nav-item.active").onclick = function () {
  document.getElementById("reviewsContainer").style.display = "";
  document.getElementById("upgradedCustomersContainer").style.display = "";

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

  // Tải dữ liệu khách hàng thăng hạng
  loadUpgradedCustomers();

  // Cập nhật thống kê dashboard
  updateDashboardStats();

  // Đảm bảo hiển thị cả hai phần
  document.getElementById("reviewsContainer").style.display = "";
  document.getElementById("upgradedCustomersContainer").style.display = "";
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
  // Hiển thị tất cả các section khi khởi tạo và chỉ làm nổi bật phần được chọn
  document.getElementById("nav-upgrade-customers").onclick = function () {
    document.getElementById("reviewsContainer").style.display = "";
    document.getElementById("upgradedCustomersContainer").style.display = "";

    // Làm nổi bật tab đang chọn
    document.querySelector(".nav-item.active").classList.remove("active");
    this.classList.add("active");

    // Cuộn đến phần khách hàng thăng hạng
    document
      .getElementById("upgradedCustomersContainer")
      .scrollIntoView({ behavior: "smooth" });
  };

  // Quay lại xem đánh giá
  document.querySelector(".nav-item.active").onclick = function () {
    document.getElementById("reviewsContainer").style.display = "";
    document.getElementById("upgradedCustomersContainer").style.display = "";

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

// Đưa các hàm vào global scope để có thể gọi từ HTML nếu cần
function setupGlobalHandlers() {
  window.showUserInfo = showUserInfo;
  window.logout = logout;
  window.closeUserInfoModal = closeUserInfoModal;
  window.replyReview = replyReview; // Nếu cần các hàm khác cũng có thể thêm vào window ở đây

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
  }

  // Đăng ký sự kiện cho nút đăng xuất trong dropdown
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

      // Cột thời gian
      const timeCell = document.createElement("td");
      timeCell.textContent = review.date;
      row.appendChild(timeCell);

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
      actionCell.innerHTML = `
        <button class="btn-action" onclick="replyReview(${review.id})">
          <span class="material-icons">reply</span>
        </button>
      `;
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
//#region UPGRADED CUSTOMERS
// ====================================

// Tải dữ liệu khách hàng thăng hạng và hiển thị
async function loadUpgradedCustomers() {
  const tableBody = document.getElementById("upgradedCustomersTableBody");

  // Hiển thị trạng thái đang tải
  tableBody.innerHTML = `
    <tr>
      <td colspan="6" class="loading-row">
        <div class="loading-indicator">
          <span class="material-icons spin">refresh</span>
          <span>Đang tải dữ liệu khách hàng...</span>
        </div>
      </td>
    </tr>
  `;

  try {
    // Lấy dữ liệu khách hàng thăng hạng từ API nếu chưa có
    if (!upgradedCustomers || upgradedCustomers.length === 0) {
      upgradedCustomers = await rankUpgradeAPI.getAll();
    }

    // Xóa trạng thái đang tải
    tableBody.innerHTML = "";

    // Nếu không có dữ liệu
    if (upgradedCustomers.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-row">
            <div class="empty-state">Không có khách hàng thăng hạng nào</div>
          </td>
        </tr>
      `;
      return;
    }

    // Hiển thị dữ liệu
    upgradedCustomers.forEach((customer) => {
      const row = document.createElement("tr"); // Cột tên khách hàng
      const nameCell = document.createElement("td");
      nameCell.innerHTML = `<span class="clickable-customer" data-customer-id="${customer.id}">${customer.name}</span>`;
      nameCell.title = "Click để xem thông tin khách hàng";
      nameCell.style.cursor = "pointer";
      row.appendChild(nameCell);

      // Cột số điện thoại
      const phoneCell = document.createElement("td");
      phoneCell.textContent = customer.phone;
      row.appendChild(phoneCell);

      // Cột hạng cũ
      const oldRankCell = document.createElement("td");
      oldRankCell.textContent = customer.oldRank;
      row.appendChild(oldRankCell);

      // Cột hạng mới
      const newRankCell = document.createElement("td");
      newRankCell.textContent = customer.newRank;
      row.appendChild(newRankCell);

      // Cột ngày thăng hạng
      const dateCell = document.createElement("td");
      dateCell.textContent = customer.upgradeDate;
      row.appendChild(dateCell);

      // Cột thao tác
      const actionCell = document.createElement("td");
      actionCell.innerHTML = `
        <button class="btn-action" onclick="sendCongratulation(${customer.id})">
          <span class="material-icons">celebration</span>
        </button>
      `;
      row.appendChild(actionCell);

      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading upgraded customers:", error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="error-row">
          <div class="error-message">
            <span class="material-icons">error</span>
            <span>Không thể tải dữ liệu khách hàng thăng hạng. Vui lòng thử lại sau.</span>
          </div>
        </td>
      </tr>
    `;
  }
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
  }

  document.getElementById("messageContent").value = template.content;
  document.getElementById("templateHint").innerText = template.hint;

  // Nếu đã chọn khách hàng cụ thể và là tin nhắc thuốc, tự động cập nhật theo take note
  if (window.selectedCustomerId && type === "reminder") {
    const customer = customerAPI.getById(window.selectedCustomerId);
    if (customer) {
      customerAPI
        .getLatestInvoice(window.selectedCustomerId)
        .then((invoice) => {
          if (invoice && invoice.takeNote) {
            document.getElementById(
              "messageContent"
            ).value = `Xin chào ${customer.name}! Đây là lời nhắc nhở uống thuốc từ Long Châu cho đơn hàng gần nhất của bạn.\n\nHướng dẫn sử dụng thuốc: ${invoice.takeNote}\n\nVui lòng tuân thủ đúng hướng dẫn sử dụng và liên hệ với chúng tôi nếu có thắc mắc.\n\nChúc bạn mau khỏe!`;
          }
        });
    }
  }
}

// Gửi tin nhắn hoặc email
async function sendMessage() {
  const messageType = document.getElementById("messageType").value;
  const messageContent = document.getElementById("messageContent").value;
  const targetType = document.querySelector(
    '.message-composer form select[onchange="toggleCustomerInput(this)"]'
  ).value;

  // Lấy kênh gửi tin được chọn
  const channels = [];
  document
    .querySelectorAll('input[name="sendChannel"]:checked')
    .forEach((input) => {
      channels.push(input.value);
    });

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
      await messageAPI.send(messageData);
    }

    // Nếu đang trả lời đánh giá, cập nhật trạng thái đánh giá thành "Đã xử lý"
    if (window.currentReviewId) {
      await reviewAPI.updateStatus(window.currentReviewId, "APPROVED");
      console.log("Đánh giá đã được cập nhật thành công.");
      // Cập nhật trực tiếp status trong reviewsData nếu có
      if (Array.isArray(reviewsData)) {
        const idx = reviewsData.findIndex(
          (r) => r.id === window.currentReviewId
        );
        if (idx !== -1) {
          reviewsData[idx].status = "APPROVED";
        }
      }
      window.currentReviewId = null;
      filterReviews(); // Không cần forceNoCache
    }

    // Hiển thị thông báo thành công
    alert("Đã gửi tin nhắn thành công!");
    // Xóa nội dung tin nhắn sau khi gửi thành công
    document.getElementById("messageContent").value = "";
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

// Gửi lời chúc mừng thăng hạng
function sendCongratulation(customerId) {
  const customer = rankUpgradeAPI.getById(customerId);
  if (!customer) return;
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

  // Hiển thị thông tin khách hàng đã chọn
  document.getElementById("selectedCustomer").style.display = "";
  document.getElementById("selectedCustomerName").textContent = customer.name;
  document.getElementById("selectedCustomerPhone").textContent = customer.phone;

  // Điền nội dung tin nhắn chúc mừng
  document.getElementById(
    "messageContent"
  ).value = `Xin chúc mừng ${customer.name} đã thăng hạng từ ${customer.oldRank} lên ${customer.newRank}! Long Châu xin gửi đến bạn chương trình ưu đãi đặc biệt dành cho khách hàng hạng ${customer.newRank}. Chi tiết xem tại: [link ưu đãi]`;
  // Lưu ID khách hàng để gửi tin nhắn
  window.selectedCustomerId = customerId;

  // Cuộn đến phần soạn tin nhắn
  document
    .querySelector(".message-composer")
    .scrollIntoView({ behavior: "smooth" });
}

//#endregion

// ====================================
//#region CHARTS & DASHBOARD
// ====================================

// Khởi tạo biểu đồ
let satisfactionChart;
async function initSatisfactionChart() {
  const chartContainer = document.getElementById("satisfactionChartContainer");
  const canvas = document.getElementById("satisfactionChart");

  // Hiển thị loading indicator
  const loadingIndicator = document.createElement("div");
  loadingIndicator.className = "chart-loading-indicator";
  loadingIndicator.innerHTML =
    '<span class="material-icons spin">refresh</span> Đang tải dữ liệu biểu đồ...';
  chartContainer.insertBefore(loadingIndicator, canvas);

  const ctx = canvas.getContext("2d");
  satisfactionChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Tỷ lệ hài lòng (%)",
          data: [],
          borderColor: "#4FD1C5",
          backgroundColor: "rgba(79, 209, 197, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `Tỷ lệ hài lòng: ${context.parsed.y}%`;
            },
          },
        },
      },
      scales: {
        y: {
          min: 0,
          max: 100,
        },
      },
    },
  });

  // Mặc định hiển thị dữ liệu 30 ngày
  await updateSatisfactionChart(30);

  // Xóa loading indicator sau khi tải xong
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

// Cập nhật dữ liệu biểu đồ
async function updateSatisfactionChart(days) {
  try {
    // Hiển thị chart loading state
    const chartDiv = document.querySelector(".chart-wrapper");
    chartDiv.classList.add("loading");

    // Lấy dữ liệu từ API
    const data = await chartAPI.getSatisfactionData(days);
    if (!data) {
      console.error("No chart data available for", days, "days");
      return;
    } // Cập nhật biểu đồ với dữ liệu mới
    satisfactionChart.data.labels = data.labels;
    satisfactionChart.data.datasets[0].data = data.values;
    satisfactionChart.update();
  } catch (error) {
    console.error("Error updating satisfaction chart:", error);
    // Hiển thị thông báo lỗi trên biểu đồ nếu cần
  } finally {
    // Xóa trạng thái đang tải
    const chartDiv = document.querySelector(".chart-wrapper");
    chartDiv.classList.remove("loading");
  }
}

// Cập nhật thống kê dashboard với dữ liệu thực tế
async function updateDashboardStats() {
  try {
    // Hiển thị loading state trên các card stats
    const statCards = document.querySelectorAll(".stat-card .stat-value");
    statCards.forEach((card) => {
      card.innerHTML =
        '<span class="loading-indicator"><i class="material-icons spin">refresh</i></span>';
    });

    // Lấy dữ liệu thực từ API - sử dụng Promise.all để tải song song
    const [messagesSent, reviewsPending, customersServed, satisfactionRate] =
      await Promise.all([
        statsAPI.getMessagesSent(),
        statsAPI.getReviewsPending(),
        statsAPI.getCustomersServed(),
        statsAPI.getSatisfactionRate(),
      ]);

    // Cập nhật giao diện
    document.querySelector(".stat-card:nth-child(1) .stat-value").textContent =
      messagesSent;
    document.querySelector(".stat-card:nth-child(2) .stat-value").textContent =
      reviewsPending;
    document.querySelector(".stat-card:nth-child(3) .stat-value").textContent =
      customersServed ? customersServed.toLocaleString("vi-VN") : "0"; // Format với dấu phân cách hàng nghìn    document.querySelector(".stat-card:nth-child(4) .stat-value").textContent =
    satisfactionRate + "%";
  } catch (error) {
    console.error("Lỗi khi cập nhật thống kê:", error);

    // Hiển thị thông báo lỗi trên các card
    document.querySelectorAll(".stat-card .stat-value").forEach((card) => {
      card.innerHTML = '<span class="error-text">--</span>';
    });
  }
}
