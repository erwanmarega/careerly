import type { Application } from './applications'
import { STATUS_LABELS } from './applications'

export async function exportApplicationsPdf(applications: Application[]) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const pageW = doc.internal.pageSize.getWidth()
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  doc.setFillColor(109, 40, 217)
  doc.rect(0, 0, pageW, 22, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Careerly', 14, 13)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Mes candidatures — exporté le ${today}`, pageW - 14, 13, { align: 'right' })

  doc.setTextColor(80, 80, 80)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`${applications.length} candidature${applications.length > 1 ? 's' : ''}`, 14, 32)

  autoTable(doc, {
    startY: 37,
    head: [['Entreprise', 'Poste', 'Statut', 'Lieu', 'Date de candidature', 'Notes']],
    body: applications.map((a) => [
      a.company,
      a.position,
      STATUS_LABELS[a.status] ?? a.status,
      a.location ?? '—',
      new Date(a.appliedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
      a.notes ?? '',
    ]),
    headStyles: {
      fillColor: [109, 40, 217],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [40, 40, 40],
    },
    alternateRowStyles: {
      fillColor: [248, 245, 255],
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 55 },
      2: { cellWidth: 28 },
      3: { cellWidth: 35 },
      4: { cellWidth: 38 },
      5: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(160, 160, 160)
      doc.text(
        `Page ${data.pageNumber} / ${pageCount}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' },
      )
    },
  })

  const dateStr = new Date().toISOString().slice(0, 10)
  doc.save(`candidatures-${dateStr}.pdf`)
}
