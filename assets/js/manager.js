async function handleUserProfile() {
    console.log('Đang hiển thị thông tin user...');
    try {
        const response = await fetch('http://localhost:8080/manager/profile?detail=true', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                window.location.href = '/HealthMateLC/index.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Dữ liệu user profile:', data);

        const userFullNameElement = document.getElementById('userFullName');
        const userPharmacyNameElement = document.getElementById('userPharmacyName');

        if (userFullNameElement && data.fullName) {
            userFullNameElement.textContent = data.fullName;
        }
        if (userPharmacyNameElement && data.pharmacyName) {
            userPharmacyNameElement.textContent = data.pharmacyName;
        } else if (userPharmacyNameElement && data.pharmacyAddress) {
            userPharmacyNameElement.textContent = data.pharmacyAddress;
        }

        console.log('Thông tin người dùng đã được tải và hiển thị.');

    } catch (error) {
        console.error('Lỗi khi lấy thông tin user profile:', error);
        alert('Không thể tải thông tin người dùng. Vui lòng thử lại. Lỗi: ' + error.message);
        window.location.href = '/HealthMateLC/index.html';
    }
}

function initializeUserDropdown() {
    const userProfile = document.querySelector(".user-profile");
    const userDropdown = document.getElementById("userDropdown");

    if (userProfile && userDropdown) {
        userProfile.addEventListener("click", function (e) {
            e.stopPropagation();
            userDropdown.classList.toggle("show");
        });

        document.addEventListener("click", function (e) {
            if (!userProfile.contains(e.target)) {
                userDropdown.classList.remove("show");
            }
        });

        userDropdown.addEventListener("click", function (e) {
            e.stopPropagation();
        });
    }
}

async function showUserInfo() {
    console.log('Hiển thị thông tin cá nhân...');
    try {
        const response = await fetch('http://localhost:8080/manager/showprofile', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                window.location.href = '/HealthMateLC/index.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Dữ liệu hồ sơ đầy đủ:', data);

        let modal = document.getElementById('userInfoModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'userInfoModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close">×</span>
                    <h2>Thông tin cá nhân</h2>
                    <div id="userInfoContent"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const userInfoContent = document.getElementById('userInfoContent');
        userInfoContent.innerHTML = `
                <p><strong>Họ và tên:</strong> ${data.fullName || 'Chưa cập nhật'}</p>
            <p><strong>Số điện thoại:</strong> ${data.phone || 'Chưa cập nhật'}</p>
            <p><strong>Email:</strong> ${data.email || 'Chưa cập nhật'}</p>
            <p><strong>ID Chi nhánh:</strong> ${data.pharmacyId || 'Chưa gán'}</p>
            <p><strong>Tên chi nhánh:</strong> ${data.pharmacyName || 'Chưa gán'}</p>
            <p><strong>Địa chỉ chi nhánh:</strong> ${data.pharmacyAddress || 'Chưa gán'}</p>
            <p><strong>Số điện thoại chi nhánh:</strong> ${data.pharmacyPhone || 'Chưa gán'}</p>
        `;

        modal.style.display = 'block';

        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };

        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };

        console.log('Thông tin cá nhân đã được hiển thị.');

    } catch (error) {
        console.error('Lỗi khi lấy thông tin cá nhân:', error);
        alert('Không thể tải thông tin cá nhân. Vui lòng thử lại. Lỗi: ' + error.message);
        window.location.href = '/HealthMateLC/index.html';
    }
}

async function logout() {
    console.log('Đang đăng xuất...');
    try {
        const response = await fetch('http://localhost:8080/logout', {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Logout response:', data);
            alert(data.message || 'Đăng xuất thành công!');
            window.location.href = data.redirectUrl || '/HealthMateLC/index.html';
        } else {
            throw new Error('Đăng xuất thất bại. Vui lòng thử lại.');
        }
    } catch (error) {
        console.error('Lỗi khi đăng xuất:', error);
        alert('Đã xảy ra lỗi khi đăng xuất: ' + error.message);
        window.location.href = '/HealthMateLC/index.html';
    }
}

function navigate(section) {
    document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
    document.getElementById(`${section}-section`).style.display = 'block';
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`.nav-item[data-section="${section}"]`).classList.add('active');
    const headerTitle = document.getElementById('header-title');
    const actionBtn = document.getElementById('header-action-btn');
    const actionText = document.getElementById('header-action-text');
    switch (section) {
        case 'dashboard':
            headerTitle.textContent = 'Chi nhánh Quận 1 - Nguyễn Huệ';
            actionText.textContent = 'Tạo lịch làm việc';
            actionBtn.onclick = handleCreateSchedule;
            break;
        case 'work_schedule':
            headerTitle.textContent = 'Lịch làm việc - Chi nhánh Quận 1';
            actionText.textContent = 'Tạo lịch làm việc';
            actionBtn.onclick = handleCreateSchedule;
            break;
        case 'edit_schedule':
            headerTitle.textContent = 'Chỉnh sửa lịch - Chi nhánh Quận 1';
            actionText.textContent = 'Tạo lịch làm việc';
            actionBtn.onclick = handleCreateSchedule;
            break;
        case 'view_invoices':
            headerTitle.textContent = 'Xem hóa đơn - Chi nhánh Quận 1';
            actionText.textContent = 'Tạo hóa đơn mới';
            actionBtn.onclick = createInvoice;
            break;
        case 'edit_invoice':
            headerTitle.textContent = 'Chỉnh sửa hóa đơn - Chi nhánh Quận 1';
            actionText.textContent = 'Tạo hóa đơn mới';
            actionBtn.onclick = createInvoice;
            break;
        case 'delete_invoice':
            headerTitle.textContent = 'Xóa hóa đơn - Chi nhánh Quận 1';
            actionText.textContent = 'Tạo hóa đơn mới';
            actionBtn.onclick = createInvoice;
            break;
        case 'export_vat':
            headerTitle.textContent = 'Xuất VAT - Chi nhánh Quận 1';
            actionText.textContent = 'Tạo hóa đơn mới';
            actionBtn.onclick = createInvoice;
            break;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    handleUserProfile();
    initializeUserDropdown();
    navigate('dashboard');
});

function handleStatCard(type) {
    console.log(`Stat card clicked: ${type}`);
}

function handleChartPeriod(period) {
    console.log(`Chart period changed to: ${period} days`);
}

function handleReviewClick(reviewId) {
    console.log(`Review clicked: ${reviewId}`);
}

function handleCreateSchedule() {
    navigate('edit_schedule');
}

function handleAddSchedule() {
    navigate('edit_schedule');
}

function handleScheduleDay(date) {
    console.log(`Schedule day clicked: ${date}`);
    navigate('edit_schedule');
}

function handleSearchInvoices(query) {
    console.log(`Searching invoices: ${query}`);
}

function handleFilterInvoices(status) {
    console.log(`Filtering invoices by status: ${status}`);
}

function handleStatusChange(invoiceId, status) {
    console.log(`Invoice ${invoiceId} status changed to: ${status}`);
}

function handleInvoiceAction(invoiceId, action) {
    console.log(`Invoice ${invoiceId} action: ${action}`);
    if (action === 'view' || action === 'edit') {
        navigate('edit_invoice');
    } else if (action === 'delete') {
        navigate('delete_invoice');
    }
}

function createInvoice() {
    console.log('Creating new invoice');
    navigate('edit_invoice');
}

function saveSchedule() {
    console.log('Saving schedule');
    alert('Lịch làm việc đã được lưu!');
    navigate('work_schedule');
}

function saveInvoice() {
    console.log('Saving invoice');
    alert('Hóa đơn đã được lưu!');
    navigate('view_invoices');
}

function deleteInvoice() {
    console.log('Deleting invoice');
    alert('Hóa đơn đã được xóa!');
    navigate('view_invoices');
}

function exportVAT() {
    console.log('Exporting VAT');
    alert('Hóa đơn VAT đã được xuất!');
    navigate('view_invoices');
}