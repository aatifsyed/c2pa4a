use std::{
    fs,
    io::{self, Cursor, Read, Write},
    path::PathBuf,
};

use anyhow::Context;
use c2pa::{Manifest, Signer, SigningAlg};
use clap::Parser;
use oxhttp::{
    model::{Request, Response, Status},
    Server,
};
use rcgen::{CertificateParams, CertifiedKey, KeyPair, SignatureAlgorithm};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Serialize, Deserialize)]
struct Assertion {
    label: String,
    data: Value,
}

#[derive(Serialize, Deserialize)]
struct ExifGpsData {
    lat: String,
    long: String,
}

#[derive(Parser)]
struct Args {
    #[arg(long)]
    write_pem: Option<PathBuf>,
    #[arg(long)]
    lat: f64,
    #[arg(long)]
    long: f64,
}

fn main() -> anyhow::Result<()> {
    let Args {
        write_pem,
        lat,
        long,
    } = Args::parse();
    let alg = SigningAlg::Es256;
    let key_pair = KeyPair::generate_for(&rcgen::PKCS_ECDSA_P256_SHA256)?;
    let cert =
        CertificateParams::new([String::from("C2PA4A Ephemeral")])?.self_signed(&key_pair)?;
    if let Some(write_pem) = write_pem {
        fs::write(write_pem, cert.pem())?;
    }
    let signer = c2pa::create_signer::from_keys(
        include_bytes!("../root.cert"),
        include_bytes!("../root.key"),
        alg,
        None,
    )?;

    let mut manifest = serde_json::from_value::<Manifest>(json!({
        "assertions": [
            {
                "label": "stds.exif",
                "data": {
                    "EXIF:GPSLatitude": lat,
                    "EXIF:GPSLongitude": long,
                }
            }
        ]
    }))?;

    let mut i = Cursor::new(vec![]);
    io::stdin().read_to_end(i.get_mut())?;

    let mut o = Cursor::new(vec![]);
    manifest.embed("/dev/stdin", "/dev/stdout", &*signer)?;

    io::stdout().write_all(o.get_ref())?;
    Ok(())
}
