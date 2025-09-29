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

// Add receipt images using html2canvas
async function addReceiptImages(doc) {
    const files = receiptInput.files;
    if (!files.length) return;

    const previewDiv = document.getElementById("receiptPreview");
    previewDiv.innerHTML = ''; // clear old content

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;

        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.style.maxWidth = '600px';
        img.style.marginBottom = '10px';
        previewDiv.appendChild(img);

        await new Promise(resolve => { img.onload = resolve; });

        const canvas = await html2canvas(img, { scale: 2 });
        const imgData = canvas.toDataURL('image/jpeg');

        if (i > 0) doc.addPage(); // new page for multiple receipts

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = pageWidth - margin * 2;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        doc.addImage(imgData, 'JPEG', margin, margin, pdfWidth, pdfHeight);
    }

    // clean up object URLs
    Array.from(previewDiv.querySelectorAll('img')).forEach(img => URL.
