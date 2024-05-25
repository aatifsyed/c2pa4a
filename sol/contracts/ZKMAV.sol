// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract ZKMAV {

    struct Location {
        uint256 longitude;
        uint256 latitude;
    }

    struct MediaData {
        bytes32 signature;
        bytes32 ipfsCID;
        Location location;
    }

    mapping(bytes32 => MediaData) public uploadedData;

    event Upload(bytes32 fileHash, bytes32 signature, bytes32 ipfsCID, uint256 longitude, uint256 latitude);

    function upload(bytes32 fileHash, bytes32 signature, bytes32 ipfsCID, uint256 longitude, uint256 latitude) public {
        require(uploadedData[fileHash].signature == 0, "File has already been uploaded");
        emit Upload(fileHash, signature, ipfsCID, longitude, latitude);
        uploadedData[fileHash] = MediaData(signature, ipfsCID, Location(longitude, latitude));
    }
}
