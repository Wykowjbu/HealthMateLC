async function handleUserProfile() {
    console.log('Đang hiển thị thông tin user...');
    try {
        const response = await fetch('http://localhost:8080/manager/profile?detail=true', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
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
        const branchElement = document.getElementById('branch');

        if (userFullNameElement) userFullNameElement.textContent = data.fullName || 'Chưa cập nhật';
        if (userPharmacyNameElement) userPharmacyNameElement.textContent = data.pharmacyName || data.branch || 'Chưa gán chi nhánh';
        if (branchElement) branchElement.textContent = data.branch || 'Chưa gán chi nhánh';

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
        userProfile.addEventListener("click", (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle("show");
        });

        document.addEventListener("click", (e) => {
            if (!userProfile.contains(e.target)) {
                userDropdown.classList.remove("show");
            }
        });

        userDropdown.addEventListener("click", (e) => e.stopPropagation());
    }
}

async function showUserInfo() {
    console.log('Hiển thị thông tin cá nhân...');
    try {
        const response = await fetch('http://localhost:8080/manager/showprofile', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
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
        modal.querySelector('.close').onclick = () => modal.style.display = 'none';
        window.onclick = (event) => event.target === modal && (modal.style.display = 'none');

        console.log('Thông tin cá nhân đã được hiển thị.');
    } catch (error) {
        console.error('Lỗi khi lấy thông tin cá nhân:', error);
        alert('Không thể tải thông tin cá nhân. Vui lòng thử lại. Lỗi: ' + error.message);
        window.location.href = '/HealthMateLC/index.html';
    }
}

async function logout() {
    console.log('Đang đăng xuất...');
    const response = await fetch('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
    });

    const data = await response.json();
    console.log('Logout response:', data);
    if (data.success) window.location.href = data.redirectUrl || '/HealthMateLC/index.html';
}

function navigate(section) {
    console.log('Navigating to section:', section);
    if (document.querySelector(`#${section}-section`)?.style.display === 'block') return;
    document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
    const sectionElement = document.getElementById(`${section}-section`);
    if (sectionElement) sectionElement.style.display = 'block';
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`.nav-item[data-section="${section}"]`)?.classList.add('active');
    const headerTitle = document.getElementById('header-title');
    const actionBtn = document.getElementById('header-action-btn');
    const actionText = document.getElementById('header-action-text');
    if (headerTitle && actionBtn && actionText) {
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
            case 'create_schedule':
                headerTitle.textContent = 'Chỉnh sửa lịch - Chi nhánh Quận 1';
                actionText.textContent = 'Lưu lịch';
                actionBtn.onclick = saveSchedule;
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
            case 'attendance_export':
                headerTitle.textContent = 'Xuất bảng chấm công - Chi nhánh Quận 1';
                actionText.textContent = 'Xuất Excel';
                actionBtn.onclick = exportAttendance;
                break;
        }
    }
}

function formatTime(timeStr) {
    let [hours, minutes] = timeStr.slice(0, 5).split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

function formatDateLocal(date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

async function loadSchedules() {
  try {
    console.log('Fetching schedules from /manager/schedules...'); // Debug
    const response = await fetch('http://localhost:8080/manager/schedules', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, Details: ${errorText}`);
    }

    const schedules = await response.json();
    console.log('Schedules data:', schedules); // Debug dữ liệu trả về

    const groupedSchedules = schedules.reduce((acc, schedule) => {
      const pid = schedule.pharmacyId || 'unknown';
      if (!acc[pid]) acc[pid] = [];
      acc[pid].push(schedule);
      return acc;
    }, {});

    console.log('Grouped schedules:', groupedSchedules); // Debug dữ liệu sau khi nhóm

    let allHtml = '';
    for (const [pharmacyId, pharmSchedules] of Object.entries(groupedSchedules)) {
      pharmSchedules.sort((a, b) => new Date(a.date) - new Date(b.date));

      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const weekSchedules = pharmSchedules.filter(s => {
        const d = new Date(s.date);
        return d >= startOfWeek && d <= endOfWeek;
      });

      console.log('Week schedules for pharmacy', pharmacyId, ':', weekSchedules); // Debug lịch tuần

      const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

      let gridHtml = '';
      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + i);

        const dayStr = dayNames[i];
        const dateStr = `${currentDay.getDate().toString().padStart(2, '0')}/${(currentDay.getMonth() + 1).toString().padStart(2, '0')}/${currentDay.getFullYear()}`;
        const dayDateStr = formatDateLocal(currentDay);

        const daySchedules = weekSchedules.filter(s => s.date === dayDateStr);
        const shiftsHtml = daySchedules.length > 0 ? daySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(schedule => `
          <div class="employee-shift">${schedule.fullName} (${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)})</div>
        `).join('') : '';

        gridHtml += `
          <div class="schedule-day">
            <div class="day-name">${dayStr}</div>
            <div class="day-date">${dateStr}</div>
            ${shiftsHtml}
          </div>
        `;
      }

      const pharmacyName = pharmSchedules[0]?.pharmacyName || `Nhà thuốc ID: ${pharmacyId}`;
      allHtml += `
        <h2>Lịch làm việc tuần này - ${pharmacyName}</h2>
        <div style="margin-top: 20px;"></div>
        <div class="schedule-grid">${gridHtml}</div>
        <br>
      `;
    }

    const scheduleSection = document.getElementById('work_schedule-section');
    if (scheduleSection) {
      console.log('Updating work_schedule-section with HTML:', allHtml); // Debug HTML
      scheduleSection.innerHTML = allHtml || '<p>Không có lịch làm việc.</p>';
    } else {
      console.error('Element work_schedule-section not found');
    }

    const pharmacyNameElement = document.getElementById('pharmacyName');
    if (pharmacyNameElement && Object.values(groupedSchedules)[0]) {
      pharmacyNameElement.textContent = Object.values(groupedSchedules)[0][0]?.pharmacyName || 'Chưa gán chi nhánh';
      console.log('Updated pharmacyName:', pharmacyNameElement.textContent); // Debug
    }
  } catch (error) {
    console.error('Lỗi khi lấy lịch làm việc:', error);
    alert('Không thể tải lịch làm việc. Vui lòng thử lại. Lỗi: ' + error.message);
  }
}

async function handleCreateSchedule() {
    try {
        console.log('Fetching employees by pharmacy...');
        const response = await fetch('http://localhost:8080/manager/employees', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Raw response text:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, Details: ${errorText}`);
        }

        const employees = await response.json();
        console.log('Danh sách nhân viên theo nhà thuốc:', employees);

        const employeeSelect = document.getElementById('employeeSelect');
        if (employeeSelect) {
            employeeSelect.innerHTML = '<option value="">Chọn nhân viên</option>';
            if (employees && employees.length > 0) {
                employees.forEach(emp => {
                    employeeSelect.innerHTML += `<option value="${emp.userId}">${emp.fullName || emp.username}</option>`;
                });
            } else {
                employeeSelect.innerHTML += '<option value="">Không có nhân viên trong nhà thuốc</option>';
            }
        } else {
            console.error('Element employeeSelect not found');
        }
    } catch (error) {
        console.error('Lỗi khi tải danh sách nhân viên:', error);
        alert('Không thể tải danh sách nhân viên. Vui lòng thử lại. Lỗi: ' + error.message);
    }
}

async function saveSchedule() {
    const userId = document.getElementById('employeeSelect').value;
    const date = document.getElementById('workDate').value;
    const startTime = document.getElementById('startTime').value + ':00';
    const endTime = document.getElementById('endTime').value + ':00';

    console.log('Saving schedule with:', { userId, date, startTime, endTime });

    if (userId && date && startTime && endTime) {
        try {
            const response = await fetch('http://localhost:8080/manager/schedule', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({ userId, date, startTime, endTime }).toString()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, Details: ${errorText}`);
            }
            alert('Lịch làm việc đã được tạo!');
            loadSchedules();
            navigate('work_schedule');
        } catch (error) {
            console.error('Lỗi khi lưu lịch:', error);
            alert('Không thể lưu lịch. Vui lòng thử lại. Lỗi: ' + error.message);
        }
    } else {
        alert('Vui lòng điền đầy đủ thông tin!');
    }
}

async function initEditScheduleSection() {
  const employeeSelect = document.getElementById('editEmployeeSelect');
  employeeSelect.innerHTML = '<option value="">Chọn nhân viên</option>';
  document.getElementById('employeeScheduleList').innerHTML = '<p>Vui lòng chọn nhân viên.</p>';

  try {
    console.log('Fetching employees for edit schedule section...');
    const response = await fetch('http://localhost:8080/manager/employees', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, Details: ${errorText}`);
    }

    const employees = await response.json();
    console.log('Danh sách nhân viên:', employees);
    employees.forEach(emp => {
      employeeSelect.innerHTML += `<option value="${emp.userId}">${emp.fullName || emp.username}</option>`;
    });
  } catch (error) {
    console.error('Lỗi khi tải danh sách nhân viên:', error);
    alert('Không thể tải danh sách nhân viên. Vui lòng thử lại.');
  }
}

async function loadEmployeeSchedules(userId) {
  if (!userId) {
    document.getElementById('employeeScheduleList').innerHTML = '<p>Vui lòng chọn nhân viên.</p>';
    return;
  }

  try {
    console.log('Fetching schedules for user:', userId);
    const response = await fetch(`http://localhost:8080/manager/schedules?userId=${userId}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, Details: ${errorText}`);
    }

    const schedules = await response.json();
    console.log('Dữ liệu lịch của nhân viên:', schedules);

    const scheduleList = document.getElementById('employeeScheduleList');
    if (schedules.length > 0) {
      scheduleList.innerHTML = schedules.sort((a, b) => new Date(a.date) - new Date(b.date)).map(schedule => `
        <div class="employee-shift">
          ${schedule.date} (${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)})
          <button class="btn btn-primary" onclick="editSchedule(${schedule.scheduleId}, ${schedule.userId}, '${schedule.fullName}', '${schedule.date}', '${schedule.startTime}', '${schedule.endTime}')">
            <span class="material-icons">edit</span> Sửa
          </button>
          <button class="btn btn-danger" onclick="showDeleteScheduleModal(${schedule.scheduleId}, '${schedule.fullName}', '${schedule.date}', '${schedule.startTime}', '${schedule.endTime}', ${schedule.userId})">
            <span class="material-icons">delete</span> Xóa
          </button>
        </div>
      `).join('');
    } else {
      scheduleList.innerHTML = '<p>Nhân viên này chưa có lịch làm việc.</p>';
    }
  } catch (error) {
    console.error('Lỗi khi tải lịch nhân viên:', error);
    alert('Không thể tải lịch làm việc. Vui lòng thử lại. Lỗi: ' + error.message);
  }
}

async function editSchedule(scheduleId, userId, fullName, date, startTime, endTime) {
  const modal = document.getElementById('editScheduleModal');
  const form = document.getElementById('editScheduleForm');
  form.dataset.scheduleId = scheduleId;
  form.dataset.userId = userId; // Lưu userId vào form
  document.getElementById('editScheduleEmployee').value = fullName;
  document.getElementById('editWorkDate').value = date;
  document.getElementById('editStartTime').value = startTime.slice(0, 5);
  document.getElementById('editEndTime').value = endTime.slice(0, 5);
  modal.style.display = 'block';
}

async function saveEditedSchedule() {
  const form = document.getElementById('editScheduleForm');
  const scheduleId = form.dataset.scheduleId;
  const userId = form.dataset.userId;
  const date = document.getElementById('editWorkDate').value;
  const startTime = document.getElementById('editStartTime').value + ':00';
  const endTime = document.getElementById('editEndTime').value + ':00';

  if (scheduleId && userId && date && startTime && endTime) {
    try {
      const response = await fetch('http://localhost:8080/manager/schedule', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ scheduleId, date, startTime, endTime }).toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, Details: ${errorText}`);
      }

      // Thông báo thành công với mention gửi email
      alert('✅ Lịch làm việc đã được cập nhật thành công!\n📧 Email thông báo đã được gửi đến nhân viên.');

      closeEditModal();
      loadEmployeeSchedules(userId); // Làm mới danh sách lịch trong section chỉnh sửa
      loadSchedules(); // Làm mới section Lịch làm việc tuần này
    } catch (error) {
      console.error('Lỗi khi cập nhật lịch:', error);
      alert('❌ Không thể cập nhật lịch. Vui lòng thử lại.\nLỗi: ' + error.message);
    }
  } else {
    alert('⚠️ Vui lòng điền đầy đủ thông tin!');
  }
}

async function confirmDeleteSchedule() {
  const modal = document.getElementById('deleteScheduleModal');
  const scheduleId = modal.dataset.scheduleId;
  const userId = modal.dataset.userId;
  console.log('Deleting schedule with ID:', scheduleId, 'for userId:', userId); // Debug
  try {
    const response = await fetch(`http://localhost:8080/manager/schedule?scheduleId=${scheduleId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, Details: ${errorText}`);
    }
    console.log('Schedule deleted successfully'); // Debug
    alert('Lịch làm việc đã được xóa!');
    closeDeleteModal();
    console.log('Refreshing schedules: calling loadEmployeeSchedules and loadSchedules'); // Debug
    await loadEmployeeSchedules(userId); // Làm mới danh sách lịch trong section chỉnh sửa
    await loadSchedules(); // Làm mới section Lịch làm việc tuần này
  } catch (error) {
    console.error('Lỗi khi xóa lịch:', error);
    alert('Không thể xóa lịch. Vui lòng thử lại. Lỗi: ' + error.message);
  }
}

function closeEditModal() {
  document.getElementById('editScheduleModal').style.display = 'none';
}

function showDeleteScheduleModal(scheduleId, fullName, date, startTime, endTime, userId) {
  const modal = document.getElementById('deleteScheduleModal');
  modal.dataset.scheduleId = scheduleId;
  modal.dataset.userId = userId; // Lưu userId vào modal
  document.getElementById('deleteScheduleEmployee').textContent = fullName;
  document.getElementById('deleteScheduleDate').textContent = date;
  document.getElementById('deleteScheduleTime').textContent = `${formatTime(startTime)} - ${formatTime(endTime)}`;
  modal.style.display = 'block';
}

function closeDeleteModal() {
  const modal = document.getElementById('deleteScheduleModal');
  modal.style.display = 'none';
  console.log('Delete modal closed'); // Debug
}

// Thêm function mới vào cuối file
async function exportAttendance() {
    const startDate = document.getElementById('startDateAttendance').value;
    const endDate = document.getElementById('endDateAttendance').value;
    const statusDiv = document.getElementById('exportStatus');

    if (!startDate || !endDate) {
        statusDiv.innerHTML = '<p style="color: red;">Vui lòng chọn khoảng thời gian!</p>';
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        statusDiv.innerHTML = '<p style="color: red;">Ngày bắt đầu phải nhỏ hơn ngày kết thúc!</p>';
        return;
    }

    try {
        statusDiv.innerHTML = '<p style="color: blue;">Đang xuất file Excel...</p>';

        const response = await fetch(`http://localhost:8080/manager/export-attendance?startDate=${startDate}&endDate=${endDate}`, {
            method: 'GET',
            credentials: 'include'
            // Bỏ header Accept để tránh conflict
        });

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorText = await response.text();
                if (errorText) {
                    errorMessage += `, Details: ${errorText}`;
                }
            } catch (e) {
                // Ignore if can't read error text
            }
            throw new Error(errorMessage);
        }

        // Get filename from response headers
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'BangChamCong.xlsx';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].replace(/['"]/g, '');
            }
        }

        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        statusDiv.innerHTML = '<p style="color: green;">Xuất file Excel thành công!</p>';

        // Clear status after 3 seconds
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 3000);

    } catch (error) {
        console.error('Lỗi khi xuất bảng chấm công:', error);
        statusDiv.innerHTML = `<p style="color: red;">Lỗi: ${error.message}</p>`;
    }
}

//#region History Empployee 
async function initEmployeeHistorySection() {
  const historyList = document.getElementById("employeeHistoryList");
  const searchInput = document.getElementById("employeeHistorySearch");
  historyList.innerHTML = "<p>Đang tải lịch sử làm việc...</p>";

  let allHistories = [];

  try {
    const response = await fetch("http://localhost:8080/manager/history/all", {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, Details: ${errorText}`);
    }

    allHistories = await response.json();
    renderHistoryList(allHistories);

    if (searchInput) {
      searchInput.value = "";
      searchInput.oninput = function () {
        const keyword = this.value.trim().toLowerCase();
        const filtered = allHistories.filter(h => (h.fullName || h.username).toLowerCase().includes(keyword));
        renderHistoryList(filtered);
      };
    }
  } catch (error) {
    console.error("Lỗi khi tải lịch sử nhân viên:", error);
    historyList.innerHTML = "<p>Không thể tải lịch sử làm việc.</p>";
  }

  function renderHistoryList(list) {
    if (list.length > 0) {
      historyList.innerHTML = list.map(h => `
        <div class="employee-shift">
          <strong>Nhân viên:</strong> ${h.fullName || h.username}<br>
          <strong>Chi nhánh:</strong> ${h.pharmacyName || h.pharmacyId}<br>
          <strong>Bắt đầu:</strong> ${h.startTime}<br>
          <strong>Kết thúc:</strong> ${h.endTime || "Đang làm việc"}
        </div>
      `).join("");
    } else {
      historyList.innerHTML = "<p>Không có lịch sử làm việc.</p>";
    }
  }
}

// Gọi khi chuyển sang tab employee_history
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("historyEmployeeSelect")
    ?.addEventListener("change", function () {
      loadEmployeeHistory(this.value);
    });
});

// Thêm vào hàm navigate để khởi tạo khi chuyển tab
const oldNavigate = navigate;
navigate = function (section) {
  oldNavigate(section);
  if (section === "employee_history") {
    initEmployeeHistorySection();
  }
};
//#endregion
document.addEventListener('DOMContentLoaded', () => {
  handleUserProfile();
  initializeUserDropdown();
  navigate('dashboard');
  loadSchedules();
  handleCreateSchedule().catch(err => console.error('Error in initial handleCreateSchedule:', err));
  initEditScheduleSection().catch(err => console.error('Error in initial initEditScheduleSection:', err));
});