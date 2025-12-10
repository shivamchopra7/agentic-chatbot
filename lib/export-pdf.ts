"use client";

import { jsPDF } from "jspdf";

interface MessagePart {
  type: string;
  text?: string;
}

interface ExportMessage {
  role: string;
  parts: MessagePart[];
  createdAt?: Date;
}

interface ExportData {
  title: string;
  messages: ExportMessage[];
}

/**
 * Generate a PDF from chat messages
 */
export function generateChatPDF(data: ExportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.title, margin, yPosition);
  yPosition += 10;

  // Export date
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(128, 128, 128);
  doc.text(`Exported: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += 15;

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Messages
  for (const message of data.messages) {
    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    // Role header
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const roleLabel = message.role === "user" ? "You" : "Assistant";
    doc.setTextColor(message.role === "user" ? 0 : 59, message.role === "user" ? 102 : 130, message.role === "user" ? 204 : 246);
    doc.text(roleLabel, margin, yPosition);
    yPosition += 6;

    // Message content
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    const textParts = message.parts
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text || "");

    for (const text of textParts) {
      // Split text into lines that fit the page width
      const lines = doc.splitTextToSize(text, maxWidth);

      for (const line of lines) {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      }
      yPosition += 3;
    }

    // Separator
    yPosition += 5;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
  }

  // Save the PDF
  const filename = `${data.title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
  doc.save(filename);
}

