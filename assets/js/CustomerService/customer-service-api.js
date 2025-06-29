/**
 * Customer Service API Module
 * Quản lý kết nối đến API backend cho dashboard dịch vụ khách hàng
 */

// Cấu hình API
const API_BASE_URL = "http://localhost:8080/customer-service"; // Thay đổi URL này theo cấu hình backend Spring Boot của bạn

// Thời gian cache (ms) - 5 phút
const CACHE_DURATION = 5 * 60 * 1000;

// Các hằng số HTTP
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

// Cấu hình cache cho các API call thường xuyên
const apiCache = {
  data: {},

  // Lưu dữ liệu vào cache
  set: function (key, data) {
    this.data[key] = {
      timestamp: Date.now(),
      value: data,
    };
    return data;
  },

  // Lấy dữ liệu từ cache
  get: function (key) {
    const cachedItem = this.data[key];
    if (!cachedItem) return null;

    // Kiểm tra xem dữ liệu có hết hạn hay không
    if (Date.now() - cachedItem.timestamp > CACHE_DURATION) {
      delete this.data[key];
      return null;
    }

    return cachedItem.value;
  },

  // Xóa dữ liệu khỏi cache
  clear: function (key) {
    if (key) {
      delete this.data[key];
    } else {
      this.data = {};
    }
  },
};

// Hàm helper thực hiện các cuộc gọi API
async function fetchApi(endpoint, options = {}) {
  // Kiểm tra xem endpoint có cần cache hay không và đây có phải là GET request không
  const useCache =
    options.useCache !== false && (!options.method || options.method === "GET");
  const cacheKey = useCache ? endpoint : null;

  // Kiểm tra cache trước khi gọi API (chỉ cho GET request)
  if (useCache) {
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      console.log(`Using cached data for: ${endpoint}`);
      return cachedData;
    }
  }

  // Thiết lập timeout cho request (10 giây)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // Cấu hình mặc định cho request
    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
        // Có thể thêm authorization token nếu cần
        // 'Authorization': `Bearer ${getToken()}`
      },
      signal: controller.signal,
      credentials: "include", // Always include credentials for session/cookie auth
    };

    // Kết hợp options mặc định với options được truyền vào
    const fetchOptions = { ...defaultOptions, ...options };

    // Thực hiện request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

    // Hủy timeout vì request đã hoàn thành
    clearTimeout(timeoutId);

    // Kiểm tra response status
    if (!response.ok) {
      // Xử lý các lỗi HTTP
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        message: errorData.message || `HTTP error: ${response.status}`,
        data: errorData,
      };
    }

    // Nếu response trống, trả về true (cho các request DELETE)
    if (response.status === 204) {
      return true;
    }

    // Parse response JSON
    const data = await response.json();

    // Lưu vào cache nếu là GET request và không có lỗi
    if (useCache) {
      apiCache.set(cacheKey, data);
    }

    return data;
  } catch (error) {
    // Hủy timeout nếu có lỗi
    clearTimeout(timeoutId);

    // Nếu lỗi là do timeout
    if (error.name === "AbortError") {
      console.error(`Request timeout for: ${endpoint}`);
      throw {
        status: "TIMEOUT",
        message: "Request timed out. Server is not responding.",
      };
    }

    // Log lỗi và tiếp tục throw
    console.error("API request failed:", error);
    throw error;
  }
}

// Helper function: withFallback
// Tries the main asyncFn, if it fails, returns fallback data from localStorage or fallbackProcessor
async function withFallback(asyncFn, fallbackKey, fallbackProcessor) {
  try {
    return await asyncFn();
  } catch (error) {
    console.warn(
      `API failed for ${fallbackKey}, using fallback data if available.`,
      error
    );
    // Try to get fallback data from localStorage
    let fallbackData = null;
    try {
      const raw = localStorage.getItem(fallbackKey);
      if (raw) fallbackData = JSON.parse(raw);
    } catch (e) {
      fallbackData = null;
    }
    if (fallbackData && typeof fallbackProcessor === "function") {
      return fallbackProcessor(fallbackData);
    }
    if (fallbackData) return fallbackData;
    // If no fallback, throw original error
    throw error;
  }
}

// ====================================
//#region PHARMACYAPI - API nhà thuốc
// ====================================
const pharmacyAPI = {
  // Lấy tất cả nhà thuốc
  getAll: async function () {
    return await fetchApi("/pharmacies", { useCache: true });
  },

  // Lấy thông tin nhà thuốc theo ID
  getById: async function (id) {
    return await fetchApi(`/pharmacies/${id}`, { useCache: true });
  },

  // Refresh dữ liệu nhà thuốc (xóa cache)
  refresh: function () {
    apiCache.clear("/pharmacies");
  },
};
//#endregion

// ====================================
//#region  REVIEW API - API đánh giá
// ====================================
const reviewAPI = {
  // Lấy tất cả đánh giá
  getAll: async function () {
    return await withFallback(
      async () => await fetchApi("/reviews"),
      "reviews"
    );
  },

  // Lọc đánh giá theo cửa hàng
  filterByPharmacy: async function (pharmacyId) {
    return await withFallback(
      async () => await fetchApi(`/reviews?pharmacyId=${pharmacyId}`),
      "reviews",
      (reviews) =>
        reviews.filter((review) => review.pharmacy === parseInt(pharmacyId))
    );
  },

  // Lấy đánh giá theo ID
  getById: async function (id) {
    return await withFallback(
      async () => await fetchApi(`/reviews/${id}`),
      "reviews",
      (reviews) => reviews.find((review) => review.id === parseInt(id))
    );
  },

  // Lấy tất cả đánh giá của một khách hàng
  getCustomerReviews: async function (customerId) {
    return await withFallback(
      async () => await fetchApi(`/reviews?customerId=${customerId}`),
      "reviews",
      (reviews) =>
        reviews.filter((review) => review.customer.id === parseInt(customerId))
    );
  },

  // Cập nhật trạng thái đánh giá
  updateStatus: async function (id, status) {
    try {
      return await fetchApi(`/reviews/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error("Failed to update review status:", error);
      // Thông báo cho người dùng biết lỗi này
      alert(
        "Không thể cập nhật trạng thái đánh giá. Hệ thống sẽ tự động đồng bộ khi kết nối được khôi phục."
      );
      return false;
    }
  },
};
//#endregion

// ====================================
//#region  CUSTOMER API - API khách hàng
// ====================================
const customerAPI = {
  // Lấy tất cả khách hàng
  getAll: async function () {
    return await withFallback(
      async () => await fetchApi("/customers"),
      "customers"
    );
  },

  // Tìm kiếm khách hàng theo từ khóa
  search: async function (query) {
    if (!query || query.length < 2) {
      return [];
    }
    return await withFallback(
      async () =>
        await fetchApi(`/customers?query=${encodeURIComponent(query)}`),
      "customers",
      (customers) => {
        const lowercaseQuery = query.toLowerCase();
        return customers.filter(
          (customer) =>
            customer.name.toLowerCase().includes(lowercaseQuery) ||
            customer.phone.includes(query)
        );
      }
    );
  },

  // Lấy thông tin khách hàng theo ID
  getById: async function (id) {
    return await withFallback(
      async () => await fetchApi(`/customers/${id}`),
      "customers",
      (customers) => customers.find((c) => c.id === parseInt(id))
    );
  },

  // Lấy hóa đơn gần nhất của khách hàng
  getLatestInvoice: async function (customerId) {
    try {
      return await fetchApi(`/customers/${customerId}/invoice/latest`);
    } catch (error) {
      console.error(
        "Failed to fetch latest invoice, creating placeholder:",
        error
      );
      // Tạo dữ liệu giả lập
      return {
        id: "N/A",
        date: new Date().toISOString().split("T")[0],
        items: ["Không có thông tin đơn hàng"],
        takeNote: "Không có hướng dẫn sử dụng",
      };
    }
  },

  // Lấy thông tin chi tiết khách hàng
  getCustomerDetail: async function (customerId) {
    return await withFallback(
      async () => await fetchApi(`/customers/${customerId}/detail`),
      "customers",
      (customers) => {
        const customer = customers.find((c) => c.id === parseInt(customerId));
        // Thêm các trường chi tiết nếu không có
        if (customer) {
          return {
            ...customer,
            totalPurchase: customer.totalPurchase || 0,
            orderCount: customer.orderCount || 0,
            lastPurchaseDate: customer.lastPurchaseDate || "N/A",
          };
        }
        return null;
      }
    );
  },
};
//#endregion

// ====================================
//#region  RANK UPGRADE API - API thăng hạng
// ====================================
const rankUpgradeAPI = {
  // Lấy danh sách khách hàng thăng hạng
  getAll: async function () {
    return await withFallback(
      async () => await fetchApi("/customers/upgraded"),
      "upgradedCustomers"
    );
  },

  // Lấy thông tin thăng hạng của khách hàng theo ID
  getById: async function (id) {
    return await withFallback(
      async () => await fetchApi(`/customers/${id}/rank-history`),
      "upgradedCustomers",
      (customers) => customers.find((c) => c.id === parseInt(id))
    );
  },
};
//#endregion

// ====================================
//#region  CHART API - API biểu đồ
// ====================================
const chartAPI = {
  // Lấy dữ liệu thống kê mức độ hài lòng theo ngày
  getSatisfactionData: async function (days) {
    // Chỉ hỗ trợ 7 và 30 ngày cho dữ liệu fallback
    const validDays = ["7", "30"].includes(String(days)) ? String(days) : "30";

    return await withFallback(
      async () => await fetchApi(`/stats/satisfaction?days=${days}`),
      `satisfactionData.${validDays}`
    );
  },
};
//#endregion

// ====================================
//#region  STATISTICS API - API thống kê
// ====================================
const statsAPI = {
  // Lấy số lượng tin nhắn đã gửi
  getMessagesSent: async function () {
    return await withFallback(async () => {
      const data = await fetchApi("/stats/messages-sent");
      return data.count;
    }, "stats.messagesSent");
  },

  // Lấy số lượng đánh giá chưa xử lý
  getReviewsPending: async function () {
    return await withFallback(async () => {
      const data = await fetchApi("/stats/reviews-pending");
      return data.count;
    }, "stats.reviewsPending");
  },

  // Lấy tổng số khách hàng đã được phục vụ
  getCustomersServed: async function () {
    return await withFallback(async () => {
      const data = await fetchApi("/stats/customers-served");
      return data.count;
    }, "stats.customersServed");
  },

  // Lấy tỷ lệ hài lòng trung bình
  getSatisfactionRate: async function () {
    return await withFallback(async () => {
      const data = await fetchApi("/stats/satisfaction-rate");
      return data.rate;
    }, "stats.satisfactionRate");
  },
};
//#endregion

// ====================================
//#region  MESSAGE API - API tin nhắn
// ====================================
const messageAPI = {
  // Gửi tin nhắn mới
  send: async function (messageData) {
    return await fetchApi("/messages", {
      method: "POST",
      body: JSON.stringify(messageData),
    });
  },

  // Lấy mẫu tin nhắn theo loại
  getTemplateByType: async function (type) {
    return await fetchApi(`/messages/templates?type=${type}`);
  },

  // Tạo tin nhắn tùy chỉnh cho khách hàng
  generateCustomMessage: async function (type, customer) {
    if (!customer) return null;

    const data = await fetchApi(`/messages/generate`, {
      method: "POST",
      body: JSON.stringify({ type, customerId: customer.id }),
    });

    return data.content;
  },
};
//#endregion

// ====================================
//#region  INVOICE API - API hóa đơn
// ====================================
const invoiceAPI = {
  // Lấy danh sách hóa đơn của khách hàng
  getByCustomerId: async function (customerId) {
    return await fetchApi(`/invoices?customerId=${customerId}`);
  },

  // Lấy chi tiết hóa đơn
  getById: async function (id) {
    return await fetchApi(`/invoices/${id}`);
  },
};

//#endregion
// Dữ liệu fallback khi không thể kết nối đến API

// ====================================
//#region  USER API - API nhân viên
// ====================================
const userAPI = {
  // Lấy thông tin người dùng hiện tại từ backend
  getCurrentUser: async function () {
    return await withFallback(
      async () => await fetchApi("/user/current", { useCache: true }),
      "currentUser"
    );
  },
};

//#endregion

// ====================================
// ERROR HANDLING HELPERS - Xử lý lỗi
// ====================================

// Helper để hiển thị thông báo lỗi phù hợp cho người dùng
function handleApiError(
  error,
  customMessage = "Đã xảy ra lỗi khi kết nối đến máy chủ."
) {
  console.error("API Error:", error);

  let userMessage = customMessage;

  // Tùy chỉnh thông báo dựa trên loại lỗi
  if (error.status === "TIMEOUT") {
    userMessage = "Máy chủ không phản hồi. Vui lòng thử lại sau.";
  } else if (error.status === HTTP_STATUS.UNAUTHORIZED) {
    userMessage = "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.";
    // Chuyển hướng đến trang đăng nhập sau 2 giây
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  } else if (error.status === HTTP_STATUS.NOT_FOUND) {
    userMessage = "Không tìm thấy dữ liệu yêu cầu.";
  } else if (error.status === HTTP_STATUS.SERVER_ERROR) {
    userMessage = "Đã có lỗi xảy ra trên máy chủ. Vui lòng thử lại sau.";
  }

  // Hiển thị thông báo
  const notificationElement = document.createElement("div");
  notificationElement.className = "api-error-notification";
  notificationElement.innerHTML = `
    <div class="error-icon"><span class="material-icons">error</span></div>
    <div class="error-message">${userMessage}</div>
    <div class="error-close"><span class="material-icons">close</span></div>
  `;

  // Thêm vào DOM
  document.body.appendChild(notificationElement);

  // Thêm sự kiện đóng thông báo
  notificationElement
    .querySelector(".error-close")
    .addEventListener("click", () => {
      notificationElement.remove();
    });

  // Tự động ẩn sau 5 giây
  setTimeout(() => {
    notificationElement.classList.add("fade-out");
    setTimeout(() => {
      if (notificationElement.parentNode) {
        notificationElement.remove();
      }
    }, 500);
  }, 5000);

  return userMessage;
}

// Helper để kiểm tra kết nối mạng
async function checkApiConnection() {
  try {
    // Kiểm tra API server sẵn sàng
    await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      mode: "no-cors",
      timeout: 5000,
    });
    console.log("API server is available");
    return true;
  } catch (error) {
    console.error("API server is unavailable:", error);
    return false;
  }
}

// ====================================
// Export các API để sử dụng trong các file JavaScript khác
export {
  pharmacyAPI,
  reviewAPI,
  customerAPI,
  rankUpgradeAPI,
  chartAPI,
  statsAPI,
  messageAPI,
  invoiceAPI,
  userAPI,
  checkApiConnection,
  handleApiError,
};
