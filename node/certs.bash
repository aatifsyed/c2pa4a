#!/usr/bin/env bash
# https://gist.github.com/fntlnz/cf14feb5a46b2eda428e000157447309
set -euxo pipefail

root_key=${root_key:-root.key}
root_cert=${root_cert:-root.cert}
app_key=${app_key:-app.key}
app_cert=${app_cert:-app.cert}
country=${country:-DE}
organisation=${organisation:-c2pa4a}
root_common_name=${root_common_name:-C2PA4A Root}
app_common_name=${app_common_name:-C2PA4A App}

: root private key
openssl genrsa -out "$root_key" 4096
: self-sign root cert
openssl req -new -sha256 -key "$root_key" -out "$root_cert" -nodes -days 1024 -x509 -subj "/C=$country/O=$organisation/CN=$root_common_name"

: app private key
openssl genrsa -out "$app_key" 2048

: generate request and sign it with root
openssl req -new -sha256 -key "$app_key" -subj "/C=$country/O=$organisation/CN=$app_common_name" \
    | openssl x509 -req -CA "$root_cert" -CAkey "$root_key" -CAcreateserial -out "$app_cert" -days 500 -sha256
