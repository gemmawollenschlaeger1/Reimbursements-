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

    const firstName = document.getElementById("firstName").value || "NoName";
    const lastName = document.getElementById("lastName").value || "NoName";
    let submissionDate = document.getElementById("submissionDate").value;

    if (!submissionDate) {
        const today = new Date();
        submissionDate = today.toISOString().split('T')[0];
    }

    const safeDate = submissionDate.replace(/[/\\?%*:|"<>]/g, "-");

    // --- Page 1: Form + Table ---
    doc.setFontSize(16);
    doc.text("Reimbursement Request", 105, 20, null, null, "center");
    doc.setFontSize(12);
    doc.text(`Employee: ${firstName} ${lastName}`, 20, 40);
    doc.text(`Submission Date: ${submissionDate}`, 20, 50);

    // Table setup
    const startX = 15;
    const startY = 70;
    const colWidths = [30, 70, 25, 25, 25]; // widths of columns
    const rowHeight = 10;
    const headers = ["Date", "Description", "Amount ($)", "Miles", "Mileage $"];

    // Draw header row
    doc.setFillColor(200, 200, 200); // light gray
    doc.setFont(undefined, 'bold');
    doc.rect(startX, startY, colWidths.reduce((a,b)=>a+b,0), rowHeight, 'F'); // header background
    let x = startX;
    headers.forEach((header, i) => {
        doc.text(header, x + 2, startY + 7);
        x += colWidths[i];
    });
    doc.setFont(undefined, 'normal');

    // Draw rows
    let y = startY + rowHeight;
    let total = 0;
    const rows = document.querySelectorAll(".expenseRow");

    rows.forEach((row, i) => {
        const expenseDate = row.querySelector(".expenseDate").value;
        const desc = row.querySelector(".expenseDesc").value;
        const amount = parseFloat(row.querySelector(".expenseAmount").value) || 0;
        const miles = parseFloat(row.querySelector(".expenseMiles").value) || 0;
        const mileageAmount = miles * 0.7;
        total += amount + mileageAmount;

        // Alternating row color
        if (i % 2 === 0) doc.setFillColor(245,245,245);
        else doc.setFillColor(255,255,255);
        doc.rect(startX, y, colWidths.reduce((a,b)=>a+b,0), rowHeight, 'F');

        let cellX = startX;
        doc.text(expenseDate, cellX + 2, y + 7); cellX += colWidths[0];
        doc.text(desc, cellX + 2, y + 7); cellX += colWidths[1];
        doc.text(amount.toFixed(2), cellX + colWidths[2]-2, y + 7, {align: "right"}); cellX += colWidths[2];
        doc.text(miles ? miles.toFixed(1) : "-", cellX + colWidths[3]-2, y + 7, {align: "right"}); cellX += colWidths[3];
        doc.text(mileageAmount ? mileageAmount.toFixed(2) : "-", cellX + colWidths[4]-2, y + 7, {align: "right"});

        y += rowHeight;
    });

    // Draw vertical lines
    let lineX = startX;
    [0,1,2,3,4,5].forEach(i => {
        doc.line(lineX, startY, lineX, y); 
        if (i < colWidths.length) lineX += colWidths[i];
    });
    // Draw horizontal lines
    for(let rowY=startY; rowY<=y; rowY+=rowHeight) doc.line(startX, rowY, startX + colWidths.reduce((a,b)=>a+b,0), rowY);

    // Total row
    doc.setFont(undefined,'bold');
    doc.setFillColor(220,220,220);
    doc.rect(startX, y, colWidths.reduce((a,b)=>a+b,0), rowHeight, 'F');
    doc.text(`Total: $${total.toFixed(2)}`, startX + 2, y + 7);
    doc.setFont(undefined,'normal');

    // Receipts (page 2+)
    await addReceiptImages(doc);

    doc.save(`${safeDate}_Reimbursement_${firstName}_${lastName}.pdf`);
});
