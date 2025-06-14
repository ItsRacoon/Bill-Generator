class BillGenerator {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.initializeDefaults();
        this.loadSavedData();
    }

    initializeElements() {
        // Form elements
        this.billForm = document.getElementById('bill-form');
        this.itemsTable = document.getElementById('items-table');
        this.itemsTableBody = this.itemsTable.querySelector('tbody');
        
        // Buttons
        this.addItemBtn = document.querySelector('.add-item-btn');
        this.generateInvoiceBtn = document.getElementById('generate-invoice-number');
        this.previewBtn = document.getElementById('preview-btn');
        this.saveTemplateBtn = document.getElementById('save-template-btn');
        
        // Totals elements
        this.subtotalElement = document.getElementById('subtotal');
        this.discountAmountElement = document.getElementById('discount-amount');
        this.afterDiscountElement = document.getElementById('after-discount');
        this.taxAmountElement = document.getElementById('tax-amount');
        this.grandTotalElement = document.getElementById('grand-total');
        
        // Input elements
        this.discountInput = document.getElementById('discount-percent');
        this.taxInput = document.getElementById('tax-percent');
        this.billDateInput = document.getElementById('bill-date');
        this.dueDateInput = document.getElementById('due-date');
        
        // Modal elements
        this.previewModal = document.getElementById('preview-modal');
        this.previewContent = document.getElementById('preview-content');
        this.closeModal = document.querySelector('.close');
        
        // Invoice number
        this.invoiceNumberSpan = document.getElementById('invoice-number');
    }

    setupEventListeners() {
        // Form submission
        this.billForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Add item button
        this.addItemBtn.addEventListener('click', () => this.addItemRow());
        
        // Generate invoice number
        this.generateInvoiceBtn.addEventListener('click', () => this.generateInvoiceNumber());
        
        // Preview button
        this.previewBtn.addEventListener('click', () => this.showPreview());
        
        // Save template button
        this.saveTemplateBtn.addEventListener('click', () => this.saveTemplate());
        
        // Modal close
        this.closeModal.addEventListener('click', () => this.hidePreview());
        window.addEventListener('click', (e) => {
            if (e.target === this.previewModal) {
                this.hidePreview();
            }
        });
        
        // Discount and tax inputs
        this.discountInput.addEventListener('input', () => this.updateTotals());
        this.taxInput.addEventListener('input', () => this.updateTotals());
        
        // Setup existing item row listeners
        this.setupItemRowListeners(this.itemsTableBody.querySelector('.item-row'));
        
        // Auto-save business info when user types
        const businessInputs = [
            document.getElementById('business-name'),
            document.getElementById('business-email'),
            document.getElementById('business-address'),
            document.getElementById('business-phone')
        ];
        
        businessInputs.forEach(input => {
            if (input) {
                input.addEventListener('input', () => this.autoSaveBusinessInfo());
            }
        });
    }

    initializeDefaults() {
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        this.billDateInput.value = today;
        
        // Set due date to 30 days from today
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        this.dueDateInput.value = dueDate.toISOString().split('T')[0];
        
        // Generate initial invoice number
        this.generateInvoiceNumber();
        
        // Initialize totals
        this.updateTotals();
    }

    loadSavedData() {
        // Load business info
        const savedBusinessInfo = localStorage.getItem('businessInfo');
        if (savedBusinessInfo) {
            try {
                const businessData = JSON.parse(savedBusinessInfo);
                this.loadBusinessInfo(businessData);
            } catch (e) {
                console.warn('Could not load saved business info:', e);
            }
        }
        
        // Load template preferences
        const savedTemplate = localStorage.getItem('billTemplate');
        if (savedTemplate) {
            try {
                const data = JSON.parse(savedTemplate);
                this.loadTemplate(data);
            } catch (e) {
                console.warn('Could not load saved template:', e);
            }
        }
    }

    generateInvoiceNumber() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        const invoiceNumber = `INV-${timestamp.toString().slice(-6)}${random.toString().padStart(3, '0')}`;
        this.invoiceNumberSpan.textContent = invoiceNumber;
    }

    addItemRow() {
        console.log('Adding new item row...');
        const newRow = document.createElement('tr');
        newRow.className = 'item-row';
        
        newRow.innerHTML = `
            <td><input type="text" name="description[]" required placeholder="Item description"></td>
            <td><input type="number" name="quantity[]" min="1" value="1" required></td>
            <td><input type="number" name="price[]" min="0" step="0.01" value="0.00" required></td>
            <td class="item-total">₹0.00</td>
            <td><button type="button" class="remove-item-btn" title="Remove Item"><i class="fas fa-trash"></i></button></td>
        `;
        
        this.itemsTableBody.appendChild(newRow);
        this.setupItemRowListeners(newRow);
        
        // Focus on description input
        newRow.querySelector('input[name="description[]"]').focus();
        console.log('New item row added successfully');
    }

    setupItemRowListeners(row) {
        if (!row) {
            console.log('No row provided to setupItemRowListeners');
            return;
        }
        
        console.log('Setting up listeners for row:', row);
        
        const inputs = row.querySelectorAll('input[name="quantity[]"], input[name="price[]"]');
        console.log('Found inputs:', inputs.length);
        
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                console.log('Input changed, updating total');
                this.updateItemTotal(row);
            });
        });
        
        const removeBtn = row.querySelector('.remove-item-btn');
        if (removeBtn) {
            console.log('Setting up remove button listener');
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Remove button clicked');
                this.removeItemRow(row);
            });
        } else {
            console.log('No remove button found');
        }
    }

    removeItemRow(row) {
        if (this.itemsTableBody.children.length > 1) {
            row.remove();
            this.updateTotals();
        } else {
            this.showNotification('At least one item is required', 'warning');
        }
    }

    updateItemTotal(row) {
        console.log('Updating item total for row:', row);
        
        const quantityInput = row.querySelector('input[name="quantity[]"]');
        const priceInput = row.querySelector('input[name="price[]"]');
        const totalCell = row.querySelector('.item-total');
        
        if (!quantityInput || !priceInput || !totalCell) {
            console.log('Missing elements:', { quantityInput, priceInput, totalCell });
            return;
        }
        
        const quantity = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = quantity * price;
        
        console.log('Calculation:', { quantity, price, total });
        
        totalCell.textContent = `₹${total.toFixed(2)}`;
        this.updateTotals();
    }

    updateTotals() {
        let subtotal = 0;
        
        // Calculate subtotal
        this.itemsTableBody.querySelectorAll('.item-total').forEach(cell => {
            const amount = parseFloat(cell.textContent.replace('₹', '')) || 0;
            subtotal += amount;
        });
        
        // Get discount and tax percentages
        const discountPercent = parseFloat(this.discountInput.value) || 0;
        const taxPercent = parseFloat(this.taxInput.value) || 0;
        
        // Calculate amounts
        const discountAmount = (subtotal * discountPercent) / 100;
        const afterDiscount = subtotal - discountAmount;
        const taxAmount = (afterDiscount * taxPercent) / 100;
        const grandTotal = afterDiscount + taxAmount;
        
        // Update display
        this.subtotalElement.textContent = `₹${subtotal.toFixed(2)}`;
        this.discountAmountElement.textContent = `₹${discountAmount.toFixed(2)}`;
        this.afterDiscountElement.textContent = `₹${afterDiscount.toFixed(2)}`;
        this.taxAmountElement.textContent = `₹${taxAmount.toFixed(2)}`;
        this.grandTotalElement.textContent = `₹${grandTotal.toFixed(2)}`;
    }

    collectFormData() {
        const items = [];
        this.itemsTableBody.querySelectorAll('.item-row').forEach(row => {
            const description = row.querySelector('input[name="description[]"]').value;
            const quantity = parseFloat(row.querySelector('input[name="quantity[]"]').value) || 0;
            const price = parseFloat(row.querySelector('input[name="price[]"]').value) || 0;
            const total = quantity * price;
            
            if (description.trim()) {
                items.push({ description, quantity, price, total });
            }
        });
        
        return {
            invoiceNumber: this.invoiceNumberSpan.textContent,
            business: {
                name: document.getElementById('business-name').value,
                email: document.getElementById('business-email').value,
                address: document.getElementById('business-address').value,
                phone: document.getElementById('business-phone').value
            },
            client: {
                name: document.getElementById('client-name').value,
                email: document.getElementById('client-email').value,
                address: document.getElementById('client-address').value,
                phone: document.getElementById('client-phone').value
            },
            dates: {
                billDate: this.billDateInput.value,
                dueDate: this.dueDateInput.value
            },
            items: items,
            calculations: {
                subtotal: parseFloat(this.subtotalElement.textContent.replace('₹', '')),
                discountPercent: parseFloat(this.discountInput.value) || 0,
                discountAmount: parseFloat(this.discountAmountElement.textContent.replace('₹', '')),
                afterDiscount: parseFloat(this.afterDiscountElement.textContent.replace('₹', '')),
                taxPercent: parseFloat(this.taxInput.value) || 0,
                taxAmount: parseFloat(this.taxAmountElement.textContent.replace('₹', '')),
                grandTotal: parseFloat(this.grandTotalElement.textContent.replace('₹', ''))
            },
            notes: document.getElementById('notes').value
        };
    }

    validateForm() {
        const data = this.collectFormData();
        const errors = [];
        
        // Only require at least one item with description
        if (data.items.length === 0) {
            errors.push('At least one item with description is required');
        }
        
        // Bill date is auto-set, so only check if it's somehow missing
        if (!data.dates.billDate) {
            errors.push('Bill date is required');
        }
        
        return errors;
    }

    showPreview() {
        const errors = this.validateForm();
        if (errors.length > 0) {
            this.showNotification(errors.join('<br>'), 'error');
            return;
        }
        
        const data = this.collectFormData();
        this.previewContent.innerHTML = this.generatePreviewHTML(data);
        this.previewModal.style.display = 'block';
    }

    hidePreview() {
        this.previewModal.style.display = 'none';
    }

    generatePreviewHTML(data) {
        const formatDate = (dateStr) => {
            if (!dateStr) return 'Not specified';
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };
        
        return `
            <div class="preview-bill">
                <div class="preview-header">
                    <h1>INVOICE</h1>
                    <div style="margin-top: 10px;">
                        <strong>Invoice #: ${data.invoiceNumber}</strong>
                    </div>
                </div>
                
                <div class="preview-info">
                    <div>
                        <h3>From:</h3>
                        <div style="margin-top: 10px;">
                            ${data.business.name ? `<strong>${data.business.name}</strong><br>` : '<em>Business Name</em><br>'}
                            ${data.business.address ? `${data.business.address.replace(/\n/g, '<br>')}<br>` : '<em>Business Address</em><br>'}
                            ${data.business.email ? `Email: ${data.business.email}<br>` : '<em>Email: business@example.com</em><br>'}
                            ${data.business.phone ? `Phone: ${data.business.phone}` : '<em>Phone: +1 (555) 123-4567</em>'}
                        </div>
                    </div>
                    
                    <div>
                        <h3>Bill To:</h3>
                        <div style="margin-top: 10px;">
                            <strong>${data.client.name || 'Client Name'}</strong><br>
                            ${data.client.address ? data.client.address.replace(/\n/g, '<br>') + '<br>' : '<em>Client Address</em><br>'}
                            Email: ${data.client.email || '<em>client@example.com</em>'}<br>
                            Phone: ${data.client.phone || '<em>+1 (555) 987-6543</em>'}
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <strong>Date:</strong> ${formatDate(data.dates.billDate)}<br>
                    ${data.dates.dueDate ? `<strong>Due Date:</strong> ${formatDate(data.dates.dueDate)}` : ''}
                </div>
                
                <table class="preview-items-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.items.map(item => `
                            <tr>
                                <td>${item.description}</td>
                                <td>${item.quantity}</td>
                                <td>₹${item.price.toFixed(2)}</td>
                                <td>₹${item.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div style="text-align: right; margin-top: 20px;">
                    <div><strong>Subtotal: ₹${data.calculations.subtotal.toFixed(2)}</strong></div>
                    ${data.calculations.discountPercent > 0 ? `
                        <div style="color: #dc3545;">Discount (${data.calculations.discountPercent}%): -₹${data.calculations.discountAmount.toFixed(2)}</div>
                        <div>After Discount: ₹${data.calculations.afterDiscount.toFixed(2)}</div>
                    ` : ''}
                    ${data.calculations.taxPercent > 0 ? `
                        <div>Tax (${data.calculations.taxPercent}%): ₹${data.calculations.taxAmount.toFixed(2)}</div>
                    ` : ''}
                    <div style="font-size: 1.2em; margin-top: 10px; padding-top: 10px; border-top: 2px solid #333;">
                        <strong>Grand Total: ₹${data.calculations.grandTotal.toFixed(2)}</strong>
                    </div>
                </div>
                
                ${data.notes ? `
                    <div style="margin-top: 30px;">
                        <h3>Notes:</h3>
                        <div style="margin-top: 10px; padding: 15px; background: #f9f9f9; border-left: 4px solid #667eea;">
                            ${data.notes.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const errors = this.validateForm();
        if (errors.length > 0) {
            this.showNotification(errors.join('<br>'), 'error');
            return;
        }
        
        this.generatePDF();
    }

    generatePDF() {
        const data = this.collectFormData();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Set up colors
        const primaryColor = [102, 126, 234]; // #667eea
        const darkColor = [51, 51, 51]; // #333
        const lightColor = [128, 128, 128]; // #888
        
        // Header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', 105, 25, { align: 'center' });
        
        // Invoice details
        doc.setTextColor(...darkColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Invoice #: ${data.invoiceNumber}`, 150, 50);
        doc.text(`Date: ${this.formatDate(data.dates.billDate)}`, 150, 55);
        if (data.dates.dueDate) {
            doc.text(`Due Date: ${this.formatDate(data.dates.dueDate)}`, 150, 60);
        }
        
        // Business info (if provided)
        if (data.business.name || data.business.address || data.business.email || data.business.phone) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('From:', 20, 55);
            
            let yPos = 62;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            
            if (data.business.name) {
                doc.setFont('helvetica', 'bold');
                doc.text(data.business.name, 20, yPos);
                yPos += 5;
                doc.setFont('helvetica', 'normal');
            }
            
            if (data.business.address) {
                const addressLines = data.business.address.split('\n');
                addressLines.forEach(line => {
                    if (line.trim()) {
                        doc.text(line.trim(), 20, yPos);
                        yPos += 4;
                    }
                });
            }
            
            if (data.business.email) {
                doc.text(`Email: ${data.business.email}`, 20, yPos);
                yPos += 4;
            }
            
            if (data.business.phone) {
                doc.text(`Phone: ${data.business.phone}`, 20, yPos);
            }
        }
        
        // Client info
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Bill To:', 20, 90);
        
        let clientYPos = 97;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(data.client.name || 'Client Name', 20, clientYPos);
        clientYPos += 5;
        
        doc.setFont('helvetica', 'normal');
        if (data.client.address) {
            const addressLines = data.client.address.split('\n');
            addressLines.forEach(line => {
                if (line.trim()) {
                    doc.text(line.trim(), 20, clientYPos);
                    clientYPos += 4;
                }
            });
        } else {
            doc.text('Client Address', 20, clientYPos);
            clientYPos += 4;
        }
        
        doc.text(`Email: ${data.client.email || 'client@example.com'}`, 20, clientYPos);
        clientYPos += 4;
        doc.text(`Phone: ${data.client.phone || '+1 (555) 987-6543'}`, 20, clientYPos);
        
        // Items table
        const tableStartY = Math.max(clientYPos + 15, 130);
        
        const tableColumns = ['Description', 'Qty', 'Unit Price (₹)', 'Total (₹)'];
        const tableRows = data.items.map(item => [
            item.description,
            item.quantity.toString(),
            item.price.toFixed(2),
            item.total.toFixed(2)
        ]);
        
        doc.autoTable({
            head: [tableColumns],
            body: tableRows,
            startY: tableStartY,
            theme: 'grid',
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10
            },
            bodyStyles: {
                fontSize: 9,
                cellPadding: 3
            },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 20, halign: 'center' },
                2: { cellWidth: 30, halign: 'right' },
                3: { cellWidth: 30, halign: 'right' }
            },
            margin: { left: 20, right: 20 }
        });
        
        // Totals
        const finalY = doc.lastAutoTable.finalY + 10;
        let totalsY = finalY;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Subtotal
        doc.text('Subtotal:', 140, totalsY);
        doc.text(`₹${data.calculations.subtotal.toFixed(2)}`, 180, totalsY, { align: 'right' });
        totalsY += 6;
        
        // Discount
        if (data.calculations.discountPercent > 0) {
            doc.setTextColor(220, 53, 69); // Red color for discount
            doc.text(`Discount (${data.calculations.discountPercent}%):`, 140, totalsY);
            doc.text(`-₹${data.calculations.discountAmount.toFixed(2)}`, 180, totalsY, { align: 'right' });
            totalsY += 6;
            
            doc.setTextColor(...darkColor);
            doc.text('After Discount:', 140, totalsY);
            doc.text(`₹${data.calculations.afterDiscount.toFixed(2)}`, 180, totalsY, { align: 'right' });
            totalsY += 6;
        }
        
        // Tax
        if (data.calculations.taxPercent > 0) {
            doc.text(`Tax (${data.calculations.taxPercent}%):`, 140, totalsY);
            doc.text(`₹${data.calculations.taxAmount.toFixed(2)}`, 180, totalsY, { align: 'right' });
            totalsY += 8;
        }
        
        // Grand Total
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.line(135, totalsY - 2, 185, totalsY - 2);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Grand Total:', 140, totalsY + 3);
        doc.text(`₹${data.calculations.grandTotal.toFixed(2)}`, 180, totalsY + 3, { align: 'right' });
        
        // Notes
        if (data.notes) {
            const notesY = totalsY + 20;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text('Notes:', 20, notesY);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            const noteLines = doc.splitTextToSize(data.notes, 170);
            doc.text(noteLines, 20, notesY + 7);
        }
        
        // Footer
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...lightColor);
        doc.text('Thank you for your business!', 105, pageHeight - 20, { align: 'center' });
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, pageHeight - 15, { align: 'center' });
        
        // Save the PDF
        const fileName = `Invoice_${data.invoiceNumber}_${data.client.name.replace(/\s+/g, '_')}.pdf`;
        doc.save(fileName);
        
        this.showNotification('PDF generated successfully!', 'success');
    }

    formatDate(dateStr) {
        if (!dateStr) return 'Not specified';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    autoSaveBusinessInfo() {
        const businessInfo = {
            name: document.getElementById('business-name').value,
            email: document.getElementById('business-email').value,
            address: document.getElementById('business-address').value,
            phone: document.getElementById('business-phone').value
        };
        
        localStorage.setItem('businessInfo', JSON.stringify(businessInfo));
    }
    
    loadBusinessInfo(businessInfo) {
        if (businessInfo.name) document.getElementById('business-name').value = businessInfo.name;
        if (businessInfo.email) document.getElementById('business-email').value = businessInfo.email;
        if (businessInfo.address) document.getElementById('business-address').value = businessInfo.address;
        if (businessInfo.phone) document.getElementById('business-phone').value = businessInfo.phone;
    }

    saveTemplate() {
        const data = this.collectFormData();
        localStorage.setItem('billTemplate', JSON.stringify({
            calculations: {
                discountPercent: data.calculations.discountPercent,
                taxPercent: data.calculations.taxPercent
            }
        }));
        this.showNotification('Template saved successfully!', 'success');
    }

    loadTemplate(data) {
        if (data.calculations) {
            if (data.calculations.discountPercent) this.discountInput.value = data.calculations.discountPercent;
            if (data.calculations.taxPercent) this.taxInput.value = data.calculations.taxPercent;
        }
        
        this.updateTotals();
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <div class="notification-message">${message}</div>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#cce7ff'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#b8daff'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#004085'};
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
        
        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }
}

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-message {
        flex: 1;
        line-height: 1.4;
    }
    
    .notification-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin-left: 10px;
        opacity: 0.7;
        transition: opacity 0.2s;
    }
    
    .notification-close:hover {
        opacity: 1;
    }
`;
document.head.appendChild(notificationStyles);

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BillGenerator();
});
