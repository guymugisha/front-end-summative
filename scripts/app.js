import { expenseCategories, incomeCategories } from './constants.js';
import { createRecord, validators, regexSearch, sortData, exportRecords } from './utils.js';
import { saveRecords, loadRecords } from './storage.js';
import { populateCategories, updateDashboard, renderTable } from './ui.js';

// APPLICATION STATE
let records = [];

// CORE LOGIC
function deleteRecord(id) {
    records = records.filter(r => r.id !== id);
    saveRecords(records);
    updateTable();
    updateDashboard(records);
}

function updateTable() {
    const searchInput = document.getElementById("search");
    const sortSelect = document.getElementById("sortOptions");

    const query = searchInput ? searchInput.value : "";
    const sortValue = sortSelect ? sortSelect.value : "date-new";

    let filtered = regexSearch(query, records);
    let sorted = sortData(filtered, sortValue);

    renderTable(sorted, deleteRecord);
}

// APPLICATION INITIALIZATION & DOM EVENTS
document.addEventListener("DOMContentLoaded", () => {
    loadRecords().then(data => {
        records = data;

        if (records.length === 0) {
            fetch('seed.json')
                .then(response => {
                    if (!response.ok) throw new Error("HTTP error " + response.status);
                    return response.json();
                })
                .then(jsonData => {
                    records = jsonData;
                    saveRecords(records);
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

    // Theme logic stays here as it's app-wide setup
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
        const typeRadios = document.querySelectorAll('input[name="type"]');
        const searchInput = document.getElementById("search");
        const sortSelect = document.getElementById("sortOptions");
        const exportBtn = document.getElementById("exportBtn");

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
        updateDashboard(records);

        if (form) {
            form.addEventListener("submit", e => {
                e.preventDefault();

                document.querySelectorAll(".error").forEach(el => el.textContent = "");
                if (successMsg) successMsg.textContent = "";

                const desc = document.getElementById("description").value;
                const amt = document.getElementById("amount").value;
                const cat = document.getElementById("category").value;
                const date = document.getElementById("date").value;

                let valid = true;

                if (!validators.description(desc)) {
                    document.getElementById("descError").textContent = "Invalid description.";
                    valid = false;
                }
                if (!validators.amount(amt)) {
                    document.getElementById("amountError").textContent = "Invalid amount.";
                    valid = false;
                }
                if (!validators.category(cat)) {
                    document.getElementById("catError").textContent = "Invalid category.";
                    valid = false;
                }
                if (!validators.date(date)) {
                    document.getElementById("dateError").textContent = "Invalid date.";
                    valid = false;
                }

                if (valid) {
                    const typeRadio = document.querySelector('input[name="type"]:checked');
                    const type = typeRadio ? typeRadio.value : 'expense';
                    const rec = createRecord(desc, amt, cat, date, type);

                    records.push(rec);
                    saveRecords(records);

                    updateTable();
                    updateDashboard(records);
                    form.reset();

                    const expenseRadio = document.querySelector('input[name="type"][value="expense"]');
                    if (expenseRadio) {
                        expenseRadio.checked = true;
                        populateCategories(expenseCategories);
                    }

                    if (successMsg) {
                        successMsg.textContent = "Transaction added successfully!";
                        setTimeout(() => successMsg.textContent = "", 3000);
                    }
                }
            });
        }

        if (searchInput) searchInput.addEventListener("input", updateTable);
        if (sortSelect) sortSelect.addEventListener("change", updateTable);
        if (exportBtn) exportBtn.addEventListener("click", () => exportRecords(records));
    }
});
