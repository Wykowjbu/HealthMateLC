// Configuration object for environment-specific settings
const config = {
    API_BASE_URL: process.env.NODE_ENV === 'production'
        ? 'https://healthmate-backend.onrender.com' // Replace with your deployed backend URL
        : 'http://localhost:8080'
};

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
        const response = await fetch(`${config.API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for session management
            body: JSON.stringify({
                username,
                password
            }),
        });

        // Parse JSON response
        const data = await response.json();

        if (response.ok && data.success) {
            messageDiv.innerHTML = '<div class="success">' + (data.message || 'Đăng nhập thành công!') + '</div>';

            // Validate redirect URL
            if (!data.redirectUrl) {
                throw new Error('Không nhận được URL chuyển hướng từ server');
            }

            // Redirect after 1 second
            setTimeout(() => {
                window.location.href = data.redirectUrl;
            }, 1000);
        } else {
            // Handle specific error statuses
            let errorMessage = data.message || 'Đăng nhập thất bại!';
            if (response.status === 401) {
                errorMessage = 'Tên đăng nhập hoặc mật khẩu không đúng!';
            } else if (response.status === 500) {
                errorMessage = 'Lỗi server. Vui lòng thử lại sau!';
            }
            messageDiv.innerHTML = '<div class="error">' + errorMessage + '</div>';
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
const clearMessage = () => {
    document.getElementById('message').innerHTML = '';
};

document.getElementById('username').addEventListener('input', clearMessage);
document.getElementById('password').addEventListener('input', clearMessage);

// Check for URL parameters (error messages)
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    if (message) {
        document.getElementById('message').innerHTML = '<div class="error">' + decodeURIComponent(message) + '</div>';
    }
});