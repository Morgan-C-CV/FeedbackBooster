import Foundation
import Quartz
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

func render(pdfURL: URL, outputDir: URL, scale: CGFloat) throws {
    guard let doc = CGPDFDocument(pdfURL as CFURL) else {
        throw NSError(domain: "render_pdf_pages", code: 1, userInfo: [NSLocalizedDescriptionKey: "Cannot open PDF: \(pdfURL.path)"])
    }

    try FileManager.default.createDirectory(at: outputDir, withIntermediateDirectories: true)

    let pageCount = doc.numberOfPages
    for index in 1...pageCount {
        guard let page = doc.page(at: index) else { continue }
        let mediaBox = page.getBoxRect(.mediaBox)
        let width = Int(mediaBox.width * scale)
        let height = Int(mediaBox.height * scale)
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue
        guard let ctx = CGContext(
            data: nil,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: 0,
            space: colorSpace,
            bitmapInfo: bitmapInfo
        ) else {
            throw NSError(domain: "render_pdf_pages", code: 2, userInfo: [NSLocalizedDescriptionKey: "Cannot create CGContext"])
        }

        ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
        ctx.fill(CGRect(x: 0, y: 0, width: width, height: height))
        ctx.saveGState()
        let drawRect = CGRect(x: 0, y: 0, width: CGFloat(width), height: CGFloat(height))
        let transform = page.getDrawingTransform(.mediaBox, rect: drawRect, rotate: 0, preserveAspectRatio: true)
        ctx.concatenate(transform)
        ctx.drawPDFPage(page)
        ctx.restoreGState()

        guard let image = ctx.makeImage() else {
            throw NSError(domain: "render_pdf_pages", code: 3, userInfo: [NSLocalizedDescriptionKey: "Cannot create image for page \(index)"])
        }

        let fileURL = outputDir.appendingPathComponent(String(format: "page-%02d.png", index))
        guard let dest = CGImageDestinationCreateWithURL(fileURL as CFURL, UTType.png.identifier as CFString, 1, nil) else {
            throw NSError(domain: "render_pdf_pages", code: 4, userInfo: [NSLocalizedDescriptionKey: "Cannot create image destination"])
        }
        CGImageDestinationAddImage(dest, image, nil)
        if !CGImageDestinationFinalize(dest) {
            throw NSError(domain: "render_pdf_pages", code: 5, userInfo: [NSLocalizedDescriptionKey: "Cannot write image \(fileURL.path)"])
        }
        print(fileURL.path)
    }
}

let args = CommandLine.arguments
guard args.count >= 3 else {
    fputs("Usage: render_pdf_pages.swift <pdf-path> <output-dir> [scale]\n", stderr)
    exit(1)
}

let pdfURL = URL(fileURLWithPath: args[1])
let outputDir = URL(fileURLWithPath: args[2], isDirectory: true)
let scale = args.count >= 4 ? CGFloat(Double(args[3]) ?? 2.0) : 2.0

do {
    try render(pdfURL: pdfURL, outputDir: outputDir, scale: scale)
} catch {
    fputs("Error: \(error.localizedDescription)\n", stderr)
    exit(1)
}
