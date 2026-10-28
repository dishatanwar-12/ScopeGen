import io
import re
from datetime import datetime, timezone
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.pdfgen import canvas
from typing import List, Dict, Any

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to draw 'Page X of Y' and header/footer on each page."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages 2+)
        if self._pageNumber > 1:
            self.drawString(54, 750, "ProposalCraft AI — Statement of Work & Proposal")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)
        
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_str)
        self.drawString(54, 32, "Confidential — Prepared for Client Review Only")
        self.restoreState()

def generate_proposal_pdf(
    proposal_title: str,
    client_name: str,
    project_title: str,
    status: str,
    sections: List[Dict[str, Any]],
    branding: Dict[str, Any] = None
) -> bytes:
    """Generates a polished PDF buffer using ReportLab."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom typography palette
    primary_color = colors.HexColor("#0F2438")  # Deep Navy
    accent_color = colors.HexColor("#2B6695")   # Muted Blue
    slate_dark = colors.HexColor("#1E293B")
    slate_light = colors.HexColor("#475569")
    bg_light = colors.HexColor("#F8FAFC")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=primary_color,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=slate_light,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'SecHeading1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=accent_color,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SecHeading2',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=primary_color,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=slate_dark,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletItem',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=3
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=body_style,
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E40AF")
    )

    story = []

    # Document Header / Banner
    story.append(Paragraph(proposal_title, title_style))
    story.append(Paragraph(f"<b>Prepared for:</b> {client_name} &nbsp;|&nbsp; <b>Project:</b> {project_title} &nbsp;|&nbsp; <b>Date:</b> {datetime.now(timezone.utc).strftime('%B %d, %Y')}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=accent_color, spaceAfter=15, spaceBefore=0))

    # Proposal Metadata Block
    meta_table_data = [
        [
            Paragraph("<b>Document Status:</b>", body_style),
            Paragraph(status.upper(), body_style),
            Paragraph("<b>Classification:</b>", body_style),
            Paragraph("COMMERCIAL CONFIDENTIAL", body_style),
        ]
    ]
    t_meta = Table(meta_table_data, colWidths=[110, 140, 110, 140])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg_light),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 15))

    # Parse and render each section
    for sec in sorted(sections, key=lambda s: s.get('sort_order', 0)):
        sec_title = sec.get('title', 'Section')
        content_md = sec.get('content_markdown', '')
        
        story.append(Paragraph(sec_title, h1_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0"), spaceAfter=8, spaceBefore=2))

        lines = content_md.split('\n')
        in_table = False
        table_rows = []

        for line in lines:
            trimmed = line.strip()
            if not trimmed:
                if in_table and table_rows:
                    # Flush table
                    story.append(build_reportlab_table(table_rows, body_style))
                    table_rows = []
                    in_table = False
                story.append(Spacer(1, 4))
                continue

            # Detect Markdown Table Row
            if trimmed.startswith('|') and trimmed.endswith('|'):
                # Ignore separator lines like | :--- | :--- |
                if re.match(r'^\|[\s\-:]+\|\s*$', trimmed):
                    continue
                in_table = True
                cells = [c.strip() for c in trimmed[1:-1].split('|')]
                table_rows.append(cells)
                continue
            else:
                if in_table and table_rows:
                    story.append(build_reportlab_table(table_rows, body_style))
                    table_rows = []
                    in_table = False

            # Markdown Headings
            if trimmed.startswith('### '):
                story.append(Paragraph(trimmed[4:], h2_style))
            elif trimmed.startswith('#### '):
                story.append(Paragraph(f"<b>{trimmed[5:]}</b>", body_style))
            elif trimmed.startswith('- ') or trimmed.startswith('* '):
                # Clean bold markers
                cleaned = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', trimmed[2:])
                story.append(Paragraph(f"&bull;&nbsp; {cleaned}", bullet_style))
            elif trimmed.startswith('> '):
                callout_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', trimmed[2:])
                story.append(Paragraph(f"<i>{callout_text}</i>", callout_style))
            else:
                cleaned = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', trimmed)
                story.append(Paragraph(cleaned, body_style))

        if in_table and table_rows:
            story.append(build_reportlab_table(table_rows, body_style))
            table_rows = []

        story.append(Spacer(1, 10))

    # Build the PDF using NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer.getvalue()

def build_reportlab_table(rows: List[List[str]], text_style: ParagraphStyle) -> Table:
    """Helper to convert Markdown table cells into a clean ReportLab Table."""
    if not rows:
        return Spacer(1, 1)

    formatted_data = []
    num_cols = max(len(r) for r in rows)
    col_width = 504 / max(1, num_cols)

    for i, row in enumerate(rows):
        formatted_row = []
        for cell in row:
            if i == 0:
                p = Paragraph(f"<b>{cell}</b>", text_style)
            else:
                p = Paragraph(cell, text_style)
            formatted_row.append(p)
        while len(formatted_row) < num_cols:
            formatted_row.append(Paragraph("", text_style))
        formatted_data.append(formatted_row)

    t = Table(formatted_data, colWidths=[col_width] * num_cols)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#0F2438")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    return t
