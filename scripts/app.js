// Merged scripts for index.html compatibility with file:// protocol

// ==========================================
// state.js
// ==========================================
// Category Data
// Category Data
const expenseCategories = ["Food", "Books", "Transport", "Entertainment", "Fees", "Other"];
const incomeCategories = ["Salary", "Allowance", "Gift", "Investments", "Other"];

let records = [];

function createRecord(desc, amount, category, date, type) {
    const id = `rec_${Date.now()}`;
    const now = new Date().toISOString();
    return {
        id,
        description: desc,
        amount: parseFloat(amount),
        category,
        date,
        type, // 'income' or 'expense'
        createdAt: now,
        updatedAt: now
    };
}

// ==========================================
// validators.js
// ==========================================
const validators = {
    description: val => /^\S+(?: \S+)*$/.test(val), // no leading/trailing spaces
    amount: val => /^(0|[1-9]\d*)(\.\d{1,2})?$/.test(val),
    date: val => /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(val),
    category: val => /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/.test(val)
};

// ==========================================
// search.js
// ==========================================
function regexSearch(pattern, records) {
    try {
        const regex = new RegExp(pattern, "i");
        return records.filter(r => regex.test(r.description) || regex.test(r.category));
    } catch (e) {
        console.error("Invalid regex:", e);
        return [];
    }
}

// ==========================================
// storage.js
// ==========================================
function saveRecords() {
    localStorage.setItem("financeRecords", JSON.stringify(records));
}

function loadRecords() {
    const data = localStorage.getItem("financeRecords");
    try {
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Failed to parse records from local storage:", e);
        return [];
    }
}


// ==========================================
// sorting.js
// ==========================================
function sortData(data, sortValue) {
    const sorted = [...data];
    switch (sortValue) {
        case 'date-new':
            return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
        case 'date-old':
            return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
        case 'desc-asc':
            return sorted.sort((a, b) => a.description.localeCompare(b.description));
        case 'desc-desc':
            return sorted.sort((a, b) => b.description.localeCompare(a.description));
        case 'cat-asc':
            return sorted.sort((a, b) => a.category.localeCompare(b.category));
        case 'amount-high':
            return sorted.sort((a, b) => b.amount - a.amount);
        case 'amount-low':
            return sorted.sort((a, b) => a.amount - b.amount);
        default:
            return sorted;
    }
}

// ==========================================
// export.js
// ==========================================
function exportRecords(data) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finance_records.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ==========================================
// ui.js
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    let data = loadRecords();
    records.push(...data);
    // UI Elements
    const form = document.getElementById("recordForm");
    const successMsg = document.getElementById("successMsg");
    const categorySelect = document.getElementById("category");
    const typeRadios = document.querySelectorAll('input[name="type"]');
    const searchInput = document.getElementById("search");
    const sortSelect = document.getElementById("sortOptions");
    const exportBtn = document.getElementById("exportBtn");

    // Unified Update Function
    function updateTable() {
        const query = searchInput.value;
        const sortValue = sortSelect.value;

        let filtered = regexSearch(query, records);
        let sorted = sortData(filtered, sortValue);

        renderTable(sorted);
    }

    // Initialize Categories (Expense by default)
    populateCategories(expenseCategories);

    // Toggle Categories on Type Change
    typeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'income') {
                populateCategories(incomeCategories);
            } else {
                populateCategories(expenseCategories);
            }
        });
    });



    // Initial Render
    updateTable();

    form.addEventListener("submit", e => {
        e.preventDefault();

        // Clear old errors + success
        document.querySelectorAll(".error").forEach(el => el.textContent = "");
        successMsg.textContent = "";

        const desc = document.getElementById("description").value;
        const amt = document.getElementById("amount").value;
        const cat = document.getElementById("category").value;
        const date = document.getElementById("date").value;

        let valid = true;

        if (!validators.description(desc)) {
            document.getElementById("descError").textContent = "Invalid description (no leading/trailing spaces).";
            valid = false;
        }
        if (!validators.amount(amt)) {
            document.getElementById("amountError").textContent = "Invalid amount (must be a number, max 2 decimals).";
            valid = false;
        }
        if (!validators.category(cat)) {
            document.getElementById("catError").textContent = "Invalid category (letters/spaces only).";
            valid = false;
        }
        if (!validators.date(date)) {
            document.getElementById("dateError").textContent = "Invalid date (YYYY-MM-DD).";
            valid = false;
        }

        if (valid) {
            // Get selected type (income or expense)
            const typeRadio = document.querySelector('input[name="type"]:checked');
            const type = typeRadio ? typeRadio.value : 'expense';

            const rec = createRecord(desc, amt, cat, date, type);
            records.push(rec);
            saveRecords();

            updateTable(); // Re-render table with new data
            updateDashboard(); // Update stats
            form.reset();

            // Reset radio to expense
            document.querySelector('input[name="type"][value="expense"]').checked = true;
            populateCategories(expenseCategories);

            // Show success message
            successMsg.textContent = "✅ Transaction added successfully!";
            setTimeout(() => successMsg.textContent = "", 3000); // clear after 3s
        }
    });

    searchInput.addEventListener("input", updateTable);
    sortSelect.addEventListener("change", updateTable);
    exportBtn.addEventListener("click", () => exportRecords(records));

    // Initial Dashboard Update
    updateDashboard();
});

function populateCategories(categories) {
    const select = document.getElementById("category");
    select.innerHTML = "";
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}

function updateDashboard() {
    const totalBalance = records.reduce((sum, r) => {
        const amount = r.amount;
        const type = r.type || 'expense';
        return type === 'income' ? sum + amount : sum - amount;
    }, 0);

    const totalEl = document.getElementById("totalAmount");
    totalEl.textContent = `$${totalBalance.toFixed(2)}`;

    // Color code balance
    if (totalBalance >= 0) {
        totalEl.style.color = "var(--secondary-color)"; // Green
    } else {
        totalEl.style.color = "var(--danger-color)"; // Red
    }

    // Category Breakdown for Chart (Expenses Only)
    const categories = {};
    let totalExpense = 0;

    records.forEach(r => {
        if (r.type === 'income') return;
        const type = r.type || 'expense';

        if (type === 'expense') {
            categories[r.category] = (categories[r.category] || 0) + r.amount;
            totalExpense += r.amount;
        }
    });

    renderChart(categories, totalExpense);
}

function renderTable(data) {
    const table = document.getElementById("recordsTable");
    // Re-render header to ensure structure
    table.innerHTML = `
        <thead>
            <tr>
                <th>Description</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    data.forEach(r => {
        const type = r.type || 'expense';
        const color = type === 'income' ? 'var(--secondary-color)' : 'var(--danger-color)';
        const sign = type === 'income' ? '+' : '-';

        tbody.innerHTML += `
            <tr>
                <td>${r.description}</td>
                <td style="color:${color}; font-weight:bold;">${sign}$${r.amount.toFixed(2)}</td>
                <td>${r.category}</td>
                <td>${r.date}</td>
            </tr>
        `;
    });
}
