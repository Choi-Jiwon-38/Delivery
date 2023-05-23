"use strict";

const { Gateway, Wallets } = require("fabric-network");
const path = require("path");
const fs = require("fs");

const { create } = require("ipfs-http-client");
const ipfs = create({
  host: "localhost",
  port: 5002,
});

var http = require("http");
var formidable = require("formidable");
var url = require("url");
var request = require("request");
var userid = "appUser";

async function AddIPFSHash(userid, sn, hash) {
  try {
    const ccpPath = path.resolve(__dirname, "..", "connection-org1.json");
    let ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    const walletPath = path.join(process.cwd(), "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    const identity = await wallet.get(userid);
    if (!identity) {
      console.log(
        'An identity for the user "appUser" does not exist in the wallet'
      );
      console.log("Run the registerUser.js application before retrying");
      return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: userid,
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork("mychannel");

    const contract = network.getContract("delivery");

    await contract.submitTransaction("AddIPFSHash", sn, hash);
    console.log("Transaction has been submitted");

    await gateway.disconnect();
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
  }
}

async function DeleteIPFSHash(userid, sn) {
  try {
    const ccpPath = path.resolve(__dirname, "..", "connection-org1.json");
    let ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    const walletPath = path.join(process.cwd(), "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    const identity = await wallet.get(userid);
    if (!identity) {
      console.log(
        'An identity for the user "appUser" does not exist in the wallet'
      );
      console.log("Run the registerUser.js application before retrying");
      return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: userid,
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork("mychannel");

    const contract = network.getContract("delivery");

    await contract.submitTransaction("DeleteIPFSHash", sn);
    console.log("Transaction has been submitted");

    await gateway.disconnect();
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
  }
}

async function AddNewDeliverer(userid, sn, user) {
  try {
    const ccpPath = path.resolve(__dirname, "..", "connection-org1.json");
    let ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    const walletPath = path.join(process.cwd(), "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    const identity = await wallet.get(userid);
    if (!identity) {
      console.log(
        'An identity for the user "appUser" does not exist in the wallet'
      );
      console.log("Run the registerUser.js application before retrying");
      return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: userid,
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork("mychannel");

    const contract = network.getContract("delivery");

    await contract.submitTransaction("AddNewDeliverer", sn, user);
    console.log("Transaction has been submitted");

    await gateway.disconnect();
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
  }
}

async function showList(userid, sn) {
  try {
    const ccpPath = path.resolve(__dirname, "..", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    const walletPath = path.join(process.cwd(), "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    const identity = await wallet.get(userid);
    if (!identity) {
      console.log(
        'An identity for the user "appUser" does not exist in the wallet'
      );
      console.log("Run the registerUser.js application before retrying");
      return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: userid,
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork("mychannel");

    const contract = network.getContract("delivery");

    const result = await contract.evaluateTransaction("ShowDeliverers", sn);

    console.log(
      `Transaction has been evaluated, result is: ${result.toString()}`
    );
    return result;

    // Disconnect from the gateway.
    await gateway.disconnect();
  } catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
  }
}

function GetDeliveryHtml(result) {
  let owners = result["deliverer"];
  let ownerstr =
    "<table border=1> <caption> Deliverer List </caption><tr><th> Name </th> <th> Date & Time </th> </tr>";

  for (let i = 0; i < owners.length; i++) {
    let timestr = new Date(parseInt(owners[i][1] * 1000));
    ownerstr +=
      "<tr> <td>" +
      owners[i][0] +
      "</td><td> " +
      timestr.toLocaleString() +
      " </td></tr>";
  }
  ownerstr += "</table>";
  console.log(ownerstr);
  console.log(JSON.stringify(result));
  return ownerstr;
}

async function gateWayPage(req, res) {
  if (req.url.startsWith("/adddeliverer")) {
    var form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
      let sn = fields.sn;
      let user = fields.userid;
      console.log(sn, user);
      await AddNewDeliverer(userid, sn, user);
      res.write(`success adddeliverer: ${sn} ${user}`);
      return res.end();
    });
  } else if (req.url.startsWith("/show")) {
    let method = req.method;
    console.log(req.url);
    if (method == "GET") {
      let queryData = url.parse(req.url, true).query;
      let sn = queryData.sn;
      if (sn == undefined || sn == "") {
        res.write("sn error: sn is missing");
        return res.end();
      }
      var result = await showList(userid, sn);
      if (result == undefined) {
        res.write("show error: info of sn does not exists: " + sn);
      } else {
        result = JSON.parse(result);
        let deliveryhtml = GetDeliveryHtml(result);
        res.write(deliveryhtml);
      }
      return res.end();
    }
  } else if (req.url.startsWith("/uploadFile")) {
    var form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
      if (err) {
        console.error("Failed to parse form data: ", err);
        return res.status(500).send("Failed to parse form data.");
      }
      let sn = fields.sn;
      let user = fields.userid; // is never used -> undefined
      const file = files.file; // get file object

      if (!file || !file.filepath) {
        console.error("Invalid file path: ", file);
        return res.status(400).send("Invalid file path.");
      }
      const fileBuffer = fs.readFileSync(file.filepath); // read file data

      if (sn == undefined || sn == "") {
        res.write("sn error: sn is missing");
        return res.end();
      }
      if (file == undefined || file == "") {
        res.write("file error: file is missing");
        return res.end();
      }
      const ipfsFile = await ipfs.add(fileBuffer);
      const hash = ipfsFile.cid.toString();

      await AddIPFSHash(userid, sn, hash);
      res.write(`success addipfshash: ${sn} ${hash}`);

      return res.end();
    });
  } else if (req.url.startsWith("/deleteFile")) {
    var form = new formidable.IncomingForm();
    form.parse(req, async function(err, fields) {
      if (err) {
  	console.error("Failed to parse form data: ", err);
	return res.status(500).send("Failed to parse form data.");
      }

      let sn = fields.sn;
     
      if (sn == undefined || sn == "") {
        res.write("sn error: sn is missing");
	return res.end();
      }
      
      await DeleteIPFSHash(userid, sn);
      res.write(`success deleteipfshash: ${sn}`);

      return res.end();
    })
  } else {
    var fname = "." + url.parse(req.url).pathname;
    if (url.parse(req.url).pathname == "/") fname = "./deliverymain.html";
    fs.readFile(fname, async function (err, data) {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/html" });
        return res.end("404 Not Found");
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(data);
      return res.end();
    });
  }
}
try {
  http.createServer(gateWayPage).listen(8080);
} catch (err) {
  console.log(err);
}
