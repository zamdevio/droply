use wasm_bindgen::prelude::*;
use js_sys::Uint8Array;
use brotli::{CompressorReader, Decompressor};

#[wasm_bindgen]
pub fn compress(input: Uint8Array, level: Option<u32>) -> Uint8Array {
    let input_vec: Vec<u8> = input.to_vec();
    let quality = level.unwrap_or(6).min(11) as u32;
    
    let mut compressed = Vec::new();
    let mut reader = CompressorReader::new(&input_vec[..], 4096, quality, 22);
    std::io::copy(&mut reader, &mut compressed).unwrap();
    
    Uint8Array::from(&compressed[..])
}

#[wasm_bindgen]
pub fn decompress(input: Uint8Array) -> Uint8Array {
    let input_vec: Vec<u8> = input.to_vec();
    
    let mut decompressed = Vec::new();
    let mut reader = Decompressor::new(&input_vec[..], 4096);
    std::io::copy(&mut reader, &mut decompressed).unwrap();
    
    Uint8Array::from(&decompressed[..])
}
