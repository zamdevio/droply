use wasm_bindgen::prelude::*;
use js_sys::{Uint8Array, Array};
use serde::{Serialize, Deserialize};
use crc32fast::Hasher as Crc32;
use flate2::{Compression, write::DeflateEncoder, read::DeflateDecoder};
use std::io::{Read, Write};

#[derive(Serialize, Deserialize)]
struct FileEntry {
    name: String,
    data: Vec<u8>,
}

#[derive(Serialize, Deserialize)]
struct PackOptions {
    #[serde(default)]
    compress_inside: bool,
    /// Optional compression level 0..=9 (default 6 if compressInside)
    #[serde(default)]
    level: Option<u32>,
}

#[wasm_bindgen]
pub fn pack(files: Array, options: JsValue) -> Result<Uint8Array, JsValue> {
    let opts: PackOptions = serde_wasm_bindgen::from_value(options)
        .unwrap_or(PackOptions { compress_inside: false, level: None });

    let level = opts.level.unwrap_or(6).min(9) as u32;
    let use_deflate = opts.compress_inside;

    // Where we accumulate the whole .zip file.
    let mut out: Vec<u8> = Vec::new();

    // We need to remember central dir records and the local header offsets.
    struct CdRec {
        name: String,
        crc32: u32,
        comp_size: u32,
        uncomp_size: u32,
        method: u16,
        rel_offset: u32,
    }
    let mut central: Vec<CdRec> = Vec::new();

    // Iterate input files
    for i in 0..files.length() {
        let file_js = files.get(i);
        let file: FileEntry = serde_wasm_bindgen::from_value(file_js)
            .map_err(|e| JsValue::from_str(&format!("Bad FileEntry: {e:?}")))?;

        let mut hasher = Crc32::new();
        hasher.update(&file.data);
        let crc = hasher.finalize();

        let (method, payload): (u16, Vec<u8>) = if use_deflate {
            let mut enc = DeflateEncoder::new(Vec::new(), Compression::new(level));
            enc.write_all(&file.data).map_err(to_js)?;
            (8, enc.finish().map_err(to_js)?)
        } else {
            (0, file.data.clone())
        };

        let fname = file.name.as_bytes();
        if fname.len() > u16::MAX as usize {
            return Err(JsValue::from_str("Filename too long for ZIP"));
        }

        // Record where this local file header starts (relative offset for central dir)
        let local_header_offset = out.len() as u32;

        // ---- Local file header ----
        // signature
        out.extend_from_slice(b"PK\x03\x04");
        // version needed to extract (2.0)
        out.extend_from_slice(&u16::to_le_bytes(20));
        // general purpose bit flag
        out.extend_from_slice(&u16::to_le_bytes(0));
        // compression method
        out.extend_from_slice(&u16::to_le_bytes(method));
        // file mod time/date (0 for now)
        out.extend_from_slice(&u16::to_le_bytes(0)); // time
        out.extend_from_slice(&u16::to_le_bytes(0)); // date
        // crc32
        out.extend_from_slice(&u32::to_le_bytes(crc));
        // compressed size
        out.extend_from_slice(&u32::to_le_bytes(payload.len() as u32));
        // uncompressed size
        out.extend_from_slice(&u32::to_le_bytes(file.data.len() as u32));
        // filename length
        out.extend_from_slice(&u16::to_le_bytes(fname.len() as u16));
        // extra length
        out.extend_from_slice(&u16::to_le_bytes(0));

        // filename
        out.extend_from_slice(fname);
        // extra (none)
        // file data
        out.extend_from_slice(&payload);

        central.push(CdRec {
            name: file.name,
            crc32: crc,
            comp_size: payload.len() as u32,
            uncomp_size: file.data.len() as u32,
            method,
            rel_offset: local_header_offset,
        });
    }

    // Central directory start
    let cd_start = out.len();

    // ---- Central directory entries ----
    for rec in &central {
        let fname = rec.name.as_bytes();

        out.extend_from_slice(b"PK\x01\x02");             // central dir sig
        out.extend_from_slice(&u16::to_le_bytes(20));      // version made by
        out.extend_from_slice(&u16::to_le_bytes(20));      // version needed to extract
        out.extend_from_slice(&u16::to_le_bytes(0));       // flags
        out.extend_from_slice(&u16::to_le_bytes(rec.method));
        out.extend_from_slice(&u16::to_le_bytes(0));       // time
        out.extend_from_slice(&u16::to_le_bytes(0));       // date
        out.extend_from_slice(&u32::to_le_bytes(rec.crc32));
        out.extend_from_slice(&u32::to_le_bytes(rec.comp_size));
        out.extend_from_slice(&u32::to_le_bytes(rec.uncomp_size));
        out.extend_from_slice(&u16::to_le_bytes(fname.len() as u16)); // fname len
        out.extend_from_slice(&u16::to_le_bytes(0));       // extra len
        out.extend_from_slice(&u16::to_le_bytes(0));       // comment len
        out.extend_from_slice(&u16::to_le_bytes(0));       // disk start
        out.extend_from_slice(&u16::to_le_bytes(0));       // int attrs
        out.extend_from_slice(&u32::to_le_bytes(0));       // ext attrs
        out.extend_from_slice(&u32::to_le_bytes(rec.rel_offset)); // rel offset local header
        out.extend_from_slice(fname);
    }

    let cd_size = out.len() - cd_start;

    // ---- End of central directory ----
    out.extend_from_slice(b"PK\x05\x06");
    out.extend_from_slice(&u16::to_le_bytes(0)); // disk no
    out.extend_from_slice(&u16::to_le_bytes(0)); // disk where cd starts
    out.extend_from_slice(&u16::to_le_bytes(central.len() as u16)); // entries this disk
    out.extend_from_slice(&u16::to_le_bytes(central.len() as u16)); // total entries
    out.extend_from_slice(&u32::to_le_bytes(cd_size as u32));       // cd size
    out.extend_from_slice(&u32::to_le_bytes(cd_start as u32));      // cd offset
    out.extend_from_slice(&u16::to_le_bytes(0));                    // comment len

    Ok(Uint8Array::from(out.as_slice()))
}

#[wasm_bindgen]
pub fn unpack(archive: Uint8Array) -> Result<Array, JsValue> {
    let data: Vec<u8> = archive.to_vec();
    let mut pos: usize = 0;
    let files = Array::new();

    while pos + 30 <= data.len() {
        // Look for a local header
        if &data[pos..pos + 4] != b"PK\x03\x04" {
            pos += 1;
            continue;
        }

        // Local file header fields
        let _ver_needed = le_u16(&data, pos + 4);
        let flags       = le_u16(&data, pos + 6);
        let method      = le_u16(&data, pos + 8);
        // let time     = le_u16(&data, pos + 10);
        // let date     = le_u16(&data, pos + 12);
        let _crc32      = le_u32(&data, pos + 14);
        let comp_size   = le_u32(&data, pos + 18) as usize;
        let uncomp_size = le_u32(&data, pos + 22) as usize;
        let fname_len   = le_u16(&data, pos + 26) as usize;
        let extra_len   = le_u16(&data, pos + 28) as usize;

        // Data descriptors (flag bit 3) are NOT supported here
        if (flags & 0x0008) != 0 {
            return Err(JsValue::from_str("Unsupported ZIP: data descriptor (flag bit 3) set"));
        }

        let header_end = pos + 30;
        if header_end + fname_len + extra_len > data.len() {
            return Err(JsValue::from_str("Corrupt ZIP: header exceeds buffer"));
        }

        let name_start = header_end;
        let name_end   = name_start + fname_len;
        let filename   = match std::str::from_utf8(&data[name_start..name_end]) {
            Ok(s) => s.to_string(),
            Err(_) => return Err(JsValue::from_str("Invalid UTF-8 in filename")),
        };

        let file_data_start = name_end + extra_len;
        let file_data_end   = file_data_start.saturating_add(comp_size);
        if file_data_end > data.len() {
            return Err(JsValue::from_str("Corrupt ZIP: file data exceeds buffer"));
        }

        let raw = &data[file_data_start..file_data_end];
        let file_bytes = match method {
            0 => raw.to_vec(), // stored
            8 => {
                let mut dec = DeflateDecoder::new(raw);
                let mut buf = Vec::with_capacity(uncomp_size);
                dec.read_to_end(&mut buf).map_err(to_js)?;
                buf
            }
            _ => return Err(JsValue::from_str("Unsupported compression method")),
        };

        let entry = FileEntry { name: filename, data: file_bytes };
        let js = serde_wasm_bindgen::to_value(&entry).map_err(to_js)?;
        files.push(&js);

        // Next local header (after file payload)
        pos = file_data_end;
    }

    Ok(files)
}

// ---- helpers ----
fn to_js<E: std::fmt::Display>(e: E) -> JsValue {
    JsValue::from_str(&format!("{e}"))
}

#[inline]
fn le_u16(buf: &[u8], i: usize) -> u16 {
    u16::from_le_bytes([buf[i], buf[i + 1]])
}

#[inline]
fn le_u32(buf: &[u8], i: usize) -> u32 {
    u32::from_le_bytes([buf[i], buf[i + 1], buf[i + 2], buf[i + 3]])
}
