/* ============================================================
   OPEN DATABASE
============================================================ */
let db = null;

document.addEventListener("DOMContentLoaded", () => {
    openDB().then(() => {
        loadOrders("All");
        setupFilters();
    });
});

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("LamprintOrdersDB", 1);

        // ⭐ Ensure the "orders" object store exists
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

/* ============================================================
   GET ALL ORDERS
============================================================ */
function getAllOrders() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("orders", "readonly");
        const store = tx.objectStore("orders");
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

/* ============================================================
   LOAD + FILTER ORDERS
============================================================ */
async function loadOrders(filter = "All") {
    const orders = await getAllOrders();
    window.allOrders = orders;

    let filtered = orders;

    if (filter !== "All") {
        filtered = orders.filter(o => o.status === filter);
    }

    renderOrders(filtered);
}

/* ============================================================
   RENDER ORDERS INTO TABLE
============================================================ */
function renderOrders(list) {
    const tbody = document.querySelector("#ordersTable tbody");
    tbody.innerHTML = "";

    list.forEach(order => {
        const tr = document.createElement("tr");

        const itemsFormatted = formatItems(order.items);

        tr.innerHTML = `
            <td>${order.number}</td>
            <td>${order.date}</td>
            <td>${order.supplier}</td>
            <td>${order.status}</td>
            <td style="white-space: pre-wrap;">${itemsFormatted}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editOrder('${order.number}')">
                    View / Edit
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

/* ============================================================
   FORMAT ITEMS (Corrected field names)
============================================================ */
function formatItems(items) {
    if (!items || items.length === 0) return "No items";

    return items
        .map(item => {
            return (
                `Type: ${item.type}\n` +
                `Code: ${item.code}\n` +
                `Desc: ${item.desc}\n` +
                `Qty: ${item.qty}\n` +
                `Expected: ${item.expectedDate}\n` +
                `-------------------------`
            );
        })
        .join("\n");
}

/* ============================================================
   FILTER BUTTONS
============================================================ */
function setupFilters() {
    document.getElementById("filterAll").addEventListener("click", () => loadOrders("All"));
    document.getElementById("filterPending").addEventListener("click", () => loadOrders("Pending"));
    document.getElementById("filterPartial").addEventListener("click", () => loadOrders("Partially Supplied"));
    document.getElementById("filterFull").addEventListener("click", () => loadOrders("Fully Supplied"));
}

/* ============================================================
   EDIT ORDER
============================================================ */
function editOrder(orderNumber) {
    localStorage.setItem("editOrderNumber", orderNumber);
    window.location.href = "index.html";
}
