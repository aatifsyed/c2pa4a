//! Getting [`c2pa`] to work in-memory was too much for my little brain, so have
//! a hacky server around it instead.
//!
//! To get started:
//! 1. [install c2patool](https://github.com/contentauth/c2patool?tab=readme-ov-file#installation)
//! 2. [install Rust](https://www.rust-lang.org/tools/install)
//! 3. run `cargo serve` in the root of the repo
//!
//! Use the [verify](https://contentcredentials.org/verify) tool to see (some of)
//! the metadata.
//! Hack in [anchors.pem](https://github.com/contentauth/c2patool/raw/main/sample/trust_anchors.pem)
//! to get the tool to trust you.

use std::{
    borrow::Cow,
    fs, io,
    net::ToSocketAddrs as _,
    path::{Path, PathBuf},
    process::Command,
};

use anyhow::{ensure, Context};
use base64::Engine as _;
use clap::Parser;
use oxhttp::{
    model::{Method, Request, Response, Status},
    Server,
};
use serde::Deserialize;
use serde_json::{json, Value};

#[derive(Parser)]
struct Args {
    /// local address/socket to listen on
    #[arg(long)]
    bind: String,
    /// Path to `c2patool`
    #[arg(long, default_value = "c2patool")]
    c2patool: PathBuf,
}

fn main() -> anyhow::Result<()> {
    let Args { bind, c2patool } = Args::parse();
    Server::new(move |req| {
        handle(req, &c2patool).unwrap_or_else(|e| {
            dbg!(req);
            Response::builder(Status::INTERNAL_SERVER_ERROR).with_body(format!("{:?}", e))
        })
    })
    .bind(bind.to_socket_addrs()?.next().context("no socket addrs")?)
    .spawn()?
    .join()?;
    Ok(())
}

#[derive(Deserialize)]
struct Params {
    /// base64 Encoded image
    input: String,
    /// "jpg" / "png" / ...
    extension: SupportedFileExtension,
    lat: f64,
    lon: f64,
    author: String,
    /// any JSON value
    proof: Value,
}

fn handle(req: &mut Request, c2patool: &Path) -> anyhow::Result<Response> {
    if *req.method() == Method::OPTIONS {
        return Ok(Response::builder(Status::NOT_IMPLEMENTED).with_body(vec![]));
    }
    let Params {
        mut input,
        extension,
        lat,
        lon,
        author,
        proof,
    } = serde_json::from_reader(req.body_mut())?;
    if input.starts_with("data:") {
        let needle = "base64,";
        let ix = input.find(needle).context("data URL must be base64")?;
        input = String::from(&input[(ix + needle.len())..]);
    }
    let input = base64::engine::general_purpose::STANDARD.decode(input)?;
    let output = with_attestations(c2patool, &*input, extension, lat, lon, &author, proof)?;
    let response = Response::builder(Status::OK)
        .with_header(http::header::ACCESS_CONTROL_ALLOW_ORIGIN.as_str(), "*")
        .unwrap()
        .with_body(output);
    Ok(response)
}

fn with_attestations(
    c2patool: &Path,
    mut input: impl io::Read,
    format: SupportedFileExtension,
    lat: f64,
    lon: f64,
    author_name: &str,
    proof: Value,
) -> anyhow::Result<Vec<u8>> {
    let suffix = format!(".{}", format);
    let mut shim_input = tempfile::Builder::new().suffix(&suffix).tempfile()?;
    io::copy(&mut input, &mut shim_input)?;

    let shim_output = tempfile::Builder::new()
        .suffix(&suffix)
        .tempfile()?
        .into_temp_path();

    let mut cmd = Command::new(c2patool);
    cmd.arg(shim_input.path())
        .arg("--config")
        .arg(
            json!({"assertions": [
                {
                    "label": "stds.exif",
                    "data": {
                        "EXIF:GPSLatitude": lat.to_string(),  // must be str to be
                        "EXIF:GPSLongitude": lon.to_string(), // displayed in UI
                    }
                },
                {
                    "label": "stds.schema-org.CreativeWork",
                    "data": {
                        "author": [
                            {
                                "name": author_name
                            }
                        ]
                    },
                },
                {
                    "label": "cp4a.zkproof",
                    "data": proof,
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

impl<'de> Deserialize<'de> for SupportedFileExtension {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        Cow::<str>::deserialize(deserializer)?
            .parse()
            .map_err(serde::de::Error::custom)
    }
}
