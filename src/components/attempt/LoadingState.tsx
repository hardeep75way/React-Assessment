import { Box, CircularProgress } from '@mui/material';

export function LoadingState() {
    return (
        <Box
            display="flex"
            height="100vh"
            alignItems="center"
            justifyContent="center"
        >
            <CircularProgress />
        </Box>
    );
}
