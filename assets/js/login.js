document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const loginButton = document.getElementById("loginButton");

  // Validate input
  if (!username || !password) {
    const apiStatusElement = document.createElement("div");
    apiStatusElement.className = "api-status ";
    apiStatusElement.innerHTML = `
        <div class="status-icon">
          <span class="material-icons"></span>
        </div>
        <div class="status-text">Vui lòng nhập đầy đủ tên người dùng và mật khẩu!</div>
      `;
  }
  loginButton.disabled = true;

  try {
    const response = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // IMPORTANT: This ensures cookies are sent and received
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    // Parse JSON response
    const data = await response.json();

    // Log toàn bộ response để debug
    console.log("Login response data:", data);

    if (response.ok && data.success) {
      // Hiển thị thông báo đăng nhập thành công dạng popup ở góc phải trên
      const apiStatusElement = document.createElement("div");
      apiStatusElement.className = "api-status connected";
      apiStatusElement.innerHTML = `
        <div class="status-icon">
          <span class="material-icons"></span>
        </div>
        <div class="status-text">Đăng nhập thành công!</div>
      `;
      document.body.appendChild(apiStatusElement);
      setTimeout(() => {
        apiStatusElement.classList.add("fade-out");
        setTimeout(() => apiStatusElement.remove(), 2000);
      }, 2000);

      // Hiển thị userId trên console
      if (data.userId) {
        console.log("User ID từ backend:", data.userId);
        localStorage.setItem("currentUserId", data.userId);
      }
      if (data.sessionId) {
        localStorage.setItem("sessionId", data.sessionId);
        console.log("Session ID:", data.sessionId);
      }
      if (data.role) {
        localStorage.setItem("userRole", data.role);
        console.log("User Role:", data.role);
      }
      setTimeout(() => {
        window.location.href = data.redirectUrl;
      }, 1000);
    } else {
      // Hiển thị thông báo đăng nhập thất bại dạng popup ở góc phải trên
      const apiStatusElement = document.createElement("div");
      apiStatusElement.className = "api-status disconnected";
      apiStatusElement.innerHTML = `
        <div class="status-icon">
          <span class="material-icons"></span>
        </div>
        <div class="status-text">Đăng nhập thất bại! ${
          data.message ? data.message : ""
        }</div>
      `;
      document.body.appendChild(apiStatusElement);
      setTimeout(() => {
        apiStatusElement.classList.add("fade-out");
        setTimeout(() => apiStatusElement.remove(), 500);
      }, 2500);
    }
  } catch (error) {
    // Hiển thị thông báo lỗi kết nối dạng popup ở góc phải trên
    const apiStatusElement = document.createElement("div");
    apiStatusElement.className = "api-status disconnected";
    apiStatusElement.innerHTML = `
      <div class="status-icon">
        <span class="material-icons"></span>
      </div>
      <div class="status-text">Có lỗi xảy ra khi kết nối đến server. Vui lòng thử lại!</div>
    `;
    document.body.appendChild(apiStatusElement);
    setTimeout(() => {
      apiStatusElement.classList.add("fade-out");
      setTimeout(() => apiStatusElement.remove(), 500);
    }, 2500);
  } finally {
    loginButton.disabled = false;
  }
});

// Clear message when user starts typing
document.getElementById("username").addEventListener("input", clearMessage);
document.getElementById("password").addEventListener("input", clearMessage);

function clearMessage() {
  document.getElementById("message").innerHTML = "";
}

// Check for URL parameters (error messages)
window.addEventListener("load", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const message = urlParams.get("message");
  if (message) {
    document.getElementById("message").innerHTML =
      '<div class="error">' + decodeURIComponent(message) + "</div>";
  }
});

