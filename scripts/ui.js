// UI HELPER FUNCTIONS
function populateCategories(categories) {
    const select = document.getElementById("category");
    if (!select) return;
    select.innerHTML = "";
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}

// DASHBOARD & STATISTICS
function updateDashboard(records) {
    const totalBalance = records.reduce((sum, r) => {
        const amount = r.amount;
        const type = r.type || 'expense';
        return type === 'income' ? sum + amount : sum - amount;
    }, 0);

    const totalEl = document.getElementById("totalAmount");
    if (totalEl) {
        totalEl.textContent = `$${totalBalance.toFixed(2)}`;
        if (totalBalance >= 0) {
            totalEl.style.color = "var(--secondary-color)";
        } else {
            totalEl.style.color = "var(--danger-color)";
        }
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

// TABLE RENDERING ENGINE
function renderTable(data, onDelete) {
    const table = document.getElementById("recordsTable");
    if (!table) return;

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
        tr.querySelector('.btn-delete').addEventListener('click', () => onDelete(r.id));
        tbody.appendChild(tr);
    });
}
