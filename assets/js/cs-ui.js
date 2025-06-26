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

// Khởi tạo khi DOM load xong
document.addEventListener("DOMContentLoaded", function () {
  // Khởi tạo biểu đồ
  initSatisfactionChart();

  // Thiết lập các sự kiện
  setupEventListeners();
  // Thiết lập hiển thị ban đầu
  setupInitialDisplay();

  // Thiết lập global handlers
  setupGlobalHandlers();
});

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
  document.getElementById("prevBtn").addEventListener("click", function () {
    if (currentPage > 1) {
      currentPage--;
      loadReviews();
    }
  });

  document.getElementById("nextBtn").addEventListener("click", function () {
    const totalPages = Math.ceil(getFilteredReviews().length / reviewsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      loadReviews();
    }
  });
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

// Lọc đánh giá theo từ khóa, cửa hàng và số sao
function filterReviews() {
  const ratingFilterValue = document.getElementById("ratingFilter").value;

  // Hiển thị biểu thị trực quan cho bộ lọc đang hoạt động
  const filterElement = document.getElementById("ratingFilter");
  if (ratingFilterValue !== "all") {
    filterElement.classList.add("active-filter");
    // Ẩn cần hiển thị bộ lọc đang hoạt động theo yêu cầu
    document.getElementById("activeFilters").style.display = "none";
  } else {
    filterElement.classList.remove("active-filter");
    document.getElementById("activeFilters").style.display = "none";
  }

  // Reset về trang đầu tiên khi lọc
  currentPage = 1;

  loadReviews();
}

// Lấy đánh giá đã lọc
function getFilteredReviews() {
  // Lấy các giá trị filter
  const searchTerm = document
    .getElementById("reviewSearch")
    .value.toLowerCase();
  const pharmacyId = document.getElementById("pharmacyFilter").value;
  const ratingFilterValue = document.getElementById("ratingFilter").value;
  // Lấy tất cả đánh giá
  const allReviews = reviewAPI.getAll();

  // Thực hiện lọc
  const filteredReviews = allReviews.filter((review) => {
    // Lọc theo tên khách hàng
    const nameMatch = review.customer.name.toLowerCase().includes(searchTerm);

    // Lọc theo cửa hàng
    const pharmacyMatch =
      pharmacyId === "all" ||
      parseInt(review.pharmacy) === parseInt(pharmacyId); // Lọc theo số sao - đảm bảo so sánh số nguyên
    let starMatch = true;
    if (ratingFilterValue !== "all") {
      starMatch = parseInt(review.rating) === parseInt(ratingFilterValue);
    }

    // Trả về kết quả lọc tổng hợp
    return nameMatch && pharmacyMatch && starMatch;
  });
  return filteredReviews;
}

// Xóa bộ lọc đánh giá sao
function clearRatingFilter() {
  document.getElementById("ratingFilter").value = "all";
  document.getElementById("ratingFilter").classList.remove("active-filter");
  filterReviews();
}

// Tải dữ liệu đánh giá và hiển thị
async function loadReviews() {
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
    // Lấy đánh giá từ API nếu chưa có
    if (!reviewsData || reviewsData.length === 0) {
      reviewsData = await reviewAPI.getAll();
    }

    const filteredReviews = getFilteredReviews();
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
      const row = document.createElement("tr"); // Cột khách hàng
      const customerCell = document.createElement("td");
      customerCell.innerHTML = `
        <div class="customer-info" data-customer-id="${review.customer.id}" style="cursor: pointer;">
          <div class="customer-name">${review.customer.name}</div>
          <div class="customer-phone">${review.customer.phone}</div>
        </div>
      `;
      customerCell.title = "Click để xem thông tin khách hàng";
      row.appendChild(customerCell);

      // Cột đánh giá
      const ratingCell = document.createElement("td");
      let stars = "";
      for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${
          i <= review.rating ? "filled" : ""
        }">★</span>`;
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
      row.appendChild(timeCell); // Cột trạng thái (đơn giản hóa chỉ còn "Đã xử lý" và "Chưa xử lý")
      const statusCell = document.createElement("td");
      const statusClass =
        review.status === "Đã xử lý" ? "status-success" : "status-error";
      statusCell.innerHTML = `<span class="status-badge ${statusClass}">${
        review.status === "Đã xử lý" ? "Đã xử lý" : "Chưa xử lý"
      }</span>`;
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
}

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

// ====================================
// XỬ LÝ TÌM KIẾM KHÁCH HÀNG
// ====================================

// Tìm kiếm khách hàng
function searchCustomers(query) {
  if (!query || query.length < 2) {
    document.getElementById("customerSuggestions").style.display = "none";
    return;
  }

  const filteredCustomers = customerAPI.search(query);
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
        <div class="customer-name">${customer.name}</div>
        <div class="customer-phone">${customer.phone}</div>
      `;
      item.addEventListener("click", function () {
        selectCustomer(customer);
      });
      suggestionBox.appendChild(item);
    });
  }

  suggestionBox.style.display = "block";
}

// Chọn khách hàng
async function selectCustomer(customerId, customerName) {
  // If we receive a customer object instead of id and name
  if (typeof customerId === "object") {
    customerName = customerId.name;
    customerId = customerId.id;
  }

  window.selectedCustomerId = customerId;

  document.getElementById("customerSuggestions").style.display = "none";
  document.getElementById("customerSearch").value = "";

  document.getElementById("selectedCustomer").style.display = "flex";
  document.getElementById("selectedCustomerName").textContent = customerName;

  // Find customer phone number if not provided
  const customer = customers.find((c) => c.id === parseInt(customerId));
  if (customer) {
    document.getElementById("selectedCustomerPhone").textContent =
      customer.phone;
  } else {
    document.getElementById("selectedCustomerPhone").textContent = "";
  }
  // Nếu loại tin nhắn là nhắc uống thuốc, lấy thông tin hóa đơn gần nhất
  const messageType = document.getElementById("messageType").value;
  if (messageType === "reminder") {
    try {
      const invoice = await customerAPI.getLatestInvoice(customerId);
      if (invoice && invoice.takeNote) {
        // Chèn take note vào nội dung tin nhắn
        document.getElementById(
          "messageContent"
        ).value = `Xin chào ${customerName}! Đây là lời nhắc nhở uống thuốc từ Long Châu cho đơn hàng gần nhất của bạn.\n\nHướng dẫn sử dụng thuốc: ${invoice.takeNote}\n\nVui lòng tuân thủ đúng hướng dẫn sử dụng và liên hệ với chúng tôi nếu có thắc mắc.\n\nChúc bạn mau khỏe!`;
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error);
    }
  }
}

// Xóa khách hàng đã chọn
function clearSelectedCustomer() {
  window.selectedCustomerId = null;
  document.getElementById("selectedCustomer").style.display = "none";
  document.getElementById("customerSearch").value = "";

  // Reset nội dung tin nhắn về template mặc định
  loadMessageTemplate(document.getElementById("messageType").value);
}

// ====================================
// XỬ LÝ TIN NHẮN VÀ THÔNG BÁO
// ====================================

// Tải template tin nhắn dựa theo loại
function loadMessageTemplate(type) {
  document.getElementById("reminderNote").style.display =
    type === "reminder" ? "" : "none";

  const template = messageAPI.getTemplateByType(type);
  const content = template.content;
  const hint = template.hint;

  document.getElementById("messageContent").value = content;
  document.getElementById("templateHint").innerText = hint;
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

// Gửi tin nhắn
async function sendMessage() {
  const messageType = document.getElementById("messageType").value;
  const messageContent = document.getElementById("messageContent").value;
  const sendDateTime = document.getElementById("sendDateTime").value;
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
  const originalButtonText = sendButton.textContent;
  sendButton.innerHTML =
    '<span class="material-icons spin">refresh</span> Đang gửi...';
  sendButton.disabled = true;

  const messageData = {
    type: messageType,
    content: messageContent,
    sendTime: sendDateTime || "Ngay lập tức",
    target: targetType,
    customerId: window.selectedCustomerId,
    channels: channels.join(", "),
  };

  try {
    // Gửi thông qua API
    const result = await messageAPI.send(messageData);

    // Nếu đang trả lời đánh giá, cập nhật trạng thái đánh giá thành "Đã xử lý"
    if (window.currentReviewId) {
      await reviewAPI.updateStatus(window.currentReviewId, "Đã xử lý");
      window.currentReviewId = null;

      // Tải lại danh sách đánh giá để hiển thị trạng thái mới
      await loadReviews();
    }

    // Hiển thị thông báo thành công
    alert("Đã gửi tin nhắn thành công!");

    // Xóa nội dung tin nhắn sau khi gửi thành công
    document.getElementById("messageContent").value = "";
  } catch (error) {
    console.error("Error sending message:", error);
    // Hiển thị lỗi nếu có
    alert("Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.");
  } finally {
    // Khôi phục trạng thái ban đầu của nút gửi
    sendButton.innerHTML = originalButtonText;
    sendButton.disabled = false;
  }
}

// Trả lời đánh giá
function replyReview(reviewId) {
  const review = reviewAPI.getById(reviewId);
  if (!review) return;

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

  // Hiển thị thông tin khách hàng đã chọn
  document.getElementById("selectedCustomer").style.display = "";
  document.getElementById("selectedCustomerName").textContent =
    review.customer.name;
  document.getElementById("selectedCustomerPhone").textContent =
    review.customer.phone;

  // Điền nội dung tin nhắn phản hồi
  let replyContent = "";
  if (review.rating <= 3) {
    replyContent = `Kính gửi ${review.customer.name},\n\nChúng tôi rất tiếc về trải nghiệm chưa tốt của bạn tại Long Châu. Chúng tôi đã ghi nhận phản hồi và sẽ cải thiện dịch vụ. Xin vui lòng liên hệ số 1800 XXXXX để được hỗ trợ thêm.\n\nTrân trọng,\nLong Châu`;
  } else {
    replyContent = `Kính gửi ${review.customer.name},\n\nCảm ơn bạn đã đánh giá tích cực về dịch vụ của Long Châu. Chúng tôi rất vui khi được phục vụ và mong tiếp tục nhận được sự ủng hộ của bạn.\n\nTrân trọng,\nLong Châu`;
  }

  document.getElementById("messageContent").value = replyContent;
  // Lưu ID khách hàng
  window.selectedCustomerId = review.customer.id;

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

// Hiển thị thông tin cá nhân
/**
 * Hiển thị thông tin cá nhân của người dùng và tải dữ liệu từ API
 * Hiển thị modal thông tin người dùng với dữ liệu cập nhật
 */
/**
 * Hiển thị thông tin cá nhân của người dùng và tải dữ liệu từ API
 * Hiển thị modal thông tin người dùng với dữ liệu cập nhật
 */
export async function showUserInfo() {
  // Hiển thị modal
  const modal = document.getElementById("userInfoModal");
  if (!modal) {
    console.error("Không tìm thấy element với ID 'userInfoModal'");
    return;
  }

  modal.classList.add("show");

  try {
    // Hiển thị trạng thái đang tải
    const statItems = document.querySelectorAll(
      ".stat-item-modal .stat-number"
    );
    statItems.forEach((item) => {
      item.innerHTML =
        '<span class="loading-indicator"><i class="material-icons spin">refresh</i></span>';
    });

    // Lấy thông tin người dùng từ API
    const currentUser = await userAPI.getCurrentUser();

    // Cập nhật thông tin cơ bản
    document.getElementById("modalEmployeeName").textContent = currentUser.name;
    document.getElementById("modalEmployeeRole").textContent = currentUser.role;
    document.getElementById("modalEmployeeEmail").textContent =
      currentUser.email;
    document.getElementById("modalEmployeePhone").textContent =
      currentUser.phone;
    document.getElementById("modalEmployeeUsername").textContent =
      currentUser.username; // Cập nhật trạng thái
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

    // Lấy thống kê công việc hôm nay
    const todayStats = await userAPI.getDailyStats();

    // Cập nhật thống kê
    const statElements = document.querySelectorAll(
      ".stat-item-modal .stat-number"
    );
    if (statElements.length >= 3 && todayStats) {
      statElements[0].textContent = todayStats.messagesSent || "0";
      statElements[1].textContent = todayStats.reviewsProcessed || "0";
      statElements[2].textContent = todayStats.customersServed || "0";
    }
  } catch (error) {
    console.error("Lỗi khi tải thông tin người dùng:", error);

    // Hiển thị thông báo lỗi cho người dùng
    const modalBody = document.querySelector(".modal-body");
    if (modalBody) {
      const errorMessage = document.createElement("div");
      errorMessage.className = "api-error-message";
      errorMessage.innerHTML = `
        <span class="material-icons">error</span>
        <span>Không thể tải thông tin người dùng. Vui lòng thử lại sau.</span>
      `;
      modalBody.prepend(errorMessage);

      // Tự động ẩn thông báo sau 5 giây
      setTimeout(() => {
        if (errorMessage.parentNode) {
          errorMessage.remove();
        }
      }, 5000);
    }
  }
}

// Các hàm lấy thông tin người dùng và thống kê đã được chuyển sang userAPI trong customer-service-api.js

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

// Event listener for customer information clicks

// Event listener for customer information clicks
document.addEventListener("click", function (e) {
  if (e.target.closest("[data-customer-id]")) {
    // Customer element clicked - handler already in place elsewhere
  }
});

/**
 * Thiết lập các global handlers để tương tác với HTML onclick attributes
 */
function setupGlobalHandlers() {
  // Đưa các hàm vào global scope để có thể gọi từ HTML
  window.showUserInfo = () => {
    showUserInfo();
    return false; // Prevent default action
  };

  window.logout = () => {
    logout();
    return false; // Prevent default action
  };

  window.closeUserInfoModal = () => {
    closeUserInfoModal();
    return false; // Prevent default action
  };

  // 1. User Info Button trong dropdown (sử dụng ID cụ thể)
  const userInfoBtn = document.getElementById("btnUserInfo");
  if (userInfoBtn) {
    userInfoBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Ẩn dropdown trước
      document.getElementById("userDropdown").classList.remove("show");
      // Sau đó hiển thị modal với độ trễ nhỏ
      setTimeout(() => {
        showUserInfo();
      }, 100);
    });
  } else {
    console.error("Không tìm thấy nút thông tin người dùng theo ID");
  }

  const logoutBtn = document.getElementById("btnLogout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      logout();
    });
  } else {
    console.error("Không tìm thấy nút đăng xuất theo ID");
  }

  // Thêm event listeners trực tiếp cho các nút đóng
  const closeModalButtons = document.querySelectorAll(
    ".modal-close, .btn-secondary"
  );
  closeModalButtons.forEach((button) => {
    if (button.getAttribute("onclick")?.includes("closeUserInfoModal")) {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        closeUserInfoModal();
      });
    }
  });
}
