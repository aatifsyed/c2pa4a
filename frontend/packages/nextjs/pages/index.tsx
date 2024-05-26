import { useCallback, useState } from "react";
import { ZKEdDSAEventTicketPCDPackage } from "@pcd/zk-eddsa-event-ticket-pcd";
import { zuAuthPopup } from "@pcd/zuauth";
import type { NextPage } from "next";
import { hexToBigInt } from "viem";
import { useAccount } from "wagmi";
import { MetaHeader } from "~~/components/MetaHeader";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { generateWitness, isETHBerlinPublicKey } from "~~/utils/scaffold-eth/pcd";
import { ETHBERLIN_ZUAUTH_CONFIG } from "~~/utils/zupassConstants";
import { b58ToHex } from '../common'
import axios from 'axios';
import pinFileToIPFS from '../IPFS'
import getGeolocation from '../components/geolocation/getGeolocation';

// Get a valid event id from { supportedEvents } from "zuauth" or https://api.zupass.org/issue/known-ticket-types
const fieldsToReveal = {
  // revealAttendeeEmail: true,
  revealEventId: true,
  revealProductId: true,
};

const Video = ({ dataURL }) => {
  return (
    <video src={dataURL}></video>
  )
}

const Home: NextPage = () => {
  const [verifiedFrontend, setVerifiedFrontend] = useState(false);
  const [verifiedBackend, setVerifiedBackend] = useState(false);
  const [verifiedOnChain, setVerifiedOnChain] = useState(false);
  const { address: connectedAddress } = useAccount();
  const [pcd, setPcd] = useState<string>();
  const [video, setVideo] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [signedVideo, setSignedVideo] = useState(null);
  const [fileHash, setFileHash] = useState('0xfce000106bf7ed55bd19e1bc9b67442efabb3ad20d66ce459238a0181037556c');
  const [signature, setSignature] = useState('0x74dddd29671a629c463d14799b4b026f7810e540884191ec624fa20ce35fa3f7');
  const [ipfsCID, setIpfsCID] = useState(null);
  const [coordinates, setCoordinates] = useState({longitude: null, latitude: null});
  const [geoError, setGeoError] = useState(null);

  const handleChange = (e) => {
    let reader = new FileReader();
    reader.onload = (e) => {
      setVideo(e.target.result);
    };
    setVideoFile(e.target.files[0]);
    reader.readAsDataURL(e.target.files[0]);
  };

  const fetchGeolocation = async () => {
    try {
      const { latitude, longitude } = await getGeolocation();
      setCoordinates({ latitude, longitude });
    } catch (error) {
      setGeoError(error.message || 'An error occurred.');
      console.error('Error:', error);
    }
  };

  const getProof = useCallback(async () => {
    if (!connectedAddress) {
      notification.error("Please connect wallet");
      return;
    }
    const result = await zuAuthPopup({ fieldsToReveal, watermark: connectedAddress, config: ETHBERLIN_ZUAUTH_CONFIG });
    if (result.type === "pcd") {
      setPcd(JSON.parse(result.pcdStr).pcd);
    } else {
      notification.error("Failed to parse PCD");
    }
  }, [connectedAddress]);

  const sendPCDToServer = async () => {
    if (!pcd || !connectedAddress || !videoFile || !coordinates.longitude) {
      notification.error("Information required for verification missing");
      return;
    }
  
    const reader = new FileReader();
    reader.readAsDataURL(videoFile);
    reader.onload = async () => {
      const videoData = reader.result;
  
      const pcdJSON = JSON.parse(pcd);
      const requestData = {
        input: videoData,
        extension: 'mp4',
        lat: coordinates.latitude,
        lon: coordinates.longitude,
        author: connectedAddress,
        proof: null,
      };
      console.log('requestData');
      console.log(requestData)

    
  
      
    };
  };

  // mintItem verifies the proof on-chain and mints an NFT
  const { writeAsync: mintNFT, isLoading: isMintingNFT } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "mintItem",
    // @ts-ignore TODO: fix the type later with readonly fixed length bigInt arrays
    args: [pcd ? generateWitness(JSON.parse(pcd)) : undefined],
  });

  const { data: yourBalance } = useScaffoldContractRead({
    contractName: "YourCollectible",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const { writeAsync: writeZKMAVAsync } = useScaffoldContractWrite({
    contractName: 'ZKMAV',
    functionName: 'upload',
    args: [fileHash, signature, '0x' + b58ToHex(ipfsCID).substring(4), (coordinates.longitude * 10**7), (coordinates.latitude * 10**7)]
  });

  return (
    <>
      <MetaHeader />
      <div className="flex flex-col items-center mt-24">
        <div className="card max-w-[90%] sm:max-w-lg bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-center">
              <h1 className="card-title text-4xl bold">ZK MAV</h1>
            </div>
            <div className="flex justify-center">
              <h2 className="card-title text-2xl bold">Media Authenticity Verification Solution</h2>
            </div>
            <div className="flex flex-col gap-4 mt-6 text-center">
              <div className="flex flex-col gap-4 mb-6 text-center">
                {video ? (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <Video dataURL={video} />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">No video selected</span>
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  id="input"
                  onChange={handleChange}
                  className="hidden"
                />
                <label
                  htmlFor="input"
                  className="btn btn-primary w-full"
                  disabled={video}
                >
                  {!video ? "1. Upload video" : "Video Uploaded"}
                </label>
              </div>

              <div className="tooltip" data-tip="Loads the Zupass UI in a modal, where you can prove your PCD.">
                <button className="btn btn-primary w-full tooltip" onClick={getProof} disabled={!video || pcd}>
                  {!pcd ? "2. Provide Proof of Identity" : "Proof Received!"}
                </button>
              </div>
              <div className="tooltip" data-tip="Provide your gps location">
                <button
                  className="btn btn-primary w-full"
                  disabled={!pcd || coordinates.longitude}
                  onClick={fetchGeolocation}
                >
                  {coordinates.longitude ? "GPS Location Received!" : "3. Provide GPS Location"}
                </button>
              </div>
              <div className="tooltip" data-tip="Send the PCD and video to the server to verify it and execute embedding.">
                <button
                  className="btn btn-primary w-full"
                  disabled={!coordinates.longitude}
                  onClick={sendPCDToServer}
                >
                  4. Verify and tag the video
                </button>
              </div>
              <div className="tooltip" data-tip="Store the video on IPFS.">
                <button
                  className="btn btn-primary w-full"
                  disabled={!verifiedBackend || ipfsCID}
                  onClick={async () => {
                    try {
                      const ipfsCID = await pinFileToIPFS('File', videoFile);
                      notification.success(`Video uploaded to ${ipfsCID}`);
                      setIpfsCID(ipfsCID);
                    } catch (e) {
                      notification.error(`Error: ${e}`);
                      return;
                    }
                  }}
                >
                  {ipfsCID ? "Video stored on IPFS!" : "5. Store video on IPFS"}
                </button>
              </div>
              <div className="tooltip" data-tip="Submit the proof to a smart contract to verify it on-chain.">
                <button
                  className="btn btn-primary w-full"
                  disabled={!ipfsCID || verifiedOnChain}
                  onClick={async () => {
                    try {
                      await writeZKMAVAsync();
                    } catch (e) {
                      notification.error(`Error: ${e}`);
                      return;
                    }
                    setVerifiedOnChain(true);
                  }}
                >
                  {verifiedOnChain ? "Video verified on-chain!" : "6. Verify (on-chain) and mint proof token"}
                </button>
              </div>
              <div className="flex justify-center">
                <button
                  className="btn btn-ghost text-error underline normal-case"
                  onClick={() => {
                    setVerifiedFrontend(false);
                  }}
                >
                  Reset
                </button>
              </div>
              <div className="text-center text-xl">
                {yourBalance && yourBalance >= 1n ? "🎉 🍾 proof verified in contract!!! 🥂 🎊" : ""}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center mt-24">
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-center">
              <h2 className="card-title text-2xl bold">Verify video</h2>
            </div>
            <div className="flex flex-col gap-4 mt-6">
              <div className="tooltip" data-tip="Upload your video">
                <button className="btn btn-secondary w-full tooltip">
                  Upload video
                </button>
              </div>
              <div className="tooltip" data-tip="Verify the uploaded video">
                <button className="btn btn-secondary w-full tooltip">
                  Verify video
                </button>
              </div>
              <div className="flex justify-center">
                <button
                  className="btn btn-ghost text-error underline normal-case"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
