document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const messageDiv = document.getElementById('message');
    const loadingDiv = document.getElementById('loading');
    const loginButton = document.getElementById('loginButton');

    // Validate input
    if (!username || !password) {
        messageDiv.innerHTML = '<div class="error">Vui lòng nhập đầy đủ tên người dùng và mật khẩu!</div>';
        return;
    }

    // Show loading
    loadingDiv.style.display = 'block';
    loginButton.disabled = true;
    messageDiv.innerHTML = '<p>Đang xử lý...</p>';

    try {
        const response = await fetch('http://localhost:8080/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // IMPORTANT: This ensures cookies are sent and received
            body: JSON.stringify({
                username: username,
                password: password
            }),
        });

        // Parse JSON response
        const data = await response.json();

        if (response.ok && data.success) {
            messageDiv.innerHTML = '<div class="success">' + data.message + '</div>';

            // Store session info in localStorage (optional, for debugging)
            if (data.sessionId) {
                localStorage.setItem('sessionId', data.sessionId);
            }
            if (data.role) {
                localStorage.setItem('userRole', data.role);
            }

            // Chuyển hướng sau 1 giây
            setTimeout(() => {
                window.location.href = data.redirectUrl;
            }, 1000);

        } else {
            messageDiv.innerHTML = '<div class="error">' + (data.message || 'Đăng nhập thất bại!') + '</div>';
        }

    } catch (error) {
        console.error('Login error:', error);
        messageDiv.innerHTML = '<div class="error">Có lỗi xảy ra khi kết nối đến server. Vui lòng thử lại!</div>';
    } finally {
        // Hide loading
        loadingDiv.style.display = 'none';
        loginButton.disabled = false;
    }
});

// Clear message when user starts typing
document.getElementById('username').addEventListener('input', clearMessage);
document.getElementById('password').addEventListener('input', clearMessage);

function clearMessage() {
    document.getElementById('message').innerHTML = '';
}

// Check for URL parameters (error messages)
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    if (message) {
        document.getElementById('message').innerHTML = '<div class="error">' + decodeURIComponent(message) + '</div>';
    }
});