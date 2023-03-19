import { ThirdwebProvider } from "@thirdweb-dev/react";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { ethers } from "ethers";

import './App.css';
import { useEffect, useState } from 'react';

import logo from './images/logo.png';

import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Stack from 'react-bootstrap/Stack';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

const chainIdList = [
  { id: 1, name: "eth" },
  { id: 5, name: "goerli" },
  { id: 137, name: "polygon" },
  { id: 80001, name: "mumbai" }
]

const getAccount = async () => {
  try {
    const account = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (account.length > 0) {
      return account[0];
    } else {
      return "";
    }
  } catch (err) {
    if (err.code === 4001) {
      // EIP-1193 userRejectedRequest error
      // If this happens, the user rejected the connection request.
      console.log('Please connect to MetaMask.');
    } else {
      console.error(err);
    }
    return "";
  }
}

const handleAccountChanged = async (accountNo, setAccount, setChainId, setNfts, setCollections, setChainName) => {

  const account = await getAccount();
  setAccount(account);//walletID

  const chainId = await getChainID();
  setChainId(chainId);//メタマスクで設定されているチェーン

  const chainName = await getChainName(chainId);
  setChainName(chainName);

  const web3ApiKey = 'uhLjLGW17H6xB1OxUtYRwz3O37P669YncgUETfC1z3JVqPMoRqexUsYaZgjMoTmY';
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'X-API-Key': web3ApiKey
    }
  };

  const resNftData = await fetch(`https://deep-index.moralis.io/api/v2/${account}/nft?chain=${chainName}`, options);
  const resNft = await resNftData.json();
  console.log(JSON.stringify(resNft));

  let nfts = [];
  for (let nft of resNft.result) {
    const tmp = JSON.parse(nft.metadata);
    console.log(JSON.stringify(tmp));
    if (tmp !== null) {//MetaguriのNFTだったらに変更///////////////////////////
      const nftinfo = {
        contract_name: nft.name,
        image: tmp.image !== "" ? `https://ipfs.io/ipfs/${tmp.image.substring(7)}` : "",
        nft_name: tmp.name,
        present_detail: "いちご",//Airtableから引っ張ってくる/////////////
        token_address: nft.token_address
      }
      nfts.push(nftinfo);
    }
  }

  //発行日でソート
  setNfts(nfts.sort((a, b) => {
    var r = 0;
    if (a.issue_date > b.issue_date) { r = -1; }
    else if (a.issue_date < b.issue_date) { r = 1; }

    return r;
  }));
  /*
    const resCollectionData = await fetch(`https://deep-index.moralis.io/api/v2/${account}/nft/collections?chain=${chainName}`, options);
    const resCollection = await resCollectionData.json();
    setCollections(resCollection.result);
  */
  /* 画面遷移
    window.history.replaceState('', '', account);
    */
}

const getChainName = async (chainId) => {
  let data = chainIdList.filter(function (item) {
    return item.id === chainId;
  });

  return data[0].name;
}

const getChainID = async () => {
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  return parseInt(chainId);
}

const handleCollectonSelect = async (chainName, setSelectedCollection, setSelectedCollectionName, setMintedNfts) => {
  let selectedCollection = "";
  let elements = document.getElementsByName('collections');
  for (let i in elements) {
    if (elements.item(i).checked) {
      selectedCollection = elements.item(i).id;
      setSelectedCollection(selectedCollection);
      setSelectedCollectionName(elements.item(i).value);
    }
  }

  const web3ApiKey = '27XAH0PFnvHnMN7EgbXAQiQH5ycsAuE3dduoJVtE5EQFwVklhnFTebDxlAiihvgV';
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'X-API-Key': web3ApiKey
    }
  };

  const resNftData = await fetch(`https://deep-index.moralis.io/api/v2/nft/${selectedCollection}?chain=${chainName}&format=decimal`, options);
  const resNft = await resNftData.json();
  let nfts = [];
  for (let nft of resNft.result) {
    const tmp = JSON.parse(nft.metadata);
    if (tmp !== null) {
      if ("attributes" in tmp) {
        let issue_date = "";
        let issuer_name = "";
        let owner_address = "";
        let genre = "";
        for (const attribute of tmp.attributes) {
          if (attribute.trait_type === "exp_type") {
            genre = attribute.value;
          } else if (attribute.trait_type === "ca_name" || attribute.trait_type === "issuer_name") {
            issuer_name = attribute.value;
          } else if (attribute.trait_type === "owner_address") {
            owner_address = attribute.value;
          } else if (attribute.trait_type === "cert_date" || attribute.trait_type === "issue_date") {
            issue_date = attribute.value.substring(0, 4) + "/" + attribute.value.substring(4, 6) + "/" + attribute.value.substring(6);
          }
        }

        const nftinfo = {
          name: tmp.name,
          image: tmp.image !== "" ? `https://ipfs.io/ipfs/${tmp.image.substring(7)}` : "",
          issue_date: issue_date,
          issuer_name: issuer_name,
          owner_address: owner_address,
          genre: genre,
          description: tmp.description,
          token_address: nft.token_address
        }

        nfts.push(nftinfo);
      }
    }
  }
  setMintedNfts(nfts.sort((a, b) => {
    var r = 0;
    if (a.issue_date > b.issue_date) { r = -1; }
    else if (a.issue_date < b.issue_date) { r = 1; }

    return r;
  }));
}

const handleNewContract = async (account, chainName, setDisable, setCollections, setShowNewToken) => {
  setDisable(true);

  let cn = chainName;
  if (chainName === "eth") {
    cn = "mainnet";
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = await provider.getSigner();
  const sdk = ThirdwebSDK.fromSigner(signer, cn);

  const contractAddress = await sdk.deployer.deployNFTCollection({
    name: document.getElementById("token_name").value,
    symbol: document.getElementById("token_symbol").value,
    primary_sale_recipient: account,
  });

  const metadata = {
    name: "First NFT",
    description: "First NFT to show in Q list.",
    image: "",
  };

  const contract = await sdk.getContract(contractAddress);
  await contract.erc721.mint(metadata);

  setDisable(false);
  setShowNewToken(false);

  document.getElementById("reloadContract").click();

}

const handleMint = async (selectedCollection, chainName, setDisable, setMintedNfts, setShow) => {
  setDisable(true);

  let cn = chainName;
  if (chainName === "eth") {
    cn = "mainnet";
  }

  const account = await getAccount();
  const issue_date = document.getElementById("issue_date").value.replace(/[^0-9]/g, "");
  const owner = document.getElementById("owner").value;
  const title = document.getElementById("exp_type").value;
  const issuer_name = document.getElementById("issuer_name").value;
  const exp_type = document.getElementById("exp_type").value;
  const description = document.getElementById("description").value;

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = await provider.getSigner();

  const sdk = ThirdwebSDK.fromSigner(signer, cn);
  const contract = await sdk.getContract(selectedCollection);

  const walletAddress = owner;
  const metadata = {
    name: title,
    description: description,
    image: document.getElementById("image").files[0],
    attributes: [
      { trait_type: "issue_date", value: issue_date },
      { trait_type: "exp_type", value: exp_type },
      { trait_type: "issuer_address", value: account },
      { trait_type: "issuer_name", "value": issuer_name },
      { trait_type: "owner_address", "value": owner },
    ]
  };
  await contract.erc721.mintTo(walletAddress, metadata);


  const url = 'https://7iqg4cc3ca2nuy6oqrjchnuige0rqzcu.lambda-url.ap-northeast-1.on.aws/';
  const method = 'POST';
  const submitBody = {
    to: document.getElementById("email").value,
    from: issuer_name,
    chainName: cn,
    title: title,
    description: description,
    owner_address: owner
  };
  const body = JSON.stringify(submitBody);

  fetch(url, { method, body })
    .then((res) => {
      console.log(res.status);
      if (res.ok) {
        return res.json()
          .then((resJson) => {
            setDisable(false);
            setShow(false);

            document.getElementById("reloadCollection").click();
          })
      }
    })
    .catch((error) => {
      console.log(error);
    });

}

const handleLogout = async () => {
  window.location.href = "/";
}


function App() {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(0);
  const [chainName, setChainName] = useState("");
  // const [index, setIndex] = useState(0);
  const [disable, setDisable] = useState(false);
  const [show, setShow] = useState(false);
  const [showNewToken, setShowNewToken] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [nfts, setNfts] = useState([]);
  const [selectedNft, setSelectedNft] = useState({});
  const [collections, setCollections] = useState([]);
  const [mintedNfts, setMintedNfts] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedCollectionName, setSelectedCollectionName] = useState("");

  const location = window.location.pathname.toLowerCase();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const handleCloseNewToken = () => setShowNewToken(false);
  const handleShowNewToken = () => setShowNewToken(true);
  const handleCloseDetail = () => setShowDetail(false);
  const handleShowDetail = async (nft) => {
    setSelectedNft(nft);
    setShowDetail(true);
  }

  // const handleSelect = (selectedIndex, e) => {
  //   setIndex(selectedIndex);
  // };

  const initializeAccount = async () => {
    const account = getAccount();
    if (account !== "") {
      await handleAccountChanged(account, setAccount, setChainId, setNfts, setCollections, setChainName);
    }
  };

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on("accountsChanged", (accountNo) => handleAccountChanged(accountNo, setAccount, setChainId, setNfts, setCollections, setChainName));
      window.ethereum.on("chainChanged", (accountNo) => handleAccountChanged(accountNo, setAccount, setChainId, setNfts, setCollections, setChainName));
    } else {
      window.addEventListener('ethereum#initialized', initializeAccount, {
        once: true,
      });

      setTimeout(initializeAccount, 3000); // 3 seconds
    }
  }, [account]);

  return (
    <div className="App d-flex flex-column">
      <div className="mb-auto w-100">
        <>
          <Navbar>
            <Container>
              <Navbar.Brand href="#home"><img src={logo} width="250" /></Navbar.Brand>
              <Navbar.Toggle />
              <Navbar.Collapse className="justify-content-end">
                <Navbar.Text>
                  <Button className="py-2 px-4 btn-lg" variant="outline-dark" id="GetAccountButton" onClick={initializeAccount}>MetaMaskに接続</Button>
                </Navbar.Text>
              </Navbar.Collapse>
            </Container>
          </Navbar>
          <Container className="my-1 p-1">
            <Navbar expand="lg">
              <Container className="mx-0 px-0">
                <Nav>
                  <Stack className="left-align">
                    <div>
                      <h3>
                        保有NFT一覧
                        <Button id="reloadNft" className="mb-1" variant="text" onClick={() => handleAccountChanged(account, setAccount, setChainId, setNfts, setCollections, setChainName)}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z" />
                            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
                          </svg>
                        </Button>
                      </h3>
                    </div>
                    <div><p><small>このウォレットにある「MetagriLabo Thanks Gift（MLTG）」の一覧です。</small></p></div>
                  </Stack>
                </Nav>
              </Container>
            </Navbar>
            <Table className="table-hover" responsive={true}>
              <thead className="table-secondary">
                <tr>
                  <th>画像</th>
                  <th>コントラクト</th>
                  <th>NFT名</th>
                  <th>もらえるもの</th>
                  <th>引き換え</th>
                </tr>
              </thead>
              <tbody>
                {nfts.length !== 0 ? (nfts.map((nft, index) => {
                  return (
                    <tr key={index} className="align-middle">
                      <td>{nft.image !== "" ? <a href={nft.image} target="_blank" rel="noreferrer"><img src={nft.image} alt="nftimage" width="70px" /></a> : <></>}</td>
                      <td>{nft.contract_name}</td>
                      <td>{nft.nft_name}</td>
                      <td>{nft.present_detail}</td>
                      <td><Button className="px-4" variant="outline-dark" onClick={() => handleShowDetail(nft)}>引き換え</Button></td>
                    </tr>
                  );
                })) : (
                  <></>
                )}
              </tbody>
            </Table>

          </Container>
        </>

      </div>

      <footer className="mt-auto p-3">
        Ideated by Studymeter Inc.
      </footer>
    </div>
  );
}

export default App;