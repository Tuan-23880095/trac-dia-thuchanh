/**
 * ========================================================
 * MODULE NGHIỆP VỤ TRẮC ĐỊA (SURVEYING MATH ENGINE)
 * Dự án: Hệ thống Thực hành Trắc địa - Khoa Địa chất (HCMUS)
 * Chức năng: Xử lý góc DMS, tính sai số 2C/MO, tính cao lượng giác, và QC số liệu
 * ========================================================
 */

const SurveyMath = {
    // ----------------------------------------------------
    // 1. XỬ LÝ GÓC (ĐỘ - PHÚT - GIÂY)
    // Sinh viên nhập liên tục theo chuẩn: 120.3015 (120 độ 30 phút 15 giây)
    // ----------------------------------------------------

    /**
     * Chuyển đổi định dạng nhập (DD.MMSS) sang Độ thập phân (Decimal Degrees) để tính toán
     */
    dmsToDec(inputVal) {
        if (!inputVal) return 0;
        const val = parseFloat(inputVal).toFixed(4); // Ép chuẩn 4 số thập phân
        const strVal = val.toString().split('.');
        
        const degrees = parseInt(strVal[0], 10);
        let minutes = 0;
        let seconds = 0;

        if (strVal[1]) {
            const fraction = strVal[1].padEnd(4, '0'); // Đảm bảo luôn đủ 4 số (VD: 30 -> 3000)
            minutes = parseInt(fraction.substring(0, 2), 10);
            seconds = parseInt(fraction.substring(2, 4), 10);
        }

        // Toán học cơ sở: D + M/60 + S/3600
        return degrees + (minutes / 60) + (seconds / 3600);
    },

    /**
     * Chuyển đổi từ Độ thập phân (Decimal Degrees) về chuỗi hiển thị chuẩn (DD° MM' SS")
     * Phục vụ in ấn lên phiếu A4
     */
    decToDmsString(decimalVal) {
        if (isNaN(decimalVal)) return '0° 00\' 00"';
        
        const isNegative = decimalVal < 0;
        let absVal = Math.abs(decimalVal);
        
        let d = Math.floor(absVal);
        let mFloat = (absVal - d) * 60;
        let m = Math.floor(mFloat);
        let s = Math.round((mFloat - m) * 60);

        // Xử lý làm tròn 60 giây
        if (s === 60) {
            s = 0;
            m += 1;
        }
        if (m === 60) {
            m = 0;
            d += 1;
        }

        const sign = isNegative ? '-' : '';
        return `${sign}${d}° ${m.toString().padStart(2, '0')}' ${s.toString().padStart(2, '0')}"`;
    },

    /**
     * Chuyển đổi Độ thập phân sang Radian để dùng cho hàm Math.cos(), Math.tan()
     */
    degToRad(degrees) {
        return degrees * (Math.PI / 180);
    },

    // ----------------------------------------------------
    // 2. THUẬT TOÁN ĐÁNH GIÁ VÀ KIỂM ĐỊNH (QUALITY CONTROL)
    // ----------------------------------------------------

    /**
     * Tính trung bình cộng thông thường (Dùng cho đọc mia, bấm giờ)
     */
    average(arr) {
        const validValues = arr.map(Number).filter(n => !isNaN(n));
        if (validValues.length === 0) return 0;
        const sum = validValues.reduce((a, b) => a + b, 0);
        return sum / validValues.length;
    },

    /**
     * Tính trung bình góc Trắc địa (Truyền vào mảng dạng 120.3015)
     */
    averageAngle(arr) {
        const decArr = arr.map(val => this.dmsToDec(val));
        const avgDec = this.average(decArr);
        return this.decToDmsString(avgDec); // Trả về dạng chuỗi đẹp
    },

    /**
     * Kiểm tra độ lệch giữa 3 lần đo (Validation Rule khắt khe ngoài công trường)
     * Trả về true nếu nằm trong giới hạn cho phép
     */
    checkTolerance(arr, maxDiff) {
        const validValues = arr.map(Number).filter(n => !isNaN(n));
        if (validValues.length < 2) return true; // Cần ít nhất 2 số để so sánh
        
        const max = Math.max(...validValues);
        const min = Math.min(...validValues);
        
        return (max - min) <= maxDiff;
    },

    // ----------------------------------------------------
    // 3. CÔNG THỨC CHUYÊN NGÀNH TRẮC ĐỊA
    // ----------------------------------------------------

    /**
     * Tính sai số 2C của máy Kinh vĩ: 2C = T - (P ± 180)
     * Đầu vào: Góc bàn độ ngang thuận/đảo (Định dạng DD.MMSS)
     */
    calc2C(thuậnDMS, đảoDMS) {
        let t = this.dmsToDec(thuậnDMS);
        let p = this.dmsToDec(đảoDMS);
        
        // Điều chỉnh ± 180
        let pAdj = (p > 180) ? (p - 180) : (p + 180);
        
        let c2 = t - pAdj;
        // Chuẩn hóa góc lệch về định dạng hiển thị
        return this.decToDmsString(c2);
    },

    /**
     * Tính sai số MO của bàn độ đứng: MO = (360 - (T + P)) / 2
     */
    calcMO(thuậnDMS, đảoDMS) {
        let t = this.dmsToDec(thuậnDMS);
        let p = this.dmsToDec(đảoDMS);
        let mo = (360 - (t + p)) / 2;
        return this.decToDmsString(mo);
    },

    /**
     * Tính Khoảng cách quang học: D = 100 * n * cos^2(V)
     * Lưu ý: n truyền vào tính bằng milimet (mm), hàm tự động chia 1000
     */
    calcOpticalDistance(n_mm, v_DMS) {
        let n = n_mm / 1000; // Đổi milimet ra mét
        let v_rad = this.degToRad(this.dmsToDec(v_DMS));
        
        let D = 100 * n * Math.pow(Math.cos(v_rad), 2);
        return parseFloat(D.toFixed(3)); // Lấy 3 số lẻ (đơn vị mét)
    },

    /**
     * Tính Chênh cao lượng giác: h = i + D*tan(V) - cG
     * Lưu ý: cG (Chỉ giữa) tính bằng milimet
     */
    calcTrigElevation(i_m, D_m, v_DMS, cG_mm) {
        let l = cG_mm / 1000; // Đổi mm ra m
        let v_rad = this.degToRad(this.dmsToDec(v_DMS));
        
        let h = i_m + (D_m * Math.tan(v_rad)) - l;
        return parseFloat(h.toFixed(3)); // Đơn vị mét
    }
};

/**
 * ========================================================
 * SESSION CONTROLLER
 * Xử lý DOM, tự động bind sự kiện cho các ô nhập liệu 
 * ========================================================
 */
const SessionController = {
    init() {
        this.bindAutoCalculations();
        this.bindValidations();
    },

    bindAutoCalculations() {
        // Tìm tất cả các thẻ có attribute data-calc="average"
        // Thường dùng cho: <input type="number" class="avg-group-1" data-calc="average" data-target="avg-result-1">
        const avgInputs = document.querySelectorAll('input[data-calc="average"]');
        
        avgInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const targetId = e.target.getAttribute('data-target');
                const groupClass = e.target.getAttribute('data-group');
                
                // Lấy tất cả input cùng nhóm để tính trung bình
                const groupInputs = document.querySelectorAll(`.${groupClass}`);
                const values = Array.from(groupInputs).map(inp => input.value);
                
                const isAngle = e.target.hasAttribute('data-is-angle');
                let result = 0;

                if (isAngle) {
                    result = SurveyMath.averageAngle(values);
                } else {
                    result = SurveyMath.average(values).toFixed(1); // Lấy 1 số thập phân cho mm
                }

                // Cập nhật DOM
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    if (targetEl.tagName === 'INPUT') targetEl.value = result;
                    else targetEl.innerText = result;
                }
            });
        });
    },

    bindValidations() {
        // Validation khắt khe: Báo đỏ nếu lệch quá 3mm (Buổi 6, 7)
        const validateInputs = document.querySelectorAll('input[data-validate="diff-3mm"]');
        
        validateInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const groupClass = e.target.getAttribute('data-group');
                const groupInputs = document.querySelectorAll(`.${groupClass}`);
                const values = Array.from(groupInputs).map(inp => inp.value).filter(v => v !== "");
                
                // Chỉ kiểm tra khi đã nhập đủ 3 lần
                if (values.length === 3) {
                    const isPassed = SurveyMath.checkTolerance(values, 3); // maxDiff = 3mm
                    const submitBtn = document.getElementById('btnSubmitSession');

                    if (!isPassed) {
                        groupInputs.forEach(inp => {
                            inp.classList.add('border-red-500', 'bg-red-50');
                            inp.classList.remove('border-gray-300', 'bg-white');
                        });
                        alert("CẢNH BÁO QC: Chênh lệch giữa 3 lần đo vượt quá 3mm. Yêu cầu sinh viên xê dịch chân máy và đo lại trạm này!");
                        if(submitBtn) submitBtn.disabled = true; // Khóa nút nộp
                    } else {
                        groupInputs.forEach(inp => {
                            inp.classList.remove('border-red-500', 'bg-red-50');
                            inp.classList.add('border-gray-300', 'bg-white');
                        });
                        if(submitBtn) submitBtn.disabled = false; // Mở lại nút nộp
                    }
                }
            });
        });
    }
};

// Khởi chạy khi DOM hoàn tất
document.addEventListener('DOMContentLoaded', () => {
    SessionController.init();
});

// Khai báo Global để dùng ngoài HTML
window.SurveyMath = SurveyMath;
