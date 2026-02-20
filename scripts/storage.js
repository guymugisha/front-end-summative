const API_URL = 'http://localhost:3000/api';

// LOCAL STORAGE & API OPERATIONS
async function saveRecords(records) {
    // 1. Always save to local storage for quick access
    localStorage.setItem("financeRecords", JSON.stringify(records));

    // 2. Try to save to seed.json via Node.js server
    try {
        const response = await fetch(`${API_URL}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(records)
        });
        if (!response.ok) throw new Error('API save failed');
        console.log("Automatically saved to seed.json");
    } catch (e) {
        console.warn("Could not save to seed.json (Server might not be running). Using LocalStorage only.");
    }
}

async function loadRecords() {
    // 1. Try to load from the Node.js server first (seed.json)
    try {
        const response = await fetch(`${API_URL}/load`);
        if (response.ok) {
            const serverData = await response.json();
            if (serverData && serverData.length > 0) {
                console.log("Loaded data from seed.json via server");
                return serverData;
            }
        }
    } catch (e) {
        console.warn("Could not reach server. Falling back to LocalStorage.");
    }

    // 2. Fallback to LocalStorage
    const data = localStorage.getItem("financeRecords");
    try {
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Failed to parse records from local storage:", e);
        return [];
    }
}
