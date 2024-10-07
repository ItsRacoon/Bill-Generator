document.addEventListener('DOMContentLoaded', () => {
    const addItemBtn = document.querySelector('.add-item-btn');
    const billItemsTable = document.querySelector('.bill-items tbody');
    const grandTotalSpan = document.getElementById('grand-total');
    const billForm = document.getElementById('bill-form');

    // Function to update total for each item
    const updateItemTotal = (row) => {
        const quantity = row.querySelector('input[name="quantity[]"]').value;
        const price = row.querySelector('input[name="price[]"]').value;
        const totalCell = row.querySelector('.item-total');

        const total = parseFloat(quantity) * parseFloat(price);
        totalCell.textContent = isNaN(total) ? '0.00' : total.toFixed(2);

        updateGrandTotal();
    };

    // Function to update grand total
    const updateGrandTotal = () => {
        const totals = document.querySelectorAll('.item-total');
        let grandTotal = 0;
        totals.forEach(total => {
            grandTotal += parseFloat(total.textContent) || 0;
        });
        grandTotalSpan.textContent = grandTotal.toFixed(2);
    };

    // Add new item row
    addItemBtn.addEventListener('click', () => {
        const newRow = document.createElement('tr');

        newRow.innerHTML = `
            <td><input type="text" name="description[]" required></td>
            <td><input type="number" name="quantity[]" min="1" value="1" required></td>
            <td><input type="number" name="price[]" min="0" step="0.01" value="0.00" required></td>
            <td class="item-total">0.00</td>
        `;

        billItemsTable.appendChild(newRow);

        newRow.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => updateItemTotal(newRow));
        });
    });

    // Handle form submission
    billForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Create a PDF document using jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add content to the PDF
        doc.setFontSize(25);
        doc.text('Bill', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Client Name: ${document.getElementById('client-name').value}`, 10, 30);
        doc.text(`Client Email: ${document.getElementById('client-email').value}`, 10, 40);
        doc.text(`Client Address: ${document.getElementById('client-address').value}`, 10, 50);
        doc.text(`Client Phone: ${document.getElementById('client-phone').value}`, 10, 60);
        doc.text('Items:', 10, 70);

        // Add bill items
        let y = 80; // Starting Y position for items
        billItemsTable.querySelectorAll('tr').forEach(row => {
            const description = row.querySelector('input[name="description[]"]').value;
            const quantity = row.querySelector('input[name="quantity[]"]').value;
            const price = row.querySelector('input[name="price[]"]').value;
            const total = row.querySelector('.item-total').textContent;

            doc.text(`${description} - Qty: ${quantity}, Price: ₹${price}, Total: ₹${total}`, 10, y);
            y += 10; // Move down for the next item
        });

        // Add total amount
        doc.text(`Grand Total: ₹${grandTotalSpan.textContent}`, 10, y);

        // Save the PDF
        doc.save('bill.pdf');
    });
});
