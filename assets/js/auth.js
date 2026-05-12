/**
 * ========================================================
 * MODULE XÁC THỰC NGƯỜI DÙNG (AUTHENTICATION)
 * Cập nhật: Đã mở khóa gọi API thật & Thêm tính năng Quên Mật Khẩu
 * ========================================================
 */

const Auth = {
    // API URL của bạn
    API_URL: typeof GAS_ENDPOINT !== 'undefined' ? GAS_ENDPOINT : "https://script.google.com/macros/s/AKfycbwPCv22W8Hhi8WRC9kNRXkEbMLSsh2cEzVnZB05ngT0QYNQL2lZOIao05lEawmZEBBc/exec",

    init() {
        this.bindEvents();
    },

    bindEvents() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Sự kiện cho nút Quên Mật Khẩu
        const forgotPassBtn = document.getElementById('forgotPassBtn');
        if (forgotPassBtn) {
            forgotPassBtn.addEventListener('click', (e) => this.handleForgotPassword(e));
        }
    },

    async fetchGAS(action, payload) {
        try {
            const response = await fetch(this.API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8", 
                },
                body: JSON.stringify({ action: action, data: payload })
            });
            return await response.json();
        } catch (error) {
            console.error("Lỗi kết nối máy chủ:", error);
            return { status: "error", message: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng!" };
        }
    },

    /**
     * Xử lý luồng Đăng nhập (Login) - ĐÃ MỞ KHÓA API THẬT
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const mssvInput = document.getElementById('mssv').value.trim();
        const passwordInput = document.getElementById('password').value;
        const btn = document.getElementById('loginBtn');
        const errorDiv = document.getElementById('errorMessage');

        this.setButtonState(btn, true, 'Đang xác thực...');
        errorDiv.classList.add('hidden');

        // GỌI API THẬT LÊN GOOGLE APPS SCRIPT
        const res = await this.fetchGAS("LOGIN", { mssv: mssvInput, password: passwordInput });
        
        if (res.status === "success") {
            // Lưu thông tin sinh viên vào trình duyệt
            localStorage.setItem('user', JSON.stringify(res.user));
            window.location.href = 'dashboard.html';
        } else {
            this.setButtonState(btn, false, 'Đăng nhập');
            // Nếu sai pass, GAS của bạn sẽ trả về chuỗi có chữ "Email". Mình hiển thị màu vàng cho thân thiện.
            if(res.message.includes("Email")) {
                this.showWarning(errorDiv, res.message);
            } else {
                this.showError(errorDiv, res.message || 'MSSV hoặc mật khẩu không chính xác!');
            }
        }
    },

    /**
     * Xử lý Quên Mật Khẩu
     * Dựa theo logic Backend: Gửi yêu cầu Đăng nhập với mật khẩu sai cố ý để kích hoạt gửi Email
     */
    async handleForgotPassword(e) {
        e.preventDefault();
        
        const mssv = prompt("Vui lòng nhập Mã số sinh viên (MSSV) của bạn để nhận lại mật khẩu:");
        if (!mssv) return; // Người dùng ấn Cancel

        alert("Đang gửi yêu cầu lên hệ thống. Quá trình này mất khoảng 3-5 giây, vui lòng chờ...");

        // Gửi API với password cố tình làm sai để Backend chạy lệnh MailApp.sendEmail
        const res = await this.fetchGAS("LOGIN", { 
            mssv: mssv.trim(), 
            password: "SAI_PASS_DE_KICH_HOAT_EMAIL_123" 
        });

        if (res.status === "error" && res.message.includes("Email")) {
            alert("✅ Thành công! Mật khẩu đã được gửi về Email sinh viên của bạn. Vui lòng kiểm tra hộp thư (bao gồm cả mục Spam/Thư rác).");
        } else if (res.status === "error") {
            alert("❌ Lỗi: " + res.message);
        }
    },

    /**
     * Xử lý luồng Đăng ký (Register) - ĐÃ MỞ KHÓA API THẬT
     */
    async handleRegister(e) {
        e.preventDefault();

        const mssv = document.getElementById('mssv').value.trim();
        const fullname = document.getElementById('fullname').value.trim();
        const classId = document.getElementById('classId').value;
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        const btn = document.getElementById('registerBtn');
        const statusDiv = document.getElementById('statusMessage');

        if (password !== confirmPassword) {
            this.showError(statusDiv, 'Mật khẩu xác nhận không khớp!');
            return;
        }

        this.setButtonState(btn, true, `Đang xử lý...`);
        statusDiv.classList.add('hidden');

        const payload = { mssv, fullname, classId, email, password };

        // GỌI API THẬT
        const res = await this.fetchGAS("REGISTER", payload);
        
        if (res.status === "success") {
            this.showSuccess(statusDiv, btn, 'Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...');
            setTimeout(() => window.location.href = 'login.html', 2000);
        } else {
            this.setButtonState(btn, false, 'Đăng ký tài khoản');
            this.showError(statusDiv, res.message);
        }
    },

    logout() {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    },

    getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // --- CÁC HÀM TIỆN ÍCH (HELPERS) ---

    setButtonState(btn, isDisabled, htmlContent) {
        btn.disabled = isDisabled;
        btn.innerHTML = htmlContent;
        if(isDisabled) {
            btn.classList.add('cursor-not-allowed', 'opacity-80');
        } else {
            btn.classList.remove('cursor-not-allowed', 'opacity-80');
        }
    },

    showError(element, message) {
        element.innerHTML = message;
        element.className = 'mt-4 p-3 rounded-xl text-sm text-center font-medium border bg-red-50 text-red-600 border-red-200 block';
    },

    showWarning(element, message) {
        element.innerHTML = message;
        element.className = 'mt-4 p-3 rounded-xl text-sm text-center font-medium border bg-yellow-50 text-yellow-700 border-yellow-200 block';
    },

    showSuccess(element, btn, message) {
        btn.innerHTML = 'Thành công!';
        btn.classList.replace('bg-blue-600', 'bg-emerald-600');
        btn.classList.replace('hover:bg-blue-700', 'hover:bg-emerald-700');
        
        element.innerHTML = message;
        element.className = 'mt-4 p-3 rounded-xl text-sm text-center font-medium border bg-emerald-50 text-emerald-700 border-emerald-200 block';
    }
};

document.addEventListener('DOMContentLoaded', () => Auth.init());
