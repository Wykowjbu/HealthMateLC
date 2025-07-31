document.addEventListener("DOMContentLoaded", () => {
  // Get hidden fields
  const params = new URLSearchParams(window.location.search);
  const customerId = params.get("customerId");
  const pharmacyId = params.get("pharmacyId");
  const invoiceId = params.get("invoiceId");
  const customerIdInput = document.getElementById("customerId");
  const pharmacyIdInput = document.getElementById("pharmacyId");
  const invoiceIdInput = document.getElementById("invoiceId");
  if (customerIdInput) customerIdInput.value = customerId || "";
  if (pharmacyIdInput) pharmacyIdInput.value = pharmacyId || "";
  if (invoiceIdInput) invoiceIdInput.value = invoiceId || "";

  // Build star rating UI
  const ratingContainer = document.getElementById("ratingContainer");

  // Xóa tất cả các sao cũ trước khi tạo mới
  ratingContainer.innerHTML = "";
  let selectedRating = 0;
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");
    star.classList.add("star");
    star.textContent = "☆"; // Sử dụng ký tự sao tối mặc định
    star.dataset.value = i;
    star.addEventListener("click", () => {
      selectedRating = i;
      updateStars();
      const ratingInput = document.getElementById("rating");
      if (ratingInput) ratingInput.value = selectedRating;
      console.log("Star clicked, selectedRating:", selectedRating);
    });
    star.addEventListener("mouseover", () => {
      if (selectedRating === 0) updatePreview(i);
    });
    star.addEventListener("mouseout", () => {
      if (selectedRating === 0) updateStars();
    });
    ratingContainer.appendChild(star);
    console.log("Added star with value:", i);
  }
  // Đảm bảo cập nhật trạng thái sao ban đầu
  updateStars();

  // Xử lý trường hợp ban đầu: loại bỏ class filled khỏi tất cả, chỉ để sao đầu tiên sáng
  function updateStars() {
    const stars = document.querySelectorAll(".star");
    stars.forEach((star) => {
      const value = parseInt(star.dataset.value);
      if (selectedRating === 0) {
        // Nếu chưa chọn, chỉ sao đầu tiên sáng
        if (value === 1) {
          star.classList.add("filled");
          star.textContent = "★";
        } else {
          star.classList.remove("filled");
          star.textContent = "☆";
        }
        star.classList.remove("hovered");
      } else {
        if (value <= selectedRating) {
          star.classList.add("filled");
          star.textContent = "★";
        } else {
          star.classList.remove("filled");
          star.textContent = "☆";
        }
        star.classList.remove("hovered");
      }
    });
  }

  function updatePreview(hoverValue) {
    const stars = document.querySelectorAll(".star");
    stars.forEach((star) => {
      const value = parseInt(star.dataset.value);
      if (value <= hoverValue) {
        star.classList.add("hovered");
        star.classList.add("filled");
        star.textContent = "★";
      } else {
        star.classList.remove("hovered");
        star.classList.remove("filled");
        star.textContent = "☆";
      }
    });
  }

  // Handle form submit
  const surveyForm = document.getElementById("surveyForm");
  if (surveyForm) {
    surveyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (selectedRating === 0) {
        showMessage("Vui lòng chọn đánh giá", "error");
        return;
      }
      const comment = document.getElementById("comment").value;
      const payload = {
        customerId: parseInt(customerId) || 0,
        pharmacyId: parseInt(pharmacyId) || 0,
        invoiceId: parseInt(invoiceId) || 0,
        rating: selectedRating,
        comment,
      };
      try {
        const res = await fetch("http://localhost:8080/survey", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showMessage("Cảm ơn bạn đã gửi phản hồi!", "success");
          surveyForm.reset();
          selectedRating = 0;
          updateStars();
          const ratingInput = document.getElementById("rating");
          if (ratingInput) ratingInput.value = "";
        } else {
          const err = await res.text();
          showMessage("Gửi thất bại: " + err, "error");
        }
      } catch (error) {
        showMessage("Lỗi mạng", "error");
      }
    });
  } else {
    console.error("Survey form not found");
  }

  function showMessage(msg, type) {
    const messageEl = document.getElementById("message");
    if (messageEl) {
      messageEl.textContent = msg;
      messageEl.className = "message " + type + " show";
      messageEl.classList.remove("hidden");
      // Ẩn thông báo sau 3 giây
      setTimeout(() => {
        messageEl.classList.add("hidden");
        messageEl.classList.remove("show");
      }, 3000);
    }
  }
});
