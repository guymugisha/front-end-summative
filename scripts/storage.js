// LOCAL STORAGE OPERATIONS
export function saveRecords(records) {
    localStorage.setItem("financeRecords", JSON.stringify(records));
}

export function loadRecords() {
    return new Promise((resolve) => {
        const data = localStorage.getItem("financeRecords");
        try {
            resolve(data ? JSON.parse(data) : []);
        } catch (e) {
            console.error("Failed to parse records from local storage:", e);
            resolve([]);
        }
    });
}
