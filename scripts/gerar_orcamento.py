# -*- coding: utf-8 -*-
"""Gera o PDF do orçamento comercial do Fecon Match."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import Color, white, black
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER

OUT = r"c:\Users\Gabriel\Desktop\Fecon namoro\Orcamento-Fecon-Match.pdf"

pdfmetrics.registerFont(TTFont("Arial", r"C:\Windows\Fonts\arial.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Bold", r"C:\Windows\Fonts\arialbd.ttf"))

INK = Color(0x1C / 255, 0x19 / 255, 0x17 / 255)
CORAL = Color(0xC8 / 255, 0x1E / 255, 0x4A / 255)
PAPER = Color(0xF3 / 255, 0xEF / 255, 0xE8 / 255)
LINE = Color(0xE6 / 255, 0xE0 / 255, 0xD6 / 255)
SAND = Color(0x5E / 255, 0x58 / 255, 0x52 / 255)
ROW = Color(0xFB / 255, 0xF8 / 255, 0xF4 / 255)


def brl(value: float) -> str:
    whole, cents = f"{value:.2f}".split(".")
    groups = []
    while whole:
        groups.append(whole[-3:])
        whole = whole[:-3]
    return "R$ " + ".".join(reversed(groups)) + "," + cents


ITEMS = [
    (
        "Desenvolvimento",
        [
            (
                "Desenvolvimento",
                "Desenvolvimento do Fecon Match.",
                1200.00,
            ),
        ],
    ),
    (
        "Domínio e hospedagem",
        [
            ("Domínio", "Registro do endereço do site.", 41.00),
            ("Hospedagem — 3 anos", "Pacote de hospedagem pelo período de 3 anos.", 723.24),
        ],
    ),
    (
        "Divulgação e identidade",
        [
            ("Google Ads", "Verba de tráfego pago. Repasse de mídia, sem taxa de agência neste item.", 1500.00),
            ("Meta Ads", "Verba de tráfego pago no Instagram e no Facebook. Repasse de mídia.", 800.00),
            ("Identidade visual", "Criação da identidade visual da marca.", 800.00),
            ("Postagens", "Criação de postagem para rede social.", 600.00),
        ],
    ),
]

FLAT = [(group, name, detail, value) for group, rows in ITEMS for name, detail, value in rows]
TOTAL = sum(value for *_, value in FLAT)
DEV = sum(value for group, _, _, value in FLAT if group == "Desenvolvimento")
HOST = sum(value for group, _, _, value in FLAT if group == "Domínio e hospedagem")
MEDIA = sum(value for group, _, _, value in FLAT if group == "Divulgação e identidade")
P1 = round(TOTAL / 2, 2)
P2 = round(TOTAL - P1, 2)


def styles():
    return {
        "kicker": ParagraphStyle(
            "kicker",
            fontName="Arial-Bold",
            fontSize=8,
            leading=10,
            textColor=CORAL,
            tracking=0.6,
        ),
        "h1": ParagraphStyle(
            "h1",
            fontName="Arial-Bold",
            fontSize=22,
            leading=26,
            textColor=INK,
        ),
        "lede": ParagraphStyle(
            "lede",
            fontName="Arial",
            fontSize=9.5,
            leading=13,
            textColor=SAND,
        ),
        "group": ParagraphStyle(
            "group",
            fontName="Arial-Bold",
            fontSize=8,
            leading=10,
            textColor=CORAL,
        ),
        "item": ParagraphStyle(
            "item",
            fontName="Arial-Bold",
            fontSize=9,
            leading=12,
            textColor=INK,
        ),
        "detail": ParagraphStyle(
            "detail",
            fontName="Arial",
            fontSize=8,
            leading=10.5,
            textColor=SAND,
        ),
        "money": ParagraphStyle(
            "money",
            fontName="Arial-Bold",
            fontSize=9,
            leading=12,
            textColor=INK,
            alignment=TA_RIGHT,
        ),
        "th": ParagraphStyle(
            "th",
            fontName="Arial-Bold",
            fontSize=8,
            leading=10,
            textColor=white,
        ),
        "thR": ParagraphStyle(
            "thR",
            fontName="Arial-Bold",
            fontSize=8,
            leading=10,
            textColor=white,
            alignment=TA_RIGHT,
        ),
        "sumL": ParagraphStyle(
            "sumL",
            fontName="Arial",
            fontSize=9,
            leading=12,
            textColor=INK,
        ),
        "sumR": ParagraphStyle(
            "sumR",
            fontName="Arial-Bold",
            fontSize=9,
            leading=12,
            textColor=INK,
            alignment=TA_RIGHT,
        ),
        "totalL": ParagraphStyle(
            "totalL",
            fontName="Arial-Bold",
            fontSize=11,
            leading=14,
            textColor=white,
        ),
        "totalR": ParagraphStyle(
            "totalR",
            fontName="Arial-Bold",
            fontSize=12,
            leading=15,
            textColor=white,
            alignment=TA_RIGHT,
        ),
        "h2": ParagraphStyle(
            "h2",
            fontName="Arial-Bold",
            fontSize=12,
            leading=16,
            textColor=INK,
        ),
        "body": ParagraphStyle(
            "body",
            fontName="Arial",
            fontSize=9,
            leading=12.5,
            textColor=INK,
        ),
        "small": ParagraphStyle(
            "small",
            fontName="Arial",
            fontSize=8,
            leading=11,
            textColor=SAND,
        ),
        "foot": ParagraphStyle(
            "foot",
            fontName="Arial",
            fontSize=8,
            leading=10,
            textColor=SAND,
            alignment=TA_CENTER,
        ),
    }


S = styles()


def header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(CORAL)
    canvas.rect(0, h - 8 * mm, w, 8 * mm, fill=1, stroke=0)
    canvas.setFillColor(INK)
    canvas.rect(0, 0, w, 12 * mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Arial", 8)
    canvas.drawString(18 * mm, 5 * mm, "Fecon Match  ·  Orçamento comercial  ·  14 de outubro de 2026")
    canvas.drawRightString(w - 18 * mm, 5 * mm, f"{doc.page}")
    canvas.restoreState()


def item_table():
    header = [
        Paragraph("Item", S["th"]),
        Paragraph("Descrição", S["th"]),
        Paragraph("Valor", S["thR"]),
    ]
    data = [header]
    spans = []
    row = 1
    for group, rows in ITEMS:
        data.append([Paragraph(group.upper(), S["group"]), "", ""])
        spans.append(("SPAN", (0, row), (-1, row)))
        row += 1
        for name, detail, value in rows:
            data.append(
                [
                    Paragraph(name, S["item"]),
                    Paragraph(detail, S["detail"]),
                    Paragraph(brl(value), S["money"]),
                ]
            )
            row += 1

    col = [42 * mm, 98 * mm, 32 * mm]
    table = Table(data, colWidths=col, repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Arial-Bold"),
        ("BACKGROUND", (0, 1), (-1, 1), PAPER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, 0), 7),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 7),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ("LINEBELOW", (0, 1), (-1, -2), 0.3, LINE),
        ("ALIGN", (2, 1), (2, -1), "RIGHT"),
    ]
    # zebra only on item rows, not group rows
    item_index = 0
    for i in range(1, len(data)):
        if data[i][1] == "":
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), PAPER))
            style_cmds.append(("TOPPADDING", (0, i), (-1, i), 8))
            style_cmds.append(("BOTTOMPADDING", (0, i), (-1, i), 3))
            item_index = 0
        else:
            if item_index % 2 == 1:
                style_cmds.append(("BACKGROUND", (0, i), (-1, i), ROW))
            item_index += 1
    for span in spans:
        style_cmds.append(span)
    table.setStyle(TableStyle(style_cmds))
    return table


def totals_table():
    rows = [
        [Paragraph("Desenvolvimento", S["sumL"]), Paragraph(brl(DEV), S["sumR"])],
        [Paragraph("Domínio e hospedagem", S["sumL"]), Paragraph(brl(HOST), S["sumR"])],
        [Paragraph("Divulgação e identidade visual", S["sumL"]), Paragraph(brl(MEDIA), S["sumR"])],
        [Paragraph("Total do orçamento", S["totalL"]), Paragraph(brl(TOTAL), S["totalR"])],
    ]
    table = Table(rows, colWidths=[140 * mm, 32 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 2), white),
                ("BACKGROUND", (0, 3), (-1, 3), CORAL),
                ("LINEBELOW", (0, 0), (-1, 1), 0.3, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, 2), 5),
                ("BOTTOMPADDING", (0, 0), (-1, 2), 5),
                ("TOPPADDING", (0, 3), (-1, 3), 8),
                ("BOTTOMPADDING", (0, 3), (-1, 3), 8),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BOX", (0, 0), (-1, -1), 0.4, LINE),
            ]
        )
    )
    return table


def build():
    doc = SimpleDocTemplate(
        OUT,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=18 * mm,
        title="Orçamento Fecon Match",
        author="Fecon Match",
    )
    story = [
        Paragraph("PROPOSTA COMERCIAL", S["kicker"]),
        Spacer(1, 2 * mm),
        Paragraph("Orçamento Fecon Match", S["h1"]),
        Spacer(1, 2 * mm),
        Paragraph(
            "Desenvolvimento, domínio, hospedagem de 3 anos, tráfego pago e identidade visual. "
            "Valores em reais. Proposta de 14 de outubro de 2026, válida até 13 de novembro de 2026.",
            S["lede"],
        ),
        Spacer(1, 5 * mm),
        item_table(),
        Spacer(1, 5 * mm),
        totals_table(),
        Spacer(1, 7 * mm),
        Paragraph("Condições", S["h2"]),
        Spacer(1, 2 * mm),
        Paragraph(
            f"1. Pagamento em duas partes: {brl(P1)} na aprovação (50%) e {brl(P2)} na entrega (50%).",
            S["body"],
        ),
        Spacer(1, 1.5 * mm),
        Paragraph(
            "2. Domínio (R$ 41,00), hospedagem de 3 anos (R$ 723,24), Google Ads (R$ 1.500,00) e Meta Ads (R$ 800,00) "
            "entram neste total nos valores informados. A verba de anúncio é repasse de mídia.",
            S["body"],
        ),
        Spacer(1, 1.5 * mm),
        Paragraph(
            "3. Identidade visual (R$ 800,00) e postagem em rede social (R$ 600,00) cobrem a criação dessas peças. Gestão mensal de rede não está inclusa.",
            S["body"],
        ),
        Spacer(1, 1.5 * mm),
        Paragraph(
            "4. Mudança de escopo é orçada à parte.",
            S["body"],
        ),
        Spacer(1, 8 * mm),
        HRFlowable(width="100%", thickness=0.4, color=LINE, spaceBefore=0, spaceAfter=4 * mm),
        Paragraph("Fecon Match  ·  Proposta para apresentação ao cliente  ·  Total " + brl(TOTAL), S["small"]),
    ]
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(f"TOTAL {TOTAL:.2f}")
    print(f"DEV {DEV:.2f} HOST {HOST:.2f} MEDIA {MEDIA:.2f}")
    print(f"P1 {P1:.2f} P2 {P2:.2f}")
    print(OUT)


if __name__ == "__main__":
    build()
