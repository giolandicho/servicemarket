import * as React from 'react';
import { useState, useEffect } from "react";
import axios from "axios";
import Web3Modal from "web3modal";
import { marketAddress, serviceAddress } from '../config';
import Service from "../artifacts/contracts/Service.sol/ServicePurchase.json";
import ServiceMarket from "../artifacts/contracts/ServiceMarket.sol/ServicesMarket.json";
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ethers } from 'ethers';
import { Link } from "react-router-dom";



const cards = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const theme = createTheme();

export default function Market() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log(ServiceMarket.abi);
    loadServices();
  }, []);

  async function loadServices(){

    const provider = new ethers.providers.JsonRpcProvider();
    const serviceContract = new ethers.Contract(serviceAddress, Service.abi, provider);
    const marketContract = new ethers.Contract(marketAddress, ServiceMarket.abi, provider);
    const data = await marketContract.fetchAvailableServices();

    const items = await Promise.all(data.map(async i => {
      const serviceUri = await serviceContract.tokenURI(i.id);
      const metadata = await axios.get(serviceUri);
      let price = ethers.utils.formatUnits(i.value.toString(), "Ether");
      let item = {
        price,
        tokenId: i.id.toNumber(),
        seller: i.seller,
        buyer: i.buyer,
        image: metadata.data.image,
        name: metadata.data.name,
        description: metadata.data.description,
        duration: i.duration,
      }
      return item;
    }))
    setServices(items);
    setLoading(false);
  }

  async function buyService(service){
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(marketAddress, ServiceMarket.abi, signer);

    const price = ethers.utils.parseUnits(service.value.toString(), "ether");
    const transaction = await contract.purchaseService(serviceAddress, service.id, {
      value: price
    })
    await transaction.wait();
    loadServices();
  }

  return (
    <ThemeProvider theme={theme}>  
      <CssBaseline />
      <main>
        {/* Hero unit */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            pt: 8,
            pb: 6,
          }}
        >
          <Container maxWidth="sm">
            <Typography
              component="h1"
              variant="h2"
              align="center"
              color="text.primary"
              gutterBottom
            >
              Freelance Services
            </Typography>
            <Typography variant="h5" align="center" color="text.secondary" paragraph>
              Do you have high demand skills? Offer your services as an NFT and get paid!
            </Typography>
            <Stack
              sx={{ pt: 4 }}
              direction="row"
              spacing={2}
              justifyContent="center"
            >
              <Link to="/Add" style={{ textDecoration: 'none' }}>
              <Button variant="contained">Create new service</Button>
              </Link>
              <Button variant="outlined">About</Button>
            </Stack>
          </Container>
        </Box>
        <Container sx={{ py: 8 }} maxWidth="md">
          {/* End hero unit */}
          <Grid container spacing={4}>
            {services.length ? services.map((service, i) => (
              <Grid item key={i} xs={12} sm={6} md={4}>
                <Card
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <CardMedia
                    component="img"
                    sx={{
                      // 16:9
                      pt: '56.25%',
                    }}
                    image={service.image}
                    alt="random"
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h2">
                      {service.name}
                    </Typography>
                    <Typography>
                      {service.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick = {() => buyService(service)}>{service.value}</Button>
                  </CardActions>
                </Card>
              </Grid>
            )) : "No Services Currently Available"}
          </Grid>
        </Container>
      </main>
      {/* Footer */}
      <Box sx={{ bgcolor: 'background.paper', p: 6 }} component="footer">
        <Typography variant="h6" align="center" gutterBottom>
          Footer
        </Typography>
        <Typography
          variant="subtitle1"
          align="center"
          color="text.secondary"
          component="p"
        >
          Something here to give the footer a purpose!
        </Typography>
      </Box>
      {/* End footer */}
    </ThemeProvider>
  );
}