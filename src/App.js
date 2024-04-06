import { ThirdwebProvider } from "@thirdweb-dev/react";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { ethers } from "ethers";

import "./App.css";
import { useEffect, useState } from "react";

import logo from "./images/logo.png";

import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/esm/Container";
import Navbar from "react-bootstrap/esm/Navbar";
import Nav from "react-bootstrap/esm/Nav";
import Row from "react-bootstrap/esm/Row";
import Col from "react-bootstrap/esm/Col";
import Tab from "react-bootstrap/esm/Tab";
import Tabs from "react-bootstrap/esm/Tabs";
import Button from "react-bootstrap/esm/Button";
import Table from "react-bootstrap/esm/Table";
import Modal from "react-bootstrap/esm/Modal";
import Form from "react-bootstrap/esm/Form";
import Stack from "react-bootstrap/esm/Stack";
import OverlayTrigger from "react-bootstrap/esm/OverlayTrigger";
import Tooltip from "react-bootstrap/esm/Tooltip";

const chainIdList = [
  { id: 1, name: "eth" },
  { id: 5, name: "goerli" },
  { id: 137, name: "polygon" },
  { id: 80001, name: "mumbai" },
];

const getAccount = async () => {
  try {
    const account = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (account.length > 0) {
      return account[0];
    } else {
      return "";
    }
  } catch (err) {
    if (err.code === 4001) {
      // EIP-1193 userRejectedRequest error
      // If this happens, the user rejected the connection request.
      console.log("Please connect to MetaMask.");
    } else {
      console.error(err);
    }
    return "";
  }
};

const handleAccountChanged = async (accountNo, setAccount, setChainId, setNfts, setCollections, setChainName) => {
  const account = await getAccount();
  setAccount(account); //walletID

  const chainId = await getChainID();
  setChainId(chainId); //メタマスクで設定されているチェーン

  const chainName = await getChainName(chainId);
  setChainName(chainName);

  console.log(process.env.WEB3_API_KEY); //thirdwebのAPIキー
  const web3ApiKey = "uhLjLGW17H6xB1OxUtYRwz3O37P669YncgUETfC1z3JVqPMoRqexUsYaZgjMoTmY";
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "X-API-Key": web3ApiKey,
    },
  };

  const resNftData = await fetch(`https://deep-index.moralis.io/api/v2/${account}/nft?chain=${chainName}`, options);
  const resNft = await resNftData.json();
  console.log(JSON.stringify(resNft));

  const hirosukeapi = 'patyTLuHtGlLraosF.8d6f778f55fc009bea73e9a9f41466b0b10be363b14e74d95b63af04b1fd1807';
  const optionInfo = {
    method: "GET",
    headers: {
      // Authorization: process.env.AIRTABLE_API_KEY, //AirTableのAPIキー
      Authorization: "Bearer patyTLuHtGlLraosF.8d6f778f55fc009bea73e9a9f41466b0b10be363b14e74d95b63af04b1fd1807",
    },
  };
  const resInfo = await fetch(
    //airTableに登録されているデータを取得
    `https://api.airtable.com/v0/appuYUHcDPRV7o8wx/tblnjog4lKdR2qZay`,
    optionInfo
  );
  const resInfoJson = await resInfo.json();
  const airtableData = resInfoJson.records;
  const nftData = resNft.result;

  // Airtableデータからインデックスを作成する関数
  const createIndex = (airtableData) => {
    const index = new Map();
    airtableData.forEach(entry => {
      const key = `${entry.fields.Contract_ID}|${entry.fields.Token_ID}`;
      index.set(key, entry);
    });
    return index;
  };

  // インデックスを使用して一致するデータを探す関数
  const findMatchingDataWithIndex = (airtableData, nftData) => {
    const index = createIndex(airtableData);
    const matchedEntries = [];
    let nfts = [];

    nftData.forEach(nft => {
      const key = `${nft.token_address}|${nft.token_id}`;
      if (index.has(key)) {
        const airtableEntry = index.get(key);
        matchedEntries.push({
          airtableId: airtableEntry.id,
          nftTokenId: nft.token_id,
          nftTokenAddress: nft.token_address,
          nftData: nft,  // nftデータ全体を保存
          airtableEntry: airtableEntry
        });
      }
    });

    // 一致したデータから新しいオブジェクト配列を作成
    const detailedEntries = matchedEntries.map(match => {
      const tmp = JSON.parse(match.nftData.metadata);
      return {
        contract_name: match.nftData.name,
        image: tmp.image !== "" ? `https://ipfs.io/ipfs/${tmp.image.substring(7)}` : "",
        nft_name: tmp.name,
        present_detail: match.airtableEntry.fields.Thanks_Gift,
        token_address: match.nftTokenAddress,
        token_id: match.nftTokenId,
        amount: match.nftData.amount,
        key_id: match.airtableEntry.fields.Key_ID,
      };
    });

    if (detailedEntries.length > 0) {
      detailedEntries.forEach(entry => {
        console.log('Detailed Entry:', entry);
        nfts.push(entry);
      });
    } else {
      console.log('No matches found.');
    }
    return (nfts);
  };

  // 関数を呼び出し
  const nfts = findMatchingDataWithIndex(airtableData, nftData);
  console.log(nfts);


  //発行日でソート
  setNfts(
    nfts.sort((a, b) => {
      var r = 0;
      if (a.issue_date > b.issue_date) {
        r = -1;
      } else if (a.issue_date < b.issue_date) {
        r = 1;
      }
      return r;
    })
  );

  // let nfts = [];
  // for (let nft of resNft.result) {
  //   const tmp = JSON.parse(nft.metadata);
  //   console.log(JSON.stringify(tmp));
  //   if (tmp !== null) {
  // const optionTokenInfo = {
  //   method: "GET",
  //   headers: {
  //     // Authorization: process.env.AIRTABLE_API_KEY, //AirTableのAPIキー
  //     Authorization: "Bearer keypjfrOALL1xCF3r",
  //   },
  // };
  // const resTokenInfo = await fetch(
  //   //airTableのNFTのaddressとIDを取得している
  //   `https://api.airtable.com/v0/appq0R9tJ2BkvKhRt/tbld2laNlKCi7B2GW?filterByFormula=AND(%7BContract_ID%7D%3D%22${nft.token_address}%22%2C%7BToken_ID%7D%3D${nft.token_id})`,
  //   optionTokenInfo
  // );
  // const resTokenInfoJson = await resTokenInfo.json();
  // if (resTokenInfoJson.records[0] !== undefined) {
  //   console.log(JSON.stringify(resTokenInfoJson.records[0]));
  //   const nftinfo = {
  //     contract_name: nft.name,
  //     image: tmp.image !== "" ? `https://ipfs.io/ipfs/${tmp.image.substring(7)}` : "",
  //     nft_name: tmp.name,
  //     present_detail: resTokenInfoJson.records[0].fields.Thanks_Gift,
  //     token_address: nft.token_address,
  //     token_id: nft.token_id,
  //     amount: nft.amount,
  //     key_id: resTokenInfoJson.records[0].fields.Key_ID,
  //   };
  //   nfts.push(nftinfo);
  // }
  //  }
  //}

};

const getChainName = async (chainId) => {
  let data = chainIdList.filter(function (item) {
    return item.id === chainId;
  });

  return data[0].name;
};

const getChainID = async () => {
  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  return parseInt(chainId);
};

//walletのNFTコレクションを取得する
const handleCollectonSelect = async (chainName, setSelectedCollection, setSelectedCollectionName, setMintedNfts) => {
  let selectedCollection = "";
  let elements = document.getElementsByName("collections");
  for (let i in elements) {
    if (elements.item(i).checked) {
      selectedCollection = elements.item(i).id;
      setSelectedCollection(selectedCollection);
      setSelectedCollectionName(elements.item(i).value);
    }
  }

  const web3ApiKey = "27XAH0PFnvHnMN7EgbXAQiQH5ycsAuE3dduoJVtE5EQFwVklhnFTebDxlAiihvgV";
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "X-API-Key": web3ApiKey,
    },
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
          token_address: nft.token_address,
        };

        nfts.push(nftinfo);
      }
    }
  }
  setMintedNfts(
    nfts.sort((a, b) => {
      var r = 0;
      if (a.issue_date > b.issue_date) {
        r = -1;
      } else if (a.issue_date < b.issue_date) {
        r = 1;
      }

      return r;
    })
  );
};

const handleNewContract = async (account, chainName, setDisable, setCollections, setShowNewToken) => {
  setDisable(true);

  let cn = chainName;
  if (chainName === "eth") {
    cn = "mainnet";
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
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
};

//ミントした場合の機能（未使用）
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
  await provider.send("eth_requestAccounts", []);
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
      { trait_type: "issuer_name", value: issuer_name },
      { trait_type: "owner_address", value: owner },
    ],
  };
  await contract.erc721.mintTo(walletAddress, metadata);

  const url = "https://7iqg4cc3ca2nuy6oqrjchnuige0rqzcu.lambda-url.ap-northeast-1.on.aws/";
  const method = "POST";
  const submitBody = {
    to: document.getElementById("email").value,
    from: issuer_name,
    chainName: cn,
    title: title,
    description: description,
    owner_address: owner,
  };
  const body = JSON.stringify(submitBody);

  fetch(url, { method, body })
    .then((res) => {
      console.log(res.status);
      if (res.ok) {
        return res.json().then((resJson) => {
          setDisable(false);
          setShow(false);

          document.getElementById("reloadCollection").click();
        });
      }
    })
    .catch((error) => {
      console.log(error);
    });
};

const handleLogout = async () => {
  window.location.href = "/";
};

const handleSubmit = async (account, nft, chainName, size, otherSize, handleClose, setIsSubmitting) => {
  let cn = chainName;
  if (chainName === "eth") {
    cn = "mainnet";
  }
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  const sdk = ThirdwebSDK.fromSigner(signer, cn);
  const contract = await sdk.getContract(nft.token_address);

  const walletAddress = "0x6D8Dd5Cf6fa8DB2be08845b1380e886BFAb03E07";

  const amount = 1;

  const tokenId = nft.token_id;

  const name = document.getElementById("Name").value;
  const zipCode = document.getElementById("Zip_Code").value;
  const address = document.getElementById("Address").value;
  const tel = document.getElementById("Tel").value;
  const mail = document.getElementById("Mail").value;
  // const otherSizeElement = document.getElementById("Other-size");
  // const otherSize = otherSizeElement ? otherSizeElement.value : "";

  // 確認ダイアログのメッセージ
  let confirmMessage = `
  以下の情報で送信してもよろしいですか？
  
  名前: ${name}
  郵便番号: ${zipCode}
  住所: ${address}
  電話番号: ${tel}
  メール: ${mail}\n`;
  if (size) confirmMessage += `  サイズ: ${size}\n`;
  if (otherSize) confirmMessage += `  その他サイズ: ${otherSize}\n`;

  // 確認ダイアログを表示
  if (!window.confirm(confirmMessage)) {
    // ユーザーがキャンセルを選択した場合、処理を中断
    handleClose();
    setIsSubmitting(false); // 送信状態を解除
    return;
  }

  setIsSubmitting(true); // 送信状態を開始

  try {
    await contract.erc1155.transfer(walletAddress, tokenId, amount);

    const headers = {
      Authorization: "Bearer keypjfrOALL1xCF3r", //AirTableのAPIキー
      "Content-Type": "application/json",
    };
    const method = "POST";
    const submitBody = {
      records: [
        {
          fields: {
            Key_ID: nft.key_id,
            Thanks_Gift: nft.present_detail,
            Name: name,
            Zip_Code: zipCode,
            Address: address,
            Tel: tel,
            Mail: mail,
            Size: size,
            Size_Other: otherSize,
          },
        },
      ],
    };

    const body = JSON.stringify(submitBody);
    console.log(body);
    const resTokenInfo = await fetch(`https://api.airtable.com/v0/appq0R9tJ2BkvKhRt/tbld2laNlKCi7B2GW`, { method, headers, body });
    document.getElementById("GetAccountButton").click();
    alert(`${nft.nft_name}の交換完了しました。到着するまでお楽しみに！`);
  } catch (error) {
    console.error(error);
    setIsSubmitting(false); // 送信状態を解除
  }
  setIsSubmitting(false); // 送信状態を解除
  handleClose(); // モーダルを閉じる

  // 送信後にフォームをリセット
  document.getElementById("Name").value = "";
  document.getElementById("Zip_Code").value = "";
  document.getElementById("Address").value = "";
  document.getElementById("Tel").value = "";
  document.getElementById("Mail").value = "";
  document.querySelectorAll('input[type="radio"]').forEach((radio) => {
    radio.checked = false;
  });
  if (document.getElementById("Other-size")) {
    document.getElementById("Other-size").value = "";
  }
};

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
  const [selectedGiftNft, setSelectedGiftNft] = useState("");
  const location = window.location.pathname.toLowerCase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleClose = () => {
    size = ""; // サイズをリセット
    otherSize = ""; // その他のサイズをリセット
    setShow(false);
    setIsSubmitting(false); // 送信状態を解除
  };
  const handleShow = () => setShow(true);
  const handleCloseNewToken = () => setShowNewToken(false);
  const handleShowNewToken = () => setShowNewToken(true);
  const handleCloseDetail = () => setShowDetail(false);
  const handleShowDetail = async (nft) => {
    setSelectedNft(nft);
    // ダイアログの内容をリセット
    setSize("");
    setOtherSize("");
    // 他のダイアログ関連の状態もリセット
    setShowDetail(true);
  };

  const [size, setSize] = useState(""); // デフォルトのサイズを設定
  const [otherSize, setOtherSize] = useState(""); // 「その他」のサイズを設定
  const handleRadioChange = (event) => {
    setSize(event.target.value);
    if (event.target.value !== "その他") {
      setOtherSize(""); // 「その他」以外が選択されたら、テキストフィールドをクリア
    }
  };

  const handleOtherSizeChange = (event) => {
    setOtherSize(event.target.value);
  };

  const specificKeys = ["rec65kFu48ut5GPhC", "recB1VbiT6bR7TMnH", "recqCurt5f435BcVf", "recj2JF2UnJU2ixXw", "reclz4Dg5QS8VnJZ0", "recyBnzU9IzYtJuCT", "recK0sK8Hzq6ffghW", "recs6Mdq8UFgEjpPD"]; //オリジナルTシャツのNFTのkey
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
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accountNo) => handleAccountChanged(accountNo, setAccount, setChainId, setNfts, setCollections, setChainName));
      window.ethereum.on("chainChanged", (accountNo) => handleAccountChanged(accountNo, setAccount, setChainId, setNfts, setCollections, setChainName));
    } else {
      window.addEventListener("ethereum#initialized", initializeAccount, {
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
              <Navbar.Brand href="#home">
                <img src={logo} width="250" />
              </Navbar.Brand>
              <Navbar.Toggle />
              <Navbar.Collapse className="justify-content-end">
                <Navbar.Text>
                  <Button className="py-2 px-4 btn-lg" variant="outline-dark" id="GetAccountButton" onClick={initializeAccount}>
                    MetaMaskに接続
                  </Button>
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
                    <div>
                      <p>
                        <small>このウォレットにある「MetagriLabo Thanks Gift（MLTG）」の一覧です。</small>
                      </p>
                    </div>
                  </Stack>
                </Nav>
              </Container>
            </Navbar>
            <Table className="table-hover" responsive={true}>
              <thead className="table-secondary">
                <tr>
                  <th>画像</th>
                  {/* <th>ID</th> */}
                  <th>コントラクト</th>
                  <th>NFT名</th>
                  <th>もらえるもの</th>
                  <th>数量</th>
                  <th>引き換え</th>
                </tr>
              </thead>
              <tbody>
                {nfts.length !== 0 ? (
                  nfts.map((nft, index) => {
                    return (
                      <tr key={index} className="align-middle">
                        <td>
                          {nft.image !== "" ? (
                            <a href={nft.image} target="_blank" rel="noreferrer">
                              <img src={nft.image} alt="nftimage" width="70px" />
                            </a>
                          ) : (
                            <></>
                          )}
                        </td>
                        {/* <td>{nft.token_id}</td> */}
                        {/* <td>{nft.key_id}</td> */}
                        <td>{nft.contract_name}</td>
                        <td>{nft.nft_name}</td>
                        <td>{nft.present_detail}</td>
                        <td>{nft.amount}</td>
                        <td>
                          <input class="form-check-input" type="radio" name="flexRadioDefault" id={index} onClick={() => handleShowDetail(nft)} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <></>
                )}
              </tbody>
            </Table>
            {/* 選択したNFTによって変わる */}
            {/* オリジナルTシャツ	*/}
            {selectedNft && specificKeys.includes(selectedNft.key_id) && (
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>お名前</Form.Label>
                  <Form.Control id="Name" type="text" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>郵便番号</Form.Label>
                  <Form.Control id="Zip_Code" type="text" placeholder="000-0000" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>ご住所</Form.Label>
                  <Form.Control id="Address" type="text" placeholder="都道府県市町村番地建物" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>電話番号</Form.Label>
                  <Form.Control id="Tel" type="text" placeholder="000-0000-0000" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>通知先メールアドレス</Form.Label>
                  <Form.Control id="Mail" type="email" placeholder="experience@metagri-labo.com" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>サイズ</Form.Label>
                </Form.Group>
                <Form.Group className="mb-3">
                  <div className="d-inline-block me-2">
                    <Form.Check type="radio" label="S" name="size" value="S" id="S-size" onChange={handleRadioChange} />
                  </div>

                  <div className="d-inline-block me-2">
                    <Form.Check type="radio" label="M" name="size" value="M" id="M-size" onChange={handleRadioChange} />
                  </div>

                  <div className="d-inline-block me-2">
                    <Form.Check type="radio" label="L" name="size" value="L" id="L-size" onChange={handleRadioChange} />
                  </div>
                  <div className="d-inline-block me-2">
                    <Form.Check type="radio" label="XL" name="size" value="XL" id="XL-size" onChange={handleRadioChange} />
                  </div>
                  <div className="d-inline-block me-2">
                    <Form.Check type="radio" label="その他" name="size" value="その他" id="other" onChange={handleRadioChange} />
                  </div>
                </Form.Group>

                {/* その他が選択された場合のテキストフィールド */}
                {size === "その他" && (
                  <Form.Group className="mb-3">
                    <Form.Label>その他サイズ</Form.Label>
                    <Form.Control type="text" id="Other-size" value={otherSize} onChange={handleOtherSizeChange} />
                  </Form.Group>
                )}
              </Form>
            )}
            {/* デフォルト */}
            {selectedNft && !specificKeys.includes(selectedNft.key_id) && (
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>お名前</Form.Label>
                  <Form.Control id="Name" type="text" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>郵便番号</Form.Label>
                  <Form.Control id="Zip_Code" type="text" placeholder="000-0000" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>ご住所</Form.Label>
                  <Form.Control id="Address" type="text" placeholder="都道府県市町村番地建物" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>電話番号</Form.Label>
                  <Form.Control id="Tel" type="text" placeholder="000-0000-0000" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>通知先メールアドレス</Form.Label>
                  <Form.Control id="Mail" type="email" placeholder="experience@metagri-labo.com" />
                </Form.Group>
              </Form>
            )}
            {/* </Form> */}
            {disable === false ? (
              <>
                {/* <Button className="px-4" variant="outline-dark" onClick={handleClose}>
                  キャンセル
                </Button> */}
                <Button className="px-4" variant="outline-dark" disabled={isSubmitting} onClick={() => handleSubmit(account, selectedNft, chainName, size, otherSize, handleClose, setIsSubmitting)}>
                  {isSubmitting && <span className="me-2 spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
                  {isSubmitting ? "数分かかる場合があります..." : "申し込む"}
                </Button>
              </>
            ) : (
              <>
                {/* <Button className="px-4" variant="outline-dark" disabled={true}>
                  キャンセル
                </Button> */}
                <Button className="px-4" variant="dark" disabled={isSubmitting}>
                  {isSubmitting && <span className="me-2 spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
                  {isSubmitting ? "数分かかる場合があります..." : "申し込む"}
                </Button>
              </>
            )}
          </Container>
        </>
      </div>

      <footer className="mt-auto p-3">Ideated by Studymeter Inc.</footer>
    </div>
  );
}

export default App;
