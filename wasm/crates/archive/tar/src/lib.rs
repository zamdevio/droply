use wasm_bindgen::prelude::*;
use js_sys::{Uint8Array, Array};
use serde::{Serialize, Deserialize};
use tar::{Builder, Archive};
use std::io::{Cursor, Read};

#[derive(Serialize, Deserialize)]
struct FileEntry {
    name: String,
    data: Vec<u8>,
}

#[wasm_bindgen]
pub fn pack(files: Array) -> Uint8Array {
    let buffer = Cursor::new(Vec::new());
    let mut builder = Builder::new(buffer);
    
    for i in 0..files.length() {
        let file_obj = files.get(i);
        if let Ok(file_entry) = serde_wasm_bindgen::from_value::<FileEntry>(file_obj) {
            let mut header = tar::Header::new_gnu();
            header.set_size(file_entry.data.len() as u64);
            header.set_mode(0o644);
            header.set_cksum();
            
            builder.append(&header, &file_entry.data[..]).unwrap();
        }
    }
    
    let buffer = builder.into_inner().unwrap();
    let archive = buffer.into_inner();
    Uint8Array::from(&archive[..])
}

#[wasm_bindgen]
pub fn unpack(archive: Uint8Array) -> Array {
    let archive_vec: Vec<u8> = archive.to_vec();
    let mut tar_archive = Archive::new(Cursor::new(archive_vec));
    
    let files = Array::new();
    
    for entry in tar_archive.entries().unwrap() {
        if let Ok(mut entry) = entry {
            let mut data = Vec::new();
            entry.read_to_end(&mut data).unwrap();
            
            // Extract filename from path
            let path = entry.path().unwrap();
            let filename = path.file_name()
                .and_then(|name| name.to_str())
                .unwrap_or("unknown")
                .to_string();
            
            // If filename is empty, use a default
            let final_filename = if filename.is_empty() {
                format!("file_{}", files.length())
            } else {
                filename
            };
            
            let file_entry = FileEntry {
                name: final_filename,
                data,
            };
            
            let js_value = serde_wasm_bindgen::to_value(&file_entry).unwrap();
            files.push(&js_value);
        }
    }
    
    files
}
