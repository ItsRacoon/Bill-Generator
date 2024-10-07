document.addEventListener('DOMContentLoaded', () => {
    const addItemBtn = document.querySelector('.add-item-btn');
    const billItemsTable = document.querySelector('.bill-items tbody');
    const grandTotalSpan = document.getElementById('grand-total');

    // Function to update total for each item
    const updateItemTotal = (row) => {
        const quantity = parseFloat(row.querySelector('input[name="quantity[]"]').value) || 0;
        const price = parseFloat(row.querySelector('input[name="price[]"]').value) || 0;
        const totalCell = row.querySelector('.item-total');

        const total = quantity * price;
        totalCell.textContent = total.toFixed(2);

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

    // Function to add event listeners to inputs
    const addInputListeners = (row) => {
        const quantityInput = row.querySelector('input[name="quantity[]"]');
        const priceInput = row.querySelector('input[name="price[]"]');

        quantityInput.addEventListener('input', () => updateItemTotal(row));
        priceInput.addEventListener('input', () => updateItemTotal(row));
    };

    // Add initial event listeners
    billItemsTable.querySelectorAll('tr').forEach(row => {
        addInputListeners(row);
        updateItemTotal(row);
    });

    // Function to add a new item row
    const addNewItem = () => {
        const newRow = document.createElement('tr');

        newRow.innerHTML = `
            <td><input type="text" name="description[]" placeholder="Item Description" required></td>
            <td><input type="number" name="quantity[]" min="1" value="1" required></td>
            <td><input type="number" name="price[]" min="0" step="0.01" value="0.00" required></td>
            <td class="item-total">0.00</td>
            <td><button type="button" class="remove-item-btn">Remove</button></td>
        `;

        // Append the new row to the table body
        billItemsTable.appendChild(newRow);

        // Add event listeners to the new inputs
        addInputListeners(newRow);

        // Initialize the total for the new row
        updateItemTotal(newRow);

        // Add event listener to the remove button
        const removeBtn = newRow.querySelector('.remove-item-btn');
        removeBtn.addEventListener('click', () => {
            newRow.remove();
            updateGrandTotal();
        });
    };

    // Event listener for adding new items
    addItemBtn.addEventListener('click', addNewItem);

    // Handle form submission and PDF generation
    const billForm = document.getElementById('bill-form');
    billForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Check if PDFDocument is available
        if (typeof PDFDocument === 'undefined') {
            alert('PDFDocument is not defined. Please check if PDFKit is loaded correctly.');
            return;
        }

        // Initialize PDFKit
        const doc = new PDFDocument({ margin: 50 });
        const stream = doc.pipe(blobStream());

        // Add Title
        doc.fontSize(20).text('Invoice', { align: 'center' });
        doc.moveDown();

        // Add Client Information
        const clientName = document.getElementById('client-name').value.trim();
        const clientEmail = document.getElementById('client-email').value.trim();
        const clientAddress = document.getElementById('client-address').value.trim();
        const clientPhone = document.getElementById('client-phone').value.trim();

        doc.fontSize(12).text(`Name: ${clientName}`);
        doc.text(`Email: ${clientEmail}`);
        doc.text(`Address: ${clientAddress}`);
        doc.text(`Phone: ${clientPhone}`);
        doc.moveDown();

        // Add Bill Items Table Headers
        doc.fontSize(14).text('Bill Items', { underline: true });
        doc.moveDown();

        // Table Headers
        doc.fontSize(12).text('Description', 50, doc.y, { continued: true });
        doc.text('Quantity', 200, doc.y, { continued: true });
        doc.text('Price (₹)', 300, doc.y, { continued: true });
        doc.text('Total (₹)', 400, doc.y);
        doc.moveDown();

        // Add each bill item
        billItemsTable.querySelectorAll('tr').forEach(row => {
            const description = row.querySelector('input[name="description[]"]').value.trim();
            const quantity = parseFloat(row.querySelector('input[name="quantity[]"]').value) || 0;
            const price = parseFloat(row.querySelector('input[name="price[]"]').value) || 0;
            const total = parseFloat(row.querySelector('.item-total').textContent) || 0;

            doc.fontSize(12).text(description, 50, doc.y, { continued: true });
            doc.text(quantity.toString(), 200, doc.y, { continued: true });
            doc.text(price.toFixed(2), 300, doc.y, { continued: true });
            doc.text(total.toFixed(2), 400, doc.y);
        });

        doc.moveDown();

        // Add Grand Total
        doc.fontSize(14).text(`Grand Total: ₹${grandTotalSpan.textContent}`, { align: 'right' });

        // Finalize PDF file
        doc.end();
        stream.on('finish', function () {
            const url = stream.toBlobURL('application/pdf');
            const link = document.createElement('a');
            link.href = url;
            link.download = 'invoice.pdf';
            link.click();
        });

        // Optionally, reset the form after generation
        alert('Invoice PDF has been generated and downloaded!');
        billForm.reset();

        // Reset the bill items to initial state
        billItemsTable.innerHTML = `
            <tr>
                <td><input type="text" name="description[]" placeholder="Item Description" required></td>
                <td><input type="number" name="quantity[]" min="1" value="1" required></td>
                <td><input type="number" name="price[]" min="0" step="0.01" value="0.00" required></td>
                <td class="item-total">0.00</td>
                <td><button type="button" class="remove-item-btn">Remove</button></td>
            </tr>
        `;
        grandTotalSpan.textContent = '0.00';

        // Re-add event listeners to the new row
        const newRow = billItemsTable.querySelector('tr');
        addInputListeners(newRow);
        updateItemTotal(newRow);

        // Add event listener to the remove button
        const removeBtn = newRow.querySelector('.remove-item-btn');
        removeBtn.addEventListener('click', () => {
            newRow.remove();
            updateGrandTotal();

            if (typeof PDFDocument === 'undefined') {
                alert('PDFDocument is not defined. Please check if PDFKit is loaded correctly.');
                return;
            }
            
        });
    });
});
