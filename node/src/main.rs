//! Getting [`c2pa`] to work in-memory was too much for my little brain, so have
//! a hacky server around it instead.

use std::{
    fs::{self, File},
    io::{self, Cursor, Read, Write},
    path::PathBuf,
    process::Command,
};

use anyhow::{ensure, Context};
use c2pa::{Manifest, Signer, SigningAlg};
use clap::Parser;
use oxhttp::{
    model::{Request, Response, Status},
    Server,
};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Parser)]
struct Args {
    #[arg(long)]
    ext: SupportedFileExtension,
    #[arg(long)]
    lat: f64,
    #[arg(long)]
    lon: f64,
    path: PathBuf,
}

fn main() -> anyhow::Result<()> {
    let Args {
        ext,
        lat,
        lon,
        path,
    } = Args::parse();
    io::stdout().write_all(&with_attestations(File::open(path)?, ext, lat, lon)?)?;
    Ok(())
}

fn with_attestations(
    mut input: impl io::Read,
    format: SupportedFileExtension,
    lat: f64,
    lon: f64,
) -> anyhow::Result<Vec<u8>> {
    let suffix = format!(".{}", format);
    let mut shim_input = tempfile::Builder::new().suffix(&suffix).tempfile()?;
    io::copy(&mut input, &mut shim_input)?;

    let shim_output = tempfile::Builder::new()
        .suffix(&suffix)
        .tempfile()?
        .into_temp_path();

    let mut cmd = Command::new("c2patool");
    cmd.arg(shim_input.path())
        .arg("--config")
        .arg(
            json!({"assertions": [
                {
                    "label": "stds.exif",
                    "data": {
                        "EXIF:GPSLatitude": lat,
                        "EXIF:GPSLongitude": lon,
                    }
                }
            ]})
            .to_string(),
        )
        .arg("--output")
        .arg(&shim_output)
        .arg("--force")
        .stdout(io::stderr());
    dbg!(&cmd);
    let status = cmd.status()?;
    ensure!(status.success());

    Ok(fs::read(shim_output)?)
}

macro_rules! strum {
    (
        $(#[$enum_meta:meta])*
        $vis:vis enum $enum_name:ident {
            $(
                $(#[$variant_meta:meta])*
                $variant_name:ident = $string:literal
            ),* $(,)?
        }
    ) => {
        $(#[$enum_meta])*
        $vis enum $enum_name {
            $(
                $(#[$variant_meta])*
                $variant_name,
            )*
        }
        impl $enum_name {
            pub fn as_str(&self) -> &'static str {
                match *self {
                    $(
                        Self::$variant_name => $string,
                    )*
                }
            }
        }
        impl core::fmt::Display for $enum_name {
            fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
                f.write_str(self.as_str())
            }
        }
        impl core::str::FromStr for $enum_name {
            type Err = ParseError;
            fn from_str(s: &str) -> Result<Self, Self::Err> {
                match s {
                    $(
                        $string => Ok(Self::$variant_name),
                    )*
                    _ => Err(ParseError(()))
                }
            }
        }
        #[derive(Debug)]
        $vis struct ParseError(());
        impl core::fmt::Display for ParseError {
            fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
                f.write_str("couldn't parse")
            }
        }
        impl std::error::Error for ParseError {}
    };
}

strum! {
    #[derive(Clone)]
    pub enum SupportedFileExtension {
        Avi = "avi",
        Avif = "avif",
        C2pa = "c2pa",
        Dng = "dng",
        Heic = "heic",
        Heif = "heif",
        Jpg = "jpg",
        M4a = "m4a",
        Mp3 = "mp3",
        Mp4 = "mp4",
        Mov = "mov",
        Pdf = "pdf",
        Png = "png",
        Svg = "svg",
        Tif = "tif",
        Wav = "wav",
        Webp = "webp",
    }
}
