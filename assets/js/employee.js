// Global variables
let customers = []
let currentCustomer = null
let currentSection = "customers" // Track current active section

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
    initializeApp()
})

function initializeApp() {
    fetchCustomers()
    setupEventListeners()
    setupNavigation()
    setupMainEditForm() // Thêm dòng này
    showCustomerSection() // Show customer section by default
}

function setupEventListeners() {
    // Customer form submission
    const customerForm = document.getElementById("customerForm")
    if (customerForm) {
        customerForm.addEventListener("submit", handleAddCustomer)
    }

    // Edit customer form submission
    const editCustomerForm = document.getElementById("editCustomerForm")
    if (editCustomerForm) {
        editCustomerForm.addEventListener("submit", handleEditCustomer)
    }

    // Search functionality
    const searchInput = document.getElementById("searchCustomer")
    if (searchInput) {
        searchInput.addEventListener("input", handleSearch)
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
    const customersList = document.getElementById("customersList")
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

    // Show create form
    document.getElementById("customersList").classList.add("shrink")
    document.getElementById("createCustomerForm").classList.add("active")

    // Clear form
    const customerForm = document.getElementById("customerForm")
    if (customerForm) {
        customerForm.reset()
    }
}

function closeAddCustomerForm() {
    document.getElementById("customersList").classList.remove("shrink")
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
    document.getElementById("customersList").classList.add("shrink")
    document.getElementById("customerDetailView").classList.add("active")
}

function closeCustomerDetails() {
    document.getElementById("customerDetailView").classList.remove("active")
    document.getElementById("customersList").classList.remove("shrink")
}

function openEditCustomerInfoForm() {
    openMainEditCustomer() // Use the new main edit form instead
}

function closeEditCustomerForm() {
    document.getElementById("editCustomerInfo").classList.remove("active")
    document.getElementById("customersList").classList.remove("hide", "shrink")

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
        // Display mock data for demo purposes
        displayMockCustomers()
    }
}

function displayMockCustomers() {
    const mockCustomers = [
        {
            id: 1,
            fullName: "Nguyễn Văn An",
            phone: "0901234567",
            email: "nguyenvanan@email.com",
            allergies: "Không có",
            totalPoints: 150,
            createdDate: "2024-01-15",
        },
        {
            id: 2,
            fullName: "Trần Thị Bình",
            phone: "0912345678",
            email: "tranthibinh@email.com",
            allergies: "Dị ứng penicillin",
            totalPoints: 200,
            createdDate: "2024-02-20",
        },
        {
            id: 3,
            fullName: "Lê Minh Cường",
            phone: "0923456789",
            email: "leminhcuong@email.com",
            allergies: "Không có",
            totalPoints: 75,
            createdDate: "2024-03-10",
        },
    ]

    customers = mockCustomers
    displayCustomers(customers)
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

function showCustomerDetails(customer) {
    currentCustomer = customer

    // Populate customer details
    document.getElementById("detailFullName").textContent = customer.fullName || "N/A"
    document.getElementById("detailPhone").textContent = customer.phone || "N/A"
    document.getElementById("detailEmail").textContent = customer.email || "N/A"
    document.getElementById("detailAllergies").textContent = customer.allergies || "Không có"
    document.getElementById("detailTotalPoints").textContent = customer.totalPoints || 0
    document.getElementById("detailCreatedDate").textContent = formatDate(customer.createdDate)

    openCustomerDetails()
}

// Event Handlers
async function handleAddCustomer(event) {
    event.preventDefault()

    const formData = {
        fullName: document.getElementById("fullName").value,
        phone: document.getElementById("phone").value,
        email: document.getElementById("email").value,
        allergies: document.getElementById("allergies").value,
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
        // For demo purposes, add to local array
        const newCustomer = {
            id: customers.length + 1,
            ...formData,
            totalPoints: 0,
            createdDate: new Date().toISOString().split("T")[0],
        }
        
    }
}

async function handleEditCustomer(event) {
    event.preventDefault()

    if (!currentCustomer) return

    const formData = {
        id: currentCustomer.id,
        fullName: document.getElementById("editFullName").value,
        phone: document.getElementById("editPhone").value,
        email: document.getElementById("editEmail").value,
        allergies: document.getElementById("editAllergies").value,
        totalPoints: Number.parseInt(document.getElementById("editTotalPoints").value) || 0,
    }

    try {
        const response = await fetch(`http://localhost:8080/employee/cap-nhat-khach-hang/${currentCustomer.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        })

        if (response.ok) {
            console.log("Customer updated successfully")
            closeEditCustomerForm()
            fetchCustomers() // Refresh the customer list
            showNotification("Cập nhật thông tin thành công!", "success")
        } else {
            throw new Error("Failed to update customer")
        }
    } catch (error) {
        console.error("Error updating customer:", error)
        // For demo purposes, update local array
        const customerIndex = customers.findIndex((c) => c.id === currentCustomer.id)
        if (customerIndex !== -1) {
            customers[customerIndex] = { ...customers[customerIndex], ...formData }
            displayCustomers(customers)
            currentCustomer = customers[customerIndex]
            showCustomerDetails(currentCustomer)
        }
        closeEditCustomerForm()
        showNotification("Cập nhật thông tin thành công! (Demo mode)", "success")
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

// Main Edit Customer Functions
function openMainEditCustomer() {
    console.log("Opening main edit customer form") // Debug log

    if (!currentCustomer) {
        console.error("No current customer selected")
        showNotification("Vui lòng chọn khách hàng trước", "error")
        return
    }

    // Populate form with current customer data
    populateMainEditForm(currentCustomer)

    // Show main edit section
    const mainEditSection = document.getElementById("mainEditCustomerSection")
    if (mainEditSection) {
        mainEditSection.style.display = "flex" // Thay đổi từ classList.add("active")
        mainEditSection.classList.add("active")
        console.log("Main edit section should be visible now")
    } else {
        console.error("Main edit section not found")
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

function populateMainEditForm(customer) {
    console.log("Populating form with customer:", customer)

    try {
        // Update preview
        const initials = customer.fullName
            .split(" ")
            .map((word) => word.charAt(0))
            .slice(-2)
            .join("")
            .toUpperCase()

        const previewAvatar = document.getElementById("previewAvatar")
        const previewName = document.getElementById("previewName")
        const previewPhone = document.getElementById("previewPhone")

        if (previewAvatar) previewAvatar.textContent = initials
        if (previewName) previewName.textContent = customer.fullName || "N/A"
        if (previewPhone) previewPhone.textContent = customer.phone || "N/A"

        // Populate form fields
        const fields = [
            { id: "mainEditFullName", value: customer.fullName || "" },
            { id: "mainEditPhone", value: customer.phone || "" },
            { id: "mainEditEmail", value: customer.email || "" },
            { id: "mainEditBirthDate", value: customer.birthDate || "" },
            { id: "mainEditGender", value: customer.gender || "" },
            { id: "mainEditTotalPoints", value: customer.totalPoints || 0 },
            { id: "mainEditAddress", value: customer.address || "" },
            { id: "mainEditMedicalHistory", value: customer.medicalHistory || "" },
            { id: "mainEditAllergies", value: customer.allergies || "" },
        ]

        fields.forEach((field) => {
            const element = document.getElementById(field.id)
            if (element) {
                element.value = field.value
            } else {
                console.warn(`Element ${field.id} not found`)
            }
        })

        console.log("Form populated successfully")
    } catch (error) {
        console.error("Error populating form:", error)
    }
}

// Form validation functions
function validateCustomerForm(formData) {
    const errors = {}

    // Validate full name
    if (!formData.fullName || formData.fullName.trim().length < 2) {
        errors.fullName = "Họ tên phải có ít nhất 2 ký tự"
    }

    // Validate phone
    const phoneRegex = /^[0-9]{10,11}$/
    if (!formData.phone || !phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
        errors.phone = "Số điện thoại không hợp lệ (10-11 số)"
    }

    // Validate email if provided
    if (formData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            errors.email = "Email không hợp lệ"
        }
    }

    return errors
}

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
function processCustomerData(formData) {
    return {
        id: currentCustomer.id,
        fullName: formData.fullName.trim(),
        phone: formData.phone.replace(/\s/g, ""), // Remove spaces
        email: formData.email ? formData.email.trim().toLowerCase() : null,
        birthDate: formData.birthDate || null,
        gender: formData.gender || null,
        totalPoints: Number.parseInt(formData.totalPoints) || 0,
        address: formData.address ? formData.address.trim() : null,
        medicalHistory: formData.medicalHistory ? formData.medicalHistory.trim() : null,
        allergies: formData.allergies ? formData.allergies.trim() : null,
        updatedAt: new Date().toISOString(),
    }
}

// Handle main edit form submission
async function handleMainEditCustomer(event) {
    event.preventDefault()

    if (!currentCustomer) return

    const form = event.target
    const formData = new FormData(form)
    const customerData = {}

    // Convert FormData to object
    for (const [key, value] of formData.entries()) {
        customerData[key] = value
    }

    // Validate form data
    const errors = validateCustomerForm(customerData)
    if (Object.keys(errors).length > 0) {
        showFormErrors(errors)
        return
    }

    // Process data before sending
    const processedData = processCustomerData(customerData)

    // Show loading state
    const saveBtn = document.getElementById("saveCustomerBtn")
    const btnText = saveBtn.querySelector(".btn-text")
    const loadingSpinner = saveBtn.querySelector(".loading-spinner")

    saveBtn.disabled = true
    btnText.style.display = "none"
    loadingSpinner.style.display = "flex"

    try {
        console.log("Sending customer data:", processedData)

        const response = await fetch("http://localhost:8080/HealthMateLC", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(processedData),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
        }

        const result = await response.json()
        console.log("Server response:", result)

        // Update local customer data
        currentCustomer = { ...currentCustomer, ...processedData }

        // Update customer in the list
        const customerIndex = customers.findIndex((c) => c.id === currentCustomer.id)
        if (customerIndex !== -1) {
            customers[customerIndex] = currentCustomer
            displayCustomers(customers)
        }

        // Close form and show success
        closeMainEditCustomer()
        showNotification("Cập nhật thông tin khách hàng thành công!", "success")

        // Refresh customer details if it was open
        if (document.getElementById("customerDetailView").classList.contains("active")) {
            showCustomerDetails(currentCustomer)
        }
    } catch (error) {
        console.error("Error updating customer:", error)
        showNotification(`Lỗi cập nhật: ${error.message}`, "error")
    } finally {
        // Reset loading state
        saveBtn.disabled = false
        btnText.style.display = "inline"
        loadingSpinner.style.display = "none"
    }
}

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

// Thêm vào cuối file, sau function historyOrderByCustomer()

// Setup event listeners for main edit form
function setupMainEditForm() {
    const mainEditForm = document.getElementById("mainEditCustomerForm")
    if (mainEditForm) {
        mainEditForm.addEventListener("submit", handleMainEditCustomer)
    }

    // Add click outside to close
    const mainEditSection = document.getElementById("mainEditCustomerSection")
    if (mainEditSection) {
        mainEditSection.addEventListener("click", (e) => {
            if (e.target === mainEditSection) {
                closeMainEditCustomer()
            }
        })
    }
}

// Thêm function debug này vào cuối file
function testMainEdit() {
    console.log("Test main edit clicked")
    console.log("Current customer:", currentCustomer)

    if (!currentCustomer) {
        // Tạo customer giả để test
        currentCustomer = {
            id: 999,
            fullName: "Test Customer",
            phone: "0123456789",
            email: "test@example.com",
            totalPoints: 100,
        }
    }

    openMainEditCustomer()
}
