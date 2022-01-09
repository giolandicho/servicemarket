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

export default function SignUp() {
  const [created, setCreated] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, setFormInput] = useState({ 
      title: "", 
      description: "", 
      duration: "", 
      price: ""});

  const handleSubmit = async(event) => {
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
    setCreated(true);
    } catch(error){
        console.log("Error uploading file: ", error);
    }
  };

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
          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Title"
                  autoFocus
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Description"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Duration"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Price"
                />
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