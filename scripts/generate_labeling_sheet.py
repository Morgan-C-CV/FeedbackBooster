#!/usr/bin/env python3

from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path


LIB_DIR = Path("/private/tmp/codexlibs")
if LIB_DIR.exists():
    sys.path.insert(0, str(LIB_DIR))

import xlsxwriter  # type: ignore
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS_DIR = ROOT / "screenshots"
OUTPUT_PATH = ROOT / "google_sheets_labeling_template.xlsx"

ROUND_PATTERN = re.compile(r"^(project\d+)_round(\d+)$", re.IGNORECASE)
LABEL_OPTIONS = ["Task-Level", "Process-Level"]


@dataclass(frozen=True)
class RoundEntry:
    project_id: str
    round_id: str
    conversation_path: Path
    pdf_path: Path


def collect_rounds(base_dir: Path) -> list[RoundEntry]:
    entries: list[RoundEntry] = []
    for folder in sorted(base_dir.iterdir()):
        if not folder.is_dir():
            continue

        match = ROUND_PATTERN.match(folder.name)
        if not match:
            continue

        conversation_path = folder / "conversation.png"
        pdf_path = folder / "pdf.png"
        if not conversation_path.exists() or not pdf_path.exists():
            continue

        project_id = match.group(1)
        round_id = f"round{int(match.group(2)):02d}"
        entries.append(
            RoundEntry(
                project_id=project_id.capitalize(),
                round_id=round_id,
                conversation_path=conversation_path,
                pdf_path=pdf_path,
            )
        )
    return entries


def image_scale(image_path: Path, target_width: int, target_height: int) -> tuple[float, float]:
    with Image.open(image_path) as image:
        width, height = image.size

    scale = min(target_width / width, target_height / height, 1.0)
    return scale, scale


def build_workbook(entries: list[RoundEntry], output_path: Path) -> None:
    workbook = xlsxwriter.Workbook(str(output_path))
    sheet = workbook.add_worksheet("Labeling")
    options_sheet = workbook.add_worksheet("Options")
    options_sheet.hide()

    header_format = workbook.add_format(
        {
            "bold": True,
            "bg_color": "#D9EAF7",
            "border": 1,
            "align": "center",
            "valign": "vcenter",
            "text_wrap": True,
        }
    )
    cell_format = workbook.add_format(
        {
            "border": 1,
            "align": "center",
            "valign": "vcenter",
        }
    )

    headers = ["Project", "Round", "Conversation Screenshot", "File Screenshot", "Round Label"]
    for col, header in enumerate(headers):
        sheet.write(0, col, header, header_format)

    sheet.freeze_panes(1, 0)
    sheet.set_row_pixels(0, 28)
    sheet.set_column("A:A", 14)
    sheet.set_column("B:B", 12)
    sheet.set_column("C:C", 26)
    sheet.set_column("D:D", 22)
    sheet.set_column("E:E", 18)

    for row, option in enumerate(LABEL_OPTIONS):
        options_sheet.write(row, 0, option)

    validation_source = "=Options!$A$1:$A$2"

    conversation_target = (180, 180)
    pdf_target = (128, 180)
    row_height_pixels = 190

    for row_index, entry in enumerate(entries, start=1):
        sheet.set_row_pixels(row_index, row_height_pixels)
        sheet.write(row_index, 0, entry.project_id, cell_format)
        sheet.write(row_index, 1, entry.round_id, cell_format)
        sheet.data_validation(
            row_index,
            4,
            row_index,
            4,
            {
                "validate": "list",
                "source": validation_source,
                "ignore_blank": True,
            },
        )
        sheet.write_blank(row_index, 4, None, cell_format)

        conversation_scale_x, conversation_scale_y = image_scale(
            entry.conversation_path,
            target_width=conversation_target[0],
            target_height=conversation_target[1],
        )
        pdf_scale_x, pdf_scale_y = image_scale(
            entry.pdf_path,
            target_width=pdf_target[0],
            target_height=pdf_target[1],
        )

        sheet.write_blank(row_index, 2, None, cell_format)
        sheet.write_blank(row_index, 3, None, cell_format)

        sheet.insert_image(
            row_index,
            2,
            str(entry.conversation_path),
            {
                "x_scale": conversation_scale_x,
                "y_scale": conversation_scale_y,
                "x_offset": 6,
                "y_offset": 5,
                "object_position": 1,
            },
        )
        sheet.insert_image(
            row_index,
            3,
            str(entry.pdf_path),
            {
                "x_scale": pdf_scale_x,
                "y_scale": pdf_scale_y,
                "x_offset": 6,
                "y_offset": 5,
                "object_position": 1,
            },
        )

    workbook.close()


def main() -> int:
    if not SCREENSHOTS_DIR.exists():
        raise SystemExit(f"Missing screenshots directory: {SCREENSHOTS_DIR}")

    entries = collect_rounds(SCREENSHOTS_DIR)
    if not entries:
        raise SystemExit(f"No valid round folders found in: {SCREENSHOTS_DIR}")

    build_workbook(entries, OUTPUT_PATH)
    print(f"Generated {OUTPUT_PATH}")
    print(f"Rows: {len(entries)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
