const { expect } = require("chai");

const ctosol = (c) => {
  return c * 10 ** 7;
};

describe("ZKMAV", function () {
  it("uploads data", async function () {
    const ZKMAV = await ethers.deployContract('ZKMAV');
    const vd = {
      fileHash: '0xfce000106bf7ed55bd19e1bc9b67442efabb3ad20d66ce459238a0181037556c',
      signature: '0x74dddd29671a629c463d14799b4b026f7810e540884191ec624fa20ce35fa3f7',
      ipfsCID: '0x3062fee938a12dd64ba0b1380aee47e139c0b11382ef0bd9f2e055e89e2599ab',
      longitude: 52.4852321,
      latitude: 13.4355856
    };
    await ZKMAV.upload(vd.fileHash, vd.signature, vd.ipfsCID, ctosol(vd.longitude), ctosol(vd.latitude));
    const data = await ZKMAV.uploadedData(vd.fileHash);
    expect(data.signature).to.be.equal(vd.signature);
    expect(data.ipfsCID).to.be.equal(vd.ipfsCID);
    expect(data.location.longitude).to.be.equal(ctosol(vd.longitude));
    expect(data.location.latitude).to.be.equal(ctosol(vd.latitude));
  });
});
