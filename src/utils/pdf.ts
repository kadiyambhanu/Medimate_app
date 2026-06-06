import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportSummary {
  period: string;
  adherenceRate: number;
  taken: number;
  missed: number;
  total: number;
  generatedAt: string;
}

interface MedicineStat {
  medicineName: string;
  total: number;
  taken: number;
  missed: number;
  adherence: number;
}

export function generateAdherencePDF(summary: ReportSummary, medicineStats: MedicineStat[]) {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text("MediMate - Medicine Adherence Report", 14, 22);
  doc.setFontSize(12);
  doc.text(`Period: ${summary.period}`, 14, 32);
  doc.text(`Generated: ${new Date(summary.generatedAt).toLocaleString()}`, 14, 40);
  doc.text(`Adherence Rate: ${summary.adherenceRate}%`, 14, 48);
  doc.text(`Taken: ${summary.taken} | Missed: ${summary.missed} | Total: ${summary.total}`, 14, 56);

  autoTable(doc, {
    startY: 64,
    head: [["Medicine", "Total", "Taken", "Missed", "Adherence %"]],
    body: medicineStats.map((m) => [
      m.medicineName,
      m.total,
      m.taken,
      m.missed,
      `${m.adherence}%`,
    ]),
  });

  return doc;
}
