// Elements
const expensesContainer = document.getElementById("expensesContainer");
const addExpenseBtn = document.getElementById("addExpenseBtn");
const generatePdfBtn = document.getElementById("generatePdfBtn");
const receiptInput = document.getElementById("receiptFiles");

// Add a new expense row
function addExpenseRow() {
    const div = document.createElement("div");
    div.classList.add("expenseRow");
    div.innerHTML = `
        <label>Expense Date: <input type="date" class="expenseDate" required></label>
        <label>Description: <input type="text" class="expenseDesc" required></label>
        <label>Amount ($): <input type="number" class="expenseAmount" step="0.01" required></label>
        <label>Mileage (if applicable): <input type="number" class="expenseMiles" step="0.1"></label>
        <button type="button" class="removeExpenseBtn">Remove</button>
        <hr>
    `;
    expensesContainer.appendChild(div);
    div.querySelector(".removeExpenseBtn").addEventListener("click", () => div.remove());
}

addExpenseBtn.addEventListener("click", addExpenseRow);

// Add receipts using FileReader
async function addReceiptImages(doc) {
    const files = receiptInput.files;
    if (!files.length) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;

        const imgData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(e);
            reader.readAsDataURL(file);
        });

        // Add a new page for each receipt
        doc.addPage();

        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;

        const img = new Image();
        img.src = imgData;
        await new Promise(resolve => { img.onload = resolve; });

        const pdfWidth = pageWidth - margin * 2;
        const pdfHeight = (img.height * pdfWidth) / img.width;

        doc.addImage(imgData, 'JPEG', margin, margin, pdfWidth, pdfHeight);
    }
}

// Generate PDF
generatePdfBtn.addEventListener("click", async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const submissionDate = document.getElementById("submissionDate").value;

    // Page 1: Form + Expenses
    doc.setFontSize(16);
    doc.text("Reimbursement Request", 105, 20, null, null, "center");
    doc.setFontSize(12);
    doc.text(`Employee: ${firstName} ${lastName}`, 20, 40);
    doc.text(`Submission Date: ${submissionDate}`, 20, 50);

    let startY = 70;
    doc.text("Date", 20, startY);
    doc.text("Description", 50, startY);
    doc.text("Amount ($)", 120, startY);
    doc.text("Miles", 150, startY);
    doc.text("Mileage $", 180, startY);

    let total = 0;
    const rows = document.querySelectorAll(".expenseRow");
    rows.forEach((row, i) => {
        const expenseDate = row.querySelector(".expenseDate").value;
        const desc = row.querySelector(".expenseDesc").value;
        const amount = parseFloat(row.querySelector(".expenseAmount").value) || 0;
        const miles = parseFloat(row.querySelector(".expenseMiles").value) || 0;
        const mileageAmount = miles * 0.7;
        total += amount + mileageAmount;

        const y = startY + 10 + i * 10;
        doc.text(expenseDate, 20, y);
        doc.text(desc, 50, y);
        doc.text(amount.toFixed(2), 120, y);
        doc.text(miles ? miles.toFixed(1) : "-", 150, y);
        doc.text(mileageAmount ? mileageAmount.toFixed(2) : "-", 180, y);
    });

    doc.text(`Total Reimbursement: $${total.toFixed(2)}`, 20, startY + 20 + rows.length * 10);

    // Receipts (page 2+)
    await addReceiptImages(doc);

    doc.save(`Reimbursement_${firstName}_${lastName}.pdf`);
});
