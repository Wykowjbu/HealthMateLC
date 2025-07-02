// Global variables
let customers = []
let currentCustomer = null
let currentSection = "customers" // Track current active section

// Order Management Variables
let selectedCustomerForOrder = null;
let orderItems = [];
let orderTotal = 0;

// Product Management Variables
let products = [];
let filteredProducts = [];

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
    initializeApp()
})

function initializeApp() {
    fetchCustomers()
    fetchProducts() // Thêm fetch products
    setupEventListeners()
    setupNavigation()
    setupMainEditForm() // Thêm dòng này
    setupOrderFormEventListeners() // Thêm dòng này
    showCustomerSection() // Show customer section by default
}

function setupEventListeners() {
    // Customer form submission
    const customerForm = document.getElementById("customerForm")
    if (customerForm) {
        customerForm.addEventListener("submit", handleAddCustomer)
    }

    // Search functionality - sử dụng đúng ID từ HTML
    const searchInput = document.getElementById("customerSearchInput")
    if (searchInput) {
        searchInput.addEventListener("input", handleSearch)
        console.log("Customer search event listener added successfully")
    } else {
        console.error("Customer search input not found!")
    }
}

function setupNavigation() {
    // Customer navigation
    const navCreateCustomer = document.getElementById("nav-create-customer")
    const navCustomerList = document.getElementById("nav-customer-list")

    // Order navigation
    const navCreateOrder = document.getElementById("nav-create-order")
    const navOrderList = document.getElementById("nav-order-list")

    // Personal navigation
    const navSchedule = document.getElementById("nav-schedule")
    const navMedicineInfo = document.getElementById("nav-medicine-info")

    if (navCreateCustomer) {
        navCreateCustomer.addEventListener("click", () => {
            setActiveNav(navCreateCustomer)
            showCustomerSection()
            openAddCustomerForm()
        })
    }

    if (navCustomerList) {
        navCustomerList.addEventListener("click", () => {
            setActiveNav(navCustomerList)
            showCustomerSection()
            openCustomerList()
        })
    }

    if (navCreateOrder) {
        navCreateOrder.addEventListener("click", () => {
            setActiveNav(navCreateOrder)
            showCreateOrderForm()
        })
    }

    if (navOrderList) {
        navOrderList.addEventListener("click", () => {
            setActiveNav(navOrderList)
            showNotification("Chức năng danh sách đơn hàng đang được phát triển", "info")
        })
    }

    if (navSchedule) {
        navSchedule.addEventListener("click", () => {
            setActiveNav(navSchedule)
            showSchedule()
        })
    }

    if (navMedicineInfo) {
        navMedicineInfo.addEventListener("click", () => {
            setActiveNav(navMedicineInfo)
            showNotification("Chức năng thông tin thuốc đang được phát triển", "info")
        })
    }
}

function setActiveNav(activeElement) {
    // Remove active class from all nav items
    const navItems = document.querySelectorAll(".nav-item")
    navItems.forEach((item) => item.classList.remove("active"))

    // Add active class to clicked item
    if (activeElement) {
        activeElement.classList.add("active")
    }
}

// Section Management Functions
function hideAllSections() {
    // Ẩn tất cả các section
    const customerContainer = document.querySelector(".customer-container")
    const createOrderForm = document.getElementById("createOrderForm")
    const scheduleContainer = document.getElementById("scheduleContainer")
    const mainEditCustomerSection = document.getElementById("mainEditCustomerSection")

    if (customerContainer) customerContainer.style.display = "none"
    if (createOrderForm) createOrderForm.style.display = "none"
    if (scheduleContainer) scheduleContainer.style.display = "none"
    if (mainEditCustomerSection) mainEditCustomerSection.style.display = "none"
}
// 
function showCustomerSection() {
    hideAllSections()
    currentSection = "customers"

    const customerContainer = document.querySelector(".customer-container")
    if (customerContainer) {
        customerContainer.style.display = "block"
    }

    // Reset customer section states
    resetCustomerSectionStates()
}

function showCreateOrderForm() {
    hideAllSections()
    currentSection = "orders"

    const createOrderForm = document.getElementById("createOrderForm")
    if (createOrderForm) {
        createOrderForm.style.display = "block"
    }
    
    // Reset form and ensure all elements are visible
    resetOrderForm()
    
    // Display products when form opens
    if (products.length > 0) {
        displayProducts(products)
    } else {
        // If products not loaded yet, fetch them
        fetchProducts()
    }
}

function showSchedule() {
    hideAllSections()
    currentSection = "schedule"

    const scheduleContainer = document.getElementById("scheduleContainer")
    if (scheduleContainer) {
        scheduleContainer.style.display = "block"
    }
}

function resetCustomerSectionStates() {
    // Reset all customer section states
    const customersList = document.querySelector(".customers-list")
    const createCustomerForm = document.getElementById("createCustomerForm")
    const customerDetailView = document.getElementById("customerDetailView")
    const editCustomerInfo = document.getElementById("editCustomerInfo")

    if (customersList) {
        customersList.classList.remove("shrink", "hide")
    }

    if (createCustomerForm) {
        createCustomerForm.classList.remove("active")
    }

    if (customerDetailView) {
        customerDetailView.classList.remove("active")
    }

    if (editCustomerInfo) {
        editCustomerInfo.classList.remove("active")
    }
}

// Customer Management Functions (updated)
function openAddCustomerForm() {
    if (currentSection !== "customers") {
        showCustomerSection()
    }

    // Close other customer forms
    document.getElementById("customerDetailView").classList.remove("active")
    document.getElementById("editCustomerInfo").classList.remove("active")

    // Show create form and shrink customer list
    const customersList = document.querySelector(".customers-list")
    if (customersList) {
        customersList.classList.add("shrink")
    }
    document.getElementById("createCustomerForm").classList.add("active")

    // Clear form
    const customerForm = document.getElementById("customerForm")
    if (customerForm) {
        customerForm.reset()
    }
}

function closeAddCustomerForm() {
    const customersList = document.querySelector(".customers-list")
    if (customersList) {
        customersList.classList.remove("shrink")
    }
    document.getElementById("createCustomerForm").classList.remove("active")

    const customerForm = document.getElementById("customerForm")
    if (customerForm) {
        customerForm.reset()
    }
}

function openCustomerDetails() {
    if (currentSection !== "customers") {
        showCustomerSection()
    }

    document.getElementById("createCustomerForm").classList.remove("active")
    document.getElementById("editCustomerInfo").classList.remove("active")
    const customersList = document.querySelector(".customers-list")
    if (customersList) {
        customersList.classList.add("shrink")
    }
    document.getElementById("customerDetailView").classList.add("active")
}

function closeCustomerDetails() {
    document.getElementById("customerDetailView").classList.remove("active")
    const customersList = document.querySelector(".customers-list")
    if (customersList) {
        customersList.classList.remove("shrink")
    }
}

function openEditCustomerInfoForm() {
    openMainEditCustomer() // Use the new main edit form instead
}

function closeEditCustomerForm() {
    document.getElementById("editCustomerInfo").classList.remove("active")
    const customersList = document.querySelector(".customers-list")
    if (customersList) {
        customersList.classList.remove("hide", "shrink")
    }

    const editForm = document.getElementById("editCustomerForm")
    if (editForm) {
        editForm.reset()
    }
}

function openCustomerList() {
    if (currentSection !== "customers") {
        showCustomerSection()
    }

    resetCustomerSectionStates()
}

// Customer Management Functions
async function fetchCustomers() {
    try {
        console.log("Fetching customers...")
        const response = await fetch("http://localhost:8080/employee/danh-sach-khach-hang", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        })

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
        }

        customers = await response.json()
        console.log("Received customers:", customers)
        displayCustomers(customers)
    } catch (error) {
        console.error("Error fetching customers:", error)
    }
}


function displayCustomers(customerList) {
    const customerListContainer = document.getElementById("customer-list")
    if (!customerListContainer) return

    customerListContainer.innerHTML = ""

    customerList.forEach((customer) => {
        const customerItem = document.createElement("div")
        customerItem.className = "customer-item"

        const initials = customer.fullName
            .split(" ")
            .map((word) => word.charAt(0))
            .slice(-2)
            .join("")
            .toUpperCase()

        customerItem.innerHTML = `
            <div class="customer-avatar">${initials}</div>
            <div class="customer-info">
                <h4>${customer.fullName}</h4>
                <p>${customer.phone || "N/A"} • Điểm: ${customer.totalPoints || 0}</p>
            </div>
        `

        customerItem.addEventListener("click", () => showCustomerDetails(customer))
        customerListContainer.appendChild(customerItem)
    })
}

// hiển thị chi tiết thông tin khách hàng khi mình click vao khach hàng bat kì
function showCustomerDetails(customer) {
    currentCustomer = customer

    // Populate customer details
    document.getElementById("detailFullName").textContent = customer.fullName || "N/A"
    document.getElementById("detailPhone").textContent = customer.phone || "N/A"
    document.getElementById("detailEmail").textContent = customer.email || "N/A"
    document.getElementById("detailGender").textContent = customer.gender || "Không xác định"
    document.getElementById("detailDateOfBirth").textContent = formatDate(customer.dateOfBirth) || "N/A"
    document.getElementById("detailMedicalHistory").textContent = customer.medicalHistory || "Không có"
    document.getElementById("detailAllergies").textContent = customer.allergies || "Không có"
    document.getElementById("detailTotalPoints").textContent = customer.totalPoints || 0
    document.getElementById("detailCreatedDate").textContent = formatDate(customer.createdDate)

    openCustomerDetails()
}


// Event Handlers
async function handleAddCustomer(event) {

    event.preventDefault()

    const formData = {
        fullName: document.getElementById("fullName").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim(),
        gender: document.getElementById("gender").value,
        dateOfBirth: document.getElementById("dateOfBirth").value,
        medicalHistory: document.getElementById("medicalHistory").value.trim(),
        allergies: document.getElementById("allergies").value.trim(),
    }

    try {
        const response = await fetch("http://localhost:8080/employee/tao-moi-khach-hang", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        })

        if (response.ok) {
            console.log("Customer added successfully")
            closeAddCustomerForm()
            fetchCustomers() // Refresh the customer list
            showNotification("Thêm khách hàng thành công!", "success")
        } else {
            throw new Error("Failed to add customer")
        }
    } catch (error) {
        console.error("Error adding customer:", error)
        showNotification("Lỗi khi thêm khách hàng: " + error.message, "error") ;
    }
}



function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase()
    const filteredCustomers = customers.filter(
        (customer) =>
            customer.fullName.toLowerCase().includes(searchTerm) ||
            customer.phone.includes(searchTerm) ||
            (customer.email && customer.email.toLowerCase().includes(searchTerm)),
    )
    displayCustomers(filteredCustomers)
}

// hàm chỉnh sua thong tin khách hàng(hiển thị, điền thông tin và chỉnh sửa)
function openMainEditCustomer() {
    console.log("Opening main edit customer form") // Debug log

    if (!currentCustomer) {
        console.error("No current customer selected")
        showNotification("Vui lòng chọn khách hàng trước", "error")
        return
    }

    // Chèn data vào các ô thông tin của khách hàng
    populateMainEditForm(currentCustomer)

    // Show main edit section
    const mainEditSection = document.getElementById("mainEditCustomerSection")
    if (mainEditSection) {
        mainEditSection.style.display = "flex" // Thay đổi từ classList.add("active")
        mainEditSection.classList.add("active")
        console.log("Đã hiển thị form để chỉnh sửa khách hàng!")
    } else {
        console.error("Hiển thị form chỉnh sủa bị lỗi!!")
    }

    // Close other forms
    closeCustomerDetails()
    closeEditCustomerForm()
}

function closeMainEditCustomer() {
    const mainEditSection = document.getElementById("mainEditCustomerSection")
    if (mainEditSection) {
        mainEditSection.style.display = "none"
        mainEditSection.classList.remove("active")
    }

    clearFormErrors()

    // Reset form
    const form = document.getElementById("mainEditCustomerForm")
    if (form) {
        form.reset()
    }
}



// Form validation functions


function showFormErrors(errors) {
    // Clear previous errors
    clearFormErrors()

    // Show new errors
    Object.keys(errors).forEach((field) => {
        const input = document.getElementById(`mainEdit${field.charAt(0).toUpperCase() + field.slice(1)}`)
        const errorElement = document.getElementById(`${field}Error`)

        if (input && errorElement) {
            input.classList.add("error")
            errorElement.textContent = errors[field]
            errorElement.classList.add("show")
        }
    })
}

function clearFormErrors() {
    const errorElements = document.querySelectorAll(".error-message")
    const inputElements = document.querySelectorAll(".form-group input, .form-group textarea, .form-group select")

    errorElements.forEach((el) => {
        el.classList.remove("show")
        el.textContent = ""
    })

    inputElements.forEach((el) => {
        el.classList.remove("error")
    })
}

// Process data before sending to server


// Handle main edit form submission


// Utility Functions
function formatDate(dateString) {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN")
}

function showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div")
    notification.className = `notification notification-${type}`
    notification.textContent = message

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
    })

    // Set background color based on type
    switch (type) {
        case "success":
            notification.style.background = "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
            break
        case "error":
            notification.style.background = "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
            break
        default:
            notification.style.background = "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
    }

    // Add to DOM
    document.body.appendChild(notification)

    // Animate in
    setTimeout(() => {
        notification.style.transform = "translateX(0)"
    }, 100)

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = "translateX(100%)"
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification)
            }
        }, 300)
    }, 3000)
}

// Additional feature functions (placeholders)
function historyOrderByCustomer() {
    if (!currentCustomer) return
    showNotification(`Xem lịch sử đơn hàng của ${currentCustomer.fullName}`, "info")
    // Implement order history functionality here
}

// Setup main edit form
function setupMainEditForm() {
    const mainEditForm = document.getElementById("mainEditCustomerForm")
    if (mainEditForm) {
        mainEditForm.addEventListener("submit", handleMainEditCustomer)
    }
}

// Populate main edit form with current customer data
function populateMainEditForm(customer) {
    if (!customer) return

    // Populate form fields
    const fullNameInput = document.getElementById("mainEditFullName")
    const phoneInput = document.getElementById("mainEditPhone")
    const emailInput = document.getElementById("mainEditEmail")
    const genderInput = document.getElementById("mainEditGender")
    const dateOfBirthInput = document.getElementById("mainEditDateOfBirth")
    const medicalHistoryInput = document.getElementById("mainEditMedicalHistory")
    const allergiesInput = document.getElementById("mainEditAllergies")
    const totalPointsInput = document.getElementById("mainEditTotalPoints")

    if (fullNameInput) fullNameInput.value = customer.fullName || ""
    if (phoneInput) phoneInput.value = customer.phone || ""
    if (emailInput) emailInput.value = customer.email || ""
    if (genderInput) genderInput.value = customer.gender || ""
    if (dateOfBirthInput) dateOfBirthInput.value = customer.dateOfBirth || ""
    if (medicalHistoryInput) medicalHistoryInput.value = customer.medicalHistory || ""
    if (allergiesInput) allergiesInput.value = customer.allergies || ""
    if (totalPointsInput) totalPointsInput.value = customer.totalPoints || 0

    // Update preview
    updateCustomerPreview(customer)
}

// Update customer preview in edit form
function updateCustomerPreview(customer) {
    const previewName = document.getElementById("previewName")
    const previewPhone = document.getElementById("previewPhone")
    const previewAvatar = document.getElementById("previewAvatar")

    if (previewName) previewName.textContent = customer.fullName || "Tên khách hàng"
    if (previewPhone) previewPhone.textContent = customer.phone || "Số điện thoại"
    
    if (previewAvatar && customer.fullName) {
        const initials = customer.fullName
            .split(" ")
            .map((word) => word.charAt(0))
            .slice(-2)
            .join("")
            .toUpperCase()
        previewAvatar.textContent = initials
    }
}

// Handle main edit form submission
async function handleMainEditCustomer(event) {
    event.preventDefault()

    if (!currentCustomer) {
        showNotification("Không tìm thấy thông tin khách hàng", "error")
        return
    }

    // Clear previous errors
    clearFormErrors()

    // Get form data
    const formData = {
        id: currentCustomer.customerId,
        fullName: document.getElementById("mainEditFullName").value.trim(),
        phone: document.getElementById("mainEditPhone").value.trim(),
        email: document.getElementById("mainEditEmail").value.trim(),
        gender: document.getElementById("mainEditGender").value,
        dateOfBirth: document.getElementById("mainEditDateOfBirth").value,
        medicalHistory: document.getElementById("mainEditMedicalHistory").value.trim(),
        allergies: document.getElementById("mainEditAllergies").value.trim(),
    }

    // Validate form data
    const errors = validateMainEditForm(formData)
    if (Object.keys(errors).length > 0) {
        showFormErrors(errors)
        return
    }

    try {
        // Show loading state
        const submitBtn = document.querySelector("#mainEditCustomerForm button[type='submit']")
        const originalText = submitBtn?.textContent
        if (submitBtn) {
            submitBtn.disabled = true
            submitBtn.textContent = "Đang xử lý..."
        }

        // Send update request to backend
        const response = await fetch(`http://localhost:8080/employee/cap-nhat-khach-hang/${formData.id}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                fullName: formData.fullName,
                phone: formData.phone,
                email: formData.email,
                gender: formData.gender,
                dateOfBirth: formData.dateOfBirth,
                medicalHistory: formData.medicalHistory,
                allergies: formData.allergies
            }),
        })
        if (response.ok) {
            const updatedCustomer = await response.json()
            
            // Update current customer data
            currentCustomer = { ...currentCustomer, ...updatedCustomer }
            
            // Update customers array
            const customerIndex = customers.findIndex(c => c.customerID === currentCustomer.customerID || c.id === currentCustomer.id)
            if (customerIndex !== -1) {
                customers[customerIndex] = currentCustomer
            }

            // Refresh UI
            fetchCustomers();
            displayCustomers(customers)
            showCustomerDetails(currentCustomer)
            closeMainEditCustomer()
            
            showNotification("Cập nhật thông tin khách hàng thành công!", "success")

        } else {
            
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `Số điện thoại hoặc email đã tồn tại! Vui lòng kiểm tra lại.`)
        }
    } catch (error) {
        console.error("Error updating customer:", error)
        showNotification("Số điện thoại hoặc email đã tồn tại! Vui lòng kiểm tra lại.", "error")
    } finally {
        // Reset button state
        const submitBtn = document.querySelector("#mainEditCustomerForm button[type='submit']")
        submitBtn.disabled = false
        submitBtn.textContent = "Lưu thay đổi"
        
    }
}

// Validate main edit form
function validateMainEditForm(formData) {
    const errors = {}

    // Validate full name
    if (!formData.fullName) {
        errors.fullName = "Tên khách hàng không được để trống"
    } else if (formData.fullName.length < 2) {
        errors.fullName = "Tên khách hàng phải có ít nhất 2 ký tự"
    } else if (formData.fullName.length > 100) {
        errors.fullName = "Tên khách hàng không được vượt quá 100 ký tự"
    }

    // Validate phone
    if (!formData.phone) {
        errors.phone = "Số điện thoại không được để trống"
    } else if (!/^[0-9]{10,11}$/.test(formData.phone)) {
        errors.phone = "Số điện thoại phải có 10-11 chữ số"
    }

    // Validate email (optional but must be valid if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = "Email không hợp lệ"
    }

    // Validate date of birth (optional but must be valid if provided)
    if (formData.dateOfBirth) {
        const birthDate = new Date(formData.dateOfBirth)
        const today = new Date()
        if (birthDate >= today) {
            errors.dateOfBirth = "Ngày sinh phải nhỏ hơn ngày hiện tại"
        }
    }

    // Validate medical history (optional, max length check)
    if (formData.medicalHistory && formData.medicalHistory.length > 1000) {
        errors.medicalHistory = "Tiền sử bệnh lý không được vượt quá 1000 ký tự"
    }

    // Validate allergies (optional, max length check)
    if (formData.allergies && formData.allergies.length > 500) {
        errors.allergies = "Thông tin dị ứng không được vượt quá 500 ký tự"
    }

    return errors
}

// Show Create Order Form
function showCreateOrderForm() {
    // Hide other sections first
    hideAllSections();
    
    // Show the create order form
    document.getElementById("createOrderForm").style.display = "flex";
    
    // Reset form and ensure all elements are visible
    resetOrderForm();
}

// Close Create Order Form
function closeCreateOrderForm() {
    document.getElementById("createOrderForm").style.display = "none";
    resetOrderForm();
    
    // Show customer section by default
    showCustomerSection();
}

// Reset Order Form
function resetOrderForm() {
    selectedCustomerForOrder = null;
    orderItems = [];
    orderTotal = 0;
    
    // Clear form fields
    document.getElementById("orderCustomerSearch").value = "";
    document.getElementById("medicineSearch").value = "";
    document.getElementById("noCustomerCheckbox").checked = false;
    
    // Hide selected customer
    document.getElementById("selectedCustomer").style.display = "none";
    document.getElementById("customerSearchResults").style.display = "none";
    
    // Show customer search elements
    showCustomerSearchElements();
    
    // Reset order summary
    updateOrderSummary();
}

// Search Customers for Order
function searchCustomersForOrder(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
        document.getElementById("customerSearchResults").style.display = "none";
        return;
    }
    
    // Filter customers based on search term
    const filteredCustomers = customers.filter(customer => 
        customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
    );
    
    displayCustomerSearchResults(filteredCustomers);
}

// Display Customer Search Results
function displayCustomerSearchResults(customerList) {
    const resultsContainer = document.getElementById("customerSearchResults");
    
    if (customerList.length === 0) {
        resultsContainer.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #718096;">
                <span class="material-icons">search_off</span>
                <p>Không tìm thấy khách hàng</p>
            </div>
        `;
        resultsContainer.style.display = "block";
        return;
    }
    
    resultsContainer.innerHTML = customerList.map(customer => {
        const initials = customer.fullName
            .split(" ")
            .map(word => word.charAt(0))
            .slice(-2)
            .join("")
            .toUpperCase();
            
        return `
            <div class="customer-result-item" onclick="selectCustomerForOrder(${customer.id}, '${customer.fullName}', '${customer.phone}', ${customer.totalPoints || 0})">
                <div class="customer-avatar">${initials}</div>
                <div class="customer-info">
                    <h6>${customer.fullName}</h6>
                    <p>${customer.phone} • Điểm: ${customer.totalPoints || 0}</p>
                </div>
            </div>
        `;
    }).join("");
    
    resultsContainer.style.display = "block";
}

// Select Customer for Order
function selectCustomerForOrder(customerId, fullName, phone, totalPoints) {
    selectedCustomerForOrder = {
        id: customerId,
        fullName: fullName,
        phone: phone,
        totalPoints: totalPoints
    };
    
    // Update selected customer display
    const initials = fullName
        .split(" ")
        .map(word => word.charAt(0))
        .slice(-2)
        .join("")
        .toUpperCase();
    
    document.getElementById("selectedCustomerAvatar").textContent = initials;
    document.getElementById("selectedCustomerName").textContent = fullName;
    document.getElementById("selectedCustomerPhone").textContent = phone;
    document.getElementById("selectedCustomerPoints").textContent = `Điểm: ${totalPoints || 0}`;
    
    // Show selected customer and hide search results
    document.getElementById("selectedCustomer").style.display = "flex";
    document.getElementById("customerSearchResults").style.display = "none";
    document.getElementById("orderCustomerSearch").value = "";
    document.getElementById("noCustomerCheckbox").checked = false;
    
    // Hide customer search elements
    hideCustomerSearchElements();
}

// Hide Customer Search Elements when a customer is selected
function hideCustomerSearchElements() {
    const customerSearchContainer = document.querySelector(".customer-search-container");
    const noCustomerOption = document.querySelector(".no-customer-option");
    
    if (customerSearchContainer) {
        customerSearchContainer.style.display = "none";
    }
    if (noCustomerOption) {
        noCustomerOption.style.display = "none";
    }
}

// Show Customer Search Elements when customer is removed
function showCustomerSearchElements() {
    const customerSearchContainer = document.querySelector(".customer-search-container");
    const noCustomerOption = document.querySelector(".no-customer-option");
    
    if (customerSearchContainer) {
        customerSearchContainer.style.display = "flex";
    }
    if (noCustomerOption) {
        noCustomerOption.style.display = "block";
    }
}

// Remove Selected Customer
function removeSelectedCustomer() {
    selectedCustomerForOrder = null;
    document.getElementById("selectedCustomer").style.display = "none";
    document.getElementById("orderCustomerSearch").value = "";
    document.getElementById("noCustomerCheckbox").checked = false;
    
    // Show customer search elements again
    showCustomerSearchElements();
}

// Product Management Functions
async function fetchProducts() {
    try {
        console.log("Fetching products...")
        const response = await fetch("http://localhost:8080/employee/danh-sach-san-pham", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        })

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
        }

        products = await response.json()
        filteredProducts = [...products] // Copy all products initially
        console.log("Received products:", products)
        displayProducts(products)
    } catch (error) {
        console.error("Error fetching products:", error)
        console.log("Using sample products as fallback")
        displaySampleProducts()
        showNotification("Đang sử dụng dữ liệu mẫu - Không thể kết nối API", "info")
    }
}

function displayProducts(productList) {
    const productListContainer = document.getElementById("medicineSearchResults")
    if (!productListContainer) {
        console.error("Medicine search results container not found!")
        return
    }

    // Clear existing static content but keep structure
    productListContainer.innerHTML = ""

    if (productList.length === 0) {
        productListContainer.innerHTML = `
            <div class="no-products" style="text-align: center; padding: 20px; color: #718096;">
                <span class="material-icons">inventory_2</span>
                <p>Không có sản phẩm nào</p>
            </div>
        `
        return
    }

    productList.forEach((product) => {
        const productItem = document.createElement("div")
        productItem.className = "medicine-item"
        
        productItem.innerHTML = `
            <div class="medicine-info">
                <h6>${product.productName}</h6>
                <p>${product.description || product.productType}</p>
                <span class="medicine-price">${formatCurrency(product.price)}</span>
            </div>
            <button class="add-medicine-btn" onclick="addProductToOrder(${product.productId}, '${product.productName}', ${product.price})">
                <span class="material-icons">add</span>
            </button>
        `

        productListContainer.appendChild(productItem)
    })
}

function searchProducts(searchTerm) {
    console.log("Searching products with term:", searchTerm);
    console.log("Current products array:", products);
    
    if (!searchTerm) {
        filteredProducts = [...products]
    } else {
        filteredProducts = products.filter(product => 
            product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.productType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
    }
    console.log("Filtered products:", filteredProducts);
    displayProducts(filteredProducts)
}

function filterProductsByType(productType) {
    if (!productType || productType === 'all') {
        filteredProducts = [...products]
    } else {
        filteredProducts = products.filter(product => 
            product.productType.toLowerCase() === productType.toLowerCase()
        )
    }
    displayProducts(filteredProducts)
}

function addProductToOrder(productId, productName, price) {
    // Check if product already exists in order
    const existingItem = orderItems.find(item => item.id === productId)
    
    if (existingItem) {
        existingItem.quantity += 1
        existingItem.total = existingItem.quantity * existingItem.price
    } else {
        orderItems.push({
            id: productId,
            name: productName,
            price: price,
            quantity: 1,
            total: price
        })
    }
    
    updateOrderSummary()
    showNotification(`Đã thêm ${productName} vào đơn hàng`, "success")
}

// Close Create Order Form
function closeCreateOrderForm() {
    document.getElementById("createOrderForm").style.display = "none";
    resetOrderForm();
    
    // Show customer section by default
    showCustomerSection();
}

// Reset Order Form
function resetOrderForm() {
    selectedCustomerForOrder = null;
    orderItems = [];
    orderTotal = 0;
    
    // Clear form fields
    document.getElementById("orderCustomerSearch").value = "";
    document.getElementById("medicineSearch").value = "";
    document.getElementById("noCustomerCheckbox").checked = false;
    
    // Hide selected customer
    document.getElementById("selectedCustomer").style.display = "none";
    document.getElementById("customerSearchResults").style.display = "none";
    
    // Show customer search elements
    showCustomerSearchElements();
    
    // Reset order summary
    updateOrderSummary();
}

// Search Customers for Order
function searchCustomersForOrder(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
        document.getElementById("customerSearchResults").style.display = "none";
        return;
    }
    
    // Filter customers based on search term
    const filteredCustomers = customers.filter(customer => 
        customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
    );
    
    displayCustomerSearchResults(filteredCustomers);
}

// Display Customer Search Results
function displayCustomerSearchResults(customerList) {
    const resultsContainer = document.getElementById("customerSearchResults");
    
    if (customerList.length === 0) {
        resultsContainer.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #718096;">
                <span class="material-icons">search_off</span>
                <p>Không tìm thấy khách hàng</p>
            </div>
        `;
        resultsContainer.style.display = "block";
        return;
    }
    
    resultsContainer.innerHTML = customerList.map(customer => {
        const initials = customer.fullName
            .split(" ")
            .map(word => word.charAt(0))
            .slice(-2)
            .join("")
            .toUpperCase();
            
        return `
            <div class="customer-result-item" onclick="selectCustomerForOrder(${customer.id}, '${customer.fullName}', '${customer.phone}', ${customer.totalPoints || 0})">
                <div class="customer-avatar">${initials}</div>
                <div class="customer-info">
                    <h6>${customer.fullName}</h6>
                    <p>${customer.phone} • Điểm: ${customer.totalPoints || 0}</p>
                </div>
            </div>
        `;
    }).join("");
    
    resultsContainer.style.display = "block";
}

// Select Customer for Order
function selectCustomerForOrder(customerId, fullName, phone, totalPoints) {
    selectedCustomerForOrder = {
        id: customerId,
        fullName: fullName,
        phone: phone,
        totalPoints: totalPoints
    };
    
    // Update selected customer display
    const initials = fullName
        .split(" ")
        .map(word => word.charAt(0))
        .slice(-2)
        .join("")
        .toUpperCase();
    
    document.getElementById("selectedCustomerAvatar").textContent = initials;
    document.getElementById("selectedCustomerName").textContent = fullName;
    document.getElementById("selectedCustomerPhone").textContent = phone;
    document.getElementById("selectedCustomerPoints").textContent = `Điểm: ${totalPoints || 0}`;
    
    // Show selected customer and hide search results
    document.getElementById("selectedCustomer").style.display = "flex";
    document.getElementById("customerSearchResults").style.display = "none";
    document.getElementById("orderCustomerSearch").value = "";
    document.getElementById("noCustomerCheckbox").checked = false;
    
    // Hide customer search elements
    hideCustomerSearchElements();
}

// Hide Customer Search Elements when a customer is selected
function hideCustomerSearchElements() {
    const customerSearchContainer = document.querySelector(".customer-search-container");
    const noCustomerOption = document.querySelector(".no-customer-option");
    
    if (customerSearchContainer) {
        customerSearchContainer.style.display = "none";
    }
    if (noCustomerOption) {
        noCustomerOption.style.display = "none";
    }
}

// Show Customer Search Elements when customer is removed
function showCustomerSearchElements() {
    const customerSearchContainer = document.querySelector(".customer-search-container");
    const noCustomerOption = document.querySelector(".no-customer-option");
    
    if (customerSearchContainer) {
        customerSearchContainer.style.display = "flex";
    }
    if (noCustomerOption) {
        noCustomerOption.style.display = "block";
    }
}

// Remove Selected Customer
function removeSelectedCustomer() {
    selectedCustomerForOrder = null;
    document.getElementById("selectedCustomer").style.display = "none";
    document.getElementById("orderCustomerSearch").value = "";
    document.getElementById("noCustomerCheckbox").checked = false;
    
    // Show customer search elements again
    showCustomerSearchElements();
}

// Update Medicine Quantity (renamed to Product)
function updateProductQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeProductFromOrder(productId);
        return;
    }
    
    const item = orderItems.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        item.total = item.quantity * item.price;
        updateOrderSummary();
    }
}

// Remove Product from Order (renamed from Medicine)
function removeProductFromOrder(productId) {
    orderItems = orderItems.filter(item => item.id !== productId);
    updateOrderSummary();
}

// Update Order Summary
function updateOrderSummary() {
    const orderItemsList = document.getElementById("orderItemsList");
    
    if (orderItems.length === 0) {
        orderItemsList.innerHTML = `
            <div class="empty-order">
                <span class="material-icons">shopping_cart_outlined</span>
                <p>Chưa có sản phẩm nào</p>
            </div>
        `;
        orderTotal = 0;
    } else {
        orderItemsList.innerHTML = orderItems.map(item => `
            <div class="order-item">
                <div class="order-item-info">
                    <h6>${item.name}</h6>
                    <p>${formatCurrency(item.price)} x ${item.quantity}</p>
                </div>
                <div class="order-item-controls">
                    <button class="quantity-btn" onclick="updateProductQuantity(${item.id}, ${item.quantity - 1})">
                        <span class="material-icons" style="font-size: 14px;">remove</span>
                    </button>
                    <input type="number" class="quantity-input" value="${item.quantity}" 
                           onchange="updateProductQuantity(${item.id}, parseInt(this.value) || 0)" min="1">
                    <button class="quantity-btn" onclick="updateProductQuantity(${item.id}, ${item.quantity + 1})">
                        <span class="material-icons" style="font-size: 14px;">add</span>
                    </button>
                    <button class="remove-item-btn" onclick="removeProductFromOrder(${item.id})">
                        <span class="material-icons" style="font-size: 14px;">delete</span>
                    </button>
                </div>
                <div class="order-item-total">
                    ${formatCurrency(item.total)}
                </div>
            </div>
        `).join("");
        
        orderTotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    }
    
    // Update totals
    document.getElementById("orderSubtotal").textContent = formatCurrency(orderTotal);
    document.getElementById("orderTotal").textContent = formatCurrency(orderTotal);
}

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Open Quick Add Customer Popup
function openQuickAddCustomer() {
    document.getElementById("quickAddCustomerPopup").style.display = "block";
}

// Close Quick Add Customer Popup
function closeQuickAddCustomer() {
    document.getElementById("quickAddCustomerPopup").style.display = "none";
    document.getElementById("quickAddCustomerForm").reset();
}

// Handle Quick Add Customer Form
async function handleQuickAddCustomer(event) {
    event.preventDefault();
    
    const formData = {
        fullName: document.getElementById("quickFullName").value.trim(),
        phone: document.getElementById("quickPhone").value.trim(),
        email: document.getElementById("quickEmail").value.trim()
    };
    
    try {
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Đang thêm...";
        
        // Send request to backend
        const response = await fetch("http://localhost:8080/employee/tao-moi-khach-hang", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });
        
        if (response.ok) {
            const newCustomer = await response.json();
            
            // Add to customers array
            customers.push(newCustomer);
            
            // Select the new customer
            selectCustomerForOrder(
                newCustomer.customerID,
                newCustomer.fullName,
                newCustomer.phone,
                newCustomer.totalPoints || 0
            );
            
            closeQuickAddCustomer();
            showNotification("Thêm khách hàng thành công!", "success");
        } else {
            throw new Error("Không thể thêm khách hàng");
        }
    } catch (error) {
        console.error("Error adding customer:", error);
        showNotification("Lỗi khi thêm khách hàng: " + error.message, "error");
    } finally {
        // Reset button state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = "Thêm và chọn";
    }
}

// Cancel Order
function cancelOrder() {
    if (orderItems.length > 0) {
        if (confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
            closeCreateOrderForm();
        }
    } else {
        closeCreateOrderForm();
    }
}

// Create Order
async function createOrder() {
    if (orderItems.length === 0) {
        showNotification("Vui lòng thêm ít nhất một sản phẩm", "error");
        return;
    }
    
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const noCustomer = document.getElementById("noCustomerCheckbox").checked;
    
    const orderData = {
        customerId: noCustomer ? null : selectedCustomerForOrder?.id,
        items: orderItems,
        totalAmount: orderTotal,
        paymentMethod: paymentMethod,
        invoiceDate: new Date().toISOString()
    };
    
    try {
        // Show loading state
        const createBtn = document.querySelector('.create-order-btn');
        const originalText = createBtn.innerHTML;
        createBtn.disabled = true;
        createBtn.innerHTML = '<span class="material-icons">refresh</span> Đang tạo...';
        
        // Send to backend
        const response = await fetch("http://localhost:8080/employee/tao-don-hang", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(orderData),
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification("Tạo đơn hàng thành công!", "success");
            closeCreateOrderForm();
            
            // Print receipt if needed
            if (confirm("Bạn có muốn in hóa đơn không?")) {
                printReceipt(result);
            }
        } else {
            throw new Error("Không thể tạo đơn hàng");
        }
    } catch (error) {
        console.error("Error creating order:", error);
        showNotification("Lỗi khi tạo đơn hàng: " + error.message, "error");
    } finally {
        // Reset button state
        const createBtn = document.querySelector('.create-order-btn');
        createBtn.disabled = false;
        createBtn.innerHTML = originalText;
    }
}

// Print Receipt
function printReceipt(orderData) {
    // Implementation for printing receipt
    console.log("Printing receipt for order:", orderData);
    showNotification("Chức năng in hóa đơn sẽ được cập nhật", "info");
}

// Setup Order Form Event Listeners
function setupOrderFormEventListeners() {
    // Customer search
    const customerSearchInput = document.getElementById("orderCustomerSearch");
    if (customerSearchInput) {
        customerSearchInput.addEventListener("input", (e) => {
            // If user starts typing and no customer checkbox is checked, uncheck it
            const noCustomerCheckbox = document.getElementById("noCustomerCheckbox");
            if (noCustomerCheckbox && noCustomerCheckbox.checked && e.target.value.length > 0) {
                noCustomerCheckbox.checked = false;
                showCustomerSearchElements();
            }
            
            searchCustomersForOrder(e.target.value);
        });
    }
    
    // Product search
    const productSearchInput = document.getElementById("medicineSearch");
    if (productSearchInput) {
        productSearchInput.addEventListener("input", (e) => {
            console.log("Product search input detected:", e.target.value);
            searchProducts(e.target.value);
        });
        console.log("Product search event listener added successfully");
    } else {
        console.error("Product search input (medicineSearch) not found!");
    }
    
    // Product type filter
    const productTypeFilter = document.getElementById("productTypeFilter");
    if (productTypeFilter) {
        productTypeFilter.addEventListener("change", (e) => {
            filterProductsByType(e.target.value);
        });
    }
    
    // No customer checkbox
    const noCustomerCheckbox = document.getElementById("noCustomerCheckbox");
    if (noCustomerCheckbox) {
        noCustomerCheckbox.addEventListener("change", (e) => {
            if (e.target.checked) {
                removeSelectedCustomer();
                document.getElementById("customerSearchResults").style.display = "none";
                
                // Hide customer search elements when no customer is selected
                const customerSearchContainer = document.querySelector(".customer-search-container");
                if (customerSearchContainer) {
                    customerSearchContainer.style.display = "none";
                }
            } else {
                // Show customer search elements when unchecked
                showCustomerSearchElements();
            }
        });
    }
    
    // Quick add customer form
    const quickAddForm = document.getElementById("quickAddCustomerForm");
    if (quickAddForm) {
        quickAddForm.addEventListener("submit", handleQuickAddCustomer);
    }
}

// Refresh products display when needed
function refreshProductsDisplay() {
    if (products.length > 0) {
        filteredProducts = [...products];
        displayProducts(filteredProducts);
    }
}

// Function to display sample products if API is not available
function displaySampleProducts() {
    const sampleProducts = [
        {
            productId: 1,
            productName: "Paracetamol 500mg",
            productType: "Thuốc",
            unit: "Viên",
            description: "Giảm đau, hạ sốt",
            price: 2500
        },
        {
            productId: 2,
            productName: "Amoxicillin 250mg",
            productType: "Thuốc",
            unit: "Viên", 
            description: "Kháng sinh",
            price: 3500
        },
        {
            productId: 3,
            productName: "Vitamin C 1000mg",
            productType: "Thuốc",
            unit: "Viên",
            description: "Bổ sung vitamin",
            price: 1500
        }
    ];
    
    products = sampleProducts;
    filteredProducts = [...products];
    displayProducts(filteredProducts);
    console.log("Displaying sample products as fallback");
}



