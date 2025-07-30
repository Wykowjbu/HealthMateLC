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
        if (!username) return alert('Vui lòng nhập tên đăng nhập');

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
                alert(`Lỗi: ${response.status} - ${responseText || 'Lỗi server'}`);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            alert('Lỗi hệ thống: ' + error.message);
        }
    });

    document.getElementById('verifyOtpButton').addEventListener('click', async () => {
        const username = document.getElementById('resetUsername').value;
        const otp = document.getElementById('otp').value;
        if (!otp) return alert('Vui lòng nhập OTP');

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
                alert('OTP không hợp lệ');
            }
        } catch (error) {
            alert('Lỗi hệ thống');
        }
    });

    document.getElementById('changePasswordButton').addEventListener('click', async () => {
        const username = document.getElementById('resetUsername').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) return alert('Mật khẩu không khớp');
        if (!newPassword) return alert('Vui lòng nhập mật khẩu mới');

        try {
            const response = await fetch('http://localhost:8080/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `username=${encodeURIComponent(username)}&newPassword=${encodeURIComponent(newPassword)}`
            });
            if (response.status === 200) {
                alert('Đổi mật khẩu thành công');
                window.location.href = 'index.html';
            } else {
                alert('Lỗi khi đổi mật khẩu');
            }
        } catch (error) {
            alert('Lỗi hệ thống');
        }
    });
});