
# Quickstart
## Run the backend
prerequisites:
- [cargo](https://www.rust-lang.org/tools/install)
- [dotslash](https://dotslash-cli.com/docs/installation/)

```bash
# start the node
$ cargo serve localhost:10000 &

# make an HTTP request
$ cat <<EOF | curl -X POST localhost:10000 -d @- --output "signed.$file_extension"
{
    "input": "$(base64 --wrap=0 $file_path)",
    "extension": "$file_extension",
    "lat": 0,
    "lon": 0,
    "author": "aatif",
    "proof": null
}
EOF

# inspect the new image metadata
$ ./c2patool "signed.$file_extension"

# stop the server
$ kill $(jobs -p)
```
