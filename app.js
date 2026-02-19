
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
        type,
        createdAt: now,
        updatedAt: now
    };
}


const validators = {
    description: val => /^\S+(?: \S+)*$/.test(val),
    amount: val => /^(0|[1-9]\d*)(\.\d{1,2})?$/.test(val),
    date: val => /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(val),
    category: val => /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/.test(val)
};


function regexSearch(pattern, records) {
    try {
        const regex = new RegExp(pattern, "i");
        return records.filter(r => regex.test(r.description) || regex.test(r.category));
    } catch (e) {
        console.error("Invalid regex:", e);
        return [];
    }
}


function saveRecords() {
    localStorage.setItem("financeRecords", JSON.stringify(records));
}

function loadRecords() {
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

document.addEventListener("DOMContentLoaded", () => {
    loadRecords().then(data => {
        records = data;

        if (records.length === 0) {
            fetch('seed.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error("HTTP error " + response.status);
                    }
                    return response.json();
                })
                .then(jsonData => {
                    records = jsonData;
                    saveRecords();
                    initializeApp();
                })
                .catch(err => {
                    console.error("Failed to load seed data:", err);
                    initializeApp();
                });
        } else {
            initializeApp();
        }
    });


    const themeToggle = document.getElementById("themeToggle");
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (storedTheme === "dark" || (!storedTheme && prefersDark)) {
        document.body.setAttribute("data-theme", "dark");
        if (themeToggle) themeToggle.checked = true;
    }

    if (themeToggle) {
        themeToggle.addEventListener("change", () => {
            if (themeToggle.checked) {
                document.body.setAttribute("data-theme", "dark");
                localStorage.setItem("theme", "dark");
            } else {
                document.body.removeAttribute("data-theme");
                localStorage.setItem("theme", "light");
            }
        });
    }

    function initializeApp() {

        const form = document.getElementById("recordForm");
        const successMsg = document.getElementById("successMsg");
        const categorySelect = document.getElementById("category");
        const typeRadios = document.querySelectorAll('input[name="type"]');
        const searchInput = document.getElementById("search");
        const sortSelect = document.getElementById("sortOptions");
        const exportBtn = document.getElementById("exportBtn");


        updateTable = function () {
            const query = searchInput.value;
            const sortValue = sortSelect.value;

            let filtered = regexSearch(query, records);
            let sorted = sortData(filtered, sortValue);

            renderTable(sorted);
        };


        populateCategories(expenseCategories);


        typeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'income') {
                    populateCategories(incomeCategories);
                } else {
                    populateCategories(expenseCategories);
                }
            });
        });

        updateTable();
        updateDashboard();

        form.addEventListener("submit", e => {
            e.preventDefault();


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

                const typeRadio = document.querySelector('input[name="type"]:checked');
                const type = typeRadio ? typeRadio.value : 'expense';
                const rec = createRecord(desc, amt, cat, date, type);

                records.push(rec);
                saveRecords();

                updateTable();
                updateDashboard();
                form.reset();


                document.querySelector('input[name="type"][value="expense"]').checked = true;
                populateCategories(expenseCategories);


                successMsg.textContent = "Transaction added successfully!";
                setTimeout(() => successMsg.textContent = "", 3000);
            }
        });

        searchInput.addEventListener("input", updateTable);
        sortSelect.addEventListener("change", updateTable);
        exportBtn.addEventListener("click", () => exportRecords(records));
    }
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


    if (totalBalance >= 0) {
        totalEl.style.color = "var(--secondary-color)";
    } else {
        totalEl.style.color = "var(--danger-color)";
    }


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

function renderChart(categories, totalExpense) {
    const container = document.getElementById("categoryChart");
    if (!container) return;
    container.innerHTML = "";

    const entries = Object.entries(categories);
    if (entries.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No expense data yet.</p>';
        return;
    }

    const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

    entries.forEach(([cat, amount], i) => {
        const pct = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0;
        const bar = document.createElement("div");
        bar.style.cssText = `
            display: flex; align-items: center; gap: 0.5rem;
            margin-bottom: 0.5rem; font-size: 0.875rem;
        `;
        bar.innerHTML = `
            <span style="min-width: 90px; color: var(--text-primary);">${cat}</span>
            <div style="flex:1; background: var(--border-color); border-radius: 4px; height: 20px; overflow: hidden;">
                <div style="width:${pct}%; background:${colors[i % colors.length]}; height:100%; border-radius:4px; transition: width 0.5s ease;"></div>
            </div>
            <span style="min-width: 70px; text-align: right; color: var(--text-secondary);">$${amount.toFixed(2)} (${pct}%)</span>
        `;
        container.appendChild(bar);
    });
}

function deleteRecord(id) {
    records = records.filter(r => r.id !== id);
    saveRecords();
    updateTable();
    updateDashboard();
}

function renderTable(data) {
    const table = document.getElementById("recordsTable");

    table.innerHTML = `
        <thead>
            <tr>
                <th>Description</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Date</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    data.forEach(r => {
        const type = r.type || 'expense';
        const color = type === 'income' ? 'var(--secondary-color)' : 'var(--danger-color)';
        const sign = type === 'income' ? '+' : '-';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.description}</td>
            <td style="color:${color}; font-weight:bold;">${sign}$${r.amount.toFixed(2)}</td>
            <td>${r.category}</td>
            <td>${r.date}</td>
            <td><button class="btn-delete" data-id="${r.id}">Delete</button></td>
        `;
        tr.querySelector('.btn-delete').addEventListener('click', () => deleteRecord(r.id));
        tbody.appendChild(tr);
    });
}
