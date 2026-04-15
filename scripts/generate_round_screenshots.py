import json
import os
import shutil
import subprocess
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path("/Users/mgccvmacair/Myproject/Academic/ResearchProject")
PROJECTS_DIR = ROOT / "backend" / "projects"
SCREENSHOTS_DIR = ROOT / "screenshots"

CONV_W = 880
CONV_H = 1000
PDF_W = 1785
PDF_H = 2526
PDF_MARGIN = 48

COLORS = {
    "bg": "#f8fafc",
    "panel": "#ffffff",
    "border": "#e2e8f0",
    "title": "#1e293b",
    "primary": "#2563eb",
    "muted": "#64748b",
    "header_bg": "#f1f5f9",
    "student_bg": "#dbeafe",
    "advisor_bg": "#eef2ff",
    "file_bg": "#f8fafc",
    "text": "#1e293b",
    "light_text": "#ffffff",
    "bubble_border": "#cbd5e1",
}


def load_font(size, bold=False):
    candidates = []
    if bold:
        candidates = [
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/System/Library/Fonts/Supplemental/Helvetica.ttc",
        ]
    else:
        candidates = [
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/System/Library/Fonts/Supplemental/Helvetica.ttc",
        ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size=size)
            except Exception:
                continue
    return ImageFont.load_default()


FONT_TITLE = load_font(24, bold=True)
FONT_SUBTITLE = load_font(16, bold=False)
FONT_PANEL = load_font(18, bold=True)
FONT_BODY = load_font(18, bold=False)
FONT_BODY_BOLD = load_font(18, bold=True)
FONT_SMALL = load_font(14, bold=False)
FONT_FOOTER = load_font(16, bold=False)
FONT_FOOTER_BOLD = load_font(16, bold=True)


def draw_rounded_box(draw, box, fill, outline=None, radius=18, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def wrap_text(draw, text, font, max_width):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if draw.textlength(candidate, font=font) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [""]


def extract_round_pdf(record_list):
    for record in record_list:
        if record.get("type") == "file" and str(record.get("content", "")).endswith(".pdf"):
            return Path(record["content"])
    raise ValueError("No pdf file found in round records")


def export_pdf_preview(pdf_path, out_path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        subprocess.run(
            ["sips", "-s", "format", "png", "-Z", "2200", str(pdf_path), "--out", str(out_path)],
            check=True,
            capture_output=True,
            text=True,
        )
        return True
    except subprocess.CalledProcessError as exc:
        print(f"Failed to render PDF {pdf_path}: {exc.stderr}")
        return False


def fit_image(img, target_w, target_h, bg="white"):
    fitted = Image.new("RGB", (target_w, target_h), bg)
    source = img.copy()
    source.thumbnail((target_w, target_h))
    x = (target_w - source.width) // 2
    y = (target_h - source.height) // 2
    fitted.paste(source, (x, y))
    return fitted


def normalize_pdf_background(pdf_img_path):
    raw = Image.open(pdf_img_path).convert("RGBA")
    alpha = raw.getchannel("A")
    bbox = alpha.getbbox()

    if bbox:
        # Crop to the actual rendered page bounds to remove transparent border.
        raw = raw.crop(bbox)

    # Composite transparency onto a white page so transparent regions do not turn black.
    white_page = Image.new("RGBA", raw.size, (255, 255, 255, 255))
    page = Image.alpha_composite(white_page, raw).convert("RGB")

    # Output a higher-resolution single-page screenshot with a small white page margin.
    canvas = Image.new("RGB", (PDF_W, PDF_H), "white")
    target_w = PDF_W - PDF_MARGIN * 2
    target_h = PDF_H - PDF_MARGIN * 2
    page.thumbnail((target_w, target_h), Image.Resampling.LANCZOS)
    x = (PDF_W - page.width) // 2
    y = (PDF_H - page.height) // 2
    canvas.paste(page, (x, y))
    canvas.save(pdf_img_path)


def render_conversation(project_name, round_idx, participants, records, output_path):
    img = Image.new("RGB", (CONV_W, CONV_H), COLORS["bg"])
    draw = ImageDraw.Draw(img)

    header_h = 76
    draw.rectangle((0, 0, CONV_W, CONV_H), fill=COLORS["bg"])
    draw.rectangle((0, 0, CONV_W, header_h), fill=COLORS["panel"])
    draw.line((0, header_h, CONV_W, header_h), fill=COLORS["border"], width=2)
    draw.text((24, 22), "Conversation", fill=COLORS["text"], font=FONT_PANEL)
    draw.text((170, 22), project_name, fill=COLORS["muted"], font=FONT_SUBTITLE)

    badge_w = 132
    badge_h = 32
    badge_x = CONV_W - badge_w - 24
    badge_y = 22
    draw_rounded_box(draw, (badge_x, badge_y, badge_x + badge_w, badge_y + badge_h), fill="#e0edff", outline="#bfdbfe", radius=16)
    draw.text((badge_x + 18, badge_y + 7), f"Round {round_idx:02d}", fill=COLORS["primary"], font=FONT_SMALL)

    conv_left = 22
    conv_right = CONV_W - 22
    y = header_h + 18
    bubble_max_w = CONV_W - 150

    for record in records:
        sender = record.get("sender")
        rtype = record.get("type")
        if rtype == "message":
            if sender == "B":
                label = participants["B"]
                align_right = True
                fill = COLORS["student_bg"]
            else:
                label = participants["A"]
                align_right = False
                fill = COLORS["advisor_bg"]

            text = record.get("content", "")
            lines = wrap_text(draw, text, FONT_BODY, bubble_max_w - 40)
            line_h = 26
            bubble_h = 20 + 24 + len(lines) * line_h + 16
            bubble_w = min(
                bubble_max_w,
                max(int(max(draw.textlength(line, font=FONT_BODY) for line in lines)) + 40, 280),
            )
            if align_right:
                x1 = conv_right - bubble_w
            else:
                x1 = conv_left
            x2 = x1 + bubble_w
            y2 = y + bubble_h
            draw_rounded_box(draw, (x1, y, x2, y2), fill=fill, outline=COLORS["bubble_border"], radius=18)
            draw.text((x1 + 18, y + 14), label, fill=COLORS["text"], font=FONT_BODY_BOLD)
            text_y = y + 42
            for line in lines:
                draw.text((x1 + 18, text_y), line, fill=COLORS["text"], font=FONT_BODY)
                text_y += line_h
            y = y2 + 18
        else:
            file_name = Path(record.get("content", "")).name
            box_w = 300
            box_h = 68
            x1 = conv_left + 30
            x2 = x1 + box_w
            y2 = y + box_h
            draw_rounded_box(draw, (x1, y, x2, y2), fill=COLORS["file_bg"], outline=COLORS["border"], radius=14)
            draw.text((x1 + 18, y + 12), "PDF attachment", fill=COLORS["muted"], font=FONT_SMALL)
            draw.text((x1 + 18, y + 34), file_name, fill=COLORS["primary"], font=FONT_BODY_BOLD)
            y = y2 + 18

    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path)


def main():
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

    for project_path in sorted(PROJECTS_DIR.glob("project*")):
        messages_path = project_path / "messages.json"
        if not messages_path.exists():
            continue

        with open(messages_path, "r", encoding="utf-8") as handle:
            conversations = json.load(handle)

        for round_idx, conversation in enumerate(conversations, start=1):
            round_dir = SCREENSHOTS_DIR / f"{project_path.name}_round{round_idx:02d}"
            if round_dir.exists():
                shutil.rmtree(round_dir)
            round_dir.mkdir(parents=True, exist_ok=True)

            pdf_path = extract_round_pdf(conversation["records"])
            pdf_img_path = round_dir / "pdf.png"
            export_pdf_preview(pdf_path, pdf_img_path)
            if pdf_img_path.exists():
                normalize_pdf_background(pdf_img_path)

            conversation_img_path = round_dir / "conversation.png"
            render_conversation(
                project_name=conversation["project"],
                round_idx=round_idx,
                participants=conversation["participants"],
                records=conversation["records"],
                output_path=conversation_img_path,
            )
            print(f"Generated {round_dir}")


if __name__ == "__main__":
    main()
