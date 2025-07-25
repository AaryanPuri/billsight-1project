import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#64b5f6",
    },
    background: {
      default: "#f6fafd",
      paper: "#fff",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", Arial, sans-serif',
    fontSize: 15,
  },
  shape: {
    borderRadius: 10,
  },
});

export default theme;