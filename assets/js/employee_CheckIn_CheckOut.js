// ===== PHẦN CHECK-IN/CHECK-OUT THEO CA - ĐÃ SỬA LỖI EVENT HANDLING =====

// Check-in/Check-out Global Variables (riêng biệt để tránh conflict)
let currentUserIdCheckin = null;
let timesheetInterval = null;
let clockInterval = null;
let currentShifts = [];

// Auto-initialize check-in section when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Auto-initializing check-in section...');
    setTimeout(autoInitializeCheckin, 3000); // Wait 3 seconds for other initializations

    // Setup event delegation for shift buttons
    setupShiftEventDelegation();
});

// Setup event delegation for dynamically created shift buttons
function setupShiftEventDelegation() {
    const scheduleContainer = document.getElementById('scheduleToday');
    if (scheduleContainer) {
        scheduleContainer.addEventListener('click', function(event) {
            const target = event.target;

            // Handle check-in button clicks
            if (target.classList.contains('shift-checkin-btn') || target.closest('.shift-checkin-btn')) {
                event.preventDefault();
                const button = target.classList.contains('shift-checkin-btn') ? target : target.closest('.shift-checkin-btn');
                const scheduleId = button.closest('[data-schedule-id]').getAttribute('data-schedule-id');
                if (scheduleId && !button.disabled) {
                    handleShiftCheckIn(parseInt(scheduleId));
                }
            }

            // Handle check-out button clicks
            if (target.classList.contains('shift-checkout-btn') || target.closest('.shift-checkout-btn')) {
                event.preventDefault();
                const button = target.classList.contains('shift-checkout-btn') ? target : target.closest('.shift-checkout-btn');
                const scheduleId = button.closest('[data-schedule-id]').getAttribute('data-schedule-id');
                if (scheduleId && !button.disabled) {
                    handleShiftCheckOut(parseInt(scheduleId));
                }
            }
        });
    }
}

// Auto initialize check-in functionality
async function autoInitializeCheckin() {
    console.log('Starting auto check-in initialization...');

    try {
        // Đợi để các function khác load xong trước
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get current user ID from session (sử dụng endpoint mới)
        currentUserIdCheckin = await getCurrentUserIdFromSessionCheckin();
        console.log('Current userId for check-in:', currentUserIdCheckin);

        if (!currentUserIdCheckin) {
            console.error('Cannot get userId from session');
            showTimesheetNotificationCheckin('Không thể xác định người dùng. Vui lòng đăng nhập lại.', 'error');
            return;
        }
    } catch (error) {
        console.error('Error during initialization:', error);
        showTimesheetNotificationCheckin('Lỗi khởi tạo: ' + error.message, 'error');
        return;
    }

    // Start all check-in functions
    startRealTimeClockCheckin();
    await loadTimesheetStatusByShift();

    // Set up auto-refresh every 1 minute to update check-in availability
    if (timesheetInterval) clearInterval(timesheetInterval);
    timesheetInterval = setInterval(async () => {
        await loadTimesheetStatusByShift();
    }, 60000); // Every 1 minute to check time windows

    console.log('Check-in section auto-initialized successfully!');
}

// Get current userId from authenticated session - SỬ DỤNG ENDPOINT MỚI
async function getCurrentUserIdFromSessionCheckin() {
    try {
        // Thử gọi endpoint mới status-by-shift thay vì endpoint cũ
        const response = await fetch('http://localhost:8080/employee/timesheet/status-by-shift', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            // Nếu thành công, có nghĩa là backend có thể lấy user từ session
            console.log('Session-based authentication working with new endpoint');
            return 'session'; // Dùng 'session' làm indicator
        } else if (response.status === 401) {
            throw new Error('Phiên đăng nhập đã hết hạn');
        } else if (response.status === 403) {
            throw new Error('Không có quyền truy cập');
        } else if (response.status === 404) {
            // Nếu endpoint mới chưa có, thử endpoint profile
            console.log('New endpoint not found, trying profile endpoint');
            return await tryProfileEndpoint();
        } else {
            throw new Error('Không thể xác thực');
        }
    } catch (error) {
        console.error('Error getting userId from session:', error);
        // Thử sử dụng endpoint profile làm fallback
        return await tryProfileEndpoint();
    }
}

// Fallback: Sử dụng profile endpoint để xác thực
async function tryProfileEndpoint() {
    try {
        const response = await fetch('http://localhost:8080/employee/profile', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            console.log('Profile endpoint authentication working');
            return 'session';
        } else {
            throw new Error('Không thể xác thực qua profile endpoint');
        }
    } catch (error) {
        console.error('Profile endpoint also failed:', error);
        throw error;
    }
}

// Start real-time clock display
function startRealTimeClockCheckin() {
    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const currentTimeElement = document.getElementById('currentTime');
        if (currentTimeElement) {
            currentTimeElement.textContent = timeString;
        }
    }

    updateClock();
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(updateClock, 1000);
}

// Load timesheet status by shift
async function loadTimesheetStatusByShift() {
    if (!currentUserIdCheckin) {
        console.log('No userId available for timesheet status');
        return;
    }

    try {
        // Sử dụng endpoint mới để lấy trạng thái theo ca
        const response = await fetch('http://localhost:8080/employee/timesheet/status-by-shift', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Không có quyền truy cập. Vui lòng đăng nhập lại.');
            } else if (response.status === 401) {
                throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            } else if (response.status === 404) {
                // Nếu endpoint chưa có, hiển thị giao diện fallback
                console.log('New endpoint not available, using fallback UI');
                displayFallbackSchedule();
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Shift timesheet status loaded:', data);

        currentShifts = data.shifts || [];
        updateTimesheetUIByShift(data);
    } catch (error) {
        console.error('Error loading timesheet status by shift:', error);
        // Only show notification for initial load, not auto-refresh
        if (!timesheetInterval) {
            showTimesheetNotificationCheckin('Backend chưa hỗ trợ check-in theo ca. Hiển thị giao diện cơ bản.', 'info');
        }

        // Hiển thị giao diện fallback
        displayFallbackSchedule();
    }
}

// Fallback: Hiển thị lịch làm việc cơ bản từ endpoint schedules
async function displayFallbackSchedule() {
    try {
        const response = await fetch('http://localhost:8080/employee/schedules', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const schedules = await response.json();
        const today = new Date().toISOString().split('T')[0];
        const todaySchedules = schedules.filter(s => s.date === today);

        displayFallbackScheduleUI(todaySchedules);
        updateFallbackGlobalStatus();
    } catch (error) {
        console.error('Error loading fallback schedule:', error);
        updateTimesheetUIErrorCheckin();
    }
}

// Hiển thị giao diện fallback cho lịch làm việc
function displayFallbackScheduleUI(schedules) {
    const scheduleContainer = document.getElementById('scheduleToday');
    if (!scheduleContainer) return;

    if (schedules.length === 0) {
        scheduleContainer.innerHTML = '<p style="color: #718096; font-style: italic;">Không có ca làm việc hôm nay</p>';
        return;
    }

    const scheduleHTML = schedules.map(schedule => `
        <div class="schedule-item">
            <div class="schedule-time">${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}</div>
            <div class="schedule-shift">${schedule.fullName || 'Ca làm việc'}</div>
            <div class="schedule-note" style="font-size: 12px; color: #718096; margin-top: 4px;">
                Backend chưa hỗ trợ check-in theo ca
            </div>
        </div>
    `).join('');

    scheduleContainer.innerHTML = scheduleHTML;
}

// Cập nhật trạng thái global cho fallback
function updateFallbackGlobalStatus() {
    const checkinStatus = document.getElementById('checkinStatus');
    const checkoutStatus = document.getElementById('checkoutStatus');
    const workDuration = document.getElementById('workDuration');
    const checkinBtn = document.getElementById('checkinBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (checkinStatus) {
        checkinStatus.textContent = 'Chưa hỗ trợ check-in theo ca';
        checkinStatus.style.color = '#718096';
    }
    if (checkoutStatus) {
        checkoutStatus.textContent = 'Cần cập nhật backend';
        checkoutStatus.style.color = '#718096';
    }
    if (workDuration) {
        workDuration.textContent = 'Đang phát triển...';
        workDuration.style.color = '#718096';
    }

    // Ẩn các button chính vì chưa hỗ trợ
    if (checkinBtn) {
        checkinBtn.style.display = 'none';
    }
    if (checkoutBtn) {
        checkoutBtn.style.display = 'none';
    }
}

// Update UI based on shift status - CHỈ CHẠY KHI CÓ ENDPOINT MỚI
function updateTimesheetUIByShift(data) {
    const scheduleContainer = document.getElementById('scheduleToday');
    if (!scheduleContainer) {
        console.log('Schedule container not found');
        return;
    }

    const shifts = data.shifts || [];

    if (shifts.length === 0) {
        scheduleContainer.innerHTML = '<p style="color: #718096; font-style: italic;">Không có ca làm việc hôm nay</p>';
        updateGlobalStatus(null, null, '0 giờ 0 phút');
        return;
    }

    // Tạo HTML cho từng ca - SỬ DỤNG DATA ATTRIBUTES THAY VÌ ONCLICK
    const shiftHTML = shifts.map(shift => {
        const statusClass = getShiftStatusClass(shift.status);
        const statusText = getShiftStatusText(shift.status);
        const buttonHTML = getShiftButtonHTML(shift);
        const timeInfoHTML = getShiftTimeInfoHTML(shift);

        return `
            <div class="shift-item ${statusClass}" data-schedule-id="${shift.scheduleId}">
                <div class="shift-info">
                    <div class="shift-time">${shift.startTime} - ${shift.endTime}</div>
                    <div class="shift-status">${statusText}</div>
                    ${timeInfoHTML}
                    ${shift.checkInTime ? `<div class="shift-checkin">Check-in: ${formatTimeDisplay(shift.checkInTime)}</div>` : ''}
                    ${shift.checkOutTime ? `<div class="shift-checkout">Check-out: ${formatTimeDisplay(shift.checkOutTime)}</div>` : ''}
                </div>
                <div class="shift-actions">
                    ${buttonHTML}
                </div>
            </div>
        `;
    }).join('');

    scheduleContainer.innerHTML = shiftHTML;

    // Cập nhật trạng thái tổng quan
    updateGlobalStatusFromShifts(shifts);
}

// Get time info HTML for shift
function getShiftTimeInfoHTML(shift) {
    if (shift.status === 'not_started' && shift.allowedCheckInStart && shift.allowedCheckInEnd) {
        const now = new Date();
        const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
        const allowedStart = shift.allowedCheckInStart.substring(0, 5);
        const allowedEnd = shift.allowedCheckInEnd.substring(0, 5);

        if (shift.canCheckInNow) {
            return `
                <div class="shift-time-info available">
                    <span class="material-icons">schedule</span>
                    Có thể check-in đến ${allowedEnd}
                </div>
            `;
        } else if (currentTime < allowedStart) {
            return `
                <div class="shift-time-info waiting">
                    <span class="material-icons">schedule</span>
                    Check-in từ ${allowedStart} đến ${allowedEnd}
                </div>
            `;
        } else {
            return `
                <div class="shift-time-info expired">
                    <span class="material-icons">schedule_send</span>
                    Đã quá thời gian check-in (${allowedEnd})
                </div>
            `;
        }
    } else if (shift.status === 'working' && shift.checkOutAllowedFrom) {
        const now = new Date();
        const currentTime = now.toTimeString().substring(0, 5);
        const checkOutTime = shift.checkOutAllowedFrom.substring(0, 5);

        if (shift.canCheckOutNow) {
            return `
                <div class="shift-time-info available">
                    <span class="material-icons">logout</span>
                    Có thể check-out từ ${checkOutTime}
                </div>
            `;
        } else {
            return `
                <div class="shift-time-info waiting">
                    <span class="material-icons">schedule</span>
                    Check-out từ ${checkOutTime}
                </div>
            `;
        }
    }
    return '';
}

// Get CSS class for shift status
function getShiftStatusClass(status) {
    switch(status) {
        case 'working': return 'shift-working';
        case 'completed': return 'shift-completed';
        default: return 'shift-not-started';
    }
}

// Get text for shift status
function getShiftStatusText(status) {
    switch(status) {
        case 'working': return 'Đang làm việc';
        case 'completed': return 'Đã hoàn thành';
        default: return 'Chưa bắt đầu';
    }
}

// Get button HTML for shift - KHÔNG SỬ DỤNG ONCLICK NỮA
function getShiftButtonHTML(shift) {
    const scheduleId = shift.scheduleId;

    if (shift.status === 'not_started') {
        if (shift.canCheckInNow) {
            return `
                <button class="shift-checkin-btn available" data-schedule-id="${scheduleId}">
                    <span class="material-icons">login</span>
                    Check-in
                </button>
            `;
        } else {
            const now = new Date();
            const currentTime = now.toTimeString().substring(0, 5);
            const allowedStart = shift.allowedCheckInStart ? shift.allowedCheckInStart.substring(0, 5) : '';
            const allowedEnd = shift.allowedCheckInEnd ? shift.allowedCheckInEnd.substring(0, 5) : '';

            if (currentTime < allowedStart) {
                return `
                    <button class="shift-checkin-btn disabled" disabled title="Chưa đến thời gian check-in">
                        <span class="material-icons">schedule</span>
                        Chờ ${allowedStart}
                    </button>
                `;
            } else {
                return `
                    <button class="shift-checkin-btn expired" disabled title="Đã quá thời gian check-in">
                        <span class="material-icons">schedule_send</span>
                        Quá hạn
                    </button>
                `;
            }
        }
    } else if (shift.status === 'working') {
        // KIỂM TRA THỜI GIAN CHECK-OUT
        if (shift.canCheckOutNow) {
            return `
                <button class="shift-checkout-btn available" data-schedule-id="${scheduleId}">
                    <span class="material-icons">logout</span>
                    Check-out
                </button>
            `;
        } else {
            const checkOutTime = shift.checkOutAllowedFrom ? shift.checkOutAllowedFrom.substring(0, 5) : '';
            return `
                <button class="shift-checkout-btn disabled" disabled title="Chưa đến giờ tan làm">
                    <span class="material-icons">schedule</span>
                    Chờ ${checkOutTime}
                </button>
            `;
        }
    } else {
        return `
            <span class="shift-completed-label">
                <span class="material-icons">check_circle</span>
                Hoàn thành
            </span>
        `;
    }
}

// Format time for display
function formatTimeDisplay(timeString) {
    try {
        const time = new Date(`1970-01-01T${timeString}`);
        return time.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return timeString;
    }
}

// Update global status from shifts
function updateGlobalStatusFromShifts(shifts) {
    const checkinStatus = document.getElementById('checkinStatus');
    const checkoutStatus = document.getElementById('checkoutStatus');
    const workDuration = document.getElementById('workDuration');
    const checkinBtn = document.getElementById('checkinBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (!checkinStatus || !checkoutStatus || !workDuration) return;

    const workingShifts = shifts.filter(s => s.status === 'working');
    const completedShifts = shifts.filter(s => s.status === 'completed');
    const availableShifts = shifts.filter(s => s.status === 'not_started' && s.canCheckInNow);
    const canCheckOutShifts = shifts.filter(s => s.status === 'working' && s.canCheckOutNow);
    const totalShifts = shifts.length;

    // Cập nhật trạng thái tổng quan
    if (workingShifts.length > 0) {
        checkinStatus.textContent = `${workingShifts.length} ca đang làm việc`;
        checkinStatus.style.color = '#3182ce';

        if (canCheckOutShifts.length > 0) {
            checkoutStatus.textContent = `${canCheckOutShifts.length} ca có thể check-out`;
            checkoutStatus.style.color = '#38a169';
        } else {
            checkoutStatus.textContent = 'Chưa đến giờ tan làm';
            checkoutStatus.style.color = '#f59e0b';
        }
    } else if (completedShifts.length > 0) {
        checkinStatus.textContent = `${completedShifts.length}/${totalShifts} ca hoàn thành`;
        checkinStatus.style.color = '#38a169';
        checkoutStatus.textContent = 'Đã hoàn thành ca';
        checkoutStatus.style.color = '#dd6b20';
    } else if (availableShifts.length > 0) {
        checkinStatus.textContent = `${availableShifts.length} ca có thể check-in`;
        checkinStatus.style.color = '#38a169';
        checkoutStatus.textContent = 'Chờ check-in';
        checkoutStatus.style.color = '#718096';
    } else {
        checkinStatus.textContent = 'Chưa check-in ca nào';
        checkinStatus.style.color = '#718096';
        checkoutStatus.textContent = 'Chưa check-out';
        checkoutStatus.style.color = '#718096';
    }

    // Tính tổng thời gian làm việc
    const totalDuration = calculateTotalWorkDuration(shifts);
    workDuration.textContent = totalDuration;
    workDuration.style.color = totalDuration !== '0 giờ 0 phút' ? '#3182ce' : '#718096';

    // Disable global buttons (chỉ dùng buttons của từng ca)
    if (checkinBtn) checkinBtn.style.display = 'none';
    if (checkoutBtn) checkoutBtn.style.display = 'none';
}

// Calculate total work duration from all shifts
function calculateTotalWorkDuration(shifts) {
    let totalMinutes = 0;

    shifts.forEach(shift => {
        if (shift.checkInTime) {
            const endTime = shift.checkOutTime || new Date().toTimeString().split(' ')[0];
            const duration = calculateWorkDurationCheckin(shift.checkInTime, endTime);
            const match = duration.match(/(\d+) giờ (\d+) phút/);
            if (match) {
                totalMinutes += parseInt(match[1]) * 60 + parseInt(match[2]);
            }
        }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} giờ ${minutes} phút`;
}

// Calculate work duration for a shift
function calculateWorkDurationCheckin(startTime, endTime) {
    try {
        const start = new Date(`1970-01-01T${startTime}`);
        const end = new Date(`1970-01-01T${endTime}`);

        const diffMs = end - start;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        return `${diffHours} giờ ${diffMinutes} phút`;
    } catch (error) {
        console.error('Error calculating work duration:', error);
        return '0 giờ 0 phút';
    }
}

// Handle check-in for specific shift - CẬP NHẬT VỚI KIỂM TRA THỜI GIAN
async function handleShiftCheckIn(scheduleId) {
    console.log('handleShiftCheckIn called with scheduleId:', scheduleId);

    if (!currentUserIdCheckin) {
        showTimesheetNotificationCheckin('Không thể xác định người dùng. Vui lòng tải lại trang.', 'error');
        return;
    }

    // Kiểm tra thời gian trước khi gửi request
    const currentShift = currentShifts.find(s => s.scheduleId === scheduleId);
    if (!currentShift || !currentShift.canCheckInNow) {
        showTimesheetNotificationCheckin('Chưa đến thời gian check-in hoặc đã quá thời gian cho phép', 'error');
        return;
    }

    const shiftBtn = document.querySelector(`[data-schedule-id="${scheduleId}"] .shift-checkin-btn`);
    if (shiftBtn) {
        shiftBtn.disabled = true;
        shiftBtn.innerHTML = '<span class="material-icons spinning">refresh</span> Đang xử lý...';
    }

    try {
        const response = await fetch('http://localhost:8080/employee/timesheet/check-in-shift', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ scheduleId: scheduleId })
        });

        const data = await response.json();

        if (response.ok) {
            showTimesheetNotificationCheckin(data.message || 'Check-in thành công!', 'success');
            await loadTimesheetStatusByShift(); // Refresh status immediately
        } else {
            throw new Error(data.message || 'Lỗi khi check-in');
        }
    } catch (error) {
        console.error('Error during shift check-in:', error);
        showTimesheetNotificationCheckin(error.message || 'Backend chưa hỗ trợ check-in theo ca', 'error');

        // Reset button state on error
        if (shiftBtn) {
            shiftBtn.disabled = false;
            shiftBtn.innerHTML = '<span class="material-icons">login</span> Check-in';
        }
    }
}

// Handle check-out for specific shift - CẬP NHẬT VỚI KIỂM TRA THỜI GIAN
async function handleShiftCheckOut(scheduleId) {
    console.log('handleShiftCheckOut called with scheduleId:', scheduleId);

    if (!currentUserIdCheckin) {
        showTimesheetNotificationCheckin('Không thể xác định người dùng. Vui lòng tải lại trang.', 'error');
        return;
    }

    // Kiểm tra thời gian trước khi gửi request
    const currentShift = currentShifts.find(s => s.scheduleId === scheduleId);
    if (!currentShift) {
        showTimesheetNotificationCheckin('Không tìm thấy thông tin ca làm việc', 'error');
        return;
    }

    // Kiểm tra đã check-in chưa
    if (currentShift.status !== 'working') {
        showTimesheetNotificationCheckin('Vui lòng check-in trước khi check-out', 'error');
        return;
    }

    // Kiểm tra đã đến giờ tan làm chưa
    if (!currentShift.canCheckOutNow) {
        const checkOutTime = currentShift.checkOutAllowedFrom ?
            currentShift.checkOutAllowedFrom.substring(0, 5) : 'không xác định';
        showTimesheetNotificationCheckin(`Chưa đến giờ tan làm. Có thể check-out từ ${checkOutTime}`, 'error');
        return;
    }

    const shiftBtn = document.querySelector(`[data-schedule-id="${scheduleId}"] .shift-checkout-btn`);
    if (shiftBtn) {
        shiftBtn.disabled = true;
        shiftBtn.innerHTML = '<span class="material-icons spinning">refresh</span> Đang xử lý...';
    }

    try {
        const response = await fetch('http://localhost:8080/employee/timesheet/check-out-shift', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ scheduleId: scheduleId })
        });

        const data = await response.json();

        if (response.ok) {
            showTimesheetNotificationCheckin(data.message || 'Check-out thành công!', 'success');
            await loadTimesheetStatusByShift(); // Refresh status immediately
        } else {
            throw new Error(data.message || 'Lỗi khi check-out');
        }
    } catch (error) {
        console.error('Error during shift check-out:', error);
        showTimesheetNotificationCheckin(error.message || 'Không thể check-out. Vui lòng thử lại.', 'error');

        // Reset button state on error
        if (shiftBtn) {
            shiftBtn.disabled = false;
            const canCheckOut = currentShift.canCheckOutNow;
            if (canCheckOut) {
                shiftBtn.innerHTML = '<span class="material-icons">logout</span> Check-out';
                shiftBtn.classList.add('available');
            } else {
                const checkOutTime = currentShift.checkOutAllowedFrom ?
                    currentShift.checkOutAllowedFrom.substring(0, 5) : '';
                shiftBtn.innerHTML = `<span class="material-icons">schedule</span> Chờ ${checkOutTime}`;
                shiftBtn.classList.add('disabled');
            }
        }
    }
}

// Update UI when there's an error
function updateTimesheetUIErrorCheckin() {
    const checkinStatus = document.getElementById('checkinStatus');
    const checkoutStatus = document.getElementById('checkoutStatus');
    const workDuration = document.getElementById('workDuration');
    const scheduleContainer = document.getElementById('scheduleToday');

    if (checkinStatus) {
        checkinStatus.textContent = 'Lỗi tải dữ liệu';
        checkinStatus.style.color = '#e53e3e';
    }
    if (checkoutStatus) {
        checkoutStatus.textContent = 'Lỗi tải dữ liệu';
        checkoutStatus.style.color = '#e53e3e';
    }
    if (workDuration) {
        workDuration.textContent = 'Lỗi tải dữ liệu';
        workDuration.style.color = '#e53e3e';
    }
    if (scheduleContainer) {
        scheduleContainer.innerHTML = '<p style="color: #e53e3e;">Lỗi tải lịch làm việc</p>';
    }
}

// Global update status function for compatibility
function updateGlobalStatus(checkinTime, checkoutTime, duration) {
    const checkinStatus = document.getElementById('checkinStatus');
    const checkoutStatus = document.getElementById('checkoutStatus');
    const workDuration = document.getElementById('workDuration');

    if (checkinStatus && checkinTime) {
        checkinStatus.textContent = formatTimeDisplay(checkinTime);
        checkinStatus.style.color = '#38a169';
    }
    if (checkoutStatus && checkoutTime) {
        checkoutStatus.textContent = formatTimeDisplay(checkoutTime);
        checkoutStatus.style.color = '#dd6b20';
    }
    if (workDuration) {
        workDuration.textContent = duration;
        workDuration.style.color = duration !== '0 giờ 0 phút' ? '#3182ce' : '#718096';
    }
}

// Manual refresh function
async function refreshTimesheetStatus() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (!refreshBtn) return;

    const originalText = refreshBtn.innerHTML;

    refreshBtn.innerHTML = '<span class="material-icons spinning">refresh</span> Đang tải...';
    refreshBtn.disabled = true;

    try {
        await loadTimesheetStatusByShift();
        showTimesheetNotificationCheckin('Đã làm mới trạng thái', 'success');
    } catch (error) {
        showTimesheetNotificationCheckin('Lỗi khi làm mới: ' + error.message, 'error');
    } finally {
        setTimeout(() => {
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;
        }, 1000);
    }
}

// Keep these original functions for backward compatibility
async function handleCheckIn() {
    showTimesheetNotificationCheckin('Vui lòng sử dụng nút check-in của từng ca làm việc', 'info');
}

async function handleCheckOut() {
    showTimesheetNotificationCheckin('Vui lòng sử dụng nút check-out của từng ca làm việc', 'info');
}

// Notification function specifically for timesheet
function showTimesheetNotificationCheckin(message, type = "info") {
    // Try to use existing showNotification if available
    if (typeof showNotification === 'function') {
        showNotification(message, type);
        return;
    }

    // Create our own notification if showNotification doesn't exist
    console.log(`[${type.toUpperCase()}] ${message}`);

    // Create notification element
    const notification = document.createElement("div");
    notification.className = `timesheet-notification timesheet-notification-${type}`;
    notification.textContent = message;

    // Style the notification
    Object.assign(notification.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        padding: "15px 20px",
        borderRadius: "8px",
        color: "white",
        fontWeight: "500",
        zIndex: "9999",
        transform: "translateX(100%)",
        transition: "transform 0.3s ease",
        maxWidth: "300px",
        wordWrap: "break-word"
    });

    // Set background color based on type
    switch (type) {
        case "success":
            notification.style.background = "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)";
            break;
        case "error":
            notification.style.background = "linear-gradient(135deg, #fa709a 0%, #fee140 100%)";
            break;
        default:
            notification.style.background = "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)";
    }

    // Add to DOM
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = "translateX(0)";
    }, 100);

    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = "translateX(100%)";
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Clean up intervals when page unloads
window.addEventListener('beforeunload', () => {
    if (timesheetInterval) {
        clearInterval(timesheetInterval);
    }
    if (clockInterval) {
        clearInterval(clockInterval);
    }
});

// ===== KẾT THÚC PHẦN CHECK-IN/CHECK-OUT THEO CA =====