  // Các hàm xử lý sự kiện
  async function handleUserProfile() {
      console.log('Đang hiển thị thông tin user...');
      try {
          const response = await fetch('http://localhost:8080/manager/profile?detail=true', {
              method: 'GET',
              credentials: 'include', // IMPORTANT: This ensures session cookies are sent
              headers: {
                  'Accept': 'application/json',
              }
          });

          if (!response.ok) {
              // Nếu có lỗi HTTP, ném lỗi với status
              if (response.status === 401) {
                  // Unauthorized - redirect to login
                  alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                  window.location.href = '/login.html'; // Adjust path as needed
                  return;
              }
              throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log('Dữ liệu user profile:', data);

          // Cập nhật UI với dữ liệu người dùng nhận được từ backend
          const userFullNameElement = document.getElementById('userFullName');
          const userPharmacyNameElement = document.getElementById('userPharmacyName');

          if (userFullNameElement && data.fullName) {
              userFullNameElement.textContent = data.fullName;
          }
          if (userPharmacyNameElement && data.pharmacyName) {
              userPharmacyNameElement.textContent = data.pharmacyName;
          } else if (userPharmacyNameElement && data.pharmacyAddress) {
              // Nếu không có pharmacyName nhưng có pharmacyAddress, hiển thị địa chỉ chi nhánh
              userPharmacyNameElement.textContent = data.pharmacyAddress;
          }

          console.log('Thông tin người dùng đã được tải và hiển thị.');

      } catch (error) {
          console.error('Lỗi khi lấy thông tin user profile:', error);
          alert('Không thể tải thông tin người dùng. Vui lòng thử lại. Lỗi: ' + error.message);
      }
  }

  // Gọi hàm handleUserProfile() khi trang tải xong
  document.addEventListener('DOMContentLoaded', handleUserProfile);

  function navigate(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
    // Show selected section
    document.getElementById(`${section}-section`).style.display = 'block';
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`.nav-item[data-section="${section}"]`).classList.add('active');
    // Update header title and action button
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

  function handleStatCard(type) {
    console.log(`Stat card clicked: ${type}`);
    // Placeholder for actual functionality
  }

  function handleChartPeriod(period) {
    console.log(`Chart period changed to: ${period} days`);
    // Placeholder for actual chart update
  }

  function handleReviewClick(reviewId) {
    console.log(`Review clicked: ${reviewId}`);
    // Placeholder for actual functionality
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
    // Placeholder for actual search
  }

  function handleFilterInvoices(status) {
    console.log(`Filtering invoices by status: ${status}`);
    // Placeholder for actual filter
  }

  function handleStatusChange(invoiceId, status) {
    console.log(`Invoice ${invoiceId} status changed to: ${status}`);
    // Placeholder for actual status update
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

  // Initialize dashboard
  document.addEventListener('DOMContentLoaded', () => {
    navigate('dashboard');
  });
