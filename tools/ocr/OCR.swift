// Trich van ban + toa do tu anh thiet ke bang Vision framework cua macOS.
//
// Vi sao can: 31 trang con duoc dung tu frame thiet ke da render, nen chu nam
// TRONG anh. Khong co lop van ban nay thi Google, trinh doc man hinh va o tim
// kiem noi bo deu khong thay gi.
//
// Dung: swift OCR.swift <duong-dan-anh> <be-rong-hien-thi> > out.json
// In ra JSON: [{ "text": "...", "x": 0, "y": 0, "w": 0, "h": 0, "confidence": 0.0 }]
// Toa do quy ve he 1440px cua canvas.

import Foundation
import Vision
import AppKit

// Anh rat cao (toi 25.000px) lam Vision giam do chinh xac.
// Cat thanh tung manh cao TILE_HEIGHT, chong lan OVERLAP de khong dut chu.
let TILE_HEIGHT = 2400
let OVERLAP = 120

struct Block: Codable {
    let text: String
    let x: Double
    let y: Double
    let w: Double
    let h: Double
    let confidence: Double
}

func fail(_ message: String) -> Never {
    FileHandle.standardError.write("OCR: \(message)\n".data(using: .utf8)!)
    exit(1)
}

guard CommandLine.arguments.count >= 3 else {
    fail("dung: OCR.swift <anh> <be-rong-hien-thi>")
}
let path = CommandLine.arguments[1]
let displayWidth = Double(CommandLine.arguments[2]) ?? 1440

guard let image = NSImage(contentsOfFile: path),
      let full = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    fail("khong doc duoc anh: \(path)")
}

// Ti le tu pixel anh ve he toa do hien thi 1440px.
let scale = displayWidth / Double(full.width)

var blocks: [Block] = []
var top = 0

while top < full.height {
    let height = min(TILE_HEIGHT, full.height - top)
    guard let tile = full.cropping(to: CGRect(x: 0, y: top, width: full.width, height: height)) else {
        top += TILE_HEIGHT - OVERLAP
        continue
    }

    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    request.recognitionLanguages = ["vi-VN", "en-US"]

    let handler = VNImageRequestHandler(cgImage: tile, options: [:])
    do {
        try handler.perform([request])
    } catch {
        fail("Vision loi: \(error)")
    }

    for observation in request.results ?? [] {
        guard let candidate = observation.topCandidates(1).first else { continue }
        let text = candidate.string.trimmingCharacters(in: .whitespacesAndNewlines)
        if text.isEmpty { continue }

        // boundingBox: goc toa do o duoi-trai, gia tri 0..1 cua manh anh.
        let box = observation.boundingBox
        let xPx = box.minX * Double(tile.width)
        let wPx = box.width * Double(tile.width)
        let hPx = box.height * Double(tile.height)
        // Doi ve goc tren-trai cua ca anh.
        let yPx = Double(top) + (1.0 - box.maxY) * Double(tile.height)

        blocks.append(
            Block(
                text: text,
                x: (xPx * scale * 100).rounded() / 100,
                y: (yPx * scale * 100).rounded() / 100,
                w: (wPx * scale * 100).rounded() / 100,
                h: (hPx * scale * 100).rounded() / 100,
                confidence: Double((candidate.confidence * 1000).rounded()) / 1000
            )
        )
    }

    if height < TILE_HEIGHT { break }
    top += TILE_HEIGHT - OVERLAP
}

// Bo trung lap sinh ra o vung chong lan giua hai manh.
blocks.sort { $0.y == $1.y ? $0.x < $1.x : $0.y < $1.y }
var unique: [Block] = []
for block in blocks {
    let duplicate = unique.contains { other in
        other.text == block.text && abs(other.y - block.y) < 6 && abs(other.x - block.x) < 6
    }
    if !duplicate { unique.append(block) }
}

let data = try JSONEncoder().encode(unique)
FileHandle.standardOutput.write(data)
