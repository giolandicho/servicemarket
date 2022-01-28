import React, { useState } from 'react';
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import Web3Modal from 'web3modal'
import { marketAddress, serviceAddress } from '../config';
import Service from "../artifacts/contracts/Service.sol/ServicePurchase.json";
import ServiceMarket from "../artifacts/contracts/ServiceMarket.sol/ServicesMarket.json";
import { Navigate } from "react-router-dom"
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');


const theme = createTheme();

export default function AddService() {
  const [created, setCreated] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, setFormInput] = useState({ 
      title: "", 
      description: "", 
      duration: "", 
      price: ""});

  const onChange = async(event) => {
    event.preventDefault();
    const file = event.target.files[0];
    try {const added = await client.add(
        file,
        {
           progress: (prog) => console.log(`received: ${prog}`) 
        }
    )
    const url = `https://ipfs.infura.io/ipfs/${added.path}`;
    setFileUrl(url)
    } catch(error){
        console.log("Error uploading file: ", error);
    }
  };
  const createMarket = async() => {
      const { title, description, duration, price } = formInput;
      if( !title || !description || !duration || !price || !fileUrl) return
        //upload to IPFS
      const data = JSON.stringify({
          title, description, image: fileUrl
      })
      try {
        const added = await client.add(data);
        const url = `https://ipfs.infura.io/ipfs/${added.path}`
        createItem(url);
      } catch(error){
        console.log("Error uploading file: ", error);
      }
  }
  const createItem = async(url) => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    //Create Item
    let contract = new ethers.Contract(serviceAddress, Service.abi, signer);
    let transaction = await contract.createToken(url);
    let tx = await transaction.wait();
    let event = tx.events[0];
    let value = event.args[2];
    let tokenId = value.toNumber();
    const price = ethers.utils.parseUnits(formInput.price, "ether");

    //list item for sale on marketplace
    contract = new ethers.Contract(marketAddress, ServiceMarket.abi, signer);
    let listingPrice = await contract.getListingPrice();
    listingPrice = listingPrice.toString();
    console.log("here")

    try {
        transaction = await contract.createService(
        serviceAddress,
        tokenId,
        price,
        { value: listingPrice }
    )
    await transaction.wait();
    }catch(error){
        console.log(error);
    }
        console.log("all done bro")
        setCreated(true);
  }

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        { created ? <Navigate to="/"/> :
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <AddOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            New Service
          </Typography>
          <Box component="form" noValidate onSubmit={createMarket} sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Title"
                  autoFocus
                  onChange={e => setFormInput({ ...formInput, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  onChange={e => setFormInput({ ...formInput, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Duration"
                  onChange={e => setFormInput({ ...formInput, duration: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Price"
                  onChange={e => setFormInput({ ...formInput, price: e.target.value })}
                />
               <input
                type="file"
                name="Asset"
                onChange={onChange}
               /> 
               {
                   fileUrl && (
                       <img width="350" src={fileUrl}/>
                   )
               }
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Create
            </Button>
          </Box>
        </Box> }
      </Container>
    </ThemeProvider>
  );
}