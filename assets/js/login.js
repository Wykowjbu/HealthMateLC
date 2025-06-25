document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const messageDiv = document.getElementById('message');
    const loadingDiv = document.getElementById('loading');
    const loginButton = document.getElementById('loginButton');

    if (!username || !password) {
        messageDiv.innerHTML = '<div class="error">Vui lòng nhập đầy đủ tên người dùng và mật khẩu!</div>';
        return;
    }

    loadingDiv.style.display = 'block';
    loginButton.disabled = true;
    messageDiv.innerHTML = '';

    try {
        console.log('Sending login request to: http://localhost:8080/api/auth/login');
        const response = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        console.log('Response status:', response.status);
        let data;
        try {
            data = await response.json(); // Parse chỉ nếu có body
        } catch (parseError) {
            console.error('Parse error:', parseError);
            data = { success: false, message: 'Dữ liệu phản hồi không hợp lệ' };
        }
        console.log('Response data:', data);

        if (response.ok && data.success) {
            messageDiv.innerHTML = '<div class="success">' + data.message + '</div>';
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
        loadingDiv.style.display = 'none';
        loginButton.disabled = false;
    }
});

// ... (giữ nguyên các event listener khác)