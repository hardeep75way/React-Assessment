import { Box, CircularProgress } from '@mui/material';

const styles = {
    box: {
        display: "flex",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
    }
}

export function LoadingState() {
    return (
        <Box
            sx={styles.box}
        >
            <CircularProgress />
        </Box>
    );
}
