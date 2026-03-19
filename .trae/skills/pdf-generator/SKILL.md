---
name: "pdf-generator"
description: "Generates professional binary PDF files for research proposals or documentation. Invoke when the user needs to create or update real PDF files with structured content."
---

# PDF Generator

This skill generates professional, renderable binary PDF files using the `fpdf2` library. It is specifically designed for academic research proposals, but can be adapted for any structured documentation.

## Capabilities

- Creates real binary PDFs (not Markdown).
- Supports structured sections with titles and multi-line content.
- Automatically handles metadata like Author and Date.
- Uses standard academic fonts (Helvetica).

## Usage

When this skill is invoked, you should use the provided Python script `generate_pdfs.py` as a template or directly to generate the required PDF files.

### Template Script Location
`.trae/skills/pdf-generator/generate_pdfs.py`

### How to use the script
1. Define the sections and content in the script.
2. Run the script using a compatible Python environment (e.g., `/opt/miniconda3/bin/python3.10`).
3. Ensure `fpdf2` is installed in the target environment.

## Dependencies
- `fpdf2`
