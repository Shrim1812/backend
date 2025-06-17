import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import PdfPrinter from "pdfmake";
import { poolPromise } from "../db.js";

// __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Fonts path
const fonts = {
  Roboto: {
    normal: path.join(__dirname, "..", "fonts", "Roboto-Regular.ttf"),
    bold: path.join(__dirname, "..", "fonts", "Roboto-Medium.ttf"),
    italics: path.join(__dirname, "..", "fonts", "Roboto-Italic.ttf"),
    bolditalics: path.join(__dirname, "..", "fonts", "Roboto-MediumItalic.ttf"),
  },
};

const printer = new PdfPrinter(fonts);

export const ReceipPDF = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        yps.ReceiptNumber,
        yps.ReceiptDate,
        m.CompanyName,
        m.MemberName,
        yps.AmountPaid AS ReceivedAmount,
        yps.ChequeNumber,
        yps.PaymentYear,
        yps.PaymentType
      FROM 
        YearlyPaymentSummary yps
      JOIN 
        Members m ON yps.MembershipID = m.MembershipID
      ORDER BY yps.ReceiptDate DESC
    `);

    const data = result.recordset;

    const tableBody = [
      [
        "Receipt No.",
        "Date",
        "Company",
        "Member",
        "Received ₹",
        "Cheque No",
        "Year",
        "Type",
      ],
    ];

    data.forEach((row) => {
      tableBody.push([
        row.ReceiptNumber || "-",
        row.ReceiptDate ? new Date(row.ReceiptDate).toLocaleDateString() : "-",
        row.CompanyName || "-",
        row.MemberName || "-",
        row.ReceivedAmount ?? "-",
        row.ChequeNumber || "-",
        row.PaymentYear ?? "-",
        row.PaymentType || "-",
      ]);
    });

    const docDefinition = {
      content: [
        { text: "Yearly Payment Summary Report", style: "header" },
        {
          table: {
            headerRows: 1,
            widths: ["auto", "auto", "*", "*", "auto", "auto", "auto", "auto"],
            body: tableBody,
          },
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
      },
      pageOrientation: "landscape",
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=payment-report.pdf");
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).send("Error generating report");
  }
};
