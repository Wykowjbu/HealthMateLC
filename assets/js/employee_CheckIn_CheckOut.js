// ===== PHẦN CHECK-IN/CHECK-OUT THEO CA VỚI GPS - ĐÃ SỬA LỖI EVENT HANDLING =====

// Check-in/Check-out Global Variables (riêng biệt để tránh conflict)
let currentUserIdCheckin = null;
let timesheetInterval = null;
let clockInterval = null;
let currentShifts = [];
let isGPSRequestInProgress = false; // THÊM MỚI: Prevent multiple GPS requests

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
                if (scheduleId && !button.disabled && !isGPSRequestInProgress) { // KIỂM TRA GPS PROGRESS
                    handleShiftCheckInWithGPS(parseInt(scheduleId));
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

            // Handle retry button clicks
            if (target.classList.contains('shift-retry-btn') || target.closest('.shift-retry-btn')) {
                event.preventDefault();
                const button = target.classList.contains('shift-retry-btn') ? target : target.closest('.shift-retry-btn');
                const scheduleId = button.closest('[data-schedule-id]').getAttribute('data-schedule-id');
                if (scheduleId && !button.disabled) {
                    // Remove retry button and restore check-in button
                    removeRetryButton(scheduleId);
                    handleShiftCheckInWithGPS(parseInt(scheduleId));
                }
            }
        });
    }
}

// CẬP NHẬT: Hàm lấy vị trí GPS hiện tại với 3 lần thử
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Trình duyệt không hỗ trợ GPS'));
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 12000, // 12 giây cho mỗi lần thử
            maximumAge: 30000 // 30 giây
        };

        let attemptCount = 0;
        const maxAttempts = 3; // 3 lần thử
        let isResolved = false;

        function tryGetLocation() {
            if (isResolved) return; // Prevent multiple resolves

            attemptCount++;
            console.log(`GPS attempt ${attemptCount}/${maxAttempts}`);

            // Cập nhật loading message
            if (attemptCount === 1) {
                showLoadingGPS('Đang lấy vị trí GPS... (Lần thử 1/3)');
            } else if (attemptCount === 2) {
                showLoadingGPS('Đang thử lại lấy vị trí GPS... (Lần thử 2/3)');
            } else if (attemptCount === 3) {
                showLoadingGPS('Lần thử cuối cùng... (Lần thử 3/3)');
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    if (isResolved) return;
                    isResolved = true;
                    console.log('GPS success on attempt', attemptCount, ':', position.coords);
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        attempts: attemptCount
                    });
                },
                (error) => {
                    if (isResolved) return;
                    console.log(`GPS error attempt ${attemptCount}:`, error);

                    let errorMessage = 'Không thể lấy vị trí GPS';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            isResolved = true;
                            errorMessage = 'Bạn đã từ chối chia sẻ vị trí. Vui lòng bật GPS và cho phép truy cập vị trí trong cài đặt trình duyệt.';
                            reject(new Error(errorMessage));
                            return;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Không thể xác định vị trí. Vui lòng kiểm tra GPS và kết nối mạng.';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Hết thời gian chờ lấy vị trí GPS.';
                            break;
                    }

                    if (attemptCount < maxAttempts) {
                        console.log(`Retrying GPS in 2 seconds... (${maxAttempts - attemptCount} attempts left)`);
                        setTimeout(tryGetLocation, 2000); // 2 giây delay giữa các lần thử
                    } else {
                        isResolved = true;
                        reject(new Error(`${errorMessage} (Đã thử ${maxAttempts} lần)`));
                    }
                },
                options
            );
        }

        tryGetLocation();
    });
}

// THÊM MỚI: Hàm kiểm tra permissions GPS
async function checkGPSPermission() {
    if (!navigator.permissions) {
        return 'unknown';
    }

    try {
        const permission = await navigator.permissions.query({name: 'geolocation'});
        return permission.state; // 'granted', 'denied', 'prompt'
    } catch (error) {
        console.log('Cannot check GPS permission:', error);
        return 'unknown';
    }
}

// CẬP NHẬT: Hàm hiển thị loading với cancel functionality
function showLoadingGPS(message) {
    // Tạo loading overlay nếu chưa có
    let loadingDiv = document.getElementById('gps-loading');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'gps-loading';
        loadingDiv.className = 'gps-loading-overlay';
        loadingDiv.innerHTML = `
            <div class="gps-loading-content">
                <div class="gps-spinner"></div>
                <p class="gps-loading-text"></p>
                <p class="gps-loading-hint">Vui lòng đợi trong khi hệ thống lấy vị trí GPS...</p>
                <button class="gps-cancel-btn">Hủy</button>
            </div>
        `;

        // Add CSS styles
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        const content = loadingDiv.querySelector('.gps-loading-content');
        content.style.cssText = `
            background: white;
            padding: 40px;
            border-radius: 15px;
            text-align: center;
            max-width: 350px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;

        const spinner = loadingDiv.querySelector('.gps-spinner');
        spinner.style.cssText = `
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        `;

        const hint = loadingDiv.querySelector('.gps-loading-hint');
        hint.style.cssText = `
            font-size: 12px;
            color: #666;
            margin: 10px 0 20px 0;
            line-height: 1.4;
        `;

        const cancelBtn = loadingDiv.querySelector('.gps-cancel-btn');
        cancelBtn.style.cssText = `
            background: #f44336;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 15px;
        `;

        // Add spinner animation
        if (!document.getElementById('gps-spinner-style')) {
            const style = document.createElement('style');
            style.id = 'gps-spinner-style';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(loadingDiv);

        // Add cancel functionality
        cancelBtn.onclick = () => {
            hideLoadingGPS();
            isGPSRequestInProgress = false; // Reset flag
            resetCheckInButton(); // Reset button state
            showTimesheetNotificationCheckin('Đã hủy việc lấy vị trí GPS', 'info');
        };
    }

    loadingDiv.querySelector('.gps-loading-text').textContent = message;
    loadingDiv.style.display = 'flex';
}

// THÊM MỚI: Hàm ẩn loading
function hideLoadingGPS() {
    const loadingDiv = document.getElementById('gps-loading');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
}

// THÊM MỚI: Reset check-in button state
function resetCheckInButton() {
    // Find all check-in buttons and reset their state
    const checkinBtns = document.querySelectorAll('.shift-checkin-btn');
    checkinBtns.forEach(btn => {
        if (btn.disabled) {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-icons">📍</span> Check-in GPS';
        }
    });
}

// THÊM MỚI: Hàm hiển thị lỗi về khoảng cách
function showLocationError(currentDistance, allowedDistance) {
    const errorHtml = `
        <div class="location-error-details">
            <h4>⚠️ Vị trí không hợp lệ</h4>
            <p>Khoảng cách hiện tại: <strong>${currentDistance}m</strong></p>
            <p>Khoảng cách cho phép: <strong>${allowedDistance}m</strong></p>
            <p>Vui lòng đến nhà thuốc để check-in.</p>
        </div>
    `;

    showTimesheetNotificationCheckin(errorHtml, 'error');
}

// THÊM MỚI: Hàm thêm nút "Thử lại" khi GPS fail
function addRetryButton(scheduleId) {
    const shiftElement = document.querySelector(`[data-schedule-id="${scheduleId}"]`);
    if (!shiftElement) return;

    const actionsDiv = shiftElement.querySelector('.shift-actions');
    if (!actionsDiv) return;

    // Kiểm tra đã có button retry chưa
    if (actionsDiv.querySelector('.shift-retry-btn')) return;

    // Ẩn button check-in hiện tại
    const checkinBtn = actionsDiv.querySelector('.shift-checkin-btn');
    if (checkinBtn) {
        checkinBtn.style.display = 'none';
    }

    // Thêm button thử lại
    const retryBtn = document.createElement('button');
    retryBtn.className = 'shift-retry-btn available';
    retryBtn.innerHTML = '<span class="material-icons">🔄</span> Thử lại GPS';
    retryBtn.style.cssText = `
        background: #FF9800;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-right: 8px;
    `;

    actionsDiv.appendChild(retryBtn);

    // Thêm ghi chú
    const noteDiv = document.createElement('div');
    noteDiv.className = 'gps-error-note';
    noteDiv.innerHTML = '<small style="color: #f44336;">❌ GPS không khả dụng - Click để thử lại</small>';
    noteDiv.style.cssText = `
        font-size: 11px;
        color: #f44336;
        margin-top: 5px;
    `;

    actionsDiv.appendChild(noteDiv);
}

// THÊM MỚI: Hàm xóa nút thử lại
function removeRetryButton(scheduleId) {
    const shiftElement = document.querySelector(`[data-schedule-id="${scheduleId}"]`);
    if (!shiftElement) return;

    const actionsDiv = shiftElement.querySelector('.shift-actions');
    if (!actionsDiv) return;

    // Xóa button retry và note
    const retryBtn = actionsDiv.querySelector('.shift-retry-btn');
    const errorNote = actionsDiv.querySelector('.gps-error-note');

    if (retryBtn) retryBtn.remove();
    if (errorNote) errorNote.remove();

    // Hiện lại button check-in
    const checkinBtn = actionsDiv.querySelector('.shift-checkin-btn');
    if (checkinBtn) {
        checkinBtn.style.display = 'inline-flex';
        checkinBtn.disabled = false;
        checkinBtn.innerHTML = '<span class="material-icons">📍</span> Check-in GPS';
    }
}

// CẬP NHẬT: Handle check-in cho specific shift VỚI GPS - BỎ MANUAL CHECK-IN
async function handleShiftCheckInWithGPS(scheduleId) {
    console.log('handleShiftCheckInWithGPS called with scheduleId:', scheduleId);

    // Prevent multiple simultaneous requests
    if (isGPSRequestInProgress) {
        console.log('GPS request already in progress, ignoring...');
        return;
    }

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

    // Set flag to prevent multiple requests
    isGPSRequestInProgress = true;

    const shiftBtn = document.querySelector(`[data-schedule-id="${scheduleId}"] .shift-checkin-btn`);
    if (shiftBtn) {
        shiftBtn.disabled = true;
        shiftBtn.innerHTML = '<span class="material-icons spinning">refresh</span> Đang xử lý...';
    }

    try {
        // Kiểm tra permission trước
        const permission = await checkGPSPermission();
        console.log('GPS permission status:', permission);

        if (permission === 'denied') {
            throw new Error('Quyền truy cập vị trí đã bị từ chối. Vui lòng vào cài đặt trình duyệt để bật GPS.');
        }

        // Lấy vị trí hiện tại với 3 lần thử tự động
        const location = await getCurrentLocation();
        console.log('GPS Location obtained after', location.attempts, 'attempts:', {
            lat: location.lat,
            lng: location.lng,
            accuracy: location.accuracy
        });

        // Cập nhật loading
        showLoadingGPS('Đang thực hiện check-in...');

        // Validate location data trước khi gửi
        if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            throw new Error('Dữ liệu GPS không hợp lệ');
        }

        // Gửi request check-in với GPS
        const requestBody = {
            scheduleId: scheduleId,
            lat: location.lat,
            lng: location.lng
        };

        // Thêm accuracy nếu có
        if (location.accuracy) {
            requestBody.accuracy = location.accuracy;
        }

        console.log('Sending check-in request:', requestBody);

        const response = await fetch('http://localhost:8080/employee/timesheet/check-in-shift', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Check-in response status:', response.status);

        // Parse response
        let data;
        try {
            data = await response.json();
            console.log('Check-in response data:', data);
        } catch (parseError) {
            console.error('Error parsing response:', parseError);
            throw new Error('Lỗi khi xử lý phản hồi từ server');
        }

        if (response.ok) {
            showTimesheetNotificationCheckin(data.message || 'Check-in thành công!', 'success');
            if (data.gpsVerified) {
                showTimesheetNotificationCheckin(`✅ Vị trí GPS đã được xác thực (Lần thử: ${location.attempts})`, 'success');
            }
            await loadTimesheetStatusByShift(); // Refresh status immediately

            // Xóa retry button nếu có
            removeRetryButton(scheduleId);
        } else {
            // Xử lý các loại lỗi khác nhau
            if (response.status === 400) {
                // Bad Request - có thể là lỗi validation
                const errorMsg = data.message || data.error || 'Dữ liệu không hợp lệ';
                throw new Error(`Lỗi yêu cầu: ${errorMsg}`);
            } else if (response.status === 403) {
                throw new Error('Không có quyền thực hiện check-in');
            } else if (response.status === 409) {
                throw new Error('Đã check-in rồi hoặc xung đột thời gian');
            } else if (data.distance && data.allowedDistance) {
                showLocationError(data.distance, data.allowedDistance);
                // Thêm retry button cho trường hợp distance
                setTimeout(() => {
                    addRetryButton(scheduleId);
                }, 1000);
                return; // Don't throw error for distance issues
            } else {
                throw new Error(data.message || `Lỗi server (${response.status})`);
            }
        }
    } catch (error) {
        console.error('Error during GPS check-in:', error);

        // Hiển thị lỗi chi tiết
        const errorMessage = error.message || 'Lỗi khi check-in với GPS';

        // Kiểm tra loại lỗi
        if (error.message.includes('từ chối') || error.message.includes('permission')) {
            // Lỗi permission - không cho thử lại
            showTimesheetNotificationCheckin(
                `${errorMessage}<br><br>🔧 <strong>Hướng dẫn:</strong><br>
                1. Mở cài đặt trình duyệt<br>
                2. Tìm mục "Quyền" hoặc "Permissions"<br>
                3. Bật quyền "Vị trí" cho trang web này<br>
                4. Làm mới trang và thử lại`,
                'error'
            );
        } else {
            // Các lỗi khác - cho phép thử lại
            showTimesheetNotificationCheckin(
                `${errorMessage}<br><br>🔄 <strong>Có thể thử lại:</strong> Click nút "Thử lại GPS" để thử lần nữa.`,
                'error'
            );

            // Thêm retry button sau 2 giây
            setTimeout(() => {
                addRetryButton(scheduleId);
            }, 2000);
        }

        // Reset button state on error
        resetCheckInButton();
    } finally {
        hideLoadingGPS();
        isGPSRequestInProgress = false; // Reset flag
    }
}

// CẬP NHẬT: Hàm get button HTML để hiển thị GPS icon
function getShiftButtonHTML(shift) {
    const scheduleId = shift.scheduleId;

    if (shift.status === 'not_started') {
        if (shift.canCheckInNow) {
            return `
                <button class="shift-checkin-btn available gps-enabled" data-schedule-id="${scheduleId}">
                    <span class="material-icons">📍</span>
                    Check-in GPS
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

// Auto initialize check-in functionality
async function autoInitializeCheckin() {
    console.log('Starting auto check-in initialization...');

    try {
        // Kiểm tra hỗ trợ GPS ngay từ đầu
        if (!navigator.geolocation) {
            showTimesheetNotificationCheckin('⚠️ Trình duyệt không hỗ trợ GPS. Không thể check-in.', 'error');
        } else {
            // Kiểm tra permission GPS
            const permission = await checkGPSPermission();
            if (permission === 'denied') {
                showTimesheetNotificationCheckin('⚠️ Quyền GPS đã bị từ chối. Vui lòng bật GPS trong cài đặt trình duyệt.', 'warning');
            } else if (permission === 'prompt') {
                showTimesheetNotificationCheckin('💡 Hệ thống sẽ yêu cầu quyền GPS khi check-in.', 'info');
            } else if (permission === 'granted') {
                showTimesheetNotificationCheckin('✅ GPS đã sẵn sàng cho check-in.', 'success');
            }
        }

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
        const response = await fetch('https://healthmate-lc-83d3cba0821e.herokuapp.com/employee/timesheet/status-by-shift', {
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
        const response = await fetch('https://healthmate-lc-83d3cba0821e.herokuapp.com/employee/profile', {
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
        const response = await fetch('https://healthmate-lc-83d3cba0821e.herokuapp.com/employee/timesheet/status-by-shift', {
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
        const response = await fetch('https://healthmate-lc-83d3cba0821e.herokuapp.com/employee/schedules', {
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
                Backend chưa hỗ trợ check-in theo ca với GPS
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
        checkinStatus.textContent = 'Chưa hỗ trợ check-in theo ca với GPS';
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
                    <span class="material-icons">📍</span>
                    Có thể check-in GPS đến ${allowedEnd} (Tự động thử 3 lần)
                </div>
            `;
        } else if (currentTime < allowedStart) {
            return `
                <div class="shift-time-info waiting">
                    <span class="material-icons">schedule</span>
                    Check-in GPS từ ${allowedStart} đến ${allowedEnd}
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
        checkinStatus.textContent = `${workingShifts.length} ca đang làm việc (GPS)`;
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
        checkinStatus.textContent = `${availableShifts.length} ca có thể check-in GPS`;
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
        const response = await fetch('https://healthmate-lc-83d3cba0821e.herokuapp.com/employee/timesheet/check-in-shift', {
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
        const response = await fetch('https://healthmate-lc-83d3cba0821e.herokuapp.com/employee/timesheet/check-out-shift', {
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
    showTimesheetNotificationCheckin('Vui lòng sử dụng nút check-in GPS của từng ca làm việc', 'info');
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

    // Handle HTML content
    if (typeof message === 'string' && message.includes('<')) {
        notification.innerHTML = message;
    } else {
        notification.textContent = message;
    }

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
        maxWidth: "350px",
        wordWrap: "break-word",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
    });

    // Set background color based on type
    switch (type) {
        case "success":
            notification.style.background = "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)";
            break;
        case "error":
            notification.style.background = "linear-gradient(135deg, #fa709a 0%, #fee140 100%)";
            break;
        case "warning":
            notification.style.background = "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)";
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

    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = "translateX(100%)";
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 5000);
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

// ===== KẾT THÚC PHẦN CHECK-IN/CHECK-OUT THEO CA VỚI GPS =====