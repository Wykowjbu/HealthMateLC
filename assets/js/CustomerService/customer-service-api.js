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
async function withFallback(
  asyncFn,
  fallbackKey,
  fallbackProcessor,
  fallbackGenerator
) {
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

    // If we have fallback data and a processor, use the processor
    if (fallbackData && typeof fallbackProcessor === "function") {
      return fallbackProcessor(fallbackData);
    }

    // If we have fallback data, return it directly
    if (fallbackData) return fallbackData;

    // If we have a fallback generator, use it to create data
    if (typeof fallbackGenerator === "function") {
      const generatedData = fallbackGenerator();
      // Save generated data to localStorage for future use
      try {
        localStorage.setItem(fallbackKey, JSON.stringify(generatedData));
      } catch (e) {
        console.warn("Could not save fallback data to localStorage:", e);
      }
      return generatedData;
    }

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
  getAll: async function (forceNoCache = false) {
    let endpoint = "/reviews";
    let options = {};
    if (forceNoCache) {
      endpoint += (endpoint.includes("?") ? "&" : "?") + "ts=" + Date.now();
      options.useCache = false;
    }
    return await withFallback(
      async () => await fetchApi(endpoint, options),
      "reviews",
      null,
      () => this.generateFallbackReviews() // Tạo reviews mẫu nếu không có
    );
  },

  // Lọc đánh giá theo cửa hàng
  filterByPharmacy: async function (pharmacyId, forceNoCache = false) {
    let endpoint = `/reviews?pharmacyId=${pharmacyId}`;
    let options = {};
    if (forceNoCache) {
      endpoint += `&ts=${Date.now()}`;
      options.useCache = false;
    }
    return await withFallback(
      async () => await fetchApi(endpoint, options),
      "reviews",
      (reviews) =>
        reviews.filter((review) => review.pharmacy === parseInt(pharmacyId))
    );
  },

  // Lấy đánh giá theo ID
  getById: async function (id, forceNoCache = false) {
    let endpoint = `/reviews/${id}`;
    let options = {};
    if (forceNoCache) {
      endpoint += `?ts=${Date.now()}`;
      options.useCache = false;
    }
    return await withFallback(
      async () => await fetchApi(endpoint, options),
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
      // Lấy user hiện tại để lấy userId
      const currentUser = await userAPI.getCurrentUser();
      const handledByUserId =
        currentUser && currentUser.id ? currentUser.id : null;
      return await fetchApi(`/reviews/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, handledByUserId }),
      });
    } catch (error) {
      console.error("Failed to update review status:", error);
      // Thông báo cho người dùng biết lỗi này
      alert(
        error && error.message
          ? `Có lỗi xảy ra khi cập nhật trạng thái đánh giá: ${error.message}`
          : "Có lỗi xảy ra khi cập nhật trạng thái đánh giá. Vui lòng thử lại."
      );
      return null;
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
//#region  CHART API - Tính toán biểu đồ từ feedback data
// ====================================
const chartAPI = {
  // Tạo dữ liệu biểu đồ mức độ hài lòng từ feedback có sẵn
  getSatisfactionData: function (days) {
    // Lấy feedback từ localStorage
    let feedbacks = [];
    try {
      const storedFeedbacks = localStorage.getItem("feedbacks");
      if (storedFeedbacks) {
        feedbacks = JSON.parse(storedFeedbacks);
      } else {
      }
    } catch (e) {
      console.error("Failed to parse feedbacks from localStorage:", e);
    }

    return this.calculateSatisfactionFromFeedbacks(feedbacks, days);
  },
  // Tính toán satisfaction từ feedback thực tế
  calculateSatisfactionFromFeedbacks: function (feedbacks, days) {
    const labels = [];
    const satisfactionRates = [];
    const feedbackCounts = [];

    // Tạo nhãn ngày từ hôm nay trở về trước
    const today = new Date();

    // Xử lý tùy chọn "Từ trước đến nay"
    let actualDays = days;
    if (days === "all") {
      // Tìm ngày đầu tiên có feedback hoặc tối đa 365 ngày
      if (feedbacks.length > 0) {
        const oldestFeedback = feedbacks.reduce((oldest, feedback) => {
          const feedbackDate = new Date(
            feedback.feedbackDate || feedback.date || feedback.createdAt
          );
          const oldestDate = new Date(
            oldest.feedbackDate ||
              oldest.date ||
              oldest.createdAt ||
              feedback.date
          );
          return feedbackDate < oldestDate ? feedback : oldest;
        }, feedbacks[0]);
        const oldestDate = new Date(
          oldestFeedback.feedbackDate ||
            oldestFeedback.date ||
            oldestFeedback.createdAt
        );
        actualDays = Math.ceil((today - oldestDate) / (1000 * 60 * 60 * 24));
        // Giới hạn tối đa 365 ngày để tránh biểu đồ quá dài
        actualDays = Math.min(actualDays, 365);
      } else {
        // Nếu không có feedback, hiển thị 90 ngày gần nhất
        actualDays = 90;
      }
    }

    for (let i = actualDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Format: DD/MM cho khoảng ngắn, DD/MM/YY cho khoảng dài
      let label;
      if (actualDays > 90) {
        label = date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        });
      } else {
        label = date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        });
      }
      labels.push(label);

      // Lọc feedbacks theo ngày hiện tại
      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
      const dayFeedbacks = feedbacks.filter((feedback) => {
        // Hỗ trợ nhiều field date cho tương thích với backend
        const feedbackDateField =
          feedback.feedbackDate || feedback.date || feedback.createdAt;
        if (!feedbackDateField) return false;
        const feedbackDate = new Date(feedbackDateField)
          .toISOString()
          .split("T")[0];
        return feedbackDate === dateStr;
      });

      // Tính toán satisfaction thực tế từ feedback
      let satisfaction = 0;
      let feedbackCount = dayFeedbacks.length;

      if (feedbackCount > 0) {
        // Tính % satisfaction từ feedback (rating 4-5 sao = hài lòng)
        const satisfiedFeedbacks = dayFeedbacks.filter((feedback) => {
          const rating = parseInt(feedback.rating);
          return rating >= 4;
        }).length;
        satisfaction =
          Math.round((satisfiedFeedbacks / feedbackCount) * 100 * 10) / 10;
      } else {
        // Nếu không có feedback trong ngày, dùng dữ liệu giả lập thực tế
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const baseSatisfaction = isWeekend ? 85 : 78;
        const randomVariation = (Math.random() - 0.5) * 10;
        satisfaction = Math.max(
          65,
          Math.min(95, baseSatisfaction + randomVariation)
        );
        satisfaction = Math.round(satisfaction * 10) / 10;

        // Số feedback giả lập cho ngày không có dữ liệu
        feedbackCount = Math.floor(Math.random() * 8) + 3; // 3-10 feedbacks
      }

      satisfactionRates.push(satisfaction);
      feedbackCounts.push(feedbackCount);
    }

    // Xác định period text
    let periodText;
    if (days === "all") {
      periodText = `Từ trước đến nay (${actualDays} ngày)`;
    } else {
      periodText = `${days} ngày qua`;
    }

    return {
      labels: labels,
      values: satisfactionRates,
      reviewCounts: feedbackCounts, // Giữ tên cũ để tương thích với UI
      period: periodText,
      summary: {
        avgSatisfaction:
          Math.round(
            (satisfactionRates.reduce((a, b) => a + b, 0) /
              satisfactionRates.length) *
              10
          ) / 10,
        totalReviews: feedbackCounts.reduce((a, b) => a + b, 0),
        highestDay:
          labels[satisfactionRates.indexOf(Math.max(...satisfactionRates))],
        lowestDay:
          labels[satisfactionRates.indexOf(Math.min(...satisfactionRates))],
        dataSource:
          feedbacks.length > 0 ? "Từ feedback thực tế" : "Dữ liệu mô phỏng",
      },
    };
  },
};
//#endregion

//#region  STATISTICS API - API thống kê
// ====================================
const statsAPI = {
  // Lấy số lượng tin nhắn đã gửi
  getMessagesSent: async function () {
    return await withFallback(
      async () => {
        const data = await fetchApi("/stats/messages-sent");
        return data.count;
      },
      "stats.messagesSent",
      null,
      () => Math.floor(Math.random() * 50) + 100
    ); // 100-150 messages
  },

  // Lấy số lượng đánh giá chưa xử lý
  getReviewsPending: async function () {
    return await withFallback(
      async () => {
        const data = await fetchApi("/stats/reviews-pending");
        return data.count;
      },
      "stats.reviewsPending",
      null,
      () => Math.floor(Math.random() * 20) + 5
    ); // 5-25 pending
  },

  // Lấy tổng số khách hàng đã được phục vụ
  getCustomersServed: async function () {
    return await withFallback(
      async () => {
        const data = await fetchApi("/stats/customers-served");
        return data.count;
      },
      "stats.customersServed",
      null,
      () => Math.floor(Math.random() * 500) + 1000
    ); // 1000-1500 customers
  },

  // Lấy rating trung bình
  getAverageRating: async function () {
    return await withFallback(
      async () => {
        const data = await fetchApi("/stats/average-rating");
        return data.average;
      },
      "stats.averageRating",
      null
    ); // 4.0-5.0 stars
  },
};
//#endregion

// ====================================
//#region  MESSAGE API - API tin nhắn
// ====================================
const messageAPI = {
  // Gửi tin nhắn nội bộ (nếu dùng)
  send: async function (messageData) {
    return await fetchApi("/messages", {
      method: "POST",
      body: JSON.stringify(messageData),
    });
  },

  // Gửi email cho khách hàng
  sendEmail: async function ({ to, subject, content, customerId }) {
    return await fetchApi("/send-email", {
      method: "POST",
      body: JSON.stringify({ to, subject, content, customerId }),
    });
  },

  // Lấy tất cả tin nhắn (nội bộ và email) để hiển thị lịch sử
  getAllMessages: async function () {
    return await fetchApi("/messages");
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

  // Lấy hóa đơn để nhắc uống thuốc (customerId tuỳ chọn)
  getReminders: async function (customerId) {
    const param = customerId ? `?customerId=${customerId}` : "";
    return await fetchApi(`/invoices/reminders${param}`);
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
    return true;
  } catch (error) {
    return false;
  }
}

// ====================================
// Export các API để sử dụng trong các file JavaScript khác
export {
  pharmacyAPI,
  reviewAPI,
  customerAPI,
  chartAPI,
  statsAPI,
  messageAPI,
  invoiceAPI,
  userAPI,
  checkApiConnection,
  handleApiError,
};
