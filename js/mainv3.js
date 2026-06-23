/* ============================================================
   GLOBALS
============================================================ */
let db = null;
let isEditing = false;
let currentOrderNumber = "";

let inkData = []; // Loaded from inkcodes.json

// Codes treated as solvents
const SOLVENT_CODES = ["Acetol", "Ethyl", "Normal", "Lactanol"];

/* Supplier → Email mapping */
const SUPPLIERS = {
    "DIC": ["DICNZ.CustomerServices@dic.co.nz"],
    "DKSH": [
        "rick.menalda@dksh.com",
        "Sales.pM.NZ@dksh.com"
    ],
    "Miscellaneous": ["oggiowens@outlook.com"],
    "Huber": ["oggiowens@outlook.com"],
    "Sun Chemicals": ["oggiowens@outlook.com"],
    "Flint Group": ["oggiowens@outlook.com"],
    "Toyo Ink": ["oggiowens@outlook.com"],
    "Other": ["oggiowens@outlook.com"]
};

/* ============================================================
   ON PAGE LOAD
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
    init();
});

/* ============================================================
   INIT
============================================================ */
async function init() {
    await openDB();
    await loadInkCodes();
    populateSuppliers();
    await loadOrderNumber();
    autoFillDate();
    setupButtons();

    // Load order if editing
    await loadOrderForEditing();

    // Only add a blank row if NOT editing
    if (!isEditing) {
        addItemRow();
    }
}

/* ============================================================
   LOAD INK CODES (inkcodes.json)
============================================================ */
async function loadInkCodes() {
    try {
        const response = await fetch("inkcodes.json");
        if (!response.ok) {
            console.error("Failed to load inkcodes.json");
            return;
        }
        inkData = await response.json();
    } catch (err) {
        console.error("Error loading inkcodes.json:", err);
    }
}

/* ============================================================
   NEW AUTOCOMPLETE PER ROW
============================================================ */
function setupRowAutocomplete(codeInput, descInput) {
    const wrapper = codeInput.closest(".autocomplete");
    if (!wrapper) {
        console.error("No .autocomplete wrapper found for code input");
        return;
    }

    let listEl = wrapper.querySelector(".autocomplete-items");
    if (!listEl) {
        listEl = document.createElement("div");
        listEl.className = "autocomplete-items";
        wrapper.appendChild(listEl);
    }

    function clearList() {
        listEl.innerHTML = "";
        listEl.style.display = "none";
    }

    function showList(items) {
        listEl.innerHTML = "";

        if (!items.length) {
            clearList();
            return;
        }

        items.forEach(item => {
            const div = document.createElement("div");
            div.className = "autocomplete-item";
            div.textContent = `${item.code} - ${item.name}`;

            div.addEventListener("mousedown", () => {
                codeInput.value = item.code;
                descInput.value = item.name;

                const row = codeInput.closest("tr");
                const typeSelect = row.querySelector(".item-type");
                const supplierSelect = document.getElementById("supplier");

                if (SOLVENT_CODES.includes(item.code)) {
                    typeSelect.value = "Solvent";
                    supplierSelect.value = "DKSH";
                } else {
                    typeSelect.value = "Ink";
                    supplierSelect.value = "DIC";
                }

                codeInput.dataset.lock = "1";
                clearList();
            });

            listEl.appendChild(div);
        });

        listEl.style.display = "block";
    }

    codeInput.addEventListener("input", () => {
        if (codeInput.dataset.lock === "1") {
            codeInput.dataset.lock = "0";
            return;
        }

        const query = codeInput.value.trim().toLowerCase();
        if (!query) {
            clearList();
            return;
        }

        const row = codeInput.closest("tr");
        const typeSelect = row.querySelector(".item-type");
        const type = typeSelect ? typeSelect.value : "Ink";

        let filtered = inkData;

        if (type === "Solvent") {
            filtered = inkData.filter(item =>
                SOLVENT_CODES.includes(item.code)
            );
        }

        const matches = filtered.filter(item =>
            item.code.toLowerCase().includes(query) ||
            item.name.toLowerCase().includes(query)
        ).slice(0, 20);

        showList(matches);
    });

    codeInput.addEventListener("blur", () => {
        setTimeout(() => {
            if (!wrapper.contains(document.activeElement)) {
                clearList();
            }
        }, 120);
    });
}
/* ============================================================
   INDEXEDDB SETUP
============================================================ */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("LamprintOrdersDB", 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("orders")) {
                const store = db.createObjectStore("orders", { keyPath: "number" });
                store.createIndex("number", "number", { unique: true });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve();
        };

        request.onerror = (event) => {
            console.error("IndexedDB error:", event.target.error);
            reject(event.target.error);
        };
    });
}

function getAllOrders() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("orders", "readonly");
        const store = tx.objectStore("orders");
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

function getOrderByNumber(number) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("orders", "readonly");
        const store = tx.objectStore("orders");
        const request = store.get(number);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

function saveOrderToDB(order) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("orders", "readwrite");
        const store = tx.objectStore("orders");
        const request = store.put(order);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/* ============================================================
   LOAD ORDER FOR EDITING
============================================================ */
async function loadOrderForEditing() {
    const editNum = localStorage.getItem("editOrderNumber");
    if (!editNum) return;

    const order = await getOrderByNumber(editNum);
    if (!order) return;

    isEditing = true;
    currentOrderNumber = order.number;

    document.getElementById("orderNumber").value = order.number;
    document.getElementById("orderDate").value = order.date;
    document.getElementById("supplier").value = order.supplier;
    document.getElementById("orderStatus").value = order.status;
    document.getElementById("orderComments").value = order.comments || "";

    const tbody = document.getElementById("itemsBody");
    tbody.innerHTML = "";

    order.items.forEach(item => {
        const tr = addItemRow();

        tr.querySelector(".item-type").value = item.type;
        tr.querySelector(".code-input").value = item.code;
        tr.querySelector(".desc-input").value = item.desc;
        tr.querySelector(".qty-input").value = item.qty;
        tr.querySelector(".date-input").value = item.expectedDate;
    });
}

/* ============================================================
   AUTO-FILL DATE
============================================================ */
function autoFillDate() {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("orderDate").value = today;
}

/* ============================================================
   SUPPLIERS DROPDOWN
============================================================ */
function populateSuppliers() {
    const supplierSelect = document.getElementById("supplier");
    supplierSelect.innerHTML = "";

    Object.keys(SUPPLIERS).forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        supplierSelect.appendChild(opt);
    });
}
/* ============================================================
   ORDER NUMBER HANDLING (LAM###)
============================================================ */
async function loadOrderNumber() {
    const orders = await getAllOrders();
    const lamOrders = orders
        .map(o => o.number)
        .filter(n => typeof n === "string" && n.startsWith("LAM"));

    let nextNumber = 1;
    if (lamOrders.length) {
        const maxNum = Math.max(
            ...lamOrders.map(n => parseInt(n.replace("LAM", ""), 10) || 0)
        );
        nextNumber = maxNum + 1;
    }

    currentOrderNumber = "LAM" + String(nextNumber).padStart(3, "0");
    document.getElementById("orderNumber").value = currentOrderNumber;
}

/* ============================================================
   ITEM ROWS
============================================================ */
function addItemRow() {
    const tbody = document.getElementById("itemsBody");

    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>
            <select class="form-control item-type">
                <option>Ink</option>
                <option>Solvent</option>
                <option>Varnish</option>
                <option>Plate Cleaner</option>
                <option>Other</option>
            </select>
        </td>
        <td>
            <div class="autocomplete">
                <input type="text" class="form-control code-input">
            </div>
        </td>
        <td>
            <input type="text" class="form-control desc-input">
        </td>
        <td>
            <input type="number" class="form-control qty-input" min="1" value="1">
        </td>
        <td>
            <input type="date" class="form-control date-input">
        </td>
        <td class="text-center">
            <button type="button" class="btn btn-sm btn-danger remove-row">X</button>
        </td>
    `;

    tbody.appendChild(tr);

    const codeInput = tr.querySelector(".code-input");
    const descInput = tr.querySelector(".desc-input");
    const removeBtn = tr.querySelector(".remove-row");

    setupRowAutocomplete(codeInput, descInput);

    removeBtn.addEventListener("click", () => {
        tr.remove();
    });

    return tr;
}

function clearAllItems() {
    const tbody = document.getElementById("itemsBody");
    tbody.innerHTML = "";
    addItemRow();
}

/* ============================================================
   COLLECT ORDER DATA
============================================================ */
function collectOrderData() {
    const number = document.getElementById("orderNumber").value;
    const date = document.getElementById("orderDate").value;
    const supplier = document.getElementById("supplier").value;
    const status = document.getElementById("orderStatus").value;
    const comments = document.getElementById("orderComments").value;

    const items = [];
    const rows = document.querySelectorAll("#itemsBody tr");

    rows.forEach(row => {
        const type = row.querySelector(".item-type").value;
        const code = row.querySelector(".code-input").value.trim();
        const desc = row.querySelector(".desc-input").value.trim();
        const qty = parseFloat(row.querySelector(".qty-input").value) || 0;
        const expectedDate = row.querySelector(".date-input").value;

        if (!code && !desc && !qty) return;

        items.push({
            type,
            code,
            desc,
            qty,
            expectedDate
        });
    });

    return {
        number,
        date,
        supplier,
        status,
        comments,
        items
    };
}

/* ============================================================
   SAVE ORDER
============================================================ */
async function saveOrder() {
    const order = collectOrderData();

    if (!order.items.length) {
        alert("Please add at least one item.");
        return;
    }

    await saveOrderToDB(order);

    localStorage.removeItem("editOrderNumber");
    isEditing = false;

    alert("Order saved.");
}

/* ============================================================
   SEND EMAIL
============================================================ */
function sendEmail() {
    const order = collectOrderData();

    if (!order.items.length) {
        alert("Please add at least one item before sending.");
        return;
    }

    const supplierEmails = SUPPLIERS[order.supplier] || ["oggiowens@outlook.com"];
    const to = supplierEmails.join(",");

    const cc = "iris@lamprint.co.nz";

    let subject = `Ink/Supplies Order ${order.number} - ${order.supplier}`;
    let bodyLines = [];

    bodyLines.push(`Order Number: ${order.number}`);
    bodyLines.push(`Date: ${order.date}`);
    bodyLines.push(`Supplier: ${order.supplier}`);
    bodyLines.push(`Status: ${order.status}`);
    bodyLines.push("");
    bodyLines.push("Items:");
    bodyLines.push("");

    order.items.forEach((item, idx) => {
        bodyLines.push(
            `${idx + 1}. [${item.type}] ${item.code} - ${item.desc} | Qty: ${item.qty} | Expected: ${item.expectedDate || "N/A"}`
        );
    });

    if (order.comments) {
        bodyLines.push("");
        bodyLines.push("Comments:");
        bodyLines.push(order.comments);
    }

    const body = encodeURIComponent(bodyLines.join("\n"));

    const mailto = `mailto:${encodeURIComponent(to)}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(subject)}&body=${body}`;

    window.location.href = mailto;
}

/* ============================================================
   SETUP BUTTONS
============================================================ */
function setupButtons() {
    document.getElementById("addItemRow").addEventListener("click", addItemRow);
    document.getElementById("clearItems").addEventListener("click", clearAllItems);

    document.getElementById("saveOrder").addEventListener("click", () => {
        saveOrder().catch(err => {
            console.error("Error saving order:", err);
            alert("Error saving order.");
        });
    });

    document.getElementById("sendEmail").addEventListener("click", sendEmail);

    // ⭐ NEW ORDER BUTTON
    document.getElementById("newOrder").addEventListener("click", () => {
        localStorage.removeItem("editOrderNumber");
        isEditing = false;
        window.location.reload();
    });
}