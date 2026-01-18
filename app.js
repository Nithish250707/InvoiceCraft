/**
 * InvoiceCraft - Invoice Generator Application
 * A browser-based invoice generator with PDF export
 */

// Currency Configuration
const currencies = {
    USD: { symbol: '$', name: 'US Dollar', position: 'before' },
    EUR: { symbol: '€', name: 'Euro', position: 'before' },
    GBP: { symbol: '£', name: 'British Pound', position: 'before' },
    INR: { symbol: '₹', name: 'Indian Rupee', position: 'before' },
    JPY: { symbol: '¥', name: 'Japanese Yen', position: 'before' },
    CNY: { symbol: '¥', name: 'Chinese Yuan', position: 'before' },
    AUD: { symbol: 'A$', name: 'Australian Dollar', position: 'before' },
    CAD: { symbol: 'C$', name: 'Canadian Dollar', position: 'before' },
    CHF: { symbol: 'Fr', name: 'Swiss Franc', position: 'before' },
    HKD: { symbol: 'HK$', name: 'Hong Kong Dollar', position: 'before' },
    SGD: { symbol: 'S$', name: 'Singapore Dollar', position: 'before' },
    SEK: { symbol: 'kr', name: 'Swedish Krona', position: 'after' },
    KRW: { symbol: '₩', name: 'South Korean Won', position: 'before' },
    MXN: { symbol: '$', name: 'Mexican Peso', position: 'before' },
    BRL: { symbol: 'R$', name: 'Brazilian Real', position: 'before' },
    RUB: { symbol: '₽', name: 'Russian Ruble', position: 'after' },
    ZAR: { symbol: 'R', name: 'South African Rand', position: 'before' },
    AED: { symbol: 'د.إ', name: 'UAE Dirham', position: 'before' },
    SAR: { symbol: '﷼', name: 'Saudi Riyal', position: 'before' },
    NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', position: 'before' },
    THB: { symbol: '฿', name: 'Thai Baht', position: 'before' },
    PHP: { symbol: '₱', name: 'Philippine Peso', position: 'before' },
    MYR: { symbol: 'RM', name: 'Malaysian Ringgit', position: 'before' },
    IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', position: 'before' },
    PLN: { symbol: 'zł', name: 'Polish Zloty', position: 'after' },
    TRY: { symbol: '₺', name: 'Turkish Lira', position: 'before' },
    NOK: { symbol: 'kr', name: 'Norwegian Krone', position: 'after' },
    DKK: { symbol: 'kr', name: 'Danish Krone', position: 'after' }
};

// State Management
const state = {
    businessName: '',
    businessEmail: '',
    businessAddress: '',
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    shipTo: '',
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    paymentTerms: '',
    poNumber: '',
    currency: 'USD',
    lineItems: [],
    taxRate: 0,
    discount: 0,
    discountType: 'percent', // 'percent' or 'flat'
    showDiscount: false,
    shipping: 0,
    showShipping: false,
    amountPaid: 0,
    notes: '',
    terms: '',
    companyLogo: ''
};

// DOM Elements
const elements = {
    landingPage: document.getElementById('landing-page'),
    builderPage: document.getElementById('builder-page'),
    invoiceForm: document.getElementById('invoice-form'),
    lineItemsContainer: document.getElementById('line-items-container'),
    invoicePreview: document.getElementById('invoice-preview'),
    subtotalDisplay: document.getElementById('subtotal-display'),
    taxDisplay: document.getElementById('tax-display'),
    totalDisplay: document.getElementById('total-display'),
    discountDisplay: document.getElementById('discount-display'),
    shippingDisplay: document.getElementById('shipping-display'),
    balanceDisplay: document.getElementById('balance-display')
};

// Format currency
function formatCurrency(amount) {
    const curr = currencies[state.currency] || currencies.USD;
    const formatted = Math.abs(amount).toFixed(2);
    const sign = amount < 0 ? '-' : '';
    if (curr.position === 'after') {
        return sign + formatted + ' ' + curr.symbol;
    }
    return sign + curr.symbol + formatted;
}

// Navigation
function navigateToBuilder() {
    elements.landingPage.classList.remove('active');
    elements.builderPage.classList.add('active');
    loadFromStorage();
    if (state.lineItems.length === 0) addLineItem();
    updatePreview();
}

function navigateToLanding() {
    elements.builderPage.classList.remove('active');
    elements.landingPage.classList.add('active');
}

// Line Items
let itemCounter = 0;

function addLineItem(item = null) {
    itemCounter++;
    const itemData = item || { id: itemCounter, name: '', quantity: 1, price: 0 };
    if (!item) state.lineItems.push(itemData);

    const html = '<div class="line-item" id="line-item-' + itemData.id + '">' +
        '<div class="line-item-header"><span class="line-item-number">Item ' + itemData.id + '</span>' +
        '<button type="button" class="btn-remove-item" onclick="removeLineItem(' + itemData.id + ')" title="Remove">✕</button></div>' +
        '<div class="line-item-fields">' +
        '<div class="form-group"><label>Description</label><input type="text" class="form-input item-name" data-id="' + itemData.id + '" placeholder="Description of item/service..." value="' + itemData.name + '"></div>' +
        '<div class="form-group"><label>Qty</label><input type="number" class="form-input item-quantity" data-id="' + itemData.id + '" placeholder="1" min="1" value="' + itemData.quantity + '"></div>' +
        '<div class="form-group"><label>Rate</label><input type="number" class="form-input item-price" data-id="' + itemData.id + '" placeholder="0" min="0" step="0.01" value="' + (itemData.price || '') + '"></div>' +
        '<div class="form-group"><label>Amount</label><div class="line-item-total" id="item-total-' + itemData.id + '">' + formatCurrency(itemData.quantity * itemData.price) + '</div></div>' +
        '</div></div>';

    elements.lineItemsContainer.insertAdjacentHTML('beforeend', html);
    attachLineItemListeners(itemData.id);
    updateCalculations();
    saveToStorage();
}

function removeLineItem(id) {
    const el = document.getElementById('line-item-' + id);
    if (el) {
        el.remove();
        state.lineItems = state.lineItems.filter(i => i.id !== id);
        updateCalculations();
        updatePreview();
        saveToStorage();
        if (state.lineItems.length === 0) addLineItem();
    }
}

function attachLineItemListeners(id) {
    const nameInput = document.querySelector('.item-name[data-id="' + id + '"]');
    const qtyInput = document.querySelector('.item-quantity[data-id="' + id + '"]');
    const priceInput = document.querySelector('.item-price[data-id="' + id + '"]');

    const update = () => {
        const item = state.lineItems.find(i => i.id === id);
        if (item) {
            item.name = nameInput.value;
            item.quantity = parseFloat(qtyInput.value) || 1;
            item.price = parseFloat(priceInput.value) || 0;
            document.getElementById('item-total-' + id).textContent = formatCurrency(item.quantity * item.price);
            updateCalculations();
            updatePreview();
            saveToStorage();
        }
    };

    nameInput.addEventListener('input', update);
    qtyInput.addEventListener('input', update);
    priceInput.addEventListener('input', update);
}

// Toggle Functions
function toggleDiscount() {
    state.showDiscount = !state.showDiscount;
    const discountGroup = document.getElementById('discount-group');
    const discountRow = document.getElementById('discount-row');
    const btn = document.getElementById('toggle-discount-btn');

    if (state.showDiscount) {
        discountGroup.style.display = 'block';
        discountRow.style.display = 'flex';
        btn.innerHTML = '<span class="btn-icon">➖</span> Discount';
    } else {
        discountGroup.style.display = 'none';
        discountRow.style.display = 'none';
        btn.innerHTML = '<span class="btn-icon">➕</span> Discount';
        state.discount = 0;
        document.getElementById('discount').value = '';
    }
    updateCalculations();
    updatePreview();
    saveToStorage();
}

function toggleShipping() {
    state.showShipping = !state.showShipping;
    const shippingGroup = document.getElementById('shipping-group');
    const shippingRow = document.getElementById('shipping-row');
    const btn = document.getElementById('toggle-shipping-btn');

    if (state.showShipping) {
        shippingGroup.style.display = 'block';
        shippingRow.style.display = 'flex';
        btn.innerHTML = '<span class="btn-icon">➖</span> Shipping';
    } else {
        shippingGroup.style.display = 'none';
        shippingRow.style.display = 'none';
        btn.innerHTML = '<span class="btn-icon">➕</span> Shipping';
        state.shipping = 0;
        document.getElementById('shipping').value = '';
    }
    updateCalculations();
    updatePreview();
    saveToStorage();
}

function toggleDiscountType() {
    const btn = document.getElementById('discount-type-btn');
    if (state.discountType === 'percent') {
        state.discountType = 'flat';
        btn.textContent = currencies[state.currency]?.symbol || '$';
    } else {
        state.discountType = 'percent';
        btn.textContent = '%';
    }
    updateCalculations();
    updatePreview();
    saveToStorage();
}

function updateCalculations() {
    const subtotal = state.lineItems.reduce((sum, i) => sum + (i.quantity * i.price), 0);
    const tax = subtotal * (state.taxRate / 100);

    let discountAmount = 0;
    if (state.showDiscount && state.discount > 0) {
        if (state.discountType === 'percent') {
            discountAmount = (subtotal + tax) * (state.discount / 100);
        } else {
            discountAmount = state.discount;
        }
    }

    const shippingAmount = state.showShipping ? (state.shipping || 0) : 0;
    const total = subtotal + tax - discountAmount + shippingAmount;
    const balanceDue = total - (state.amountPaid || 0);

    elements.subtotalDisplay.textContent = formatCurrency(subtotal);
    elements.taxDisplay.textContent = formatCurrency(tax);
    elements.totalDisplay.textContent = formatCurrency(total);

    if (elements.discountDisplay) {
        elements.discountDisplay.textContent = '-' + formatCurrency(discountAmount);
    }
    if (elements.shippingDisplay) {
        elements.shippingDisplay.textContent = formatCurrency(shippingAmount);
    }
    if (elements.balanceDisplay) {
        elements.balanceDisplay.textContent = formatCurrency(balanceDue);
    }

    // Update line item totals with new currency
    state.lineItems.forEach(item => {
        const totalEl = document.getElementById('item-total-' + item.id);
        if (totalEl) {
            totalEl.textContent = formatCurrency(item.quantity * item.price);
        }
    });
}

function updatePreview() {
    const subtotal = state.lineItems.reduce((sum, i) => sum + (i.quantity * i.price), 0);
    const tax = subtotal * (state.taxRate / 100);

    let discountAmount = 0;
    if (state.showDiscount && state.discount > 0) {
        if (state.discountType === 'percent') {
            discountAmount = (subtotal + tax) * (state.discount / 100);
        } else {
            discountAmount = state.discount;
        }
    }

    const shippingAmount = state.showShipping ? (state.shipping || 0) : 0;
    const total = subtotal + tax - discountAmount + shippingAmount;
    const balanceDue = total - (state.amountPaid || 0);

    if (!state.businessName && !state.clientName && !state.lineItems.some(i => i.name)) {
        elements.invoicePreview.innerHTML = '<div class="empty-preview"><div class="empty-preview-icon">📄</div><h3>Your invoice preview will appear here</h3><p>Start filling in the form to see your invoice</p></div>';
        return;
    }

    const itemsHTML = state.lineItems.filter(i => i.name || i.price > 0).map(i =>
        '<tr><td class="item-name">' + (i.name || 'Item') + '</td><td>' + i.quantity + '</td><td>' + formatCurrency(i.price) + '</td><td>' + formatCurrency(i.quantity * i.price) + '</td></tr>'
    ).join('');

    const logoHTML = state.companyLogo
        ? '<img src="' + state.companyLogo + '" class="company-logo" style="height:60px;width:auto;max-width:200px;object-fit:contain;">'
        : '<div style="font-size:1.5rem;font-weight:700;color:#4f63d2;">' + (state.businessName || 'Your Business') + '</div>';

    let summaryHTML = '<div class="summary-line"><span>Subtotal</span><span>' + formatCurrency(subtotal) + '</span></div>';
    if (state.taxRate > 0) {
        summaryHTML += '<div class="summary-line"><span>Tax (' + state.taxRate + '%)</span><span>' + formatCurrency(tax) + '</span></div>';
    }
    if (state.showDiscount && discountAmount > 0) {
        summaryHTML += '<div class="summary-line"><span>Discount' + (state.discountType === 'percent' ? ' (' + state.discount + '%)' : '') + '</span><span>-' + formatCurrency(discountAmount) + '</span></div>';
    }
    if (state.showShipping && shippingAmount > 0) {
        summaryHTML += '<div class="summary-line"><span>Shipping</span><span>' + formatCurrency(shippingAmount) + '</span></div>';
    }
    summaryHTML += '<div class="summary-line total"><span>Total</span><span class="amount">' + formatCurrency(total) + '</span></div>';
    if (state.amountPaid > 0) {
        summaryHTML += '<div class="summary-line"><span>Amount Paid</span><span>-' + formatCurrency(state.amountPaid) + '</span></div>';
    }
    summaryHTML += '<div class="summary-line balance"><span>Balance Due</span><span class="amount">' + formatCurrency(balanceDue) + '</span></div>';

    let metaHTML = '<div class="invoice-number-display">#' + (state.invoiceNumber || '1') + '</div>';
    metaHTML += '<div class="invoice-date-display">' + (state.invoiceDate ? formatDate(state.invoiceDate) : 'Invoice Date');
    if (state.dueDate) metaHTML += '<br>Due: ' + formatDate(state.dueDate);
    metaHTML += '</div>';
    if (state.paymentTerms) metaHTML += '<div class="invoice-terms-display">Terms: ' + state.paymentTerms + '</div>';
    if (state.poNumber) metaHTML += '<div class="invoice-po-display">PO #' + state.poNumber + '</div>';

    let partiesHTML = '<div class="party-block"><h4>From</h4><div class="party-name">' + (state.businessName || 'Your Business') + '</div><div class="party-details">' + (state.businessEmail || '') + '\n' + (state.businessAddress || '') + '</div></div>';
    partiesHTML += '<div class="party-block"><h4>Bill To</h4><div class="party-name">' + (state.clientName || 'Client Name') + '</div><div class="party-details">' + (state.clientEmail || '') + '\n' + (state.clientAddress || '') + '</div></div>';
    if (state.shipTo) {
        partiesHTML += '<div class="party-block"><h4>Ship To</h4><div class="party-details">' + state.shipTo + '</div></div>';
    }

    let footerHTML = '<p>Thank you for your business!</p>';
    if (state.notes) {
        footerHTML += '<div class="invoice-notes"><strong>Notes:</strong> ' + state.notes + '</div>';
    }
    if (state.terms) {
        footerHTML += '<div class="invoice-terms"><strong>Terms:</strong> ' + state.terms + '</div>';
    }
    footerHTML += '<div class="powered-by"><span>Created with</span><img src="assets/logo.png" alt="InvoiceCraft"></div>';

    elements.invoicePreview.innerHTML = '<div class="invoice-header"><div class="invoice-branding">' + logoHTML + '</div><div class="invoice-meta">' + metaHTML + '</div></div><div class="invoice-parties">' + partiesHTML + '</div><table class="items-table"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>' + (itemsHTML || '<tr><td colspan="4" style="text-align:center;color:var(--gray-400);">No items added</td></tr>') + '</tbody></table><div class="invoice-summary"><div class="summary-table">' + summaryHTML + '</div></div><div class="invoice-footer">' + footerHTML + '</div>';
}

function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// PDF Generation using jsPDF
async function downloadPDF() {
    const btn = document.getElementById('download-btn');
    const origText = btn.innerHTML;
    btn.innerHTML = '<span class="btn-icon">⏳</span> Generating...';
    btn.disabled = true;

    try {
        const subtotal = state.lineItems.reduce((sum, i) => sum + (i.quantity * i.price), 0);
        const tax = subtotal * (state.taxRate / 100);

        let discountAmount = 0;
        if (state.showDiscount && state.discount > 0) {
            if (state.discountType === 'percent') {
                discountAmount = (subtotal + tax) * (state.discount / 100);
            } else {
                discountAmount = state.discount;
            }
        }

        const shippingAmount = state.showShipping ? (state.shipping || 0) : 0;
        const total = subtotal + tax - discountAmount + shippingAmount;
        const balanceDue = total - (state.amountPaid || 0);

        const itemsRows = state.lineItems.filter(i => i.name || i.price > 0).map(i =>
            '<tr><td style="padding:10px;border-bottom:1px solid #ddd;">' + (i.name || 'Item') + '</td>' +
            '<td style="padding:10px;border-bottom:1px solid #ddd;text-align:center;">' + i.quantity + '</td>' +
            '<td style="padding:10px;border-bottom:1px solid #ddd;text-align:right;">' + formatCurrency(i.price) + '</td>' +
            '<td style="padding:10px;border-bottom:1px solid #ddd;text-align:right;font-weight:bold;">' + formatCurrency(i.quantity * i.price) + '</td></tr>'
        ).join('');

        const logoHTML = state.companyLogo
            ? '<img src="' + state.companyLogo + '" style="height:50px;max-width:180px;">'
            : '<div style="font-size:22px;font-weight:bold;color:#4f63d2;">' + (state.businessName || 'Your Business') + '</div>';

        let summaryHTML = '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;"><span>Subtotal</span><span>' + formatCurrency(subtotal) + '</span></div>';
        if (state.taxRate > 0) {
            summaryHTML += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;"><span>Tax (' + state.taxRate + '%)</span><span>' + formatCurrency(tax) + '</span></div>';
        }
        if (state.showDiscount && discountAmount > 0) {
            summaryHTML += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;"><span>Discount</span><span>-' + formatCurrency(discountAmount) + '</span></div>';
        }
        if (state.showShipping && shippingAmount > 0) {
            summaryHTML += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;"><span>Shipping</span><span>' + formatCurrency(shippingAmount) + '</span></div>';
        }
        summaryHTML += '<div style="display:flex;justify-content:space-between;padding:12px 0;font-size:18px;font-weight:bold;"><span>Total</span><span style="color:#059669;">' + formatCurrency(total) + '</span></div>';
        if (state.amountPaid > 0) {
            summaryHTML += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;"><span>Amount Paid</span><span>-' + formatCurrency(state.amountPaid) + '</span></div>';
        }
        summaryHTML += '<div style="display:flex;justify-content:space-between;padding:12px 0;font-size:16px;font-weight:bold;background:#ecfdf5;margin:8px -10px -10px;padding:12px;border-radius:6px;"><span>Balance Due</span><span style="color:#059669;">' + formatCurrency(balanceDue) + '</span></div>';

        let metaHTML = '<div style="font-size:22px;font-weight:bold;">#' + (state.invoiceNumber || '1') + '</div>';
        metaHTML += '<div style="color:#666;margin-top:5px;">' + (state.invoiceDate ? formatDate(state.invoiceDate) : '') + (state.dueDate ? '<br>Due: ' + formatDate(state.dueDate) : '') + '</div>';
        if (state.paymentTerms) metaHTML += '<div style="color:#666;margin-top:5px;">Terms: ' + state.paymentTerms + '</div>';
        if (state.poNumber) metaHTML += '<div style="color:#666;margin-top:5px;">PO #' + state.poNumber + '</div>';

        let partiesHTML = '<div style="flex:1;"><div style="font-size:12px;color:#888;text-transform:uppercase;margin-bottom:8px;">From</div><div style="font-weight:bold;margin-bottom:4px;">' + (state.businessName || 'Your Business') + '</div><div style="color:#666;font-size:13px;white-space:pre-line;">' + (state.businessEmail || '') + '\n' + (state.businessAddress || '') + '</div></div>';
        partiesHTML += '<div style="flex:1;"><div style="font-size:12px;color:#888;text-transform:uppercase;margin-bottom:8px;">Bill To</div><div style="font-weight:bold;margin-bottom:4px;">' + (state.clientName || 'Client') + '</div><div style="color:#666;font-size:13px;white-space:pre-line;">' + (state.clientEmail || '') + '\n' + (state.clientAddress || '') + '</div></div>';
        if (state.shipTo) {
            partiesHTML += '<div style="flex:1;"><div style="font-size:12px;color:#888;text-transform:uppercase;margin-bottom:8px;">Ship To</div><div style="color:#666;font-size:13px;white-space:pre-line;">' + state.shipTo + '</div></div>';
        }

        let footerHTML = 'Thank you for your business!';
        if (state.notes) footerHTML += '<br><br><strong>Notes:</strong> ' + state.notes;
        if (state.terms) footerHTML += '<br><br><strong>Terms:</strong> ' + state.terms;
        footerHTML += '<br>Generated with InvoiceCraft';

        const container = document.createElement('div');
        container.style.cssText = 'position:absolute;left:-9999px;width:794px;padding:40px;background:#fff;font-family:Arial,sans-serif;color:#333;';
        container.innerHTML = '<div style="display:flex;justify-content:space-between;margin-bottom:30px;padding-bottom:20px;border-bottom:2px solid #eee;"><div>' + logoHTML + '</div><div style="text-align:right;">' + metaHTML + '</div></div><div style="display:flex;margin-bottom:30px;">' + partiesHTML + '</div><table style="width:100%;border-collapse:collapse;margin-bottom:20px;"><thead><tr style="background:#4f63d2;color:white;"><th style="padding:10px;text-align:left;">Description</th><th style="padding:10px;text-align:center;">Qty</th><th style="padding:10px;text-align:right;">Rate</th><th style="padding:10px;text-align:right;">Amount</th></tr></thead><tbody>' + (itemsRows || '<tr><td colspan="4" style="padding:20px;text-align:center;color:#999;">No items</td></tr>') + '</tbody></table><div style="display:flex;justify-content:flex-end;"><div style="width:250px;">' + summaryHTML + '</div></div><div style="text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #eee;color:#999;font-size:12px;">' + footerHTML + '</div>';

        document.body.appendChild(container);
        await new Promise(r => setTimeout(r, 200));

        const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgW = 210;
        const imgH = (canvas.height * imgW) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);

        const fn = 'InvoiceCraft_Invoice_' + (state.invoiceNumber || 'draft').replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf';
        pdf.save(fn);

        document.body.removeChild(container);
    } catch (err) {
        console.error('PDF error:', err);
        alert('PDF generation failed: ' + err.message);
    } finally {
        btn.innerHTML = origText;
        btn.disabled = false;
    }
}

// Storage
const STORAGE_KEY = 'invoicecraft_data';

function saveToStorage() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { }
}

function loadFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            Object.assign(state, JSON.parse(saved));
            document.getElementById('business-name').value = state.businessName || '';
            document.getElementById('business-email').value = state.businessEmail || '';
            document.getElementById('business-address').value = state.businessAddress || '';
            document.getElementById('client-name').value = state.clientName || '';
            document.getElementById('client-email').value = state.clientEmail || '';
            document.getElementById('client-address').value = state.clientAddress || '';
            document.getElementById('ship-to').value = state.shipTo || '';
            document.getElementById('invoice-number').value = state.invoiceNumber || '';
            document.getElementById('invoice-date').value = state.invoiceDate || '';
            document.getElementById('due-date').value = state.dueDate || '';
            document.getElementById('payment-terms').value = state.paymentTerms || '';
            document.getElementById('po-number').value = state.poNumber || '';
            document.getElementById('currency-select').value = state.currency || 'USD';
            document.getElementById('tax-rate').value = state.taxRate || '';
            document.getElementById('discount').value = state.discount || '';
            document.getElementById('shipping').value = state.shipping || '';
            document.getElementById('amount-paid').value = state.amountPaid || '';
            document.getElementById('notes').value = state.notes || '';
            document.getElementById('terms').value = state.terms || '';

            // Restore discount/shipping visibility
            if (state.showDiscount) {
                document.getElementById('discount-group').style.display = 'block';
                document.getElementById('discount-row').style.display = 'flex';
                document.getElementById('toggle-discount-btn').innerHTML = '<span class="btn-icon">➖</span> Discount';
            }
            if (state.showShipping) {
                document.getElementById('shipping-group').style.display = 'block';
                document.getElementById('shipping-row').style.display = 'flex';
                document.getElementById('toggle-shipping-btn').innerHTML = '<span class="btn-icon">➖</span> Shipping';
            }

            // Update discount type button
            const discountTypeBtn = document.getElementById('discount-type-btn');
            if (state.discountType === 'flat') {
                discountTypeBtn.textContent = currencies[state.currency]?.symbol || '$';
            }

            elements.lineItemsContainer.innerHTML = '';
            if (state.lineItems.length > 0) {
                itemCounter = Math.max(...state.lineItems.map(i => i.id));
                state.lineItems.forEach(item => addLineItem(item));
            }
            if (state.companyLogo) updateLogoPreview(state.companyLogo);
        }
    } catch (e) { }
}

function clearInvoice() {
    if (confirm('Clear all invoice data?')) {
        localStorage.removeItem(STORAGE_KEY);
        Object.keys(state).forEach(k => {
            if (k === 'lineItems') state[k] = [];
            else if (k === 'taxRate' || k === 'discount' || k === 'shipping' || k === 'amountPaid') state[k] = 0;
            else if (k === 'showDiscount' || k === 'showShipping') state[k] = false;
            else if (k === 'discountType') state[k] = 'percent';
            else if (k === 'currency') state[k] = 'USD';
            else state[k] = '';
        });
        elements.invoiceForm.reset();
        elements.lineItemsContainer.innerHTML = '';
        itemCounter = 0;
        updateLogoPreview(null);

        // Reset visibility
        document.getElementById('discount-group').style.display = 'none';
        document.getElementById('discount-row').style.display = 'none';
        document.getElementById('shipping-group').style.display = 'none';
        document.getElementById('shipping-row').style.display = 'none';
        document.getElementById('toggle-discount-btn').innerHTML = '<span class="btn-icon">➕</span> Discount';
        document.getElementById('toggle-shipping-btn').innerHTML = '<span class="btn-icon">➕</span> Shipping';
        document.getElementById('discount-type-btn').textContent = '%';

        addLineItem();
        updatePreview();
    }
}

// Form Listeners
function initFormListeners() {
    const fields = [
        { id: 'business-name', key: 'businessName' },
        { id: 'business-email', key: 'businessEmail' },
        { id: 'business-address', key: 'businessAddress' },
        { id: 'client-name', key: 'clientName' },
        { id: 'client-email', key: 'clientEmail' },
        { id: 'client-address', key: 'clientAddress' },
        { id: 'ship-to', key: 'shipTo' },
        { id: 'invoice-number', key: 'invoiceNumber' },
        { id: 'invoice-date', key: 'invoiceDate' },
        { id: 'due-date', key: 'dueDate' },
        { id: 'payment-terms', key: 'paymentTerms' },
        { id: 'po-number', key: 'poNumber' },
        { id: 'tax-rate', key: 'taxRate' },
        { id: 'discount', key: 'discount' },
        { id: 'shipping', key: 'shipping' },
        { id: 'amount-paid', key: 'amountPaid' },
        { id: 'notes', key: 'notes' },
        { id: 'terms', key: 'terms' }
    ];

    fields.forEach(({ id, key }) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', (e) => {
                const numericFields = ['taxRate', 'discount', 'shipping', 'amountPaid'];
                state[key] = numericFields.includes(key) ? (parseFloat(e.target.value) || 0) : e.target.value;
                if (numericFields.includes(key)) updateCalculations();
                updatePreview();
                saveToStorage();
            });
        }
    });

    // Currency selector
    const currencySelect = document.getElementById('currency-select');
    if (currencySelect) {
        currencySelect.addEventListener('change', (e) => {
            state.currency = e.target.value;
            // Update discount type button if flat
            if (state.discountType === 'flat') {
                document.getElementById('discount-type-btn').textContent = currencies[state.currency]?.symbol || '$';
            }
            updateCalculations();
            updatePreview();
            saveToStorage();
        });
    }
}

// Logo Upload
function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please upload an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { alert('File size should be less than 2MB'); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
        state.companyLogo = e.target.result;
        updateLogoPreview(state.companyLogo);
        updatePreview();
        saveToStorage();
    };
    reader.readAsDataURL(file);
}

function updateLogoPreview(logoData) {
    const img = document.getElementById('logo-preview-img');
    const placeholder = document.getElementById('logo-placeholder');
    const removeBtn = document.getElementById('remove-logo-btn');
    if (logoData) {
        img.src = logoData;
        img.style.display = 'block';
        placeholder.style.display = 'none';
        removeBtn.style.display = 'inline-flex';
    } else {
        img.src = '';
        img.style.display = 'none';
        placeholder.style.display = 'flex';
        removeBtn.style.display = 'none';
    }
}

function removeLogo() {
    state.companyLogo = '';
    updateLogoPreview(null);
    document.getElementById('logo-upload').value = '';
    updatePreview();
    saveToStorage();
}

// Init
function init() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('invoice-date');
    if (dateInput && !dateInput.value) {
        dateInput.value = today;
        state.invoiceDate = today;
    }

    const due = new Date();
    due.setDate(due.getDate() + 30);
    const dueInput = document.getElementById('due-date');
    if (dueInput && !dueInput.value) {
        dueInput.value = due.toISOString().split('T')[0];
        state.dueDate = dueInput.value;
    }

    const numInput = document.getElementById('invoice-number');
    if (numInput && !numInput.value) {
        numInput.value = '1';
        state.invoiceNumber = '1';
    }

    initFormListeners();
}

document.addEventListener('DOMContentLoaded', init);
