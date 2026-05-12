/**
 * ========================================================
 * MODULE XÁC THỰC NGƯỜI DÙNG (AUTHENTICATION)
 * Dự án: Hệ thống Thực hành Trắc địa HCMUS
 * Chức năng: Xử lý Đăng nhập, Đăng ký, Lưu Session, Đăng xuất
 * ========================================================
 */

const Auth = {
    // Lưu ý: Thay URL này bằng Web App URL của Google Apps Script sau khi deploy
    API_URL: typeof GAS_ENDPOINT !== 'undefined' ? GAS_ENDPOINT : "https://script.google.com/macros/s/AKfycbwPCv22W8Hhi8WRC9kNRXkEbMLSsh2cEzVnZB05ngT0QYNQL2lZOIao05lEawmZEBBc/exec",

    init() {
        this.bindEvents();
        // Không gọi checkSession() ở đây vì mỗi trang HTML đã tự có logic kiểm tra điều hướng
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
    },

    /**
     * Hàm gọi API chung đến Google Apps Script
     */
    async fetchGAS(action, payload) {
        try {
            const response = await fetch(this.API_URL, {
                method: "POST",
                // Thiết lập text/plain để tránh lỗi CORS Preflight trên Google Apps Script
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
     * Xử lý luồng Đăng nhập (Login)
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const mssvInput = document.getElementById('mssv').value.trim();
        const passwordInput = document.getElementById('password').value;
        const btn = document.getElementById('loginBtn');
        const errorDiv = document.getElementById('errorMessage');

        // 1. Cập nhật UI Loading
        this.setButtonState(btn, true, 'Đang xác thực...');
        errorDiv.classList.add('hidden');

        // 2. Gọi API kiểm tra đăng nhập (Bỏ comment phần dưới khi có GAS thật)
        /*
        const res = await this.fetchGAS("LOGIN", { mssv: mssvInput, password: passwordInput });
        
        if (res.status === "success") {
            // Lưu thông tin sinh viên vào trình duyệt
            localStorage.setItem('user', JSON.stringify(res.user));
            window.location.href = 'dashboard.html';
        } else {
            this.setButtonState(btn, false, 'Đăng nhập');
            this.showError(errorDiv, res.message || 'MSSV hoặc mật khẩu không chính xác!');
        }
        */

        // --- GIẢ LẬP ĐỂ TEST UI KHI CHƯA CÓ BACKEND ---
        setTimeout(() => {
            if (mssvInput === "admin" && passwordInput === "123456") {
                const mockUser = {
                    mssv: mssvInput,
                    fullname: "Sinh viên Test",
                    classId: "GEO25A",
                    role: "student"
                };
                localStorage.setItem('user', JSON.stringify(mockUser));
                window.location.href = 'dashboard.html';
            } else {
                this.setButtonState(btn, false, 'Đăng nhập');
                this.showError(errorDiv, 'Sai MSSV hoặc Mật khẩu! (Thử: admin / 123456)');
            }
        }, 1200);
        // ----------------------------------------------
    },

    /**
     * Xử lý luồng Đăng ký (Register)
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

        // 1. Validation nội bộ
        if (password !== confirmPassword) {
            this.showError(statusDiv, 'Mật khẩu xác nhận không khớp!');
            return;
        }

        // 2. Cập nhật UI Loading
        this.setButtonState(btn, true, `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg> Đang xử lý...
        `);
        statusDiv.classList.add('hidden');

        const payload = { mssv, fullname, classId, email, password };

        // 3. Gọi API đăng ký (Bỏ comment phần dưới khi có GAS thật)
        /*
        const res = await this.fetchGAS("REGISTER", payload);
        
        if (res.status === "success") {
            this.showSuccess(statusDiv, btn, 'Đăng ký thành công! Đang chuyển hướng...');
            setTimeout(() => window.location.href = 'login.html', 2000);
        } else {
            this.setButtonState(btn, false, 'Đăng ký tài khoản');
            this.showError(statusDiv, res.message || 'Sinh viên không có trong danh sách lớp!');
        }
        */

        // --- GIẢ LẬP ĐỂ TEST UI KHI CHƯA CÓ BACKEND ---
        setTimeout(() => {
            if (mssv.length === 8) {
                this.showSuccess(statusDiv, btn, 'Đăng ký thành công! Đang chuyển hướng...');
                setTimeout(() => window.location.href = 'login.html', 2000);
            } else {
                this.setButtonState(btn, false, 'Đăng ký tài khoản');
                this.showError(statusDiv, 'Đăng ký thất bại. Vui lòng thử lại!');
            }
        }, 1500);
        // ----------------------------------------------
    },

    /**
     * Đăng xuất hệ thống
     */
    logout() {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    },

    /**
     * Trả về thông tin user hiện tại (Dùng cho các trang Session)
     */
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

    showSuccess(element, btn, message) {
        btn.innerHTML = 'Thành công!';
        btn.classList.replace('bg-blue-600', 'bg-emerald-600');
        btn.classList.replace('hover:bg-blue-700', 'hover:bg-emerald-700');
        
        element.innerHTML = message;
        element.className = 'mt-4 p-3 rounded-xl text-sm text-center font-medium border bg-emerald-50 text-emerald-700 border-emerald-200 block';
    }
};

// Khởi tạo Auth khi DOM load xong
document.addEventListener('DOMContentLoaded', () => Auth.init());
