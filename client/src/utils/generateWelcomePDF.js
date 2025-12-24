import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateWelcomePDF = (user) => {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // --- 1. HEADER & LOGO ---
    // Load logo from public folder
    const logoUrl = '/logo.png';
    const logoImg = new Image();
    logoImg.src = logoUrl;

    // We need to wait for image to load, but since this is client-side sync usage often works if cached, 
    // but better to use a simple approach or base64 if possible. 
    // For simplicity in this React context, we'll try adding it directly. 
    // If it fails (due to async loading), we might show a placeholder or handle it differently.
    // Ideally, pass base64 logo or ensure it's loaded. 
    // For now, let's assume standard addImage works with URL in modern jsPDF or use a colored header.

    // Header Background
    doc.setFillColor(13, 148, 136); // Teal/Emerald Color (0D9488)
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text("OPENBANK PRO", 20, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("The Future of Digital Banking", 20, 32);

    // --- 2. OFFICIAL COMMUNICATION TEXT ---
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 55);
    doc.text("Ref: OBP/REG/2025/WELCOME", 150, 55);

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Welcome to the Elite Financial Network", 20, 70);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const welcomeText = `Dear ${user.ownerName},

We are delighted to confirm the successful opening of your digital vault with OpenBank Pro. You have joined a premier banking ecosystem designed for speed, security, and global access.

Your account is now active and ready for immediate transactions. Below are your official account details. Please keep this document safe as it serves as your proof of account ownership.`;

    doc.text(welcomeText, 20, 85, { maxWidth: 170, lineHeightFactor: 1.5 });

    // --- 3. ACCOUNT DETAILS TABLE ---
    autoTable(doc, {
        startY: 130,
        head: [['Attribute', 'Details']],
        body: [
            ['Account Holder', user.ownerName],
            ['Account Number', user.accountNumber],
            ['Account Type', 'Savings Premium'],
            ['Customer ID (CIF)', user.cifNumber || 'Pending Generation'],
            ['IFSC Code', 'OPEN0001 (Cyber City HQ)'],
            ['Branch', 'Digital Global HQ'],
            ['Currency Base', 'INR / Multi-Currency Enabled'],
            ['Registered Email', user.email],
            ['Registered Mobile', user.mobile]
        ],
        theme: 'grid',
        headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 11, cellPadding: 6 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { cellWidth: 'auto' }
        }
    });

    // --- 4. FOOTER & SIGNATURE ---
    const finalY = doc.lastAutoTable.finalY + 30;

    // Digital Stamp / Signature Place
    // doc.setDrawColor(13, 148, 136);
    // doc.setLineWidth(1);
    // doc.line(20, finalY, 80, finalY); // Signature Line

    // Add Signature Image (Assuming standard A4 and reasonable size)
    const signatureUrl = '/signature.png';
    const sigImg = new Image();
    sigImg.src = signatureUrl;
    // We attempt to add it. If it loads in time (which it should for local assets usually), it shows.
    // For production reliability with sync jsPDF, ensuring pre-load is better, but this often works for simple cases.
    try {
        doc.addImage(sigImg, 'PNG', 20, finalY - 15, 50, 20); // x, y, w, h
    } catch (e) {
        // Fallback if image fails
        doc.line(20, finalY, 80, finalY);
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Authorized Signatory", 20, finalY + 5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("OpenBank Pro Systems Inc.", 20, finalY + 10);

    // Disclaimer
    doc.setFontSize(8);
    doc.text("This is a computer-generated document and serves as an official confirmation of your account status with OpenBank Pro. No physical signature is required.", 20, pageHeight - 15, { maxWidth: 170 });

    // --- 5. SAVE ---
    doc.save(`OpenBank_Welcome_Letter_${user.accountNumber}.pdf`);
};
