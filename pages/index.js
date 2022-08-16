import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/Home.module.css';
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import WalletConnectProvider from '@walletconnect/web3-provider';

export default function Home() {
  const [eoaAddress, setEoaAddress] = useState('');
  const [contractAddress, setContractAddress] = useState(
    '0x01547Ef97f9140dbDF5ae50f06B77337B95cF4BB'
  );
  const [canApprove, setCanApprove] = useState(false);

  const [walletConnectUri, setWalletConnectUri] = useState('');
  const [walletConnector, setWalletConnector] = useState();

  const onClickEnableEthereum = async () => {
    await ethereum.request({ method: 'eth_requestAccounts' });

    setEoaAddress(ethereum.selectedAddress);
  };

  const onClickConnectDapp = async () => {
    await initWalletConnect();
  };

  const onClickApproveConnection = async () => {
    console.log('ACTION', 'approveSession');

    const chainId = 4;
    if (walletConnector) {
      try {
        walletConnector.approveSession({
          chainId,
          accounts: [contractAddress],
        });

        setCanApprove(false);
        alert('Success');
      } catch (error) {
        alert(error);
      }
    }
  };

  const onClickSendTransaction = async () => {
    const transactionParameters = {
      nonce: '0x00', // ignored by MetaMask
      // gasPrice: '0x09184e72a000', // customizable by user during MetaMask confirmation.
      // gas: '0x2710', // customizable by user during MetaMask confirmation.
      to: '0xbB89cCA0Ee293bC28704C32aB31602d4AbBcBfD5', // Required except during contract publications.
      from: ethereum.selectedAddress, // must match user's active address.
      // value: '0x01', // Only required to send ether to the recipient from the initiating external account.
      // data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057', // Optional, but used for defining smart contract creation and interaction.
      chainId: '0x4', // Used to prevent transaction reuse across blockchains. Auto-filled by MetaMask.
    };

    // txHash is a hex string
    // As with any RPC call, it may throw an error
    const txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    });
  };

  const onChangeWalletConnectUri = async (event) => {
    setWalletConnectUri(event.target.value);
  };

  const initWalletConnect = async () => {
    try {
      const connector = new WalletConnect({ uri: walletConnectUri });

      if (!connector.connected) {
        await connector.createSession();
      }

      setWalletConnector(connector);
    } catch (error) {
      console.log(error);
      alert(error);
    }
  };

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      setEoaAddress(ethereum.selectedAddress);
      ethereum.on('accountsChanged', function (accounts) {
        setEoaAddress(accounts[0]);
      });
    } else {
      alert('You need to "Enable Ethereum" ');
    }
  }, []);

  useEffect(() => {
    if (walletConnector) {
      console.log(walletConnector);
      // Subscribe to session requests
      walletConnector.on('session_request', (error, payload) => {
        if (error) {
          throw error;
        }
        console.log('-----  session_request  -----');
        console.log('Payload: ', payload);

        setCanApprove(true);
      });

      // Subscribe to call requests
      walletConnector.on('call_request', async (error, payload) => {
        if (error) {
          throw error;
        }

        //
        const transactionParameters = {
          to: '0xbB89cCA0Ee293bC28704C32aB31602d4AbBcBfD5', // Required except during contract publications.
          from: ethereum.selectedAddress, // must match user's active address.
          chainId: '0x4', // Used to prevent transaction reuse across blockchains. Auto-filled by MetaMask.
        };

        // txHash is a hex string
        // As with any RPC call, it may throw an error
        const txHash = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [transactionParameters],
        });

        walletConnector.approveRequest({
          id: payload.id,
          result: txHash,
        });
      });

      walletConnector.on('disconnect', (error, payload) => {
        if (error) {
          throw error;
        }

        console.log('-----  disconnect  -----');
        console.log('Payload: ', payload);
      });
    }
  }, [walletConnector]);

  return (
    <div className={styles.container}>
      <div>
        <h2>Step 1: </h2>
        <button onClick={onClickEnableEthereum}>Enable Ethereum</button>
      </div>

      <div>
        <h2>Step 2: </h2>
        <h3>WalletConnect URI: </h3>
        <input
          onChange={onChangeWalletConnectUri}
          value={walletConnectUri}
        ></input>
        <button onClick={onClickConnectDapp}>Connect Dapp with URI</button>
      </div>

      <div>
        <h2>Step 3: </h2>
        <button onClick={onClickApproveConnection} disabled={!canApprove}>
          Approve Connection
        </button>
      </div>

      <div>
        <h2>Others: </h2>
        <button onClick={onClickSendTransaction}>
          Metamask Send Transaction
        </button>
      </div>

      <div>
        <h2>MetaMask Address: {eoaAddress} </h2>

        <h2>Contract Address: {contractAddress} </h2>
      </div>
    </div>
  );
}
