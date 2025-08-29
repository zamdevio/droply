use wasm_bindgen::prelude::*;
use js_sys::Uint8Array;
use flate2::write::{GzEncoder, GzDecoder};
use flate2::Compression;
use std::io::Write;

#[wasm_bindgen]
pub fn compress(input: Uint8Array, level: Option<u32>) -> Uint8Array {
    let input_vec: Vec<u8> = input.to_vec();
    let compression_level = Compression::new(level.unwrap_or(6).min(9));
    
    let mut encoder = GzEncoder::new(Vec::new(), compression_level);
    encoder.write_all(&input_vec).unwrap();
    
    let compressed = encoder.finish().unwrap();
    Uint8Array::from(&compressed[..])
}

#[wasm_bindgen]
pub fn decompress(input: Uint8Array) -> Uint8Array {
    let input_vec: Vec<u8> = input.to_vec();
    
    let mut decoder = GzDecoder::new(Vec::new());
    decoder.write_all(&input_vec).unwrap();
    
    let decompressed = decoder.finish().unwrap();
    Uint8Array::from(&decompressed[..])
}
