
scratch=$(mktemp -d)
mkdir -p "$scratch/lib" "$scratch/bin"
./install.sh -build -prefix "$scratch"
pushd "$scratch"

