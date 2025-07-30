document.addEventListener('DOMContentLoaded', () => {
    const step1 = document.querySelector('.step1');
    const step2 = document.querySelector('.step2');
    const step3 = document.querySelector('.step3');

    if (!step1 || !step2 || !step3) {
        console.error('Không tìm thấy các bước trong DOM:', { step1, step2, step3 });
        return;
    }

    step1.classList.add('active');

    document.getElementById('requestOtpButton').addEventListener('click', async () => {
        const username = document.getElementById('resetUsername').value;
        if (!username) return showToast('Vui lòng nhập tên đăng nhập');

        try {
            console.log('Sending request to: http://localhost:8080/api/auth/request-otp');
            const response = await fetch('http://localhost:8080/api/auth/request-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `username=${encodeURIComponent(username)}`
            });
            console.log('Response status:', response.status);
            const responseText = await response.text();
            console.log('Response text:', responseText);
            if (response.status === 200) {
                console.log('Switching to step2');
                step1.classList.remove('active');
                step2.classList.add('active');
                console.log('Step1 active:', step1.classList.contains('active'));
                console.log('Step2 active:', step2.classList.contains('active'));
            } else {
                showToast(`Lỗi: ${response.status} - ${responseText || 'Lỗi server'}`);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showToast('Lỗi hệ thống: ' + error.message);
        }
    });

    document.getElementById('verifyOtpButton').addEventListener('click', async () => {
        const username = document.getElementById('resetUsername').value;
        const otp = document.getElementById('otp').value;
        if (!otp) return showToast('Vui lòng nhập OTP');

        try {
            const response = await fetch('http://localhost:8080/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `username=${encodeURIComponent(username)}&otp=${encodeURIComponent(otp)}`
            });
            if (response.status === 200) {
                step2.classList.remove('active');
                step3.classList.add('active');
            } else {
                showToast('OTP không hợp lệ');
            }
        } catch (error) {
            showToast('Lỗi Hệ Thống');
        }
    });

    document.getElementById('changePasswordButton').addEventListener('click', async () => {
        const username = document.getElementById('resetUsername').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) return showToast('Mật khẩu không khớp');
        if (!newPassword) return showToast('Vui lòng nhập mật khẩu mới');

        try {
            const response = await fetch('http://localhost:8080/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `username=${encodeURIComponent(username)}&newPassword=${encodeURIComponent(newPassword)}`
            });
            if (response.status === 200) {
                showToast('Đổi mật khẩu thành công');
                window.location.href = 'index.html';
            } else {
                showToast('Lỗi khi đổi mật khẩu');
            }
        } catch (error) {
            showToast('Lỗi hệ thống');
        }
    });
});

// Toast notification
function showToast(message) {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector(".toast-container");

  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  // Create toast
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-message">${message}</span>
    </div>
    <span class="toast-close">&times;</span>
  `;

  // Add toast to container
  toastContainer.appendChild(toast);

  // Animation
  setTimeout(() => toast.classList.add("show"), 10);

  // Close button functionality
  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}
