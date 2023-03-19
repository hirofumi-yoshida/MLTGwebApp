import { ThirdwebProvider } from "@thirdweb-dev/react";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { ethers } from "ethers";

import './App.css';
import { useEffect, useState } from 'react';

import logoicon from './images/logoicon.png';
import about from './images/about.png';
import about2 from './images/about2.png';
import metamask from './images/metamask.svg';

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
  {id: 1, name: "eth"},
  {id: 5, name: "goerli"},
  {id: 137, name: "polygon"},
  {id: 80001, name: "mumbai"}
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
  setAccount(account);

  const chainId = await getChainID();
  setChainId(chainId);

  const chainName = await getChainName(chainId);
  setChainName(chainName);

  const web3ApiKey = '27XAH0PFnvHnMN7EgbXAQiQH5ycsAuE3dduoJVtE5EQFwVklhnFTebDxlAiihvgV';
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'X-API-Key': web3ApiKey
    }
  };

  const resNftData = await fetch(`https://deep-index.moralis.io/api/v2/${account}/nft?chain=${chainName}`, options);
  const resNft = await resNftData.json();

  let nfts = [];
  for (let nft of resNft.result) {
    const tmp = JSON.parse(nft.metadata);
    console.log(JSON.stringify(tmp));
    if (tmp !== null) {
      if ("attributes" in tmp) {
        let issue_date = "";
        let issuer_name = "";
        let issuer_address = "";
        let genre = "";
        for (const attribute of tmp.attributes) {
          if (attribute.trait_type === "exp_type") {
            genre = attribute.value;
          } else if (attribute.trait_type === "ca_name" || attribute.trait_type === "issuer_name") {
            issuer_name = attribute.value;
          } else if (attribute.trait_type === "ca_address" || attribute.trait_type === "issuer_address") {
            issuer_address = attribute.value;
          } else if (attribute.trait_type === "cert_date" || attribute.trait_type === "issue_date") {
            issue_date = attribute.value.substring(0,4) + "/" +  attribute.value.substring(4,6) + "/" + attribute.value.substring(6);
          }
        }

        const nftinfo = {
          name: tmp.name,
          image: tmp.image !== "" ? `https://ipfs.io/ipfs/${tmp.image.substring(7)}` : "",
          issue_date: issue_date,
          issuer_name: issuer_name,
          issuer_address: issuer_address,
          genre: genre,
          description: tmp.description,
          token_address: nft.token_address
        }

        nfts.push(nftinfo);
      }
    }
  }

  setNfts(nfts.sort(( a, b ) => {
    var r = 0;
    if( a.issue_date > b.issue_date ){ r = -1; }
    else if( a.issue_date < b.issue_date ){ r = 1; }
  
    return r;
  }));

  const resCollectionData = await fetch(`https://deep-index.moralis.io/api/v2/${account}/nft/collections?chain=${chainName}`, options);
  const resCollection = await resCollectionData.json();
  setCollections(resCollection.result);

  window.history.replaceState('','',account);
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
    if (elements.item(i).checked){
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
            issue_date = attribute.value.substring(0,4) + "/" +  attribute.value.substring(4,6) + "/" + attribute.value.substring(6);
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
  setMintedNfts(nfts.sort(( a, b ) => {
    var r = 0;
    if( a.issue_date > b.issue_date ){ r = -1; }
    else if( a.issue_date < b.issue_date ){ r = 1; }
  
    return r;
  }));
}

const handleNewContract = async (account, chainName, setDisable, setCollections, setShowNewToken) => {
  setDisable(true);

  let cn = chainName;
  if(chainName === "eth") {
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
  if(chainName === "eth") {
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
      {trait_type:"issue_date",value: issue_date},
      {trait_type:"exp_type",value:exp_type},
      {trait_type:"issuer_address",value:account},
      {trait_type:"issuer_name","value":issuer_name},
      {trait_type:"owner_address","value":owner},
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
      await handleAccountChanged(account, setAccount, setChainId, setNfts, setCollections,setChainName);
    }
  };

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
        window.ethereum.on("accountsChanged", (accountNo) => handleAccountChanged(accountNo, setAccount, setChainId, setNfts, setCollections,setChainName));
        window.ethereum.on("chainChanged", (accountNo) => handleAccountChanged(accountNo, setAccount, setChainId, setNfts, setCollections,setChainName));
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
        {location === "/" ? (
          <>
            <Container className="my-5 p-5">
              <img src={logoicon} className="title-img mb-5" alt="logoicon"/>
              <h1 className="text-big mb-5">世界中の挑戦を<br />ブロックチェーンに記録</h1>
              <Button className="py-2 px-4 btn-lg" variant="outline-dark" id="GetAccountButton" onClick={initializeAccount}>MetaMaskに接続</Button>
              <br />
              <small className="mt-5">Google ChromeとMetaMaskのインストールされたPCで利用可能です。</small>
            </Container>
            <Container className="content">
              <Row className="align-items-center row-margin">
                <Col sm={5} className="p-5"><img src={about} className="img-fluid lp-img" alt="about"></img></Col>
                <Col sm={7} className="left-align p-3"> 
                  <h1 className="text-big mb-5">Web3時代に、<br />証明書はいらない。</h1>
                  <h4 className="mb-4">Qは、学校の卒業歴や社会活動への参加歴など、様々な経歴情報をブロックチェーンに記録できるシステムです。<br />人生を通じて挑戦・経験したことをNFTの「証明トークン」に記録し、積み上げることで、学歴や保有資格だけでは測れなかった、その人の本当の魅力を可視化します。</h4>
                </Col>
              </Row>
              <Row className="align-items-center row-margin">
                <Col sm={7} className="left-align p-3"> 
                  <h1 className="text-big mb-5">誰でも贈り、受け取れる。</h1>
                  <h4 className="mb-4">Qを使うと、誰でも証明トークンを発行したり、自分が受け取った証明トークンの一覧を見ることができます。<br />これからは、学校が発行する卒業証書だけではなく、仲間同士で感謝を伝え合ったり、自分自身の学習記録を残したりすることも、すべてあなたの経歴につながります。</h4>
                </Col>
                <Col sm={5} className="p-3"><img src={about2} className="img-fluid lp-img" alt="about2"></img></Col>
              </Row>
              <Row className="align-items-center row-margin">
                <Col sm={5} className="p-3"><img src={metamask} alt="metamask"></img></Col>
                <Col sm={7} className="left-align p-3"> 
                  <h1 className="text-big mb-5">Qを集める冒険に出よう！</h1>
                  <h4 className="mb-4">証明書を発行したり、受け取ったりするためには、NFTを管理するためのウォレットアプリ「MetaMask」が必要です。<br />くわしいQのはじめかたは、Discordのコミュニティで紹介しています。</h4>
                  <Button className="py-2 px-4 btn-lg" variant="outline-dark" href="https://discord.gg/mvWHWKhNgr" target="_blank" rel="noreferrer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-discord" viewBox="0 0 16 16">
                      <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/>
                    </svg>
                    　コミュニティに参加
                  </Button>
                </Col>
              </Row>
            </Container>
          </>
        ) : (
          <>
            <Navbar className="headernav" expand="lg">
              <Container className="align-items-center">
                <Navbar.Brand>
                  <img src={logoicon}  height="40px" alt="logoicon"/>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                <Navbar.Collapse id="responsive-navbar-nav">
                  <Nav className="me-auto">
                  </Nav>
                  <Nav>
                    <Navbar.Text>
                      <Button id="openhelp" className="mb-1 me-2" variant="text" href="https://discord.gg/mvWHWKhNgr" target="_blank" rel="noreferrer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-question-circle" viewBox="0 0 16 16">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                          <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
                        </svg>
                      </Button>
                      {account ? (
                        <>
                          <span className="me-2">ネットワーク: {chainName}</span>
                          <Button className="px-4" variant="outline-dark" onClick={handleLogout}>接続を解除する</Button>
                        </>
                      ) : (
                        <Button className="px-4" variant="dark" onClick={initializeAccount}>MetaMaskと接続</Button>
                      )}
                    </Navbar.Text>
                  </Nav>
                </Navbar.Collapse>
              </Container>
            </Navbar>
            <ThirdwebProvider desiredChainId={chainId}>
              <Container className="mt-5">
                <Tabs
                  defaultActiveKey="receive"
                  id="uncontrolled-tab-example"
                  className="mb-3"
                >
                  <Tab eventKey="receive" title="受け取る">
                    <Navbar expand="lg">
                      <Container className="mx-0 px-0">
                        <Nav>
                          <Stack className="left-align">
                            <div>
                              <h3>
                                あなたの経歴
                                <Button id="reloadNft" className="mb-1" variant="text" onClick={() => handleAccountChanged(account, setAccount, setChainId, setNfts, setCollections,setChainName)}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                                    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                                  </svg>
                                </Button>
                              </h3>
                            </div>
                            <div><p><small>このウォレットで受け取った証明書の一覧です。</small></p></div>
                          </Stack>
                        </Nav>
                      </Container>
                    </Navbar>

                    <Table className="table-hover" responsive={true}>
                      <thead className="table-secondary">
                        <tr>
                          <th>画像</th>
                          <th>日付</th>
                          <th>発行者</th>
                          <th>証明すること</th>
                          <th>メッセージ</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {nfts.length !== 0 ? (nfts.map((nft, index) => {
                          return (
                            <tr key={index} className="align-middle">
                              <td>{nft.image !== "" ? <a href={nft.image}  target="_blank" rel="noreferrer"><img src={nft.image} alt="nftimage" width="70px" /></a> : <></>}</td>
                              <td>{nft.issue_date}</td>
                              <td>{nft.issuer_name}</td>
                              <td>{nft.name}</td>
                              <td>{nft.description.length > 20 ? nft.description.substring(0, 20)+'...' : nft.description}</td>
                              <td><Button className="px-4" variant="outline-dark" onClick={() => handleShowDetail(nft)}>詳細</Button></td>
                            </tr>
                          );  
                        })) : (
                          <></>
                        )}
                      </tbody>
                    </Table>
                  </Tab>
                  <Tab eventKey="mint" title="発行する">
                    <Navbar expand="lg">
                      <Container className="mx-0 px-0">
                        <Nav>
                          <Stack className="left-align">
                            <div>
                              <h3>
                                発行者一覧
                                <Button id="reloadContract" variant="text" className="mb-1" onClick={() => handleAccountChanged(account, setAccount, setChainId, setNfts, setCollections,setChainName)}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                                    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                                  </svg>
                                </Button>
                              </h3>
                            </div>
                            <div><p><small>このウォレットで登録した発行者の一覧です。選択した発行者名で証明を発行します。<br />※新しく登録した発行者がブロックチェーンに記録されるまで数分かかる場合があります。リロードボタンを押下してください。</small></p></div>
                          </Stack>
                        </Nav>
                        <Nav className="justify-content-end">
                          {account === location.substring(1) ? (
                            <Button className="px-4" variant="outline-dark" onClick={handleShowNewToken}>発行者を登録する</Button>
                          ) : (
                            <></>
                          )}
                        </Nav>
                      </Container>
                    </Navbar>
                    <Table className="table-hover mb-5">
                      <thead className="table-secondary">
                        <tr>
                          <th>選択</th>
                          <th>発行者名</th>
                          <th>単位</th>
                          <th>発行者アドレス</th>
                        </tr>
                      </thead>
                      <tbody>
                        {collections.length !== 0 ? (collections.map((collection, index) => {
                          return (
                            <tr key={index}>
                              <td><input className="form-check-input" type="radio" name="collections" id={collection.token_address} value={collection.name} onClick={() => handleCollectonSelect(chainName, setSelectedCollection, setSelectedCollectionName, setMintedNfts)} /></td>
                              <td>{collection.name}</td>
                              <td>{collection.symbol}</td>
                              <td>
                                <OverlayTrigger
                                  key="copy"
                                  placement="top"
                                  overlay={
                                    <Tooltip>コピー</Tooltip>
                                  }
                                >
                                  <Button variant="text" size="sm" onClick={()=>{navigator.clipboard.writeText(collection.token_address);}}>
                                    {collection.token_address.substring(0,4)}...{collection.token_address.substring(38)}
                                    <span className="ms-2">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-clipboard" viewBox="0 0 16 16">
                                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                                      </svg>
                                    </span>
                                  </Button>
                                </OverlayTrigger>
                              </td>
                            </tr>
                          );  
                        })) : (
                          <></>
                        )}
                      </tbody>
                    </Table>

                    <Navbar expand="lg">
                      <Container className="mx-0 px-0">
                        <Nav>
                          <Stack className="left-align">
                            <div>
                              <h3>
                                証明を発行する
                                <Button id="reloadCollection" className="mb-1" variant="text" onClick={() => handleCollectonSelect(chainName, setSelectedCollection, setSelectedCollectionName, setMintedNfts)}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                                    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                                  </svg>
                                </Button>
                              </h3>
                            </div>
                            <div><p><small>選択した発行者から証明トークンを発行し、相手のウォレットアドレスに送信します。<br />※新しく登録した証明トークンがブロックチェーンに記録されるまで数分かかる場合があります。リロードボタンを押下してください。</small></p></div>
                          </Stack>
                        </Nav>
                        <Nav className="justify-content-end">
                          {selectedCollection !== "" ? (
                            <Button className="px-4" variant="outline-dark" onClick={handleShow} >証明トークンを発行する</Button>
                          ) : (
                            <></>
                          )}
                        </Nav>
                      </Container>
                    </Navbar>
                    <Table className="table-hover mb-5">
                      <thead className="table-secondary">
                        <tr>
                          <th>画像</th>
                          <th>日付</th>
                          <th>受取者アドレス</th>
                          <th>証明すること</th>
                          <th>説明</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mintedNfts.length !== 0 ? (mintedNfts.map((nft, index) => {
                          return (
                            <tr key={index} className="align-middle">
                              <td><td>{nft.image !== "" ? <a href={nft.image}  target="_blank" rel="noreferrer"><img src={nft.image} alt="nftimage" width="70px" /></a> : <></>}</td></td>
                              <td>{nft.issue_date}</td>
                              <td>
                                <OverlayTrigger
                                  key="copy"
                                  placement="top"
                                  overlay={
                                    <Tooltip>コピー</Tooltip>
                                  }
                                >
                                  <Button variant="text" size="sm" onClick={()=>{navigator.clipboard.writeText(nft.owner_address);}}>
                                    {nft.owner_address.substring(0,4)}...{nft.owner_address.substring(38)}
                                    <span className="ms-2">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16">
                                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                                      </svg>
                                    </span>
                                  </Button>
                                </OverlayTrigger>
                              </td>
                              <td>{nft.name}</td>
                              <td>{nft.description}</td>
                            </tr>
                          );  
                        })) : (
                          <></>
                        )}
                      </tbody>
                    </Table>

                    <Modal
                      show={showNewToken}
                      backdrop="static"
                      onHide={handleCloseNewToken}
                      size="md"
                      aria-labelledby="contained-modal-title-vcenter"
                      centered
                    >
                      <Modal.Header closeButton>
                        <Modal.Title>新しい発行者を登録する</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <Form>
                          <Form.Group className="mb-3">
                            <Form.Label>発行者名</Form.Label>
                            <Form.Control id="token_name" type="text"  placeholder="スタディメーター株式会社" />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>トークン単位(任意)</Form.Label>
                            <Form.Control id="token_symbol" type="text" placeholder="ETH" />
                          </Form.Group>
                        </Form>
                        <p><strong>ご確認ください</strong></p>
                        <ul>
                          <li><small>登録ボタン押下後、MetaMaskの画面が開き、ブロックチェーンの利用手数料（ガス代）の支払いが<strong className="text-danger">2回</strong>発生します。暗号資産の残高をご確認ください。2回目の支払いでキャンセルすると、1回目のガス代を取り戻すことができません。</small></li>
                        </ul>
                      </Modal.Body>
                      <Modal.Footer>
                        {disable === false ? (
                          <>
                            <Button className="px-4" variant="outline-dark" id="closeNewToken" onClick={handleCloseNewToken}>
                              <span>キャンセル</span>
                            </Button>
                            <Button className="px-4" variant="dark" onClick={() => handleNewContract(account, chainName, setDisable, setCollections, setShowNewToken)}>
                              <span>登録する</span>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button className="px-4" variant="outline-dark" id="closeNewToken" disabled="true">
                              <span>キャンセル</span>
                            </Button>
                            <Button className="px-4" variant="dark" disabled="true">
                              <span className="me-2 spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              <span>数分かかる場合があります...</span>
                            </Button>
                          </>
                        )}
                      </Modal.Footer>
                    </Modal>

                    <Modal
                      show={show}
                      backdrop="static"
                      onHide={handleClose}
                      size="lg"
                      aria-labelledby="contained-modal-title-vcenter"
                      centered
                    >
                      <Modal.Header closeButton>
                        <Modal.Title>新しい証明トークンを発行する</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <Form>
                          <Form.Group className="mb-3">
                            <Form.Label>発行者名</Form.Label>
                            <Form.Control id="issuer_name" type="text" value={selectedCollectionName} readOnly={true} />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>発行日（証明トークン自体は、発行直後に送信されます）</Form.Label>
                            <Form.Control id="issue_date" type="date" className="form-control datetimepicker-input" data-target="#datetimepicker1"/>
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>受取者のウォレットアドレス</Form.Label>
                            <Form.Control id="owner" type="text" placeholder="0x..." />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>証明すること</Form.Label>
                            <Form.Control id="exp_type" type="text" placeholder="講座修了、セミナー参加..." />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>メッセージ</Form.Label>
                            <Form.Control id="description" type="text" placeholder="○○講座の受講、ありがとうございました！" />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>画像</Form.Label>
                            <Form.Control id="image" type="file" />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>通知先メールアドレス</Form.Label>
                            <Form.Control id="email" type="email" placeholder="experience@studymeter-web.com" />
                            <Form.Text className="text-muted">
                              証明トークンが発行されたことをメールで通知します。このメールアドレスは、NFTに記録されません。
                            </Form.Text>
                          </Form.Group>
                        </Form>
                        <p><strong>ご確認ください</strong></p>
                        <ul>
                          <li><small>通知先メールアドレス以外の情報は、ブロックチェーン上で公開され、削除することができません。個人情報や機密情報を含めないよう、ご注意ください。</small></li>
                          <li><small>発行ボタン押下後、MetaMaskの画面が開き、ブロックチェーンの利用手数料（ガス代）の支払いが発生します。</small></li>
                        </ul>

                      </Modal.Body>
                      <Modal.Footer>
                        {disable === false ? (
                          <>
                            <Button className="px-4" variant="outline-dark" onClick={handleClose}>
                              キャンセル
                            </Button>
                            <Button className="px-4" variant="dark" onClick={() => handleMint(selectedCollection, chainName, setDisable, setMintedNfts, setShow)}>
                                発行する
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button className="px-4" variant="outline-dark" disabled={true}>
                              キャンセル
                            </Button>
                            <Button className="px-4" variant="dark" disabled={true}>
                              <span className="me-2 spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              <span>数分かかる場合があります...</span>
                            </Button>
                          </>
                        )}
                        
                      </Modal.Footer>
                    </Modal>

                    <Modal
                      show={showDetail}
                      backdrop="static"
                      onHide={handleCloseDetail}
                      size="md"
                      aria-labelledby="contained-modal-title-vcenter"
                      centered
                    >
                      <Modal.Header closeButton>
                        <Modal.Title>{selectedNft.name}</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <p className="text-center">
                          {selectedNft.image !== "" ? <a href={selectedNft.image}  target="_blank" rel="noreferrer"><img src={selectedNft.image} className="detail-img" alt="nftimage" /></a> : <></>}
                        </p>
                        <p className="my-3"><small>メッセージ</small> <br /> {selectedNft.description}</p>
                        <Row>
                          <Col>
                            <p>
                              <small>証明日</small><br />
                              {selectedNft.issue_date}
                            </p>
                          </Col>
                          <Col>
                            <p>
                              <small>発行者</small><br />
                              {selectedNft.issuer_name}
                            </p>
                          </Col>
                        </Row>
                        <p>
                          <small>発行者コントラクトアドレス</small>
                          <OverlayTrigger
                            key="copy"
                            placement="top"
                            overlay={
                              <Tooltip>コピー</Tooltip>
                            }
                          >
                            <Button className="mt-1 ps-0" variant="text" size="sm" onClick={()=>{navigator.clipboard.writeText(selectedNft.token_address);}}>
                              {selectedNft.token_address}
                              <span className="ms-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-clipboard" viewBox="0 0 16 16">
                                  <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                  <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                                </svg>
                              </span>
                            </Button>
                          </OverlayTrigger>
                        </p>
                        <Button variant="text" href={"https://twitter.com/intent/tweet?hashtags=QWeb3,証明トークン&text=「" + selectedNft.name + "」の証明書を受け取りました！" + selectedNft.image} target="_blank" rel="noreferrer">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-twitter" viewBox="0 0 16 16">
                            <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                          </svg>
                        </Button>
                        <Button variant="text" href={"https://www.facebook.com/sharer/sharer.php?u=" + selectedNft.image} target="_blank" rel="noreferrer">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-facebook" viewBox="0 0 16 16">
                            <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                          </svg>
                        </Button>
                        {/* <hr />
                        <p className="text-center mt-3 mb-0">
                          <Button className="text-danger" variant="link">
                            証明書を削除する
                          </Button>                        
                        </p>
                        <p className="text-center mt-0">
                          <small>削除操作は取り消せません。また、ガス代の支払いが必要です。</small>
                        </p> */}
                      </Modal.Body>
                    </Modal>

                  </Tab>
                </Tabs>
              </Container>
            </ThirdwebProvider>
          </>
        )}
        <Button className="bottomright" variant="text" href="https://discord.gg/mvWHWKhNgr" target="_blank" rel="noreferrer">
          <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="currentColor" className="bi bi-discord" viewBox="0 0 16 16">
            <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/>
          </svg>
          <br />
          <small className="icontitle">使い方はこちら</small>
        </Button>
      </div>  

      <footer className="mt-auto p-3">
        Ideated by Studymeter Inc.
      </footer>
    </div>
  );
}

export default App;
