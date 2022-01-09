import React from 'react'
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import Typography from '@mui/material/Typography';
import { Link } from "react-router-dom";

function Header() {
    return (
        <AppBar position="relative">
        <Toolbar>
          <Link to="/">
          <IconButton color="inherit" size="medium" disableRipple={false}>
          <HomeRoundedIcon style={{fontSize: 30, color: "white"}} />
          </IconButton>
          </Link>
          <Typography variant="h6" color="inherit" noWrap>
            Service Market
          </Typography>
        </Toolbar>
      </AppBar>
    )
}

export default Header
