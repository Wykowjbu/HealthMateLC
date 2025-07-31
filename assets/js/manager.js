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

        if (userPharmacyNameElement && data.pharmacyName) {
            userPharmacyNameElement.textContent = data.pharmacyName;
        } else if (userPharmacyNameElement && data.pharmacyAddress) {
            userPharmacyNameElement.textContent = data.pharmacyAddress;
        } else if (userPharmacyNameElement) {
            userPharmacyNameElement.textContent = 'Chưa gán chi nhánh';
        }

        if (branchElement && data.branch) {
            branchElement.textContent = data.branch;
        } else if (branchElement) {
            branchElement.textContent = "Chưa gán chi nhánh";
        }

        console.log("Thông tin người dùng đã được tải và hiển thị.");
    } catch (error) {
        console.error("Lỗi khi lấy thông tin user profile:", error);
        alert("Không thể tải thông tin người dùng. Vui lòng thử lại. Lỗi: " + error.message);
        window.location.href = "/HealthMateLC/index.html";
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

    // Khởi tạo section specific
    if (section === "employee_history") {
        initEmployeeHistorySection();
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

// THÊM MỚI: Hàm kiểm tra ngày có từ hiện tại trở đi không
function isDateFromToday(dateString) {
    const inputDate = new Date(dateString);
    const today = new Date();

    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);

    return inputDate >= today;
}

// THÊM MỚI: Hàm format ngày theo múi giờ Việt Nam
function getCurrentDateVN() {
    const now = new Date();
    const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
    return vnTime.toISOString().split('T')[0];
}

// Replace the loadSchedules function with this updated version
async function loadSchedules() {
  try {
    console.log('Fetching schedules from /manager/schedules...');
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
    console.log('Schedules data:', schedules);

    const groupedSchedules = schedules.reduce((acc, schedule) => {
      const pid = schedule.pharmacyId || 'unknown';
      if (!acc[pid]) acc[pid] = [];
      acc[pid].push(schedule);
      return acc;
    }, {});

    console.log('Grouped schedules:', groupedSchedules);

    let allHtml = '';
    for (const [pharmacyId, pharmSchedules] of Object.entries(groupedSchedules)) {
      const pharmacyName = pharmSchedules[0]?.pharmacyName || `Nhà thuốc ID: ${pharmacyId}`;

      allHtml += `
        <div class="calendar-container">
          <div class="calendar-header">
            <h3 class="chart-title">Lịch làm việc - ${pharmacyName}</h3>
            <div class="calendar-nav">
              <button onclick="changeMonth(-1)" title="Tháng trước">
                <span class="material-icons">chevron_left</span>
              </button>
              <h3 id="currentMonth">${getCurrentMonthYear()}</h3>
              <button onclick="changeMonth(1)" title="Tháng sau">
                <span class="material-icons">chevron_right</span>
              </button>
            </div>
          </div>
          ${generateCalendar(pharmSchedules)}
        </div>
      `;
    }

    const scheduleSection = document.getElementById('work_schedule-section');
    if (scheduleSection) {
      console.log('Updating work_schedule-section with calendar HTML');
      scheduleSection.innerHTML = allHtml || '<p>Không có lịch làm việc.</p>';
    } else {
      console.error('Element work_schedule-section not found');
    }

  } catch (error) {
    console.error('Lỗi khi lấy lịch làm việc:', error);
    alert('Không thể tải lịch làm việc. Vui lòng thử lại. Lỗi: ' + error.message);
  }
}

// Add these new functions for calendar functionality
let currentDate = new Date();

function getCurrentMonthYear() {
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
}

function changeMonth(direction) {
  currentDate.setMonth(currentDate.getMonth() + direction);
  document.getElementById('currentMonth').textContent = getCurrentMonthYear();
  loadSchedules(); // Reload schedules for new month
}

function generateCalendar(schedules) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Adjust for Monday start (0 = Sunday, 1 = Monday, etc.)
  const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

  const dayHeaders = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  let calendarHTML = '<div class="calendar-grid">';

  // Add day headers
  dayHeaders.forEach(day => {
    calendarHTML += `<div class="calendar-day-header">${day}</div>`;
  });

  // Add empty cells for days before month starts
  for (let i = 0; i < adjustedStartDay; i++) {
    const prevMonthDay = new Date(year, month, 0 - (adjustedStartDay - 1 - i));
    calendarHTML += `
      <div class="calendar-day other-month">
        <div class="calendar-day-number">${prevMonthDay.getDate()}</div>
      </div>
    `;
  }

  // Add days of current month
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    const isFromToday = isDateFromToday(currentDateStr);

    // Get schedules for this day
    const daySchedules = schedules.filter(s => s.date === currentDateStr);

    let shiftsHTML = '';
    if (daySchedules.length > 0) {
      shiftsHTML = daySchedules.map(schedule => {
        const canEdit = isFromToday; // Chỉ cho phép edit lịch từ hôm nay trở đi
        const clickHandler = canEdit
          ? `onclick="editScheduleFromCalendar(${schedule.scheduleId}, ${schedule.userId}, '${schedule.fullName}', '${schedule.date}', '${schedule.startTime}', '${schedule.endTime}')"`
          : '';
        const cursorStyle = canEdit ? 'cursor: pointer;' : 'cursor: not-allowed; opacity: 0.6;';
        const title = canEdit ? 'Click để chỉnh sửa' : 'Không thể chỉnh sửa lịch trong quá khứ';

        return `
          <div class="calendar-shift ${canEdit ? 'editable' : 'past-schedule'}"
               onmouseover="showShiftTooltip(event, '${schedule.fullName}', '${formatTime(schedule.startTime)}', '${formatTime(schedule.endTime)}', ${canEdit})"
               onmouseout="hideShiftTooltip()"
               ${clickHandler}
               style="${cursorStyle}"
               title="${title}">
            ${(schedule.fullName || 'NV').substring(0, 8)}
            <span class="calendar-shift-time">${formatTime(schedule.startTime).substring(0, 5)}</span>
          </div>
        `;
      }).join('');
    }

    calendarHTML += `
      <div class="calendar-day ${isToday ? 'today' : ''} ${!isFromToday ? 'past-day' : ''}">
        <div class="calendar-day-number">${day}</div>
        <div class="calendar-shifts">${shiftsHTML}</div>
      </div>
    `;
  }

  // Add remaining cells to complete the grid
  const totalCells = Math.ceil((daysInMonth + adjustedStartDay) / 7) * 7;
  const remainingCells = totalCells - (daysInMonth + adjustedStartDay);

  for (let i = 1; i <= remainingCells; i++) {
    calendarHTML += `
      <div class="calendar-day other-month">
        <div class="calendar-day-number">${i}</div>
      </div>
    `;
  }

  calendarHTML += '</div>';

  return calendarHTML;
}

// CẬP NHẬT: Add tooltip functionality với thông tin có thể edit hay không
function showShiftTooltip(event, employeeName, startTime, endTime, canEdit = true) {
  let tooltip = document.getElementById('shift-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'shift-tooltip';
    tooltip.className = 'shift-tooltip';
    document.body.appendChild(tooltip);
  }

  const editStatus = canEdit
    ? '<span style="color: #4CAF50;">✓ Có thể chỉnh sửa</span>'
    : '<span style="color: #f44336;">✗ Không thể chỉnh sửa (quá khứ)</span>';

  tooltip.innerHTML = `
    <strong>${employeeName}</strong><br>
    ${startTime} - ${endTime}<br>
    <small>${editStatus}</small>
  `;

  tooltip.style.left = event.pageX + 10 + 'px';
  tooltip.style.top = event.pageY - 10 + 'px';
  tooltip.classList.add('show');
}

function hideShiftTooltip() {
  const tooltip = document.getElementById('shift-tooltip');
  if (tooltip) {
    tooltip.classList.remove('show');
  }
}

// CẬP NHẬT: Add function to edit schedule from calendar với kiểm tra thời gian
function editScheduleFromCalendar(scheduleId, userId, fullName, date, startTime, endTime) {
  // Kiểm tra xem có thể chỉnh sửa không
  if (!isDateFromToday(date)) {
    alert('⚠️ Không thể chỉnh sửa lịch làm việc trong quá khứ!\nChỉ có thể chỉnh sửa lịch từ hôm nay trở đi.');
    return;
  }

  // Switch to edit schedule section
  navigate('edit_schedule');

  // Load the employee in the dropdown
  setTimeout(() => {
    const employeeSelect = document.getElementById('editEmployeeSelect');
    if (employeeSelect) {
      employeeSelect.value = userId;
      loadEmployeeSchedules(userId);
    }
  }, 100);
}

// Add these functions to window object so they can be called from HTML
window.changeMonth = changeMonth;
window.showShiftTooltip = showShiftTooltip;
window.hideShiftTooltip = hideShiftTooltip;
window.editScheduleFromCalendar = editScheduleFromCalendar;

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

        // CẬP NHẬT: Set minimum date cho date picker thành hôm nay
        const workDateInput = document.getElementById('workDate');
        if (workDateInput) {
            workDateInput.min = getCurrentDateVN();
            // Set default value thành hôm nay
            if (!workDateInput.value) {
                workDateInput.value = getCurrentDateVN();
            }
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

    // CẬP NHẬT: Kiểm tra ngày có từ hôm nay trở đi không
    if (!isDateFromToday(date)) {
        alert('⚠️ Không thể tạo lịch làm việc cho ngày trong quá khứ!\nVui lòng chọn ngày từ hôm nay trở đi.');
        return;
    }

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

// CẬP NHẬT: loadEmployeeSchedules với filter chỉ hiển thị lịch từ hôm nay trở đi
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

    // CẬP NHẬT: Lọc chỉ hiển thị lịch từ hôm nay trở đi
    const futureSchedules = schedules.filter(schedule => isDateFromToday(schedule.date));
    const pastSchedules = schedules.filter(schedule => !isDateFromToday(schedule.date));

    const scheduleList = document.getElementById('employeeScheduleList');

    if (futureSchedules.length > 0 || pastSchedules.length > 0) {
      let html = '';

      // Hiển thị lịch có thể chỉnh sửa (từ hôm nay trở đi)
      if (futureSchedules.length > 0) {
        html += '<h4 style="color: #4CAF50; margin: 20px 0 10px 0;">📅 Lịch có thể chỉnh sửa (Từ hôm nay trở đi)</h4>';
        html += futureSchedules.sort((a, b) => new Date(a.date) - new Date(b.date)).map(schedule => `
          <div class="employee-shift editable">
            <div class="schedule-info">
              <strong>${schedule.date}</strong> (${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)})
              <span class="schedule-status" style="color: #4CAF50; font-size: 12px;">✓ Có thể chỉnh sửa</span>
            </div>
            <div class="schedule-actions">
              <button class="btn btn-primary" onclick="editSchedule(${schedule.scheduleId}, ${schedule.userId}, '${schedule.fullName}', '${schedule.date}', '${schedule.startTime}', '${schedule.endTime}')">
                <span class="material-icons">edit</span> Sửa
              </button>
              <button class="btn btn-danger" onclick="showDeleteScheduleModal(${schedule.scheduleId}, '${schedule.fullName}', '${schedule.date}', '${schedule.startTime}', '${schedule.endTime}', ${schedule.userId})">
                <span class="material-icons">delete</span> Xóa
              </button>
            </div>
          </div>
        `).join('');
      }

      // Hiển thị lịch quá khứ (chỉ để xem)
      if (pastSchedules.length > 0) {
        html += '<h4 style="color: #757575; margin: 20px 0 10px 0;">📋 Lịch đã qua (Chỉ xem)</h4>';
        html += pastSchedules.sort((a, b) => new Date(b.date) - new Date(a.date)).map(schedule => `
          <div class="employee-shift past-schedule" style="opacity: 0.6; background-color: #f5f5f5;">
            <div class="schedule-info">
              <strong>${schedule.date}</strong> (${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)})
              <span class="schedule-status" style="color: #757575; font-size: 12px;">✗ Không thể chỉnh sửa</span>
            </div>
            <div class="schedule-actions">
              <span style="color: #757575; font-size: 12px;">Lịch đã qua</span>
            </div>
          </div>
        `).join('');
      }

      scheduleList.innerHTML = html;
    } else {
      scheduleList.innerHTML = '<p>Nhân viên này chưa có lịch làm việc.</p>';
    }
  } catch (error) {
    console.error('Lỗi khi tải lịch nhân viên:', error);
    alert('Không thể tải lịch làm việc. Vui lòng thử lại. Lỗi: ' + error.message);
  }
}

// CẬP NHẬT: editSchedule với kiểm tra thời gian
async function editSchedule(scheduleId, userId, fullName, date, startTime, endTime) {
  // Kiểm tra xem có thể chỉnh sửa không
  if (!isDateFromToday(date)) {
    alert('⚠️ Không thể chỉnh sửa lịch làm việc trong quá khứ!\nChỉ có thể chỉnh sửa lịch từ hôm nay trở đi.');
    return;
  }

  const modal = document.getElementById('editScheduleModal');
  const form = document.getElementById('editScheduleForm');
  form.dataset.scheduleId = scheduleId;
  form.dataset.userId = userId; // Lưu userId vào form
  document.getElementById('editScheduleEmployee').value = fullName;
  document.getElementById('editWorkDate').value = date;
  document.getElementById('editStartTime').value = startTime.slice(0, 5);
  document.getElementById('editEndTime').value = endTime.slice(0, 5);

  // CẬP NHẬT: Set minimum date cho date picker thành hôm nay
  const editWorkDateInput = document.getElementById('editWorkDate');
  if (editWorkDateInput) {
    editWorkDateInput.min = getCurrentDateVN();
  }

  modal.style.display = 'block';
}

// CẬP NHẬT: saveEditedSchedule với kiểm tra thời gian
async function saveEditedSchedule() {
  const form = document.getElementById('editScheduleForm');
  const scheduleId = form.dataset.scheduleId;
  const userId = form.dataset.userId;
  const date = document.getElementById('editWorkDate').value;
  const startTime = document.getElementById('editStartTime').value + ':00';
  const endTime = document.getElementById('editEndTime').value + ':00';

  // CẬP NHẬT: Kiểm tra ngày có từ hôm nay trở đi không
  if (!isDateFromToday(date)) {
    alert('⚠️ Không thể cập nhật lịch làm việc cho ngày trong quá khứ!\nVui lòng chọn ngày từ hôm nay trở đi.');
    return;
  }

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

// CẬP NHẬT: confirmDeleteSchedule với kiểm tra thời gian
async function confirmDeleteSchedule() {
  const modal = document.getElementById('deleteScheduleModal');
  const scheduleId = modal.dataset.scheduleId;
  const userId = modal.dataset.userId;
  const scheduleDate = modal.dataset.scheduleDate; // Cần thêm date vào modal

  // Kiểm tra xem có thể xóa không (chỉ cho phép xóa lịch từ hôm nay trở đi)
  if (scheduleDate && !isDateFromToday(scheduleDate)) {
    alert('⚠️ Không thể xóa lịch làm việc trong quá khứ!\nChỉ có thể xóa lịch từ hôm nay trở đi.');
    closeDeleteModal();
    return;
  }

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
    alert('✅ Lịch làm việc đã được xóa thành công!');
    closeDeleteModal();
    console.log('Refreshing schedules: calling loadEmployeeSchedules and loadSchedules'); // Debug
    await loadEmployeeSchedules(userId); // Làm mới danh sách lịch trong section chỉnh sửa
    await loadSchedules(); // Làm mới section Lịch làm việc tuần này
  } catch (error) {
    console.error('Lỗi khi xóa lịch:', error);
    alert('❌ Không thể xóa lịch. Vui lòng thử lại.\nLỗi: ' + error.message);
  }
}

function closeEditModal() {
  document.getElementById('editScheduleModal').style.display = 'none';
}

// CẬP NHẬT: showDeleteScheduleModal với kiểm tra thời gian
function showDeleteScheduleModal(scheduleId, fullName, date, startTime, endTime, userId) {
  // Kiểm tra xem có thể xóa không
  if (!isDateFromToday(date)) {
    alert('⚠️ Không thể xóa lịch làm việc trong quá khứ!\nChỉ có thể xóa lịch từ hôm nay trở đi.');
    return;
  }

  const modal = document.getElementById('deleteScheduleModal');
  modal.dataset.scheduleId = scheduleId;
  modal.dataset.userId = userId; // Lưu userId vào modal
  modal.dataset.scheduleDate = date; // CẬP NHẬT: Lưu date vào modal để kiểm tra
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

//#endregion
document.addEventListener('DOMContentLoaded', () => {
  handleUserProfile();
  initializeUserDropdown();
  navigate('dashboard');
  loadSchedules();
  handleCreateSchedule().catch(err => console.error('Error in initial handleCreateSchedule:', err));
  initEditScheduleSection().catch(err => console.error('Error in initial initEditScheduleSection:', err));
});

window.handleUserProfile = handleUserProfile;
window.navigate = navigate;
window.handleCreateSchedule = handleCreateSchedule;