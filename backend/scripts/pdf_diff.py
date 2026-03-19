import sys
import difflib
from pypdf import PdfReader

def extract_text(file_path):
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        return f"Error extracting text from {file_path}: {str(e)}"

def get_diff(file1, file2):
    text1 = extract_text(file1).splitlines()
    text2 = extract_text(file2).splitlines()
    
    diff = difflib.unified_diff(text1, text2, fromfile=file1, tofile=file2, lineterm='')
    return "\n".join(list(diff)[:1000]) # Limit to first 1000 lines of diff

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 pdf_diff.py <file1> <file2>")
        sys.exit(1)
    
    file1 = sys.argv[1]
    file2 = sys.argv[2]
    print(get_diff(file1, file2))
