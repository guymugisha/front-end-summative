// CORE DATA FACTORIES
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

// VALIDATION RULES
const validators = {
    description: val => /^\S+(?: \S+)*$/.test(val),
    amount: val => /^(0|[1-9]\d*)(\.\d{1,2})?$/.test(val),
    date: val => /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(val),
    category: val => /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/.test(val)
};

// DATA SEARCH ENGINE
function regexSearch(pattern, records) {
    try {
        const regex = new RegExp(pattern, "i");
        return records.filter(r => regex.test(r.description) || regex.test(r.category));
    } catch (e) {
        console.error("Invalid regex:", e);
        return [];
    }
}

// DATA SORTING LOGIC
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

// EXPORT OPERATIONS
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
