const GAS_ENDPOINT = "YOUR_GOOGLE_APPS_SCRIPT_URL";

async function submitSessionData(mssv, sessionNumber, data) {
    const payload = {
        action: "SUBMIT_DATA",
        mssv: mssv,
        session: sessionNumber,
        payload: JSON.stringify(data)
    };

    try {
        const response = await fetch(GAS_ENDPOINT, {
            method: "POST",
            body: JSON.stringify(payload)
        });
        return await response.json();
    } catch (error) {
        console.error("Lỗi kết nối hệ thống:", error);
    }
}
