use wasm_bindgen::prelude::*;
use js_sys::Uint8Array;
use crc32fast::Hasher as Crc32;
use flate2::{Compression, write::DeflateEncoder, read::DeflateDecoder};
use std::io::{Read, Write};

/// Compress raw bytes into a *single-file ZIP*.
/// - `filename` -> name of the single entry inside the zip (default "data.bin")
/// - `level`    -> 0..=9 (0 -> store/no compression; otherwise deflate)
#[wasm_bindgen]
pub fn compress(input: Uint8Array, filename: Option<String>, level: Option<u32>) -> Result<Uint8Array, JsValue> {
    let data = input.to_vec();
    let name = filename.unwrap_or_else(|| "data.bin".to_string());
    let lvl = level.unwrap_or(6).min(9);

    // Compute CRC of the *uncompressed* data
    let mut hasher = Crc32::new();
    hasher.update(&data);
    let crc = hasher.finalize();

    // Choose method: 0=store, 8=deflate
    let (method, payload): (u16, Vec<u8>) = if lvl == 0 {
        (0, data.clone())
    } else {
        let mut enc = DeflateEncoder::new(Vec::new(), Compression::new(lvl));
        enc.write_all(&data).map_err(to_js)?;
        (8, enc.finish().map_err(to_js)?)
    };

    let fname = name.as_bytes();
    if fname.len() > u16::MAX as usize {
        return Err(JsValue::from_str("Filename too long"));
    }

    let mut out: Vec<u8> = Vec::new();
    let local_header_offset = out.len() as u32;

    // ---- Local file header (PK\x03\x04) ----
    out.extend_from_slice(b"PK\x03\x04");
    out.extend_from_slice(&u16::to_le_bytes(20));                 // version needed
    out.extend_from_slice(&u16::to_le_bytes(0));                  // flags
    out.extend_from_slice(&u16::to_le_bytes(method));             // method
    out.extend_from_slice(&u16::to_le_bytes(0));                  // time
    out.extend_from_slice(&u16::to_le_bytes(0));                  // date
    out.extend_from_slice(&u32::to_le_bytes(crc));                // crc32
    out.extend_from_slice(&u32::to_le_bytes(payload.len() as u32));       // comp size
    out.extend_from_slice(&u32::to_le_bytes(data.len() as u32));          // uncomp size
    out.extend_from_slice(&u16::to_le_bytes(fname.len() as u16));         // name len
    out.extend_from_slice(&u16::to_le_bytes(0));                          // extra len
    out.extend_from_slice(fname);                                         // name
    out.extend_from_slice(&payload);                                      // data

    // ---- Central directory (PK\x01\x02) ----
    let cd_start = out.len();
    out.extend_from_slice(b"PK\x01\x02");
    out.extend_from_slice(&u16::to_le_bytes(20));                 // version made by
    out.extend_from_slice(&u16::to_le_bytes(20));                 // version needed
    out.extend_from_slice(&u16::to_le_bytes(0));                  // flags
    out.extend_from_slice(&u16::to_le_bytes(method));             // method
    out.extend_from_slice(&u16::to_le_bytes(0));                  // time
    out.extend_from_slice(&u16::to_le_bytes(0));                  // date
    out.extend_from_slice(&u32::to_le_bytes(crc));                // crc32
    out.extend_from_slice(&u32::to_le_bytes(payload.len() as u32));// comp size
    out.extend_from_slice(&u32::to_le_bytes(data.len() as u32));   // uncomp size
    out.extend_from_slice(&u16::to_le_bytes(fname.len() as u16));  // name len
    out.extend_from_slice(&u16::to_le_bytes(0));                   // extra len
    out.extend_from_slice(&u16::to_le_bytes(0));                   // comment len
    out.extend_from_slice(&u16::to_le_bytes(0));                   // disk start
    out.extend_from_slice(&u16::to_le_bytes(0));                   // int attrs
    out.extend_from_slice(&u32::to_le_bytes(0));                   // ext attrs
    out.extend_from_slice(&u32::to_le_bytes(local_header_offset)); // rel offset
    out.extend_from_slice(fname);                                  // name

    let cd_size = out.len() - cd_start;

    // ---- End of central directory (PK\x05\x06) ----
    out.extend_from_slice(b"PK\x05\x06");
    out.extend_from_slice(&u16::to_le_bytes(0));                   // disk no
    out.extend_from_slice(&u16::to_le_bytes(0));                   // disk w/ cd
    out.extend_from_slice(&u16::to_le_bytes(1));                   // entries this disk
    out.extend_from_slice(&u16::to_le_bytes(1));                   // total entries
    out.extend_from_slice(&u32::to_le_bytes(cd_size as u32));      // cd size
    out.extend_from_slice(&u32::to_le_bytes(cd_start as u32));     // cd offset
    out.extend_from_slice(&u16::to_le_bytes(0));                   // comment len

    Ok(Uint8Array::from(out.as_slice()))
}

/// Decompress a *single-file ZIP* produced by `compress` back to raw bytes.
#[wasm_bindgen]
pub fn decompress(zip: Uint8Array) -> Result<Uint8Array, JsValue> {
    let buf = zip.to_vec();
    let mut pos = 0usize;

    // find local header
    while pos + 30 <= buf.len() && &buf[pos..pos+4] != b"PK\x03\x04" {
        pos += 1;
    }
    if pos + 30 > buf.len() {
        return Err(JsValue::from_str("Not a ZIP (missing local header)"));
    }

    let flags  = le_u16(&buf, pos + 6);
    if (flags & 0x0008) != 0 {
        return Err(JsValue::from_str("Unsupported ZIP: data descriptor set"));
    }
    let method = le_u16(&buf, pos + 8);
    let comp_size = le_u32(&buf, pos + 18) as usize;
    let fname_len = le_u16(&buf, pos + 26) as usize;
    let extra_len = le_u16(&buf, pos + 28) as usize;

    let name_start = pos + 30;
    let data_start = name_start + fname_len + extra_len;
    let data_end   = data_start.saturating_add(comp_size);
    if data_end > buf.len() {
        return Err(JsValue::from_str("Corrupt ZIP: data beyond buffer"));
    }

    let raw = &buf[data_start..data_end];
    let out = match method {
        0 => raw.to_vec(),
        8 => {
            let mut dec = DeflateDecoder::new(raw);
            let mut out = Vec::new();
            dec.read_to_end(&mut out).map_err(to_js)?;
            out
        }
        _ => return Err(JsValue::from_str("Unsupported ZIP method")),
    };

    Ok(Uint8Array::from(out.as_slice()))
}

#[inline]
fn le_u16(buf: &[u8], i: usize) -> u16 { u16::from_le_bytes([buf[i], buf[i+1]]) }
#[inline]
fn le_u32(buf: &[u8], i: usize) -> u32 { u32::from_le_bytes([buf[i], buf[i+1], buf[i+2], buf[i+3]]) }

fn to_js<E: std::fmt::Display>(e: E) -> JsValue { JsValue::from_str(&format!("{e}")) }
